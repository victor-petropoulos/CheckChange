// FR-D6: P1 - Only .ts-derived functions appear in changedFunctions; .json changes are silently ignored
// Linked FM: FM-D07
// Behavior: Only .ts-derived functions appear in changedFunctions; .json changes are silently ignored
// Desired: Same as current

import { describe, test, expect } from 'vitest';
import { createTempRepo, writeSourceFile, writeCoverageFile, stageChanges, callBuildEvidenceOutput, normalizeOutput } from './helpers.ts';
import { join, resolve } from 'path';
import { existsSync, writeFileSync } from 'fs';
import type { ChangedFunction } from '../../../../src/evidence.ts';

describe('FR-D6: P1 - Only .ts-derived functions appear in changedFunctions', () => {
  test('should assert current behavior for .json changes being ignored', async () => {
    // Arrange: repo with a .ts file and a .json file
    const repo = createTempRepo();
    try {
      const srcDir = repo.srcDir;
      // File A: .ts file with a function
      const fileAPath = join(srcDir, 'fileA.ts');
      const fileAContent = `export function funcA() {
  return 1;
}`;
      writeFileSync(fileAPath, fileAContent, 'utf8');

      // File B: .json file (we'll treat it as a file that we change, but it should be ignored)
      const fileBPath = join(srcDir, 'fileB.json');
      const fileBContent = `{
  "key": "value"
}`;
      writeFileSync(fileBPath, fileBContent, 'utf8');

      // Create coverage file that covers the .ts function (so we have complexity info for the .ts file)
      // Note: the .json file will not have complexity info (since it's not .ts) so it won't appear in methodEvidence.
      const coverageData = {
        statementMap: {
          '0': {
            start: { line: 2, column: 0 },
            end: { line: 2, column: 100 }
          }
        },
        fnMap: {
          '0': {
            name: 'funcA',
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
      const absoluteFileA = resolve(fileAPath);
      coverageMap.set(absoluteFileA, coverageData);
      // We don't need to add coverage for the .json file because it's not .ts and won't be in complexityInfo.
      writeCoverageFile(repo.coverageDir, coverageMap);

      // Intervals: 
      //   fileA: change the entire file (or at least the function line)
      //   fileB: change the entire file (to simulate a change in the .json)
      const intervals = new Map<string, { start: number; end: number }[]>();
      intervals.set('src/fileA.ts', [{ start: 1, end: 4 }]);
      intervals.set('src/fileB.json', [{ start: 1, end: 3 }]); // change the .json file

      // Act: call buildEvidenceOutput
      const base = 'HEAD';
      const threshold = 30;
      const output = await callBuildEvidenceOutput(base, intervals, repo.tempDir, threshold);

      // Assert: we document the observed behavior for FM-D07
      expect(output).toBeDefined();
      expect(output.changedFunctions).toBeDefined();
      // We expect that only the .ts file's function appears in changedFunctions.
      const changedFileA = (output.changedFunctions as ChangedFunction[]).find(f => f.file === 'src/fileA.ts');
      const changedFileB = (output.changedFunctions as ChangedFunction[]).find(f => f.file === 'src/fileB.json');

      // According to the fixture, .json changes are silently ignored -> no changedFunctions for .json file.
      expect(changedFileB).toBeUndefined();
      // The .ts file should be present.
      expect(changedFileA).toBeDefined();
      if (changedFileA) {
        expect(changedFileA.method).toBe('funcA');
      }
    } finally {
      repo.cleanup();
    }
  });
});