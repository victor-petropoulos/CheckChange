// FR-A07-OBJECT: Object method test
// Linked FM: FM-A07
// Behavior: Object methods should receive numeric coverage (not null) when coverage data exists.

import { describe, test, expect } from 'vitest';
import { createTempRepo, writeSourceFile, writeCoverageFile, stageChanges, callBuildEvidenceOutput, normalizeOutput } from '../../wp5.2/fixtures/helpers.ts';
import { join, resolve } from 'path';
import type { ChangedFunction } from '../../../../src/evidence.ts';

describe('FR-A07-OBJECT: Object method', () => {
  test('should assign numeric coverage to object methods', async () => {
    // Arrange: object with a method
    const repo = createTempRepo();
    try {
      const srcFile = join(repo.srcDir, 'obj.ts');
      const sourceContent = `const obj = {
  method() {
    return 1; // line 3
  }
}`;
      writeSourceFile(srcFile, sourceContent);

      // Coverage: the method is covered (1 hit)
      // statement span matches bodySpan (2,11-4,3) for object method
      const coverageData = {
        statementMap: {
          '0': {
            start: { line: 2, column: 11 },
            end: { line: 4, column: 3 }
          }
        },
        fnMap: {
          '0': {
            name: 'method',
            line: 2
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
      intervals.set('src/obj.ts', [{ start: 1, end: 4 }]);

      // Act
      const base = 'HEAD';
      const threshold = 30;
      const output = await callBuildEvidenceOutput(base, intervals, repo.tempDir, threshold);

      // Assert: object method 'method' should have numeric coverage (not null)
      expect(output).toBeDefined();
      expect(output.changedFunctions).toBeDefined();
      expect(output.changedFunctions.length).toBeGreaterThan(0);

      const methodFunc = (output.changedFunctions as ChangedFunction[]).find(f => f.method === 'obj.method');
      expect(methodFunc).toBeDefined(); // should be found

      if (methodFunc) {
        // After fix, we expect numeric coverage (not null)
        expect(methodFunc.coverage).not.toBeNull();
        // 100% since covered
        expect(methodFunc.coverage).toBe(100);
      }
    } finally {
      repo.cleanup();
    }
  });
});