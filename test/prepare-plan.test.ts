import { describe, expect, test, beforeEach, afterEach } from 'vitest';
import { detectStack, createInstallPlan } from '../src/providers/prepare.js';
import { builtinConfig, deriveRegistry } from '../src/providers/index.js';
import type { ProviderConfig } from '../src/providers/index.js';
import { writeFileSync, rmSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/**
 * Custom python provider with install packages.
 * The builtin pytest runner (PYTEST_RUNNER in config.ts) has no `install`
 * field, so to exercise the install-lockfile + pinning branches we synthesize
 * a config with an install spec. Reused across scenarios with differing source.
 */
function pythonWithPackagesConfig(): ProviderConfig {
  return {
    version: 1,
    providers: [
      {
        language: 'python',
        extensions: ['.py'],
        testRunners: [
          {
            name: 'pytest',
            configFiles: ['pytest.ini'],
            binaryProbes: ['python3 -m pytest'],
            command: ['python3', '-m', 'pytest'],
            artifact: 'coverage.xml',
            install: { packages: ['pytest-cov'] },
          },
        ],
      },
    ],
  };
}

describe('createInstallPlan', () => {
  let tmpDir: string;
  let originalCwd: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'prepare-plan-test-'));
    // createInstallPlan probes `.venv` via process.cwd() (see prepare.ts L165),
    // so sync cwd to the temp repo to make the no-venv case deterministic.
    originalCwd = process.cwd();
    process.chdir(tmpDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(tmpDir, { recursive: true, force: true });
  });

  test('python-no-venv: create-venv action precedes install-lockfile', () => {
    writeFileSync(join(tmpDir, 'app.py'), 'print(1)\n', 'utf8');
    writeFileSync(join(tmpDir, 'pytest.ini'), '[pytest]\n', 'utf8');

    const config = pythonWithPackagesConfig();
    const registry = deriveRegistry(config, 'builtin');

    const stack = detectStack(tmpDir, registry);
    const plans = createInstallPlan(stack, registry, config);

    expect(plans.length).toBe(1);
    const actions = plans[0]!.actions;
    const venv = actions.findIndex((a) => a.kind === 'create-venv');
    const lockfile = actions.findIndex((a) => a.kind === 'install-lockfile');

    expect(venv).toBe(0); // create-venv is the first (and only first) action
    expect(lockfile).toBeGreaterThan(venv); // install-lockfile queued after venv
    expect(actions[lockfile]!.command).toEqual(['pip', 'install', 'pytest-cov']);
  });

  test('pinning only when builtin+packages (empty configUpdates otherwise)', () => {
    writeFileSync(join(tmpDir, 'app.py'), 'print(1)\n', 'utf8');
    writeFileSync(join(tmpDir, 'pytest.ini'), '[pytest]\n', 'utf8');

    // Scenario A: builtin source + packages present -> checkchange.providers.json pin
    const configA = pythonWithPackagesConfig();
    const registryA = deriveRegistry(configA, 'builtin');
    const stackA = detectStack(tmpDir, registryA);
    const plansA = createInstallPlan(stackA, registryA, configA);

    expect(plansA.length).toBe(1);
    const pin = plansA[0]!.configUpdates['checkchange.providers.json'];
    expect(pin).toBeDefined();
    const pinProviders = (pin as { version: number; providers: Array<{ language: string; testRunners: Array<{ name: string; install: { packages: string[] } }> }> }).providers;
    expect(pinProviders[0]!.language).toBe('python');
    expect(pinProviders[0]!.testRunners[0]!.install.packages).toContain('pytest-cov');

    // Scenario B: non-builtin (explicit) source + packages present -> no pin
    const configB = pythonWithPackagesConfig();
    const registryB = deriveRegistry(configB, 'explicit');
    const stackB = detectStack(tmpDir, registryB);
    const plansB = createInstallPlan(stackB, registryB, configB);

    expect(plansB.length).toBe(1);
    expect(plansB[0]!.configUpdates).toEqual({});
  });

  test('verify-tool action always present (sole action when nothing else applies)', () => {
    // Builtin vitest runner has no install packages and is not python,
    // so create-venv and install-lockfile are both skipped — only verify-tool remains.
    writeFileSync(join(tmpDir, 'app.ts'), 'export const x = 1;\n', 'utf8');
    writeFileSync(join(tmpDir, 'vitest.config.ts'), '', 'utf8');

    const config = builtinConfig();
    const registry = deriveRegistry(config, 'builtin');

    const stack = detectStack(tmpDir, registry);
    const plans = createInstallPlan(stack, registry, config);

    expect(plans.length).toBe(1);
    const actions = plans[0]!.actions;
    expect(actions).toHaveLength(1);
    expect(actions[0]!.kind).toBe('verify-tool');
    expect(actions[actions.length - 1]!.kind).toBe('verify-tool');
    expect(actions[0]!.command).toEqual(['npx', '--no-install', 'vitest', '--version']);
  });

  test('unknown stack: empty actions', () => {
    // Empty tmpDir -> no source files -> detectStack returns no languages
    const config = builtinConfig();
    const registry = deriveRegistry(config);

    const stack = detectStack(tmpDir, registry);
    expect(stack.languages).toEqual([]);

    const plans = createInstallPlan(stack, registry, config);
    expect(plans).toEqual([]);
  });
});
