import * as path from 'node:path';
import { access, constants } from 'node:fs/promises';
import { parseCoverageReport } from '@barney-media/crap-typescript-core';

export interface CoverageResult {
  available: boolean;
  coverageMap: Map<string, any> | null;
  error: boolean;
  reason?: string;
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
  coverageMap: Map<string, any>,
  cwd: string
): Map<string, any> {
  const normalized = new Map<string, any>();
  for (const [key, value] of coverageMap.entries()) {
    if (!path.isAbsolute(key)) {
      normalized.set(key, value);
      continue;
    }
    // Find the longest suffix of `key` that, when resolved against `cwd`,
    // points to an existing file. This re-bases cross-environment absolute
    // paths onto the current checkout.
    const segments = key.split(path.sep);
    let rebased = key;
    for (let i = 1; i < segments.length; i++) {
      const candidate = path.join(cwd, ...segments.slice(i));
      // Boundary check: candidate must stay within cwd
      const rel = path.relative(cwd, candidate);
      if (rel.startsWith('..') || path.isAbsolute(rel)) continue;
      try {
        // Use sync exists via a non-throwing try/catch around access.
        // We deliberately do not use fs.realpathSync here to avoid TOCTOU
        // and to keep the function zero-dep.
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const fs = require('node:fs') as typeof import('node:fs');
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

export async function readCoverage(cwd: string, coverageFile?: string): Promise<CoverageResult> {
  let coveragePath: string;
  if (coverageFile !== undefined && coverageFile !== null && coverageFile !== '') {
    // If coverageFile is provided, use it (resolve if relative)
    coveragePath = path.isAbsolute(coverageFile) ? coverageFile : path.resolve(cwd, coverageFile);
  } else {
        // No coverageFile provided, use default
        coveragePath = path.join(cwd, 'coverage/coverage-final.json');
    }

try {
     await access(coveragePath, constants.R_OK);
   } catch {
     // File does not exist or cannot be read
     if (coverageFile !== undefined && coverageFile !== null && coverageFile !== '') {
         // Explicitly provided file missing -> error:true to trigger FAILED semantics
         return { available: true, coverageMap: null, error: true, reason: 'missing' };
     } else {
         // Default file missing -> existing behavior: available:false, error:false
         return { available: false, coverageMap: null, error: false };
     }
   }

try {
     const coverageMap = await parseCoverageReport(coveragePath, cwd);
     const normalizedCoverageMap = normalizeCoveragePaths(coverageMap, cwd);
     return { available: true, coverageMap: normalizedCoverageMap, error: false };
   } catch (error) {
     // Malformed or unreadable
     return { available: true, coverageMap: null, error: true, reason: 'malformed' };
   }
}
