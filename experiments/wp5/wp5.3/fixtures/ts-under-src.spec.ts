// FR-A08-TSUNDER: TS under src/ test
// Linked FM: FM-C03 (but this is about files under src/ being included) and FM-A08/A07
// Behavior: A normal TypeScript file under src/ should be processed and attributed correctly.

import { describe, test, expect } from 'vitest';
import { createTempRepo, writeSourceFile, writeCoverageFile, stageChanges, callBuildEvidenceOutput, normalizeOutput } from '../../wp5.2/fixtures/helpers.ts';
import { join, resolve } from 'path';
import type { ChangedFunction } from '../../../../src/evidence.ts';

describe('FR-A08-TSUNDER: TS under src/', () => {
  test('should process and attribute a normal TS file under src/', async () => {
    // Arrange: a simple TS file under src/
    const repo = createTempRepo();
    try {
      const srcDir = repo.srcDir;
      const tsFile = join(srcDir, 'normal.ts');
      const sourceContent = `export function normal() {
  return 42; // line 3
}`;
      writeSourceFile(tsFile, sourceContent);

      // Coverage: the function is covered (1 hit)
      // statement span matches bodySpan (1,25-3,1) for exact attribution
      const coverageData = {
        statementMap: {
          '0': {
            start: { line: 1, column: 25 },
            end: { line: 3, column: 1 }
          }
        },
        fnMap: {
          '0': {
            name: 'normal',
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
      const absoluteTsFile = resolve(tsFile);
      coverageMap.set(absoluteTsFile, coverageData);

      writeCoverageFile(repo.coverageDir, coverageMap);

      // Change the file
      const intervals = new Map<string, { start: number; end: number }[]>();
      intervals.set('src/normal.ts', [{ start: 1, end: 4 }]);

      // Act
      const base = 'HEAD';
      const threshold = 30;
      const output = await callBuildEvidenceOutput(base, intervals, repo.tempDir, threshold);

      // Assert: the function should be found and have numeric coverage
      expect(output).toBeDefined();
      expect(output.changedFunctions).toBeDefined();
      expect(output.changedFunctions.length).toBeGreaterThan(0);

      const normalFunc = (output.changedFunctions as ChangedFunction[]).find(f => f.method === 'normal');
      expect(normalFunc).toBeDefined();
      if (normalFunc) {
        expect(normalFunc.coverage).toBe(100);
      }
    } finally {
      repo.cleanup();
    }
  });
});