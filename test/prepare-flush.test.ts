import { describe, expect, test, beforeEach, afterEach, vi } from 'vitest';
import { flushConfigUpdates } from '../src/providers/prepare.js';
import type { InstallPlan } from '../src/providers/prepare.js';
import { mkdtempSync, rmSync, writeFileSync, readFileSync, existsSync, mkdirSync, symlinkSync, lstatSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';

/** A plan with a single python pin (mirrors prepare-approve.test.ts samplePlan). */
function pythonPinPlan(): InstallPlan[] {
  return [
    {
      language: 'python',
      actions: [],
      configUpdates: {
        'checkchange.providers.json': {
          version: 1,
          providers: [
            {
              language: 'python',
              testRunners: [{ name: 'pytest', install: { packages: ['pytest-cov'] } }],
            },
          ],
        },
      },
    },
  ];
}

function planWithConfigKey(configKey: string): InstallPlan[] {
  const [entry] = pythonPinPlan();
  entry!.configUpdates = { [configKey]: entry!.configUpdates['checkchange.providers.json'] };
  return [entry!];
}

describe('flushConfigUpdates', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'prepare-flush-test-'));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  function expectRejectedKey(configKey: string): void {
    const output = resolve(tmpDir, configKey);
    try {
      expect(flushConfigUpdates(planWithConfigKey(configKey), tmpDir)).toEqual([]);
      expect(existsSync(output)).toBe(false);
    } finally {
      rmSync(output, { force: true });
    }
  }

  test('creates checkchange.providers.json when absent', () => {
    const written = flushConfigUpdates(pythonPinPlan(), tmpDir);
    expect(written).toEqual(['checkchange.providers.json']);

    const content = JSON.parse(readFileSync(join(tmpDir, 'checkchange.providers.json'), 'utf8'));
    expect(content.version).toBe(1);
    expect(content.providers).toHaveLength(1);
    expect(content.providers[0].language).toBe('python');
    expect(content.providers[0].testRunners[0].name).toBe('pytest');
    expect(content.providers[0].testRunners[0].install.packages).toEqual(['pytest-cov']);
  });

  test('merges into existing file, updates install on matching runner', () => {
    writeFileSync(
      join(tmpDir, 'checkchange.providers.json'),
      JSON.stringify({
        version: 1,
        providers: [
          {
            language: 'python',
            extensions: ['.py'],
            testRunners: [{ name: 'pytest', configFiles: [], binaryProbes: [], command: [], artifact: 'coverage.xml', install: { packages: ['old-pkg'] } }],
          },
        ],
      }),
    );

    const written = flushConfigUpdates(pythonPinPlan(), tmpDir);
    expect(written).toHaveLength(1);

    const content = JSON.parse(readFileSync(join(tmpDir, 'checkchange.providers.json'), 'utf8'));
    // install updated on matching runner
    expect(content.providers[0].testRunners[0].install.packages).toEqual(['pytest-cov']);
    // existing fields preserved
    expect(content.providers[0].extensions).toEqual(['.py']);
  });

  test('adds new provider when language differs', () => {
    writeFileSync(
      join(tmpDir, 'checkchange.providers.json'),
      JSON.stringify({
        version: 1,
        providers: [
          {
            language: 'python',
            extensions: ['.py'],
            testRunners: [{ name: 'pytest', install: { packages: ['pytest-cov'] } }],
          },
        ],
      }),
    );

    const tsPlan: InstallPlan[] = [
      {
        language: 'typescript',
        actions: [],
        configUpdates: {
          'checkchange.providers.json': {
            version: 1,
            providers: [
              { language: 'typescript', testRunners: [{ name: 'vitest', install: { packages: ['vitest'] } }] },
            ],
          },
        },
      },
    ];

    flushConfigUpdates(tsPlan, tmpDir);
    const content = JSON.parse(readFileSync(join(tmpDir, 'checkchange.providers.json'), 'utf8'));
    expect(content.providers).toHaveLength(2);
    expect(content.providers.map((p: { language: string }) => p.language)).toEqual(['python', 'typescript']);
  });

  test('appends new testRunner to existing provider', () => {
    writeFileSync(
      join(tmpDir, 'checkchange.providers.json'),
      JSON.stringify({
        version: 1,
        providers: [
          {
            language: 'typescript',
            extensions: ['.ts'],
            testRunners: [{ name: 'vitest', install: { packages: ['vitest'] } }],
          },
        ],
      }),
    );

    const plan: InstallPlan[] = [
      {
        language: 'typescript',
        actions: [],
        configUpdates: {
          'checkchange.providers.json': {
            version: 1,
            providers: [
              { language: 'typescript', testRunners: [{ name: 'jest', install: { packages: ['jest'] } }] },
            ],
          },
        },
      },
    ];

    flushConfigUpdates(plan, tmpDir);
    const content = JSON.parse(readFileSync(join(tmpDir, 'checkchange.providers.json'), 'utf8'));
    expect(content.providers[0].testRunners).toHaveLength(2);
    const names = content.providers[0].testRunners.map((r: { name: string }) => r.name);
    expect(names).toContain('vitest');
    expect(names).toContain('jest');
  });

  test('rejects absolute config key before writing outside cwd', () => {
    expectRejectedKey(join(tmpdir(), `prepare-flush-${basename(tmpDir)}-absolute.json`));
  });

  test('rejects parent-traversal config key before writing outside cwd', () => {
    expectRejectedKey(`../${basename(tmpDir)}-traversal.json`);
  });

  test('rejects nested config key before writing', () => {
    mkdirSync(join(tmpDir, 'nested'));
    expectRejectedKey('nested/checkchange.providers.json');
  });

  test('rejects unknown config key before writing', () => {
    expectRejectedKey('other.json');
  });

  test('no configUpdates -> no write, no file created', () => {
    const plan: InstallPlan[] = [{ language: 'python', actions: [], configUpdates: {} }];
    const written = flushConfigUpdates(plan, tmpDir);
    expect(written).toEqual([]);
  });

  test('empty providers array -> no write', () => {
    const plan: InstallPlan[] = [
      {
        language: 'python',
        actions: [],
        configUpdates: { 'checkchange.providers.json': { version: 1, providers: [] } },
      },
    ];
    const written = flushConfigUpdates(plan, tmpDir);
    expect(written).toEqual([]);
  });

  // The three tests below lock the hardened write path (pid-suffixed tmp +
  // flag:'wx' + realpath containment). Each names the attack it prevents.

  test('symlink planted at the tmp name is never written through', () => {
    // Both tmp spellings are occupied: the pre-hardening fixed `.tmp` name and
    // the pid-suffixed one. Pre-hardening src wrote through `.tmp`; hardened
    // src finds its own slot taken and skips the write entirely.
    const outside = mkdtempSync(join(tmpdir(), 'prepare-flush-outside-'));
    const targets = [join(outside, 'fixed.tmp'), join(outside, 'pidded.tmp')];
    for (const t of targets) writeFileSync(t, 'SECRET-ORIGINAL');
    const configPath = join(tmpDir, 'checkchange.providers.json');
    symlinkSync(targets[0]!, `${configPath}.tmp`);
    symlinkSync(targets[1]!, `${configPath}.tmp.${process.pid}`);

    try {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const written = flushConfigUpdates(pythonPinPlan(), tmpDir);
      // No write claimed: the O_EXCL create failed, so the key is not "written".
      expect(written).toEqual([]);
      // M-1: the failure is NOT silent. The caller derives its exit code from
      // install.ok, so a swallowed failure here would exit 0 with no output.
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(String(warnSpy.mock.calls[0]![0])).toContain('checkchange.providers.json');
      warnSpy.mockRestore();
      for (const t of targets) expect(readFileSync(t, 'utf8')).toBe('SECRET-ORIGINAL');
      expect(existsSync(configPath)).toBe(false);
      // best-effort unlink frees the occupied slot (unlink never follows a link).
      expect(existsSync(`${configPath}.tmp.${process.pid}`)).toBe(false);
    } finally {
      rmSync(outside, { recursive: true, force: true });
    }
  });

  test('config path escaping cwd via a symlink is rejected, nothing created', () => {
    const outside = mkdtempSync(join(tmpdir(), 'prepare-flush-escape-'));
    const target = join(outside, 'providers.json');
    writeFileSync(target, 'OUTSIDE-ORIGINAL');
    const configPath = join(tmpDir, 'checkchange.providers.json');
    symlinkSync(target, configPath);

    try {
      expect(flushConfigUpdates(pythonPinPlan(), tmpDir)).toEqual([]);
      // Still a symlink — not replaced by the flushed regular file.
      expect(lstatSync(configPath).isSymbolicLink()).toBe(true);
      expect(readFileSync(target, 'utf8')).toBe('OUTSIDE-ORIGINAL');
      // No tmp debris left behind by the rejected write.
      expect(existsSync(`${configPath}.tmp.${process.pid}`)).toBe(false);
    } finally {
      rmSync(outside, { recursive: true, force: true });
    }
  });

  test('non-allowlist key is skipped while the allowlisted key still flushes', () => {
    const plan = pythonPinPlan();
    plan[0]!.configUpdates['evil.json'] = plan[0]!.configUpdates['checkchange.providers.json'];

    expect(flushConfigUpdates(plan, tmpDir)).toEqual(['checkchange.providers.json']);
    expect(existsSync(join(tmpDir, 'checkchange.providers.json'))).toBe(true);
    expect(existsSync(join(tmpDir, 'evil.json'))).toBe(false);
  });
});
