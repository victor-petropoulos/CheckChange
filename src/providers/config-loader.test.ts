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
});

describe('loadProviderConfig', () => {
  let dir: string;
  beforeEach(() => { dir = tmpDir(); });
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }); });

  it('loads relative explicitPath resolved from cwd', () => {
    const explicit: ProviderConfig = {
      version: 1,
      providers: [{ language: 'go', extensions: ['.go'] }],
    };
    const sub = path.join(dir, 'sub');
    fs.mkdirSync(sub);
    fs.writeFileSync(path.join(sub, 'cfg.json'), JSON.stringify(explicit));

    // Pass relative path from dir's perspective
    const { config: cfg, source } = loadProviderConfig(dir, 'sub/cfg.json');
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

    const { config: cfg, source } = loadProviderConfig(dir, explicitPath);
    expect(source).toBe('explicit');
    expect(cfg.providers[0]!.language).toBe('rust');
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
});
