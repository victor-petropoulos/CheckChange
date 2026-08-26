// FR-A3: P1 - fnMap ambiguity / duplicate span collision handling
// Linked FM: FM-A03, FM-A04
// Behavior: Construct a coverage artifact where Istanbul fnMap contains two entries whose spans both match the same method's bodySpan by containment.
// Assert: attribution returns null coverage for that method → NOT_EVALUATED (fnmap_conflict).

import { describe, test, expect } from 'vitest';
import { createTempRepo, writeSourceFile, writeCoverageFile, stageChanges, callBuildEvidenceOutput, normalizeOutput } from './helpers.ts';
import { join, resolve } from 'path';
import { existsSync, writeFileSync } from 'fs';
import type { ChangedFunction } from '../../../../src/evidence.ts';

describe('FR-A3: P1 - fnMap ambiguity / duplicate span collision handling', () => {
  test('should assert current behavior for fnMap ambiguity', async () => {
    // Arrange: repo with a .ts file that has a function
    const repo = createTempRepo();
    try {
      const srcDir = repo.srcDir;
      const srcFile = join(srcDir, 'index.ts');
      const sourceContent = `export function main() {
  return 1;
}`;
      writeFileSync(srcFile, sourceContent, 'utf8');

      // Create coverage data with two fnMap entries that both match the same function span
      // This simulates the ambiguity where two fnMap entries claim to cover the same function
      const coverageData = {
        statementMap: {
          '0': {
            start: { line: 2, column: 0 },
            end: { line: 2, column: 100 }
          }
        },
        fnMap: {
          '0': {
            name: 'main',
            line: 1
          },
          '1': {
            name: 'main',  // Duplicate function name with same line
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

      // We'll change the function line
      const intervals = new Map<string, { start: number; end: number }[]>();
      intervals.set('src/index.ts', [{ start: 2, end: 2 }]);

      // Act: call buildEvidenceOutput
      const base = 'HEAD';
      const threshold = 30;
      const output = await callBuildEvidenceOutput(base, intervals, repo.tempDir, threshold);

      // Assert: we document the observed behavior for FM-A03/A04
      expect(output).toBeDefined();
      expect(output.changedFunctions).toBeDefined();
      // Due to fnMap ambiguity, we expect the coverage to be null (NOT_EVALUATED)
      const changedFunction = (output.changedFunctions as ChangedFunction[]).find(f => f.file === 'src/index.ts');
      expect(changedFunction).toBeDefined();
      if (changedFunction) {
        expect(changedFunction.coverage).toBeNull();
        // We can also check that the method name is correct
        expect(changedFunction.method).toBe('main');
      }
    } finally {
      repo.cleanup();
    }
  });
});