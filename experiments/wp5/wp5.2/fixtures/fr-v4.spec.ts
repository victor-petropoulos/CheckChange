// FR-V4: P1 - analysisStatus SUCCESS, gate PASS, completeness INCOMPLETE (indistinguishable from no artifact)
// Linked FM: FM-V04, FM-V05
// Behavior: analysisStatus SUCCESS, gate PASS, completeness INCOMPLETE (indistinguishable from no artifact)
// Desired: Same as current

import { describe, test, expect } from 'vitest';
import { createTempRepo, writeSourceFile, writeCoverageFile, stageChanges, callBuildEvidenceOutput, normalizeOutput } from './helpers.ts';
import { join, resolve } from 'path';
import { existsSync, writeFileSync } from 'fs';
import type { ChangedFunction } from '../../../../src/evidence.ts';

describe('FR-V4: P1 - analysisStatus SUCCESS, gate PASS, completeness INCOMPLETE', () => {
  test('should assert current behavior for incomplete completeness', async () => {
    // Arrange: repo with a .ts file that we change, but we provide coverage for a different file (so this file's coverage is null)
    const repo = createTempRepo();
    try {
      const srcDir = repo.srcDir;
      // File A: .ts file with a function that we will change
      const fileAPath = join(srcDir, 'fileA.ts');
      const fileAContent = `export function funcA() {
  return 1;
}`;
      writeFileSync(fileAPath, fileAContent, 'utf8');

      // File B: .ts file that we will provide coverage for (but we don't change it)
      const fileBPath = join(srcDir, 'fileB.ts');
      const fileBContent = `export function funcB() {
  return 2;
}`;
      writeFileSync(fileBPath, fileBContent, 'utf8');

      // Create coverage file that covers only fileB (so fileA has no coverage)
      const coverageData = {
        statementMap: {
          '0': {
            start: { line: 2, column: 0 },
            end: { line: 2, column: 100 }
          }
        },
        fnMap: {
          '0': {
            name: 'funcB',
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
      const absoluteFileB = resolve(fileBPath);
      coverageMap.set(absoluteFileB, coverageData);
      // We do not add coverage for fileA
      writeCoverageFile(repo.coverageDir, coverageMap);

      // We'll change fileA (intervals: entire file)
      const intervals = new Map<string, { start: number; end: number }[]>();
      intervals.set('src/fileA.ts', [{ start: 1, end: 4 }]);

      // Act: call buildEvidenceOutput
      const base = 'HEAD';
      const threshold = 30;
      const output = await callBuildEvidenceOutput(base, intervals, repo.tempDir, threshold);

      // Assert: we document the observed behavior for FM-V04/V05
      expect(output).toBeDefined();
      expect(output.analysisStatus).toBeDefined();
      expect(output.gate).toBeDefined();
      expect(output.completeness).toBeDefined();
      expect(output.capabilities).toBeDefined();
      // According to the fixture, we expect:
      //   analysisStatus: SUCCESS
      //   gate: PASS
      //   completeness: INCOMPLETE
      expect(output.analysisStatus).toBe('SUCCESS');
      expect(output.gate).toBe('PASS');
      expect(output.completeness).toBe('INCOMPLETE');
      // Additionally, we expect the capabilities to reflect that we have a coverage artifact (since we provided one)
      expect(output.capabilities.coverageArtifact).toBe('available');
      // We also expect that the changed function (fileA) has null coverage (because we didn't provide coverage for it)
      const changedFileA = (output.changedFunctions as ChangedFunction[]).find(f => f.file === 'src/fileA.ts');
      expect(changedFileA).toBeDefined();
      if (changedFileA) {
        expect(changedFileA.coverage).toBeNull();
      }
    } finally {
      repo.cleanup();
    }
  });
});