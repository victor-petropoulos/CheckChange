// FR-A07-CLASS: Class method test
// Linked FM: FM-A07
// Behavior: Class methods should receive numeric coverage (not null) when coverage data exists.

import { describe, test, expect } from 'vitest';
import { createTempRepo, writeSourceFile, writeCoverageFile, stageChanges, callBuildEvidenceOutput, normalizeOutput } from '../../wp5.2/fixtures/helpers.ts';
import { join, resolve } from 'path';
import type { ChangedFunction } from '../../../../src/evidence.ts';

describe('FR-A07-CLASS: Class method', () => {
  test('should assign numeric coverage to class methods', async () => {
    // Arrange: class with a method
    const repo = createTempRepo();
    try {
      const srcFile = join(repo.srcDir, 'cls.ts');
      const sourceContent = `class Foo {
  bar() {
    return 1; // line 3
  }
}`;
      writeSourceFile(srcFile, sourceContent);

      // Coverage: the method is covered (1 hit)
      // statement span covers entire file (4 lines) to satisfy bodySpan requirement
      const coverageData = {
        statementMap: {
          '0': {
            start: { line: 2, column: 8 },
            end: { line: 4, column: 3 }
          }
        },
        fnMap: {
          '0': {
            name: 'bar',
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
      intervals.set('src/cls.ts', [{ start: 1, end: 4 }]);

      // Act
      const base = 'HEAD';
      const threshold = 30;
      const output = await callBuildEvidenceOutput(base, intervals, repo.tempDir, threshold);

      // Assert: class method 'bar' should have numeric coverage (not null)
      expect(output).toBeDefined();
      expect(output.changedFunctions).toBeDefined();
      expect(output.changedFunctions.length).toBeGreaterThan(0);

      const barFunc = (output.changedFunctions as ChangedFunction[]).find(f => f.method === 'Foo.bar');
      expect(barFunc).toBeDefined(); // should be found

      if (barFunc) {
        // After fix, we expect numeric coverage (not null)
        expect(barFunc.coverage).not.toBeNull();
        // 100% since covered
        expect(barFunc.coverage).toBe(100);
      }
    } finally {
      repo.cleanup();
    }
  });
});