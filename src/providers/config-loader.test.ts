import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { loadProviderConfig, deriveRegistry, builtinConfig } from './config.js';
import type { ProviderConfig } from './config.js';

function tmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'checkchange-cfg-'));
}

describe('builtinConfig', () => {
  it('returns version 1 with typescript, javascript, and python providers', () => {
    const cfg = builtinConfig();
    expect(cfg.version).toBe(1);
    expect(cfg.providers).toHaveLength(3);
    const ts = cfg.providers.find((p) => p.language === 'typescript');
    const js = cfg.providers.find((p) => p.language === 'javascript');
    const py = cfg.providers.find((p) => p.language === 'python');
    expect(ts).toBeDefined();
    expect(ts!.extensions).toContain('.ts');
    expect(ts!.extensions).toContain('.tsx');
    expect(js).toBeDefined();
    expect(js!.extensions).toContain('.js');
    expect(js!.extensions).toContain('.jsx');
    expect(js!.extensions).toContain('.mjs');
    expect(js!.extensions).toContain('.cjs');
    expect(py).toBeDefined();
    expect(py!.extensions).toContain('.py');
    expect(py!.coverageFiles).toContain('.coverage');
  });

  it('builtin testRunners preserve current vitest/jest/pytest behavior', () => {
    const cfg = builtinConfig();
    // TypeScript + JavaScript
    const ts = cfg.providers.find((p) => p.language === 'typescript')!;
    const js = cfg.providers.find((p) => p.language === 'javascript')!;
    for (const entry of [ts, js]) {
      const runners = entry.testRunners!;
      expect(runners).toHaveLength(2);
      const vitest = runners.find((r) => r.name === 'vitest');
      expect(vitest).toBeDefined();
      expect(vitest!.command).toEqual(['npx', 'vitest', 'run', '--coverage']);
      expect(vitest!.artifact).toBe('coverage/coverage-final.json');
      const jest = runners.find((r) => r.name === 'jest');
      expect(jest).toBeDefined();
      expect(jest!.command).toEqual(['npx', 'jest', '--coverage']);
      expect(jest!.artifact).toBe('coverage/coverage-final.json');
    }
    // Python — preserve exact current behavior
    const py = cfg.providers.find((p) => p.language === 'python')!;
    const pytest = py.testRunners![0]!;
    expect(pytest.name).toBe('pytest');
    expect(pytest.configFiles).toEqual(['pyproject.toml', 'pytest.ini', 'setup.cfg', 'requirements.txt']);
    expect(pytest.binaryProbes).toEqual(['.venv/bin/pytest', 'VIRTUAL_ENV', 'python3 -m pytest']);
    expect(pytest.command).toEqual(['python3', '-m', 'pytest', '--cov', '--cov-report=xml']);
    expect(pytest.artifact).toBe('coverage.xml');
  });

  it('sets no coverageCmd on any builtin provider (the tool must live by the rule it enforces)', () => {
    expect(builtinConfig().providers.every((p) => !p.coverageCmd)).toBe(true);
  });

  it('dropped the dead allowlist field: gone from the type surface, tolerated on the wire', () => {
    // ponytail: @ts-expect-error is the runnable proof — if `allowlist` returns to
    // ProviderConfig this directive goes unused and `tsc --noEmit` fails on it.
    // @ts-expect-error allowlist removed: it had zero readers and duplicated REPO_ROOT_NAMES.
    const legacy: ProviderConfig = { version: 1, providers: [], allowlist: ['./legacy.json'] };
    // Unknown JSON keys survive validateConfig's cast, so an existing operator config
    // carrying "allowlist" keeps loading exactly as before.
    expect(legacy).toHaveProperty('allowlist');
    expect(builtinConfig()).not.toHaveProperty('allowlist');
  });
});

describe('loadProviderConfig', () => {
  let dir: string;
  let externalDir: string | undefined;
  beforeEach(() => { dir = tmpDir(); externalDir = undefined; });
  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
    if (externalDir) fs.rmSync(externalDir, { recursive: true, force: true });
  });

  it('loads relative explicitPath resolved from cwd', () => {
    const explicit: ProviderConfig = {
      version: 1,
      providers: [{ language: 'go', extensions: ['.go'] }],
    };
    const sub = path.join(dir, 'sub');
    fs.mkdirSync(sub);
    fs.writeFileSync(path.join(sub, 'cfg.json'), JSON.stringify(explicit));

    // Pass relative path from dir's perspective
    const { config: cfg, source } = loadProviderConfig(dir, 'sub/cfg.json', true);
    expect(source).toBe('explicit');
    expect(cfg.providers[0]!.language).toBe('go');
  });

  it('loads explicit path over repo root', () => {
    const explicit: ProviderConfig = {
      version: 1,
      providers: [{ language: 'rust', extensions: ['.rs'] }],
    };
    const explicitPath = path.join(dir, 'custom.json');
    fs.writeFileSync(explicitPath, JSON.stringify(explicit));

    // Also put a repo-root config that should be ignored
    fs.writeFileSync(path.join(dir, 'checkchange.providers.json'), JSON.stringify({
      version: 1,
      providers: [{ language: 'go', extensions: ['.go'] }],
    }));

    const { config: cfg, source } = loadProviderConfig(dir, explicitPath, true);
    expect(source).toBe('explicit');
    expect(cfg.providers[0]!.language).toBe('rust');
  });

  it('rejects an explicit external path by default', () => {
    externalDir = tmpDir();
    const externalPath = path.join(externalDir, 'providers.json');
    fs.writeFileSync(externalPath, JSON.stringify({
      version: 1,
      providers: [{ language: 'go', extensions: ['.go'] }],
    }));

    expect(() => loadProviderConfig(dir, externalPath)).toThrow('external config requires allowExternalConfig');
  });

  it('accepts an explicit external path with opt-in', () => {
    externalDir = tmpDir();
    const externalPath = path.join(externalDir, 'providers.json');
    fs.writeFileSync(externalPath, JSON.stringify({
      version: 1,
      providers: [{ language: 'go', extensions: ['.go'] }],
    }));

    const { config: cfg, source } = loadProviderConfig(dir, externalPath, true);
    expect(source).toBe('explicit');
    expect(cfg.providers[0]!.language).toBe('go');
  });

  it('rejects a repo-root symlink whose real path is external', () => {
    externalDir = tmpDir();
    const externalPath = path.join(externalDir, 'providers.json');
    fs.writeFileSync(externalPath, JSON.stringify({
      version: 1,
      providers: [{ language: 'go', extensions: ['.go'] }],
    }));
    fs.symlinkSync(externalPath, path.join(dir, 'checkchange.providers.json'));

    expect(() => loadProviderConfig(dir)).toThrow('external config requires allowExternalConfig');
  });

  it('rejects an explicit symlink alias to an external config', () => {
    externalDir = tmpDir();
    const externalPath = path.join(externalDir, 'providers.json');
    fs.writeFileSync(externalPath, JSON.stringify({
      version: 1,
      providers: [{ language: 'go', extensions: ['.go'] }],
    }));
    const aliasPath = path.join(dir, 'alias.json');
    fs.symlinkSync(externalPath, aliasPath);

    expect(() => loadProviderConfig(dir, aliasPath)).toThrow('external config requires allowExternalConfig');
  });

  it('allows an alias whose real path is an allowed repo-root config', () => {
    const repoPath = path.join(dir, 'checkchange.providers.json');
    fs.writeFileSync(repoPath, JSON.stringify({
      version: 1,
      providers: [{ language: 'go', extensions: ['.go'] }],
    }));
    const aliasPath = path.join(dir, 'alias.json');
    fs.symlinkSync(repoPath, aliasPath);

    const { config: cfg, source } = loadProviderConfig(dir, aliasPath);
    expect(source).toBe('explicit');
    expect(cfg.providers[0]!.language).toBe('go');
  });

  it('loads the second builtin repo-root name after the first is absent', () => {
    const nested = path.join(dir, '.checkchange');
    fs.mkdirSync(nested);
    fs.writeFileSync(path.join(nested, 'providers.json'), JSON.stringify({
      version: 1,
      providers: [{ language: 'rust', extensions: ['.rs'] }],
    }));

    const { config: cfg, source } = loadProviderConfig(dir);
    expect(source).toBe('repo-root');
    expect(cfg.providers[0]!.language).toBe('rust');
  });

  it('does not swallow non-ENOENT repo-root read errors', () => {
    fs.mkdirSync(path.join(dir, 'checkchange.providers.json'));

    expect(() => loadProviderConfig(dir)).toThrow();
  });

  it('loads repo-root checkchange.providers.json when no explicit path', () => {
    const repo: ProviderConfig = {
      version: 1,
      providers: [{ language: 'go', extensions: ['.go'] }],
    };
    fs.writeFileSync(path.join(dir, 'checkchange.providers.json'), JSON.stringify(repo));

    const { config: cfg, source } = loadProviderConfig(dir);
    expect(source).toBe('repo-root');
    expect(cfg.providers[0]!.language).toBe('go');
  });

  it('falls back to builtin when no config file exists', () => {
    const { config: cfg, source } = loadProviderConfig(dir);
    expect(source).toBe('builtin');
    expect(cfg.version).toBe(1);
    expect(cfg.providers.some((p) => p.language === 'typescript')).toBe(true);
  });

  it('validates schema version 1', () => {
    fs.writeFileSync(path.join(dir, 'checkchange.providers.json'), JSON.stringify({
      version: 2,
      providers: [],
    }));
    expect(() => loadProviderConfig(dir)).toThrow('unsupported version');
  });

  it('rejects invalid JSON', () => {
    fs.writeFileSync(path.join(dir, 'checkchange.providers.json'), '{bad json');
    expect(() => loadProviderConfig(dir)).toThrow();
  });

  it('rejects config missing providers array', () => {
    fs.writeFileSync(path.join(dir, 'checkchange.providers.json'), JSON.stringify({
      version: 1,
    }));
    expect(() => loadProviderConfig(dir)).toThrow('missing providers');
  });

  it('rejects testRunners that is not an array', () => {
    fs.writeFileSync(path.join(dir, 'checkchange.providers.json'), JSON.stringify({
      version: 1,
      providers: [{ language: 'go', extensions: ['.go'], testRunners: 'notarray' }],
    }));
    expect(() => loadProviderConfig(dir)).toThrow('testRunners not an array');
  });

  it('rejects testRunner missing required fields', () => {
    fs.writeFileSync(path.join(dir, 'checkchange.providers.json'), JSON.stringify({
      version: 1,
      providers: [{ language: 'go', extensions: ['.go'], testRunners: [{ name: 'go-test' }] }],
    }));
    expect(() => loadProviderConfig(dir)).toThrow('configFiles missing');
  });

  it('accepts config with testRunners', () => {
    const explicit: ProviderConfig = {
      version: 1,
      providers: [{
        language: 'go',
        extensions: ['.go'],
        testRunners: [{
          name: 'gotest',
          configFiles: ['go.mod'],
          binaryProbes: ['go'],
          command: ['go', 'test', '-coverprofile', 'coverage.out'],
          artifact: 'coverage.out',
        }],
      }],
    };
    fs.writeFileSync(path.join(dir, 'checkchange.providers.json'), JSON.stringify(explicit));
    const { config: cfg, source } = loadProviderConfig(dir);
    expect(source).toBe('repo-root');
    expect(cfg.providers[0]!.testRunners).toEqual(explicit.providers[0]!.testRunners);
  });

  it('accepts config with testRunner install block', () => {
    const explicit: ProviderConfig = {
      version: 1,
      providers: [{
        language: 'python',
        extensions: ['.py'],
        testRunners: [{
          name: 'pytest',
          configFiles: ['pytest.ini'],
          binaryProbes: ['.venv/bin/pytest'],
          command: ['python3', '-m', 'pytest'],
          artifact: 'coverage.xml',
          install: { packages: ['pytest', 'coverage'] },
        }],
      }],
    };
    fs.writeFileSync(path.join(dir, 'checkchange.providers.json'), JSON.stringify(explicit));
    const { config: cfg } = loadProviderConfig(dir);
    expect(cfg.providers[0]!.testRunners![0]!.install).toEqual({ packages: ['pytest', 'coverage'] });
  });

  it('rejects testRunner install with non-array packages', () => {
    fs.writeFileSync(path.join(dir, 'checkchange.providers.json'), JSON.stringify({
      version: 1,
      providers: [{
        language: 'python',
        extensions: ['.py'],
        testRunners: [{
          name: 'pytest',
          configFiles: ['pytest.ini'],
          binaryProbes: [],
          command: ['pytest'],
          artifact: 'coverage.xml',
          install: { packages: 'not-an-array' },
        }],
      }],
    }));
    expect(() => loadProviderConfig(dir)).toThrow('install.packages must be an array');
  });

  it('accepts testRunner without install field', () => {
    const explicit: ProviderConfig = {
      version: 1,
      providers: [{
        language: 'go',
        extensions: ['.go'],
        testRunners: [{
          name: 'gotest',
          configFiles: ['go.mod'],
          binaryProbes: ['go'],
          command: ['go', 'test', '-coverprofile', 'coverage.out'],
          artifact: 'coverage.out',
        }],
      }],
    };
    fs.writeFileSync(path.join(dir, 'checkchange.providers.json'), JSON.stringify(explicit));
    const { config: cfg } = loadProviderConfig(dir);
    expect(cfg.providers[0]!.testRunners![0]!.install).toBeUndefined();
  });

  it('REJECTS a loaded config that sets coverageCmd (was silently ignored)', () => {
    const cfg = {
      version: 1,
      providers: [{ language: 'python', extensions: ['.py'], coverageCmd: 'coverage json -o {out}' }],
    };
    fs.writeFileSync(path.join(dir, 'checkchange.providers.json'), JSON.stringify(cfg));
    // The old silently-ignored path no longer exists: loadProviderConfig cannot hand back a
    // config whose coverageCmd reaches ResolvedProvider non-null, so nothing downstream can
    // be quietly wrong. Operators get the failure at load instead of wrong coverage results.
    expect(() => loadProviderConfig(dir))
      .toThrow('config: providers[0].coverageCmd not supported (never executed); remove the key');
  });

  it('names the offending index when a later provider sets coverageCmd', () => {
    const cfg = {
      version: 1,
      providers: [
        { language: 'go', extensions: ['.go'] },
        { language: 'python', extensions: ['.py'], coverageCmd: 'coverage json -o {out}' },
      ],
    };
    fs.writeFileSync(path.join(dir, 'checkchange.providers.json'), JSON.stringify(cfg));
    expect(() => loadProviderConfig(dir))
      .toThrow('config: providers[1].coverageCmd not supported (never executed); remove the key');
  });

  it('rejects an explicit null coverageCmd too (the key must be absent, not blank)', () => {
    const cfg = {
      version: 1,
      providers: [{ language: 'python', extensions: ['.py'], coverageCmd: null }],
    };
    fs.writeFileSync(path.join(dir, 'checkchange.providers.json'), JSON.stringify(cfg));
    expect(() => loadProviderConfig(dir))
      .toThrow('config: providers[0].coverageCmd not supported (never executed); remove the key');
  });

  it('accepts a config whose providers simply omit coverageCmd', () => {
    const cfg = {
      version: 1,
      providers: [{ language: 'python', extensions: ['.py'], coverageFiles: ['.coverage'] }],
    };
    fs.writeFileSync(path.join(dir, 'checkchange.providers.json'), JSON.stringify(cfg));
    const { config: loaded, source } = loadProviderConfig(dir);
    expect(source).toBe('repo-root');
    expect(deriveRegistry(loaded, source).get('.py')!.coverageCmd).toBeNull();
  });
});

describe('deriveRegistry', () => {
  it('maps extensions to resolved providers', () => {
    const cfg: ProviderConfig = {
      version: 1,
      providers: [{
        language: 'python',
        extensions: ['.py'],
        complexityCmd: 'pycmd {files}',
        coverageFiles: ['.coverage'],
        coverageCmd: 'covcmd {out}',
      }],
    };
    const reg = deriveRegistry(cfg);
    const py = reg.get('.py');
    expect(py).toBeDefined();
    expect(py!.language).toBe('python');
    expect(py!.complexityCmd).toBe('pycmd {files}');
    expect(py!.coverageFiles).toEqual(['.coverage']);
    expect(py!.coverageCmd).toBe('covcmd {out}');
  });

  it('later entries override earlier for same extension', () => {
    const cfg: ProviderConfig = {
      version: 1,
      providers: [
        { language: 'old', extensions: ['.py'] },
        { language: 'new', extensions: ['.py', '.pyi'] },
      ],
    };
    const reg = deriveRegistry(cfg);
    expect(reg.get('.py')!.language).toBe('new');
    expect(reg.get('.pyi')!.language).toBe('new');
  });

  it('nulls out optional fields not provided', () => {
    const cfg: ProviderConfig = {
      version: 1,
      providers: [{ language: 'x', extensions: ['.x'] }],
    };
    const reg = deriveRegistry(cfg);
    const x = reg.get('.x')!;
    expect(x.complexityCmd).toBeNull();
    expect(x.coverageCmd).toBeNull();
    expect(x.coverageFiles).toEqual([]);
  });

  it('passes testRunners through to resolved provider', () => {
    const cfg: ProviderConfig = {
      version: 1,
      providers: [{
        language: 'python',
        extensions: ['.py'],
        testRunners: [{
          name: 'pytest',
          configFiles: ['pytest.ini'],
          binaryProbes: ['.venv/bin/Pytest'],
          command: ['python3', '-m', 'pytest'],
          artifact: 'coverage.xml',
        }],
      }],
    };
    const reg = deriveRegistry(cfg);
    const py = reg.get('.py')!;
    expect(py.testRunners).toEqual(cfg.providers[0]!.testRunners);
  });

  it('nulls testRunners when not provided', () => {
    const cfg: ProviderConfig = {
      version: 1,
      providers: [{ language: 'x', extensions: ['.x'] }],
    };
    const reg = deriveRegistry(cfg);
    const x = reg.get('.x')!;
    expect(x.testRunners).toBeNull();
  });

  it('passes install block through to resolved provider testRunner', () => {
    const cfg: ProviderConfig = {
      version: 1,
      providers: [{
        language: 'python',
        extensions: ['.py'],
        testRunners: [{
          name: 'pytest',
          configFiles: ['pytest.ini'],
          binaryProbes: ['.venv/bin/pytest'],
          command: ['python3', '-m', 'pytest'],
          artifact: 'coverage.xml',
          install: { packages: ['pytest', 'coverage'] },
        }],
      }],
    };
    const reg = deriveRegistry(cfg);
    const py = reg.get('.py')!;
    expect(py.testRunners![0]!.install).toEqual({ packages: ['pytest', 'coverage'] });
  });
});
