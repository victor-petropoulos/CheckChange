// FR-D4: P1 - Deleted file with empty intervals [] is absent from changedFunctions; other files with changes are present
// Linked FM: FM-D04
// Behavior: Deleted file with empty intervals [] is absent from changedFunctions; other files with changes are present
// Desired: Same as current

import { describe, test, expect } from 'vitest';
import { createTempRepo, writeSourceFile, writeCoverageFile, stageChanges, callBuildEvidenceOutput, normalizeOutput } from './helpers.ts';
import { join, resolve } from 'path';
import { existsSync, writeFileSync } from 'fs';
import type { ChangedFunction } from '../../../../src/evidence.ts';

describe('FR-D4: P1 - Deleted file with empty intervals', () => {
  test('should assert current behavior for deleted file with empty intervals', async () => {
    // Arrange: repo with two files: one to be deleted (with empty intervals) and one to be changed
    const repo = createTempRepo();
    try {
      const srcDir = repo.srcDir;
      // File A: we will delete (but in the repo we create it and then delete? Actually we are setting intervals for it to empty to simulate deletion? 
      // The fixture says: deleted file with empty intervals. We can simulate by having the file in the repo but setting its intervals to empty.
      const fileAPath = join(srcDir, 'fileA.ts');
      const fileAContent = `export function funcA() {
  return 1;
}`;
      writeFileSync(fileAPath, fileAContent, 'utf8');

      // File B: we will change (non-empty intervals)
      const fileBPath = join(srcDir, 'fileB.ts');
      const fileBContent = `export function funcB() {
  return 2;
}`;
      writeFileSync(fileBPath, fileBContent, 'utf8');

      // We do not actually delete the file from the repo; we just set its intervals to empty to simulate that no lines are changed in it.
      // However, note: the buildEvidenceOutput uses the intervals to determine what changed. If we set intervals for fileA to empty, then it will not be considered changed.

      // Create coverage file that covers both functions (so we have complexity info)
      const coverageData = {
        statementMap: {
          '0': {
            start: { line: 2, column: 0 },
            end: { line: 2, column: 100 }
          },
          '1': {
            start: { line: 5, column: 0 },
            end: { line: 5, column: 100 }
          }
        },
        fnMap: {
          '0': {
            name: 'funcA',
            line: 1
          },
          '1': {
            name: 'funcB',
            line: 4
          }
        },
        branchMap: {},
        s: { '0': 1, '1': 1 },
        f: { '0': 1, 'f': 1 },
        b: {},
        _coverageSchema: '3.3.2'
      };

      const coverageMap = new Map<string, any>();
      const absoluteFileA = resolve(fileAPath);
      const absoluteFileB = resolve(fileBPath);
      coverageMap.set(absoluteFileA, coverageData);
      coverageMap.set(absoluteFileB, coverageData);
      writeCoverageFile(repo.coverageDir, coverageMap);

      // Intervals: 
      //   fileA: empty intervals (to simulate deletion or no change)
      //   fileB: change the entire file (or at least the function line)
      const intervals = new Map<string, { start: number; end: number }[]>();
      intervals.set('src/fileA.ts', []); // empty array
      intervals.set('src/fileB.ts', [{ start: 1, end: 6 }]); // change the whole file

      // Act: call buildEvidenceOutput
      const base = 'HEAD';
      const threshold = 30;
      const output = await callBuildEvidenceOutput(base, intervals, repo.tempDir, threshold);

      // Assert: we document the observed behavior for FM-D04
      expect(output).toBeDefined();
      expect(output.changedFunctions).toBeDefined();
      // We expect that fileA does not appear in changedFunctions (because its intervals are empty)
      // We expect that fileB does appear in changedFunctions (because we changed it)
      const changedFileA = (output.changedFunctions as ChangedFunction[]).find(f => f.file === 'src/fileA.ts');
      const changedFileB = (output.changedFunctions as ChangedFunction[]).find(f => f.file === 'src/fileB.ts');

      // According to the fixture, the deleted file (fileA) with empty intervals is absent from changedFunctions.
      expect(changedFileA).toBeUndefined();
      // The other file (fileB) should be present.
      expect(changedFileB).toBeDefined();
      // Additionally, we can check that the function in fileB is the one we expect.
      if (changedFileB) {
        expect(changedFileB.method).toBe('funcB');
      }
    } finally {
      repo.cleanup();
    }
  });
});