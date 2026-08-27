// FR-C03-CHANGEDOUTSIDE: Changed TS outside src/ test
// Linked FM: FM-C03
// Behavior: A changed TS file outside src/ that is tracked by git should be enumerated, attributed, and appear in changedFunctions.

import { describe, test, expect } from 'vitest';
import { createTempRepo, writeSourceFile, writeCoverageFile, stageChanges, callBuildEvidenceOutput, normalizeOutput } from '../../wp5.2/fixtures/helpers.ts';
import { join, resolve } from 'path';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import type { ChangedFunction } from '../../../../src/evidence.ts';

describe('FR-C03-CHANGEDOUTSIDE: Changed TS outside src/', () => {
  test('should enumerate and attribute a changed TS file outside src/', async () => {
    // Arrange: create a TS file outside src/ (e.g., tools/check.ts) and make sure it's tracked by git
    const repo = createTempRepo();
    try {
      const srcDir = repo.srcDir;
      const rootDir = repo.tempDir;

      // Create tools/check.ts
      const toolsDir = join(rootDir, 'tools');
      if (!existsSync(toolsDir)) {
        mkdirSync(toolsDir, { recursive: true });
      }
      const checkFile = join(toolsDir, 'check.ts');
      const checkSource = `export function check() {
  return 1; // line 3
}`;
      writeSourceFile(checkFile, checkSource);

      // Stage the new file so it's tracked by git (git ls-files --cached picks it up)
      await stageChanges(repo.tempDir, new Map<string, { start: number; end: number }[]>()); // This stages all changes (including new files)

      // Re-stage just the check file to ensure it's in the index for collectComplexity
      // (stageChanges may not have added it if it was already staged from the initial commit)
      const { execSync } = await import('child_process');
      execSync(`git add ${checkFile}`, { cwd: repo.tempDir });

      // Now, create coverage for the checkFile (we'll say the function is covered)
      // statement span covers entire file (3 lines) to satisfy bodySpan requirement
      const coverageData = {
        statementMap: {
          '0': {
            start: { line: 1, column: 24 },
            end: { line: 3, column: 1 }
          }
        },
        fnMap: {
          '0': {
            name: 'check',
            line: 1
          }
        },
        branchMap: {},
        s: { '0': 1 },
        f: { '0': 1 },
        b: {},
        _coverageSchema: '3.3.2'
      };

      const coverageMap = new Map<string, any>();
      const absoluteCheckFile = resolve(checkFile);
      coverageMap.set(absoluteCheckFile, coverageData);

      const coverageDir = repo.coverageDir;
      if (!existsSync(coverageDir)) {
        mkdirSync(coverageDir, { recursive: true });
      }
      const coverageFilePath = join(coverageDir, 'coverage-final.json');
      writeCoverageFile(coverageDir, coverageMap);

      // Now, we change the file (so that it appears in changedFunctions)
      // We'll change the content slightly and then we will not need to stage it again because the intervals tell the system which files changed.
      const changedSource = `export function check() {
  return 1; // line 3 - changed
}`;
      writeSourceFile(checkFile, changedSource); // overwrite with changed content

      // We'll keep the same coverage data (the function is still covered)
      writeCoverageFile(coverageDir, coverageMap);

      // Set intervals to indicate that tools/check.ts changed
      const intervals = new Map<string, { start: number; end: number }[]>();
      intervals.set('tools/check.ts', [{ start: 1, end: 4 }]);

      // Act
      const base = 'HEAD';
      const threshold = 30;
      const output = await callBuildEvidenceOutput(base, intervals, repo.tempDir, threshold);

      // Assert: the function check from tools/check.ts should be in changedFunctions and have numeric coverage
      expect(output).toBeDefined();
      expect(output.changedFunctions).toBeDefined();
      expect(output.changedFunctions.length).toBeGreaterThan(0);

      const checkFunc = (output.changedFunctions as ChangedFunction[]).find(f => f.method === 'check' && f.file === 'tools/check.ts');
      // We expect to find the function
      expect(checkFunc).toBeDefined();
      if (checkFunc) {
        // After fix, we expect numeric coverage (not null)
        expect(checkFunc.coverage).not.toBeNull();
        // 100% since covered
        expect(checkFunc.coverage).toBe(100);
      }
    } finally {
      repo.cleanup();
    }
  });
});