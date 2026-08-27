// FR-A07-TOPLEVEL: Top-level function test
// Linked FM: FM-A07
// Behavior: Top-level functions (no container) should still work and receive numeric coverage.

import { describe, test, expect } from 'vitest';
import { createTempRepo, writeSourceFile, writeCoverageFile, stageChanges, callBuildEvidenceOutput, normalizeOutput } from '../../wp5.2/fixtures/helpers.ts';
import { join, resolve } from 'path';
import type { ChangedFunction } from '../../../../src/evidence.ts';

describe('FR-A07-TOPLEVEL: Top-level function', () => {
  test('should assign numeric coverage to top-level functions', async () => {
    // Arrange: top-level function
    const repo = createTempRepo();
    try {
      const srcFile = join(repo.srcDir, 'top.ts');
      const sourceContent = `export function topLevel() {
  return 1; // line 3
}`;
      writeSourceFile(srcFile, sourceContent);

      // Coverage: the function is covered (1 hit)
      // statement span matches bodySpan (1,27-3,1) for exact attribution
      const coverageData = {
        statementMap: {
          '0': {
            start: { line: 1, column: 27 },
            end: { line: 3, column: 1 }
          }
        },
        fnMap: {
          '0': {
            name: 'topLevel',
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
      const absoluteSrcFile = resolve(srcFile);
      coverageMap.set(absoluteSrcFile, coverageData);

      writeCoverageFile(repo.coverageDir, coverageMap);

      // Change the file (entire file)
      const intervals = new Map<string, { start: number; end: number }[]>();
      intervals.set('src/top.ts', [{ start: 1, end: 4 }]);

      // Act
      const base = 'HEAD';
      const threshold = 30;
      const output = await callBuildEvidenceOutput(base, intervals, repo.tempDir, threshold);

      // Assert: top-level function should have numeric coverage (not null)
      expect(output).toBeDefined();
      expect(output.changedFunctions).toBeDefined();
      expect(output.changedFunctions.length).toBeGreaterThan(0);

      const topLevelFunc = (output.changedFunctions as ChangedFunction[]).find(f => f.method === 'topLevel');
      expect(topLevelFunc).toBeDefined(); // should be found

      if (topLevelFunc) {
        // After fix, we expect numeric coverage (not null)
        expect(topLevelFunc.coverage).not.toBeNull();
        // 100% since covered
        expect(topLevelFunc.coverage).toBe(100);
      }
    } finally {
      repo.cleanup();
    }
  });
});