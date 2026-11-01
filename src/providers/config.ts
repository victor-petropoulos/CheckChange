/**
 * Config-driven provider registry.
 * Precedence: explicit path > repo root ./checkchange.providers.json > builtin defaults.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';

/** Test runner definition for a provider language. */
export interface TestRunner {
  name: string;
  configFiles: string[];
  binaryProbes: string[];
  command: string[];
  artifact: string;
  /** Optional install spec consulted by prepare-repo (Task 1). */
  install?: {
    packages: string[];
  };
}

export interface ProviderEntry {
  language: string;
  extensions: string[];
  complexityCmd?: string;
  coverageFiles?: string[];
  coverageCmd?: string;
  testRunners?: TestRunner[];
}

export interface ProviderConfig {
  version: number;
  providers: ProviderEntry[];
}

export interface ResolvedProvider {
  language: string;
  extensions: string[];
  complexityCmd: string | null;
  coverageFiles: string[];
  coverageCmd: string | null;
  testRunners: TestRunner[] | null;
  /** Whether this provider came from the builtin defaults or a loaded config file. */
  source: 'builtin' | string;
}

// ---- Builtin defaults (current hardcoded values as config) ----

const PY_EXTENSIONS = ['.py'];

const VITEST_RUNNER: TestRunner = {
  name: 'vitest',
  configFiles: ['vitest.config.*'],
  binaryProbes: [],
  command: ['npx', 'vitest', 'run', '--coverage'],
  artifact: 'coverage/coverage-final.json',
};

const JEST_RUNNER: TestRunner = {
  name: 'jest',
  configFiles: ['jest.config.*'],
  binaryProbes: [],
  command: ['npx', 'jest', '--coverage'],
  artifact: 'coverage/coverage-final.json',
};

const PYTEST_RUNNER: TestRunner = {
  name: 'pytest',
  configFiles: ['pyproject.toml', 'pytest.ini', 'setup.cfg', 'requirements.txt'],
  binaryProbes: ['.venv/bin/pytest', 'VIRTUAL_ENV', 'python3 -m pytest'],
  command: ['python3', '-m', 'pytest', '--cov', '--cov-report=xml'],
  artifact: 'coverage.xml',
};

// Coverlet ships in the `dotnet` SDK; the XPlat collector needs no extra package,
// hence no `install` (no builtin runner declares one — see PYTEST/JEST/VITEST).
// binaryProbes must be a COMMAND probe: probeRunner treats a space-free entry as a
// literal path (`fs.accessSync(path.join(cwd, bp))`, runner-detection.ts:148-156),
// so a bare `dotnet` could never match. Same shape as PYTEST's `python3 -m pytest`.
// ponytail: MEASURED (dotnet 9.0.121, coverlet.collector 6.0.4) — the XPlat
// collector always writes `TestResults/<guid>/coverage.cobertura.xml`. The GUID comes
// from vstest, not Coverlet, and `--results-directory` pins only the PARENT, so no
// literal can name it. Runsettings `<Output>` (relative AND absolute) and inline
// `Output=` are SILENTLY IGNORED — verified: artifact still landed in the GUID dir.
// Coverlet also exposes no `Output` knob at all (only `ReportFormat`). This `artifact`
// literal is therefore permanently INERT: no consumer globs. Real discovery works
// anyway, via two live paths — the TestResults scan in readCoverage (src/coverage.ts)
// and an explicit `--coverage-file <path>`. Both are measured green on a real repo
// (auto-detect, no flag, no config change). Do not "fix" this with a glob: globs are
// inert in every coverage consumer — see Task 4 acceptance item 11.
const DOTNET_RUNNER: TestRunner = {
  name: 'dotnet',
  configFiles: ['*.csproj', '*.sln'],
  binaryProbes: ['dotnet --version'],
  command: ['dotnet', 'test', '--collect:XPlat Code Coverage'],
  artifact: 'TestResults/coverage.cobertura.xml',
};

export function builtinConfig(): ProviderConfig {
  return {
    version: 1,
    providers: [
      {
        language: 'javascript',
        extensions: ['.js', '.jsx', '.mjs', '.cjs'],
        coverageFiles: ['coverage/coverage-final.json', 'coverage/lcov.info'],
        testRunners: [VITEST_RUNNER, JEST_RUNNER],
      },
      {
        language: 'typescript',
        extensions: ['.ts', '.tsx'],
        coverageFiles: ['coverage/coverage-final.json', 'coverage/lcov.info'],
        testRunners: [VITEST_RUNNER, JEST_RUNNER],
      },
      {
        language: 'python',
        extensions: PY_EXTENSIONS,
        coverageFiles: ['.coverage', 'coverage.xml', 'coverage.json', 'coverage/coverage-final.json'],
        testRunners: [PYTEST_RUNNER],
      },
      {
        language: 'csharp',
        extensions: ['.cs'],
        // ponytail: no complexityCmd — createGenericCommandProvider returns null for
        // an entry without one (genericCommand.ts:35), which is INTENDED: the csharp
        // provider is composed by the registration branch at evidence.ts, not by a
        // shell command. coverageFiles are LITERAL paths (acceptance item 11): discovery tries
        // exact literal via path.join + access(), then case-insensitive readdir
        // fallback in candidate's dirname; only misses both paths silently. Glob
        // entries stay inert (no consumer globs them).
        // Deliberately EMPTY. A Coverlet artifact lands in a per-run
        // `TestResults/<GUID>/` directory whose name vstest generates; no literal
        // can name it, and the three plausible-looking candidates previously listed
        // here were never observed on disk. Discovery is the automatic TestResults
        // scan in src/coverage.ts (scanCoberturaUnderTestResults) plus an explicit
        // `--coverage-file`. Adding unverifiable paths here would be worse than a
        // recorded gap: an entry that misses is silently skipped, so it buys nothing
        // and misleads the next reader about what was actually tested.
        coverageFiles: [],
        testRunners: [DOTNET_RUNNER],
      },
    ],
  };
}

// ---- Config loading ----

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

// ponytail: extracted from validateConfig to reduce cyclomatic complexity / CRAP.
function validateTestRunner(runner: unknown, i: number, j: number): void {
  if (!isRecord(runner)) throw new Error(`config: providers[${i}].testRunners[${j}] not an object`);
  if (typeof runner.name !== 'string') throw new Error(`config: providers[${i}].testRunners[${j}].name missing`);
  if (!Array.isArray(runner.configFiles)) throw new Error(`config: providers[${i}].testRunners[${j}].configFiles missing`);
  if (!Array.isArray(runner.binaryProbes)) throw new Error(`config: providers[${i}].testRunners[${j}].binaryProbes missing`);
  if (!Array.isArray(runner.command)) throw new Error(`config: providers[${i}].testRunners[${j}].command missing`);
  if (typeof runner.artifact !== 'string') throw new Error(`config: providers[${i}].testRunners[${j}].artifact missing`);
  if (runner.install !== undefined) validateInstallField(runner.install, i, j);
}

// ponytail: extracted install-field check from validateTestRunner (trivially separable).
function validateInstallField(install: unknown, i: number, j: number): void {
  if (!isRecord(install)) throw new Error(`config: providers[${i}].testRunners[${j}].install not an object`);
  if (!Array.isArray(install.packages)) throw new Error(`config: providers[${i}].testRunners[${j}].install.packages must be an array`);
}

// BEHAVIOR CHANGE: providers[].coverageCmd moves from silently-ignored to REJECTED at load.
// It was declared (ProviderEntry.coverageCmd) and mapped (deriveRegistry) but never executed —
// nothing in src/ spawns it. Exact error text:
//   config: providers[<i>].coverageCmd not supported (never executed); remove the key
// Option (a) taken: reject at validateConfig (the schema choke point for both file-based load
// paths, :166 + :187) and strip builtinConfig's own copy, since the builtin path :189 bypasses
// validateConfig. deriveRegistry stays a pure mapper. Any present value rejects, including an
// explicit `coverageCmd: null` — the operator wrote the key, so tell them to delete it rather
// than silently accept a field the tool ignores.
// Migration: delete coverageCmd from checkchange.providers.json / .checkchange/providers.json.
// The same change removed the dead `allowlist` field (zero readers; it duplicated
// REPO_ROOT_NAMES below). JSON configs carrying it still load unchanged, so no migration.
// ponytail: own function to match validateTestRunner/validateInstallField above.
function rejectCoverageCmd(entry: Record<string, unknown>, i: number): void {
  if (entry.coverageCmd !== undefined) {
    throw new Error(`config: providers[${i}].coverageCmd not supported (never executed); remove the key`);
  }
}

function validateConfig(raw: unknown): ProviderConfig {
  if (!isRecord(raw)) throw new Error('config: not an object');
  if (raw.version !== 1) throw new Error(`config: unsupported version ${String(raw.version)}`);
  if (!Array.isArray(raw.providers)) throw new Error('config: missing providers array');
  for (const [i, entry] of raw.providers.entries()) {
    if (!isRecord(entry)) throw new Error(`config: providers[${i}] not an object`);
    if (typeof entry.language !== 'string') throw new Error(`config: providers[${i}].language missing`);
    if (!Array.isArray(entry.extensions)) throw new Error(`config: providers[${i}].extensions missing`);
    rejectCoverageCmd(entry, i);
    if (entry.testRunners !== undefined) {
      if (!Array.isArray(entry.testRunners)) throw new Error(`config: providers[${i}].testRunners not an array`);
      for (const [j, runner] of entry.testRunners.entries()) {
        validateTestRunner(runner, i, j);
      }
    }
  }
  return raw as unknown as ProviderConfig;
}

const REPO_ROOT_NAMES = [
  'checkchange.providers.json',
  path.join('.checkchange', 'providers.json'),
];

function isRepoRootConfig(realPath: string, realCwd: string): boolean {
  return REPO_ROOT_NAMES.some((name) => realPath === path.join(realCwd, name));
}

export function loadProviderConfig(
  cwd: string,
  explicitPath?: string,
  allowExternalConfig = false,
): { config: ProviderConfig; source: 'explicit' | 'repo-root' | 'builtin' } {
  if (explicitPath !== undefined) {
    const resolved = path.isAbsolute(explicitPath)
      ? explicitPath
      : path.resolve(cwd, explicitPath);
    const real = fs.realpathSync(resolved);
    if (!allowExternalConfig && !isRepoRootConfig(real, fs.realpathSync(cwd))) {
      throw new Error('config: external config requires allowExternalConfig');
    }
    return { config: validateConfig(JSON.parse(fs.readFileSync(real, 'utf8'))), source: 'explicit' };
  }
  for (const name of REPO_ROOT_NAMES) {
    const candidate = path.resolve(cwd, name);
    let realCandidate: string;
    try {
      realCandidate = fs.realpathSync(candidate);
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'code' in err && err.code === 'ENOENT') continue; // file missing — try next
      throw err;
    }
    if (!allowExternalConfig && !isRepoRootConfig(realCandidate, fs.realpathSync(cwd))) {
      throw new Error('config: external config requires allowExternalConfig');
    }
    let raw: string;
    try {
      raw = fs.readFileSync(realCandidate, 'utf8');
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'code' in err && err.code === 'ENOENT') continue; // file disappeared — try next
      throw err;
    }
    return { config: validateConfig(JSON.parse(raw)), source: 'repo-root' }; // throws on bad JSON or bad schema
  }
  return { config: builtinConfig(), source: 'builtin' };
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
      testRunners: entry.testRunners ?? null,
      source,
    };
    for (const ext of entry.extensions) {
      map.set(ext, resolved); // later entry overrides
    }
  }
  return map;
}
