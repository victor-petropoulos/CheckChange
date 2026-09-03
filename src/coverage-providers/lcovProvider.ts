import * as path from 'node:path';

/**
 * Parse LCOV content and convert to a Map similar to Istanbul's coverage-final.json.
 * @param lcovContent The LCOV file content as string
 * @param cwd Current working directory for path normalization
 * @returns Map<filePath, { statementMap: Record<string, { start: { line: number, column: number }; end: { line: number, column: number } }, s: Record<string, number>, branchMap: {}, b: {}, fnMap: {}, f: {} }>
 */
export function parseLcovContent(lcovContent: string, cwd: string): Map<string, any> {
  // Security: limit LCOV size to prevent OOM
  const MAX_SIZE = 100 * 1024 * 1024; // 100MB
  if (lcovContent.length > MAX_SIZE) {
    throw new Error(`LCOV content exceeds maximum allowed size of ${MAX_SIZE} bytes`);
  }
  const result = new Map<string, any>();
  let currentFile = '';
  const statementMap: Record<string, { start: { line: number; column: number }; end: { line: number; column: number } }> = {};
  const s: Record<string, number> = {};

  const lines = lcovContent.split('\n');
  if (lines.length > 1_000_000) {
    throw new Error('LCOV contains too many lines (over 1,000,000)');
  }
  for (const line of lines) {
    const lineTrimmed = line.trim();
    if (lineTrimmed.startsWith('SF:')) {
      // Before starting a new file, finalize the previous one
      if (currentFile && Object.keys(statementMap).length > 0) {
        const normalized = normalizePath(currentFile, cwd);
        if (normalized !== null) {
          result.set(normalized, {
            statementMap: { ...statementMap },
            s: { ...s },
            branchMap: {},
            b: {},
            fnMap: {},
            f: {}
          });
        }
        // Reset for next file
        Object.keys(statementMap).forEach(k => delete statementMap[k]);
        Object.keys(s).forEach(k => delete s[k]);
      }
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
          statementMap[key] = {
            start: { line: lineNum, column: 0 },
            end: { line: lineNum, column: 0 } // LCOV doesn't have column info, assume 0
          };
          s[key] = hitCount;
        }
      }
    }
    // We ignore FN/FNDA for function coverage and BRDA/BRF for branch coverage for simplicity.
    // If needed, we can extend later.
  }
  // Handle the last file
  if (currentFile && Object.keys(statementMap).length > 0) {
    const normalized = normalizePath(currentFile, cwd);
    if (normalized !== null) {
      result.set(normalized, {
        statementMap: { ...statementMap },
        s: { ...s },
        branchMap: {},
        b: {},
        fnMap: {},
        f: {}
      });
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
      const fs = require('node:fs');
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    } catch {
      // ignore
    }
  }
  return null;
}