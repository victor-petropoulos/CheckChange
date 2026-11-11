import * as path from 'node:path';
import * as fs from 'node:fs';
import type { coverageForMethods } from '@barney-media/crap-typescript-core';

// FileCoverage is not re-exported from the package root, so derive it from the
// signature of the only consumer — same idiom as src/attribution.ts:152.
type FileCoverage = NonNullable<Parameters<typeof coverageForMethods>[1]>;

/** One FN/FNDA record: function name as written in LCOV, its FN line, and FNDA hits. */
export type FunctionHits = { name: string; line: number; hits: number };

/**
 * Parse LCOV content and convert it to the same Map shape the core package's
 * parseCoverageReport produces, so coverageForMethods can attribute methods.
 * @param lcovContent The LCOV file content as string
 * @param cwd Current working directory for path normalization
 * @param out Optional side output: when given, FN/FNDA records are collected
 *   into `out.functionCoverage` (mutated in place), keyed by the same normalized
 *   path the returned Map uses. FNDA hits are matched to FN entries by name
 *   (first not-yet-matched entry wins for same-name FNs, which are otherwise
 *   kept as separate line-keyed entries); an FNDA with no matching FN is
 *   skipped — there is no line to report it at. FN entries with no FNDA keep
 *   hits 0. `(anonymous_N)` names are captured as-is, never filtered. When
 *   `out` is omitted nothing is collected and the parse is unchanged.
 * @returns Map<filePath, { statements: Array<{ span: { startLine: number, startColumn: number, endLine: number, endColumn: number }, hits: number }>, branches: [], functions: [] }>
 *   `functions` is always empty: FN/FNDA data rides the side output only, never
 *   the attribution lane. BRDA/BRF branch records are still not parsed.
 */
export function parseLcovContent(lcovContent: string, cwd: string, out?: { functionCoverage: Map<string, FunctionHits[]> }): Map<string, FileCoverage> {
  // Security: limit LCOV size to prevent OOM
  const MAX_SIZE = 100 * 1024 * 1024; // 100MB
  if (lcovContent.length > MAX_SIZE) {
    throw new Error(`LCOV content exceeds maximum allowed size of ${MAX_SIZE} bytes`);
  }
  const result = new Map<string, FileCoverage>();
  let currentFile = '';
  // Keyed by LCOV line number so a repeated DA:<line> overwrites, as before.
  const statements: Record<string, FileCoverage['statements'][number]> = {};
  // FN/FNDA side output, per currentFile. Collected only when `out` is given,
  // so the default path keeps its allocation-free hot loop.
  const fnEntries: FunctionHits[] = [];
  const fnByName = new Map<string, FunctionHits[]>();
  const fndaMatched = new Set<FunctionHits>();

  const lines = lcovContent.split('\n');
  if (lines.length > 1_000_000) {
    throw new Error('LCOV contains too many lines (over 1,000,000)');
  }
  for (const line of lines) {
    const lineTrimmed = line.trim();
    if (lineTrimmed.startsWith('SF:')) {
      // Before starting a new file, finalize the previous one
      if (currentFile && (Object.keys(statements).length > 0 || fnEntries.length > 0)) {
        const normalized = normalizePath(currentFile, cwd);
        if (normalized !== null) {
          if (Object.keys(statements).length > 0) {
            result.set(normalized, {
              statements: Object.values(statements),
              branches: [],
              functions: []
            });
          }
          if (out !== undefined && fnEntries.length > 0) {
            out.functionCoverage.set(normalized, [...fnEntries]);
          }
        }
        // Reset for next file
        Object.keys(statements).forEach(k => delete statements[k]);
      }
      fnEntries.length = 0;
      fnByName.clear();
      fndaMatched.clear();
      // Extract file path (remove leading './' if present)
      const filePath = lineTrimmed.substring(3).trim();
      currentFile = filePath;
    } else if (lineTrimmed.startsWith('DA:')) {
      // DA:lineNumber,hitCount
      const parts = lineTrimmed.substring(3).split(',');
      if (parts.length >= 2) {
        const lineNumStr = parts[0]!;
        const hitCountStr = parts[1]!;
        const lineNum = parseInt(lineNumStr, 10);
        const hitCount = parseInt(hitCountStr, 10);
        if (!isNaN(lineNum) && !isNaN(hitCount)) {
          // Use line number as the statement key
          const key = lineNumStr;
          statements[key] = {
            // LCOV doesn't have column info, assume 0
            span: { startLine: lineNum, startColumn: 0, endLine: lineNum, endColumn: 0 },
            hits: hitCount
          };
        }
      }
    } else if (out !== undefined && currentFile && lineTrimmed.startsWith('FN:')) {
      // FN:<line>,<name> — split on the FIRST comma only; names may contain commas.
      const body = lineTrimmed.substring(3);
      const comma = body.indexOf(',');
      if (comma > 0) {
        const lineNum = parseInt(body.substring(0, comma), 10);
        const name = body.substring(comma + 1);
        if (!isNaN(lineNum) && name !== '') {
          const entry: FunctionHits = { name, line: lineNum, hits: 0 };
          fnEntries.push(entry);
          const list = fnByName.get(name);
          if (list) list.push(entry);
          else fnByName.set(name, [entry]);
        }
      }
    } else if (out !== undefined && currentFile && lineTrimmed.startsWith('FNDA:')) {
      // FNDA:<hits>,<name> — matched to the first FN entry with this name that
      // has not yet received an FNDA (same-name FNs in one file stay separate
      // line-keyed entries, but FNDA carries no line, so first-unmatched wins).
      // An FNDA with no matching FN is skipped: there is no line to report at.
      const body = lineTrimmed.substring(5);
      const comma = body.indexOf(',');
      if (comma > 0) {
        const hits = parseInt(body.substring(0, comma), 10);
        const name = body.substring(comma + 1);
        const target = fnByName.get(name)?.find((e) => !fndaMatched.has(e));
        if (target !== undefined && !isNaN(hits)) {
          target.hits = hits;
          fndaMatched.add(target);
        }
      }
    }
    // We ignore BRDA/BRF for branch coverage for simplicity.
    // If needed, we can extend later.
  }
  // Handle the last file
  if (currentFile && (Object.keys(statements).length > 0 || fnEntries.length > 0)) {
    const normalized = normalizePath(currentFile, cwd);
    if (normalized !== null) {
      if (Object.keys(statements).length > 0) {
        result.set(normalized, {
          statements: Object.values(statements),
          branches: [],
          functions: []
        });
      }
      if (out !== undefined && fnEntries.length > 0) {
        out.functionCoverage.set(normalized, [...fnEntries]);
      }
    }
  }

  return result;
}

/**
 * Check if an absolute file path is within the given cwd.
 * @param filePath Absolute file path to check
 * @param cwd Current working directory (absolute)
 * @returns true if filePath is within cwd
 */
function isWithinCwd(filePath: string, cwd: string): boolean {
  // Ensure we are working with absolute paths for the check
  if (!path.isAbsolute(filePath)) {
    filePath = path.resolve(cwd, filePath);
  }
  const rel = path.relative(cwd, filePath);
  return !rel.startsWith('..') && !path.isAbsolute(rel);
}

/**
 * Normalize a file path from LCOV to be relative to cwd if possible.
 * Similar to the normalizeCoveragePaths function in coverage.ts.
 * @returns normalized path within cwd, or null if the path escapes cwd and cannot be rebased
 */
function normalizePath(filePath: string, cwd: string): string | null {
  if (!path.isAbsolute(filePath)) {
    const resolved = path.resolve(cwd, filePath);
    const within = isWithinCwd(resolved, cwd);
    return within ? resolved : null;
  }
  // If absolute, first check if it's already within cwd
  if (isWithinCwd(filePath, cwd)) {
    return filePath;
  }
  // Try to rebase to cwd by suffix (like normalizeCoveragePaths)
  const segments = filePath.split(path.sep);
  for (let i = 1; i < segments.length; i++) {
    const candidate = path.join(cwd, ...segments.slice(i));
    const rel = path.relative(cwd, candidate);
    if (rel.startsWith('..') || path.isAbsolute(rel)) continue;
    try {
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    } catch {
      // ignore
    }
  }
  return null;
}