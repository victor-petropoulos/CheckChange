import * as path from 'node:path';
import * as fs from 'node:fs';
import { access, constants, readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { parseCoverageReport } from '@barney-media/crap-typescript-core';

// Value type of the coverage Map returned by parseCoverageReport.
// Derived from the return type to avoid importing the unexported FileCoverage.
type CoverageMap = Awaited<ReturnType<typeof parseCoverageReport>>;
import { parseLcovContent } from './coverage-providers/lcovProvider.js';
import { parseCoberturaContent } from './coverage-providers/coberturaProvider.js';
import { openWithinRoot } from './fs-safety.js';
import { providerRegistry } from './evidence.js';
import type { TraceRun } from './execute.js';

// Provenance for the coverage lineage stage: artifact parser from the core package.
export const coverageProvenance = { tool: '@barney-media/crap-typescript-core', version: '0.5.0' } as const;

export interface CoverageResult {
  available: boolean;
  coverageMap: CoverageMap | null;
  error: boolean;
  reason?: string;
  /** SHA-256 hex of the coverage artifact bytes as read (present only on a successful read). */
  contentSha256?: string;
}

const MAX_COVERAGE_SIZE = 100 * 1024 * 1024; // 100MB
export const PYTHON_COVERAGE_FILES: readonly string[] = ['.coverage', 'coverage.xml', 'coverage.json', 'coverage/coverage-final.json']; // kept for backward compat; prefer config-driven coverageFiles

/**
 * Validate file size and read auto-detected files from one fail-closed descriptor.
 * Explicit files (user-provided) retain the containment exception.
 */
async function validateAndReadFile(filePath: string, cwd: string, isExplicit = false): Promise<string | null> {
  try {
    if (isExplicit) {
      const fs = await import('node:fs/promises');
      const stats = await fs.stat(filePath);
      if (stats.size > MAX_COVERAGE_SIZE) {
        return null;
      }
      return await readFile(filePath, 'utf8');
    }

    const handle = await openWithinRoot(cwd, filePath);
    try {
      const stats = await handle.stat();
      if (stats.size > MAX_COVERAGE_SIZE) {
        return null;
      }
      return await handle.readFile('utf8');
    } finally {
      await handle.close();
    }
  } catch {
    return null;
  }
}

/**
 * Attempt to convert Python coverage format to Istanbul JSON using `coverage json`.
 * Returns the path to the generated JSON file, or null if conversion fails.
 */
async function convertPythonCoverageToJson(inputPath: string, cwd: string): Promise<string | null> {
  const outputPath = path.join(cwd, `.checkchange-coverage-temp-${process.pid}-${Math.random().toString(36).slice(2)}.json`);
  // Best effort: delete stale temp file before writing new one
  try {
    await import('node:fs/promises').then(fs => fs.unlink(outputPath));
  } catch {
    // ignore
  }
  // Try `coverage json` first (coverage.py v7+), then fallback to `python3 -m coverage json`
  const commands: string[][] = [
    ['coverage', 'json', '-o', outputPath],
    ['python3', '-m', 'coverage', 'json', '-o', outputPath],
  ];
  
  for (const cmd of commands) {
    const command = cmd[0]!;
    const args = cmd.slice(1);
    try {
      const result = spawnSync(command, args, {
        cwd,
        encoding: 'utf8',
        timeout: 30000,
      });
      if (result.status === 0) {
        // Verify output was created and is valid
        const content = await validateAndReadFile(outputPath, cwd);
        if (content) {
          // Transform Python coverage JSON format to Istanbul format
          const transformedPath = await transformPythonCoverageToIstanbul(outputPath, cwd);
          if (transformedPath) {
            // Cleanup the intermediate Python JSON temp file
            try {
              await import('node:fs/promises').then(fs => fs.unlink(outputPath));
            } catch {
              // ignore
            }
            return transformedPath;
          }
        }
        // Command succeeded but output invalid/missing - cleanup and continue
        try {
          await import('node:fs/promises').then(fs => fs.unlink(outputPath));
        } catch {
          // ignore cleanup failure
        }
      }
    } catch {
      // Command not found or failed, try next
    }
  }
  // Final cleanup attempt for any partial file left behind
  try {
    await import('node:fs/promises').then(fs => fs.unlink(outputPath));
  } catch {
    // ignore
  }
  return null;
}

// Istanbul coverage format (consumed by parseCoverageReport)
type CoveragePos = { line: number; column: number };
type IstanbulStatement = { start: CoveragePos; end: CoveragePos };
type IstanbulFunction = { name: string; decl: { start: CoveragePos; end: CoveragePos }; line: number };
interface IstanbulFileCoverage {
  statementMap: Record<string, IstanbulStatement>;
  s: Record<string, number>;
  fnMap: Record<string, IstanbulFunction>;
  f: Record<string, number>;
  branchMap: Record<string, unknown>;
  b: Record<string, unknown>;
}
// Python coverage.py JSON format
interface PythonCoverageFunction {
  start_line: number;
  end_line?: number;
  executed_lines?: number[];
  missing_lines?: number[];
  summary?: { percent_covered?: number };
}
interface PythonCoverageFile {
  executed_lines?: number[];
  missing_lines?: number[];
  excluded_lines?: number[];
  functions?: Record<string, PythonCoverageFunction>;
}

// Read + validate the Python coverage artifact and return its `files` map.
// Returns null when the artifact is unreadable, unparseable, or not Python-shaped;
// callers treat null and the caller's own null-check as the single failure seam.
async function readPythonCoverageFiles(pythonJsonPath: string, cwd: string): Promise<Record<string, unknown> | null> {
  const content = await validateAndReadFile(pythonJsonPath, cwd);
  if (!content) {
    return null;
  }
  const pythonCoverage = JSON.parse(content);
  const files = pythonCoverage.files;
  if (!files || typeof files !== 'object') {
    return null;
  }
  return files;
}

// Dedupe-and-truncate ceiling for one file's combined executed + missing line list.
const MAX_LINES = 200_000;

// Build the Istanbul statementMap + s for one file. Dedupe-then-numeric-sort order and the
// sequential id assignment are load-bearing: they fix the key order the artifact serializes in.
function buildStatementMap(pythonFileData: PythonCoverageFile): { statementMap: Record<string, IstanbulStatement>; s: Record<string, number> } {
  const executedLines: number[] = pythonFileData.executed_lines || [];
  const missingLines: number[] = pythonFileData.missing_lines || [];
  const combined = [...executedLines, ...missingLines];
  const deduped = combined.length > MAX_LINES ? [...new Set(combined)].slice(0, MAX_LINES) : [...new Set(combined)];
  const allLines = deduped.sort((a, b) => a - b);

  const statementMap: Record<string, IstanbulStatement> = {};
  const s: Record<string, number> = {};
  let stmtId = 0;

  for (const line of allLines) {
    const key = String(stmtId++);
    statementMap[key] = {
      start: { line, column: 0 },
      end: { line, column: 0 }
    };
    s[key] = executedLines.includes(line) ? 1 : 0;
  }
  return { statementMap, s };
}

// Build the Istanbul fnMap + f for one file. The fnId counter and the fnMap[key]
// assignment stay one atomic unit: they fix the key order the artifact serializes in.
function buildFunctionMap(pythonFileData: PythonCoverageFile): { fnMap: Record<string, IstanbulFunction>; f: Record<string, number> } {
  const fnMap: Record<string, IstanbulFunction> = {};
  const f: Record<string, number> = {};
  let fnId = 0;

  const functions = pythonFileData.functions || {};
  for (const [funcName, funcData] of Object.entries(functions)) {
    const func = funcData as PythonCoverageFunction;
    const key = String(fnId++);
    const startLine = func.start_line || 1;
    // coverage.py functions carry only start_line (no end_line). Statements
    // attribute to a method only inside its fn span, so bound the end via
    // the function's own line coverage; fall back to startLine when empty.
    // ponytail: no end_line in artifact => synthesize; never guess beyond lines we saw.
    const funcLines = [...(func.executed_lines || []), ...(func.missing_lines || [])];
    const endLine = func.end_line ?? (funcLines.length > 0 ? funcLines.reduce((m, v) => v > m ? v : m, funcLines[0]!) : startLine);
    const covered = (func.summary?.percent_covered ?? 0) === 100;

    fnMap[key] = {
      name: funcName,
      decl: {
        start: { line: startLine, column: 0 },
        end: { line: endLine, column: 0 }
      },
      line: startLine
    };
    f[key] = covered ? 1 : 0;
  }
  return { fnMap, f };
}

// Compose one file's complete Istanbul entry from the two map builders. branchMap/b
// stay literally empty: the Python format carries no branch data to read.
function assembleIstanbulFileCoverage(pythonFileData: PythonCoverageFile): IstanbulFileCoverage {
  const { statementMap, s } = buildStatementMap(pythonFileData);
  const { fnMap, f } = buildFunctionMap(pythonFileData);
  return {
    statementMap,
    s,
    fnMap,
    f,
    branchMap: {},
    b: {}
  };
}

/**
 * Transform Python coverage JSON format to Istanbul format expected by parseCoverageReport.
 * Python format: { meta, files: { filepath: { executed_lines, missing_lines, functions: {...}, summary, ... } }, totals }
 * Istanbul format: { filepath: { statementMap, s, fnMap, f, branchMap, b } }
 */
async function transformPythonCoverageToIstanbul(pythonJsonPath: string, cwd: string): Promise<string | null> {
  const outputPath = path.join(cwd, `.checkchange-coverage-temp-istanbul-${process.pid}-${Math.random().toString(36).slice(2)}.json`);
  try {
    const files = await readPythonCoverageFiles(pythonJsonPath, cwd);
    if (!files) {
      return null;
    }
    
    // Convert to Istanbul format
    const istanbulCoverage: Record<string, IstanbulFileCoverage> = {};
    for (const [filePath, fileData] of Object.entries(files)) {
      const absPath = path.isAbsolute(filePath) ? filePath : path.resolve(cwd, filePath);
      const pythonFileData = fileData as PythonCoverageFile;

      istanbulCoverage[absPath] = assembleIstanbulFileCoverage(pythonFileData);
    }
    
    await import('node:fs/promises').then(fs => fs.writeFile(outputPath, JSON.stringify(istanbulCoverage)));
    return outputPath;
  } catch {
    try {
      await import('node:fs/promises').then(fs => fs.unlink(outputPath));
    } catch {
      // ignore
    }
    return null;
  }
}

/**
 * F-03 remediation: rebase absolute Istanbul coverage keys onto the current cwd.
 *
 * Istanbul `coverage-final.json` records file paths as absolute paths from the
 * generation environment. `parseCoverageReport` preserves these absolute paths
 * in the returned Map. When the artifact is replayed in a different cwd
 * (cross-machine, cross-CI, or re-clone after relocation), the absolute keys
 * no longer match the project's tracked file paths.
 *
 * `src/attribution.ts` uses `endsWith()` suffix matching against repo-relative
 * complexity paths, which works when the absolute key shares a tail with the
 * relative path. But when the absolute prefix is entirely different (e.g.
 * `/var/folders/.../other-repo/h3/src/x.ts` vs cwd `/Users/me/h3`), the
 * suffix still matches if the repo-relative tail (`src/x.ts`) is identical.
 * In practice the suffix-match still works for the attribution stage, BUT
 * `parseFileMethods(coverageKey)` may be called with an absolute path that
 * doesn't exist on disk in the current environment.
 *
 * Strategy: if the absolute key's tail matches a tracked file under the current
 * cwd, rewrite the key to the absolute path of the matching file under cwd.
 * Otherwise leave the key unchanged (attribution's endsWith will still
 * succeed for the original cross-environment case via suffix overlap).
 *
 * F-04 (test-file expansion) is unrelated and is handled separately in
 * `src/complexity.ts` and documentation.
 */
function normalizeCoveragePaths(
  coverageMap: CoverageMap,
  cwd: string
): CoverageMap {
  const normalized: CoverageMap = new Map();
  for (const [key, value] of coverageMap.entries()) {
    if (!path.isAbsolute(key)) {
      normalized.set(key, value);
      continue;
    }
    // Find the longest suffix of `key` that, when resolved against `cwd`,
    // points to an existing file. This re-bases cross-environment absolute
    // paths onto the current checkout.
    // ponytail: resolve against cwd as given (no realpath) so rebased keys
    // keep the caller's path form (macOS /var vs /private/var).
    const segments = key.split(path.sep);
    let rebased = key;
    for (let i = 1; i < segments.length; i++) {
      const candidate = path.join(cwd, ...segments.slice(i));
      // Boundary check: candidate must stay within cwd
      const rel = path.relative(cwd, candidate);
      if (rel.startsWith('..') || path.isAbsolute(rel)) continue;
      try {
        if (fs.existsSync(candidate)) {
          rebased = candidate;
          break;
        }
      } catch {
        // ignore and continue
      }
    }
    normalized.set(rebased, value);
  }
  return normalized;
}

type CoverageEntry = CoverageMap extends Map<string, infer V> ? V : never;
type StatementUnit = CoverageEntry['statements'][number];

/**
 * Union two coverage maps by file path — the seam a Cobertura artifact and an
 * LCOV artifact feed (parseCoberturaContent + parseLcovContent).
 *
 * A path in only one map is carried through unchanged. A path in both has its
 * statements concatenated and then deduped by start line, keeping the MAX hits:
 * both formats report one statement per source line, so the same line reported
 * twice is one statement, and the higher count is the honest one. Branch and
 * function units are concatenated without dedupe — Cobertura never populates
 * them, and this keeps the seam a plain union rather than a guess about which
 * side is authoritative.
 *
 * KEY MATCHING IS CASE-INSENSITIVE. The parsers disagree on casing for the same
 * file: `parseCoverageReport` (Istanbul) lowercases the whole absolute path,
 * while `parseCoberturaContent` / `parseLcovContent` keep native case. Merging
 * those two with a plain `Map.get(key)` silently matched nothing — one file
 * landed in the merged map TWICE and the MAX-on-conflict rule never ran, which
 * defeats the entire point of merging. Lookup is therefore folded to lower case;
 * the FIRST-SEEN spelling is what the merged map emits, so a map whose keys all
 * agree (Cobertura+LCOV, or any single format) round-trips byte-identical.
 *
 * ponytail: fold for LOOKUP only. Emitting the folded key would rewrite every
 * key of a same-case merge, breaking callers that assert exact key spelling.
 * First-seen wins, which keeps this a pure lookup change and leaves key casing
 * as a property of whichever artifact the caller passed first.
 *
 * Neither input Map nor its FileCoverage values are mutated.
 */
export function mergeCoverageMaps(a: CoverageMap, b: CoverageMap): CoverageMap {
  const merged: CoverageMap = new Map();
  /** folded key -> the spelling already stored in `merged` */
  const canonical = new Map<string, string>();
  const add = (key: string, value: CoverageEntry): void => {
    const folded = key.toLowerCase();
    const seen = canonical.get(folded);
    if (seen === undefined) {
      canonical.set(folded, key);
      merged.set(key, value);
      return;
    }
    merged.set(seen, mergeFileCoverage(merged.get(seen)!, value));
  };
  for (const [key, value] of a) add(key, value);
  for (const [key, value] of b) add(key, value);
  return merged;
}

function mergeFileCoverage(a: CoverageEntry, b: CoverageEntry): CoverageEntry {
  // Map preserves first-seen line order; the unit stored for a line is the max-hits one.
  const byLine = new Map<number, StatementUnit>();
  for (const unit of [...a.statements, ...b.statements]) {
    const seen = byLine.get(unit.span.startLine);
    if (seen === undefined || unit.hits > seen.hits) {
      byLine.set(unit.span.startLine, unit);
    }
  }
  return {
    statements: [...byLine.values()],
    branches: [...a.branches, ...b.branches],
    functions: [...a.functions, ...b.functions]
  };
}

const COBERTURA_BASENAME = 'coverage.cobertura.xml';

// Directories the depth-3 walk must never descend into. `node_modules` is unbounded
// in size and a plausible home for a vendored `TestResults/` (proved in
// test/coverage-cobertura-routing.test.ts); `.git` is noise. Pruning at the depth-1
// child keeps the "bounded by construction" claim below honest — without it the
// widening to depth 3 would be a walk of every package tree under cwd.
// ponytail: duplicated from src/providers/runner-detection.ts SKIP_DIRS rather than
// imported — that set also skips dist/build/coverage, which a coverage scan must
// NOT skip (it is looking for artifacts there), and the module is provider-private.
const SKIP_SCAN_DIRS = new Set(['node_modules', '.git']);

/** True for any `*.cobertura.xml` path, case-insensitively (Windows-authored artifacts). */
function isCoberturaBasename(filePath: string): boolean {
  return path.basename(filePath).toLowerCase().endsWith('.cobertura.xml');
}

/**
 * Depth-bounded readdir scan for a `coverage.cobertura.xml` inside any per-run
 * subdirectory of a `TestResults` directory under cwd.
 *
 * Bounded by construction: the `TestResults` directory name is matched at depth 1,
 * 2 and 3 only (cwd itself, each direct child, and each grandchild), so the walk is
 * O(entries in those dirs) with no glob dependency and no unbounded recursion.
 * Depth 3 is required because `dotnet test` run from a REPO ROOT writes the artifact
 * under the TEST PROJECT's directory, not the root — `test/GuardClauses.UnitTests/
 * TestResults/<guid>/` (measured, SHA f96b823e). See `SKIP_SCAN_DIRS` for the prune
 * that keeps `node_modules` out of the grandchild pass.
 *
 * Newest-mtime wins: vstest mints a fresh GUID directory per run and never prunes
 * the old ones, so the most recently written artifact is the one that matches the
 * working tree. Ties break on the lexicographically smaller absolute path so the
 * result is deterministic across filesystems.
 *
 /**
 * EXPORTED for the cached path: src/cache.ts calls this as its last resort so a
 * cached C# run sees the same Coverlet `TestResults/<GUID>/` artifact an uncached
 * run does. The cache used to document that divergence as a KNOWN LIMITATION
 * because this function was module-private.
 *
 * @returns absolute path of the newest match, or null when there is none
 */
export function scanCoberturaUnderTestResults(cwd: string): string | null {
  const testResultsDirs: string[] = [];
  const addIfTestResults = (dir: string): void => {
    try {
      if (fs.readdirSync(dir, { withFileTypes: true }).some((e) => e.isDirectory() && e.name === 'TestResults')) {
        testResultsDirs.push(path.join(dir, 'TestResults'));
      }
    } catch {
      // unreadable directory — nothing to scan
    }
  };
  addIfTestResults(cwd);
  try {
    for (const entry of fs.readdirSync(cwd, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const child = path.join(cwd, entry.name);
      addIfTestResults(child);
      // Depth 3: `dotnet test` run from a repo root writes the artifact under the
      // TEST PROJECT's own directory, not the root —
      // `test/GuardClauses.UnitTests/TestResults/<guid>/` (measured, SHA f96b823e)
      // and `test/Stateless.Tests/TestResults/<guid>/` (SHA 588f1a1a). Depth 2
      // alone missed both, so doctor reported `missing` on repos that HAVE the
      // artifact. 3 is the measured worst case across the pinned corpus
      // (`NCrontab.Tests/TestResults/<guid>/` is depth 2), so the bound is exactly
      // 3 — not "until found", which would be an unbounded walk.
      if (SKIP_SCAN_DIRS.has(entry.name)) continue;
      try {
        for (const grand of fs.readdirSync(child, { withFileTypes: true })) {
          if (grand.isDirectory()) addIfTestResults(path.join(child, grand.name));
        }
      } catch {
        // unreadable child directory — its grandchildren are simply not scanned
      }
    }
  } catch {
    // unreadable cwd — no scan
  }

  let newest: { file: string; mtimeMs: number } | null = null;
  for (const resultsDir of testResultsDirs) {
    let runDirs: fs.Dirent[];
    try {
      runDirs = fs.readdirSync(resultsDir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const runDir of runDirs) {
      if (!runDir.isDirectory()) continue;
      const file = path.join(resultsDir, runDir.name, COBERTURA_BASENAME);
      try {
        const { mtimeMs } = fs.statSync(file);
        if (
          newest === null ||
          mtimeMs > newest.mtimeMs ||
          (mtimeMs === newest.mtimeMs && file < newest.file)
        ) {
          newest = { file, mtimeMs };
        }
      } catch {
        // not a cobertura artifact — skip
      }
    }
  }
  return newest?.file ?? null;
}

/**
 * Read the coverage artifacts discoverable under `cwd`.
 *
 * PRECEDENCE (top wins):
 *   1. explicit `--coverage-file` — read alone, returned as-is, never merged
 *   2. literal `coverageFiles` candidates — EVERY readable one is parsed and
 *      the resulting maps are REDUCED with `mergeCoverageMaps` in scan order
 *   3. `TestResults` scan (newest mtime) — last resort, only when no literal
 *      candidate produced a map
 *
 * Multi-artifact merge (WS2.1): a repo routinely emits more than one coverage
 * format at once (Coverlet Cobertura + an Istanbul `coverage.json`, or pytest-cov
 * + LCOV). First-success-return silently dropped every artifact after the first,
 * so a format that is the ONLY source of coverage for a given file reported it as
 * uncovered. Accumulate-then-reduce unions them instead, keeping MAX hits per
 * source line (`mergeFileCoverage`), which is the honest value when two tools
 * instrument the same line.
 *
 * @lineage `contentSha256` is the hash of the FIRST artifact that produced a map
 * (scan order), NOT of the merged result. `CoverageResult` carries a single hash
 * and `src/evidence.ts:439` consumes it as the coverage lineage input, so the
 * merged-map lineage stays per-artifact and is NOT a digest of the union. Any
 * future consumer needing full-merge lineage must widen `CoverageResult` (a
 * separate, schema-touching change) rather than silently reinterpreting this one.
 *
 * Malformed taxonomy is unchanged: if >=1 candidate was READABLE but none parsed,
 * this returns `{ available:true, error:true, reason:'malformed' }` exactly as
 * before — a partial success is a success, not a malformed read.
 */
export async function readCoverage(cwd: string, coverageFile?: string, trace?: TraceRun, autoGenerated?: boolean): Promise<CoverageResult> {
  // 1. Explicit coverageFile provided - use it directly (existing behavior)
  if (coverageFile !== undefined && coverageFile !== null && coverageFile !== '') {
    const coveragePath = path.isAbsolute(coverageFile) ? coverageFile : path.resolve(cwd, coverageFile);
    return await readCoverageFile(coveragePath, cwd, true, autoGenerated);
  }

  // 2. Auto-detect coverage files. Precedence: config-driven — all providers'
  // coverageFiles deduped in builtin order. EVERY readable candidate is parsed;
  // the maps are accumulated and reduced at the end (see @lineage above).
  let artifactFound = false;
  let mergedMap: CoverageMap | null = null;
  let mergedSha256: string | undefined;
  const registry = providerRegistry();
  const coverageCandidates = registry
    ? [...new Set([...registry.values()].flatMap((r) => r.coverageFiles))]
    : [...PYTHON_COVERAGE_FILES];
  for (const file of coverageCandidates) {
    const filePath = path.join(cwd, file);
    try {
      await access(filePath, constants.R_OK);
      artifactFound = true;
      const result = await readCoverageFile(filePath, cwd, false);
      // Conversion/read succeeded — ACCUMULATE, never return early
      if (!result.error) {
        if (result.coverageMap) {
          mergedMap = mergedMap === null ? result.coverageMap : mergeCoverageMaps(mergedMap, result.coverageMap);
          // First artifact that produced a map owns the reported lineage hash
          if (mergedSha256 === undefined) mergedSha256 = result.contentSha256;
        }
        continue;
      }
      // Conversion/read failed - warn and continue to next candidate
      const message = `Coverage conversion failed for ${filePath}: ${result.reason}`;
      if (trace) {
        trace.recordWarning('coverage', message);
      } else {
        console.warn(message);
      }
      // Continue to next file in precedence
    } catch {
      // File doesn't exist or not readable, continue to next
    }
  }

  // ponytail: a literal candidate produced a map — the merged result wins and the
  // TestResults scan is NOT consulted, so the `artifactFound` short-circuit that
  // test/coverage-cobertura-routing.test.ts:244 pins still holds. Placed before
  // the scan (not after) because the scan's own result must never displace a map
  // the literals already produced.
  if (mergedMap !== null) {
    const out: CoverageResult = { available: true, coverageMap: mergedMap, error: false };
    if (mergedSha256 !== undefined) out.contentSha256 = mergedSha256;
    return out;
  }

  // 2b. Scan fallback for Coverlet: `dotnet test --collect:"XPlat Code Coverage"`
  // writes TestResults/<GUID>/coverage.cobertura.xml, where the GUID is generated
  // per run by vstest — no literal path can name it, so the config-driven
  // coverageFiles list above can never match. Runs only when NO literal candidate
  // produced a MAP (the merged-map return above already left this branch for a
  // literal hit), so the existing precedence and the malformed-taxonomy behaviour
  // of "found but unconvertible" are untouched. The scan finds exactly ONE
  // artifact (newest mtime), so there is nothing here to merge.
  if (!artifactFound) {
    const scanned = scanCoberturaUnderTestResults(cwd);
    if (scanned !== null) {
      artifactFound = true;
      const result = await readCoverageFile(scanned, cwd, false);
      if (!result.error) return result;
      const message = `Coverage conversion failed for ${scanned}: ${result.reason}`;
      if (trace) {
        trace.recordWarning('coverage', message);
      } else {
        console.warn(message);
      }
    }
  }

  // 3. All candidates exhausted
  if (artifactFound) {
    // At least one artifact existed but all failed conversion. Under
    // accumulate-then-reduce this is now "every readable candidate was read and
    // NONE produced a map" — same taxonomy, same shape as the first-success era.
    return { available: true, coverageMap: null, error: true, reason: 'malformed' };
  } else {
    // No coverage files found at all
    return { available: false, coverageMap: null, error: false };
  }
}

/**
 * Detect the coverage format and dispatch to the matching parser.
 *
 * Routes:
 * - Cobertura: by basename ending `.cobertura.xml`, BEFORE the Python-JSON probe.
 *   Coverlet and pytest-cov emit the same Cobertura schema, so the filename is the
 *   only robust discriminator; content sniffing cannot separate them.
 * - LCOV: by extension (`.info`/`.lcov`) or content sniffing (TN:/SF:/DA: lines).
 * - Python coverage JSON (files key + meta/summary/totals): transformed to Istanbul
 *   first, unless alreadyConverted (i.e. convertPythonCoverageToJson already ran).
 * - Otherwise: parsed directly as Istanbul JSON.
 */
export async function detectCoverageFormat(
  content: string,
  actualPath: string,
  cwd: string,
  isLcovByExt: boolean,
  alreadyConverted: boolean
): Promise<CoverageMap> {
  // Cobertura first, keyed on basename: a `.cobertura.xml` artifact is Cobertura
  // whether it came from Coverlet or pytest-cov, and it is never Istanbul JSON,
  // so answering before the LCOV and Python-JSON probes below is what keeps it
  // off the `coverage json` conversion path.
  if (isCoberturaBasename(actualPath)) {
    return parseCoberturaContent(content, cwd);
  }

  // Check if LCOV by content
  let isLcov = isLcovByExt;
  if (!isLcovByExt) {
    if (content.startsWith('TN:') || content.includes('\nSF:') || content.includes('\nDA:')) {
      isLcov = true;
    }
  }

  if (isLcov) {
    // Security: limit LCOV size - validateAndReadFile already enforces stats.size pre-read
    return parseLcovContent(content, cwd);
  }

  // Check if this is Python coverage JSON format (has 'files' key + 'meta'/'summary'/'totals')
  // If so, transform to Istanbul format before parsing
  // Skip if already converted via convertPythonCoverageToJson (prevents double-transform)
  let parsePath = actualPath;
  let parseTempFile: string | null = null;
  if (!alreadyConverted) {
    try {
      const jsonData = JSON.parse(content);
      if (jsonData.files && typeof jsonData.files === 'object' && (jsonData.meta || jsonData.summary || jsonData.totals)) {
        // Python coverage format detected - transform to Istanbul
        const transformedPath = await transformPythonCoverageToIstanbul(actualPath, cwd);
        if (transformedPath) {
          parsePath = transformedPath;
          parseTempFile = transformedPath;
        }
      }
    } catch {
      // Not valid JSON or not Python format, proceed as-is
    }
  }

  // Treat as Istanbul JSON (including converted Python coverage.json)
  const coverageMap = await parseCoverageReport(parsePath, cwd);

  // Cleanup transform temp file if created
  if (parseTempFile) {
    try {
      await import('node:fs/promises').then(fs => fs.unlink(parseTempFile));
    } catch {
      // ignore
    }
  }
  return coverageMap;
}

async function readCoverageFile(
  coveragePath: string,
  cwd: string,
  isExplicit: boolean,
  autoGenerated?: boolean
): Promise<CoverageResult> {
  // Check if file exists and is readable
  try {
    await access(coveragePath, constants.R_OK);
  } catch {
    if (isExplicit && !autoGenerated) {
      return { available: true, coverageMap: null, error: true, reason: 'missing' };
    } else {
      return { available: false, coverageMap: null, error: false };
    }
  }

  // Determine file type by extension + basename (handles .coverage dotfile)
  const ext = path.extname(coveragePath).toLowerCase();
  const basename = path.basename(coveragePath);
  const isLcovByExt = ext === '.info' || ext === '.lcov';
  const isPythonCoverageBinary = basename === '.coverage';
  // Exact basename, not `startsWith('coverage')`: the prefix form also claimed
  // `coverage.cobertura.xml`, sending a Coverlet artifact into `coverage json`
  // conversion and returning reason 'malformed' (:548) before any format
  // dispatch ran. `.cobertura.xml` is Cobertura; only `coverage.xml` is the
  // pytest-cov artifact `coverage json` can read.
  const isPythonCoverageXml = ext === '.xml' && basename === 'coverage.xml';

  // For Python .coverage binary or coverage.xml, try to convert to JSON first
  let actualPath = coveragePath;
  let tempFileToCleanup: string | null = null;
  let alreadyConverted = false;

  if (isPythonCoverageBinary || isPythonCoverageXml) {
    const convertedPath = await convertPythonCoverageToJson(coveragePath, cwd);
    if (convertedPath) {
      actualPath = convertedPath;
      tempFileToCleanup = convertedPath;
      alreadyConverted = true;
    } else {
      // Conversion failed - warn and fall back to generic path
      if (autoGenerated) return { available: false, coverageMap: null, error: false };
      return { available: true, coverageMap: null, error: true, reason: 'malformed' };
    }
  }

  try {
    // Read and validate file
    const content = await validateAndReadFile(actualPath, cwd, isExplicit);
    if (content === null) {
      if (autoGenerated) return { available: false, coverageMap: null, error: false };
      return { available: true, coverageMap: null, error: true, reason: 'malformed' };
    }

    const coverageMap = await detectCoverageFormat(content, actualPath, cwd, isLcovByExt, alreadyConverted);

    const normalizedCoverageMap = normalizeCoveragePaths(coverageMap, cwd);
    // Lineage input identity: hash of the artifact bytes actually read (in hand, no new reads)
    return { available: true, coverageMap: normalizedCoverageMap, error: false, contentSha256: createHash('sha256').update(content).digest('hex') };
  } catch {
    // Malformed or unreadable
    return { available: true, coverageMap: null, error: true, reason: 'malformed' };
  } finally {
    // Cleanup temp file if created - runs on ALL paths (success, early return, throw)
    if (tempFileToCleanup) {
      try {
        await import('node:fs/promises').then(fs => fs.unlink(tempFileToCleanup));
      } catch {
        // ignore cleanup failure
      }
    }
  }
}