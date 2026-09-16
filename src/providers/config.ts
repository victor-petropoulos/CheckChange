/**
 * Config-driven provider registry.
 * Precedence: explicit path > repo root ./checkchange.providers.json > builtin defaults.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';

export interface ProviderEntry {
  language: string;
  extensions: string[];
  complexityCmd?: string;
  coverageFiles?: string[];
  coverageCmd?: string;
}

export interface ProviderConfig {
  version: number;
  providers: ProviderEntry[];
  allowlist?: string[];
}

export interface ResolvedProvider {
  language: string;
  extensions: string[];
  complexityCmd: string | null;
  coverageFiles: string[];
  coverageCmd: string | null;
  /** Whether this provider came from the builtin defaults or a loaded config file. */
  source: 'builtin' | string;
}

// ---- Builtin defaults (current hardcoded values as config) ----

const TS_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'];
const PY_EXTENSIONS = ['.py'];

export function builtinConfig(): ProviderConfig {
  return {
    version: 1,
    providers: [
      {
        language: 'typescript',
        extensions: TS_EXTENSIONS,
        coverageFiles: ['coverage/coverage-final.json', 'coverage/lcov.info'],
      },
      {
        language: 'python',
        extensions: PY_EXTENSIONS,
        coverageFiles: ['.coverage', 'coverage.xml', 'coverage.json', 'coverage/coverage-final.json'],
        coverageCmd: 'coverage json -o {out}',
      },
    ],
    allowlist: ['./checkchange.providers.json', './.checkchange/providers.json'],
  };
}

// ---- Config loading ----

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function validateConfig(raw: unknown): ProviderConfig {
  if (!isRecord(raw)) throw new Error('config: not an object');
  if (raw.version !== 1) throw new Error(`config: unsupported version ${String(raw.version)}`);
  if (!Array.isArray(raw.providers)) throw new Error('config: missing providers array');
  for (const [i, entry] of raw.providers.entries()) {
    if (!isRecord(entry)) throw new Error(`config: providers[${i}] not an object`);
    if (typeof entry.language !== 'string') throw new Error(`config: providers[${i}].language missing`);
    if (!Array.isArray(entry.extensions)) throw new Error(`config: providers[${i}].extensions missing`);
  }
  return raw as unknown as ProviderConfig;
}

const REPO_ROOT_NAMES = [
  'checkchange.providers.json',
  path.join('.checkchange', 'providers.json'),
];

export function loadProviderConfig(cwd: string, explicitPath?: string): ProviderConfig {
  if (explicitPath !== undefined) {
    const resolved = path.isAbsolute(explicitPath)
      ? explicitPath
      : path.resolve(cwd, explicitPath);
    return validateConfig(JSON.parse(fs.readFileSync(resolved, 'utf8')));
  }
  for (const name of REPO_ROOT_NAMES) {
    const candidate = path.resolve(cwd, name);
    let raw: string;
    try {
      raw = fs.readFileSync(candidate, 'utf8');
    } catch (err: any) {
      if (err?.code === 'ENOENT') continue; // file missing — try next
      throw err; // EACCES, EISDIR, etc. — propagate, don't silently skip
    }
    return validateConfig(JSON.parse(raw)); // throws on bad JSON or bad schema
  }
  return builtinConfig();
}

// ---- Registry derivation ----

export function deriveRegistry(config: ProviderConfig, source: 'builtin' | string = 'builtin'): Map<string, ResolvedProvider> {
  const map = new Map<string, ResolvedProvider>();
  for (const entry of config.providers) {
    const resolved: ResolvedProvider = {
      language: entry.language,
      extensions: entry.extensions,
      complexityCmd: entry.complexityCmd ?? null,
      coverageFiles: entry.coverageFiles ?? [],
      coverageCmd: entry.coverageCmd ?? null,
      source,
    };
    for (const ext of entry.extensions) {
      map.set(ext, resolved); // later entry overrides
    }
  }
  return map;
}
