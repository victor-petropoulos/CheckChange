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

export async function readCoverage(cwd: string, coverageFile?: string, trace?: TraceRun, autoGenerated?: boolean): Promise<CoverageResult> {
  // 1. Explicit coverageFile provided - use it directly (existing behavior)
  if (coverageFile !== undefined && coverageFile !== null && coverageFile !== '') {
    const coveragePath = path.isAbsolute(coverageFile) ? coverageFile : path.resolve(cwd, coverageFile);
    return await readCoverageFile(coveragePath, cwd, true, autoGenerated);
  }

  // 2. Auto-detect coverage files in precedence order with fallthrough on conversion failure
  // Precedence: config-driven — all providers' coverageFiles deduped in builtin order
  let artifactFound = false;
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
      // If conversion/read succeeded (error: false), return it
      if (!result.error) {
        return result;
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

  // 3. All candidates exhausted
  if (artifactFound) {
    // At least one artifact existed but all failed conversion
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
  const isPythonCoverageXml = ext === '.xml' && basename.startsWith('coverage');

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