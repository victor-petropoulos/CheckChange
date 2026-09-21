/**
 * Generic test-runner resolver.
 * Given a provider registry (Map<extension, ResolvedProvider>) and a cwd,
 * detect which test runners are available per language.
 *
 * Precedence: configFiles glob match OR binaryProbes match, first runner per
 * language wins. Preserves current auto-coverage behavior:
 *   - vitest/jest: root-level config file (e.g. vitest.config.*) OR package.json dep
 *   - pytest:    root-level config (pytest.ini/pyproject.toml/...) + venv-aware binary probe
 *   (source-file presence is a precondition so runners only report for languages
 *    actually present in the repo.)
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { spawnSync } from 'node:child_process';
import type { ResolvedProvider, TestRunner } from './config.js';

export interface ResolvedRunner {
  /** Full spawn command, e.g. ['npx','vitest','run','--coverage']. */
  command: string[];
  /** Coverage artifact path (relative, as configured). */
  artifact: string;
  /** Human-readable evidence, e.g. 'pytest.ini + .venv/bin/pytest'. */
  provenance: string;
}

const PROBE_VERSION_TIMEOUT_MS = 10_000;
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build', 'coverage']);

// ---- Helpers ----

/** True if any file under cwd (recursive) carries one of the provider's extensions. */
function hasSourceFiles(cwd: string, extensions: string[]): boolean {
  const exts = new Set(extensions.map((e) => e.toLowerCase()));
  function walk(dir: string): boolean {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return false;
    }
    for (const e of entries) {
      if (e.isDirectory()) {
        if (SKIP_DIRS.has(e.name)) continue;
        if (walk(path.join(dir, e.name))) return true;
      } else if (e.isFile() && exts.has(path.extname(e.name).toLowerCase())) {
        return true;
      }
    }
    return false;
  }
  return walk(cwd);
}

/** Match a configured configFile glob against root-level files in cwd. Returns matched filename. */
function matchConfigFile(cwd: string, pattern: string): string | null {
  let files: string[];
  try {
    files = fs.readdirSync(cwd);
  } catch {
    return null;
  }
  const re = pattern.includes('*')
    ? new RegExp('^' + pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$')
    : null;
  for (const f of files) {
    const full = path.join(cwd, f);
    const isMatch = re ? re.test(f) : f === pattern;
    if (isMatch) {
      try {
        if (fs.statSync(full).isFile()) return f;
      } catch {
        /* not a file / unreadable — skip */
      }
    }
  }
  return null;
}

function hasPackageDep(cwd: string, dep: string): boolean {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(cwd, 'package.json'), 'utf8'));
    return !!(pkg.devDependencies?.[dep] || pkg.dependencies?.[dep]);
  } catch {
    return false;
  }
}

/** Probe a command-style binaryProbe (e.g. 'python3 -m pytest') via `--version`. */
function commandProbeAvailable(parts: string[], cwd: string): boolean {
  if (parts.length === 0) return false;
  const cmd = parts[0]!;
  const args = [...parts.slice(1), '--version'];
  try {
    const res = spawnSync(cmd, args, {
      cwd,
      encoding: 'utf8',
      timeout: PROBE_VERSION_TIMEOUT_MS,
    });
    return res.status === 0;
  } catch {
    return false;
  }
}

/** Probe a single TestRunner; returns provenance string if available, else null. */
function probeRunner(cwd: string, runner: TestRunner): { provenance: string } | null {
  const configMatches: string[] = [];
  for (const cf of runner.configFiles) {
    const m = matchConfigFile(cwd, cf);
    if (m) configMatches.push(m);
  }

  const binaryMatches: string[] = [];
  for (const bp of runner.binaryProbes) {
    if (bp === 'VIRTUAL_ENV') {
      if (process.env.VIRTUAL_ENV) binaryMatches.push('VIRTUAL_ENV');
    } else if (bp.includes(' ')) {
      const parts = bp.split(/\s+/);
      if (parts[0] === 'npx') {
        // npx <runner>: available via package.json dep OR config already matched.
        const dep = parts[1] ?? '';
        if (configMatches.length > 0 || hasPackageDep(cwd, dep)) binaryMatches.push(bp);
      } else if (commandProbeAvailable(parts, cwd)) {
        binaryMatches.push(bp);
      }
    } else {
      // literal path: must exist and be executable.
      const full = path.isAbsolute(bp) ? bp : path.join(cwd, bp);
      try {
        fs.accessSync(full, fs.constants.X_OK);
        binaryMatches.push(bp);
      } catch {
        /* missing or not executable */
      }
    }
  }

  if (configMatches.length === 0 && binaryMatches.length === 0) return null;
  return { provenance: [...configMatches, ...binaryMatches].join(' + ') };
}

// ---- Public API ----

/**
 * Resolve available test runners per language.
 * Returns one entry per language whose source files are present AND whose
 * first-available runner (by configFiles/binaryProbes) probes successfully.
 * Empty map if none detected.
 */
export function resolveRunner(
  cwd: string,
  registry: Map<string, ResolvedProvider>,
): Map<string, ResolvedRunner> {
  const result = new Map<string, ResolvedRunner>();
  const seen = new Set<ResolvedProvider>();
  for (const provider of registry.values()) {
    if (seen.has(provider)) continue; // dedupe extensions → one pass per provider
    seen.add(provider);

    if (!hasSourceFiles(cwd, provider.extensions)) continue;
    if (!provider.testRunners) continue;

    for (const runner of provider.testRunners) {
      const probed = probeRunner(cwd, runner);
      if (probed) {
        result.set(provider.language, {
          command: runner.command,
          artifact: runner.artifact,
          provenance: probed.provenance,
        });
        break; // first hit per language wins
      }
    }
  }
  return result;
}
