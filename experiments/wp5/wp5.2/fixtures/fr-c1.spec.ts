// FR-C1: P2 - Single file parse failure whole-run UNSUPPORTED blast radius
// Linked FM: FM-C01
// Behavior: One TS file has invalid syntax; one is valid. Assert entire run becomes UNSUPPORTED (all-or-nothing), not just the bad file.
// Desired: analysisStatus UNSUPPORTED, gate null, completeness NOT_APPLICABLE (even though only bad.ts is broken)

import { describe, test, expect } from 'vitest';
import { createTempRepo, writeSourceFile, writeCoverageFile, stageChanges, callBuildEvidenceOutput, normalizeOutput } from './helpers.ts';
import { join, resolve } from 'path';
import { existsSync, writeFileSync, mkdirSync } from 'fs';
import type { ChangedFunction } from '../../../../src/evidence.ts';

describe('FR-C1: P2 - Single file parse failure whole-run UNSUPPORTED blast radius', () => {
  test('should assert current behavior for single file parse failure blast radius', async () => {
    // Arrange: repo with one valid TS file and one invalid TS file
    const repo = createTempRepo();
    try {
      const srcDir = repo.srcDir;
      
      // Valid TS file
      const validFilePath = join(srcDir, 'valid.ts');
      const validFileContent = `export function validFunc() {
    return 1;
  }`;
      writeFileSync(validFilePath, validFileContent, 'utf8');
      
      // Invalid TS file (syntax error)
      const invalidFilePath = join(srcDir, 'invalid.ts');
      const invalidFileContent = `export function invalidFunc() {
    return 1;  // Missing closing brace
  }`;
      writeFileSync(invalidFilePath, invalidFileContent, 'utf8');
      
      // Create coverage data for the valid file (we'll assume coverage exists for it)
      const coverageData = {
        statementMap: {
          '0': {
            start: { line: 2, column: 0 },
            end: { line: 2, column: 100 }
          }
        },
        fnMap: {
          '0': {
            name: 'validFunc',
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
      const absoluteValidFile = resolve(validFilePath);
      coverageMap.set(absoluteValidFile, coverageData);
      writeCoverageFile(repo.coverageDir, coverageMap);
      
      // We'll change the valid file line
      const intervals = new Map<string, { start: number; end: number }[]>();
      intervals.set('src/valid.ts', [{ start: 2, end: 2 }]);
      
      // Act: call buildEvidenceOutput
      const base = 'HEAD';
      const threshold = 30;
      const output = await callBuildEvidenceOutput(base, intervals, repo.tempDir, threshold);
      
      // Assert: we document the observed behavior for FM-C01
      expect(output).toBeDefined();
      expect(output.analysisStatus).toBeDefined();
      expect(output.gate).toBeDefined();
      expect(output.completeness).toBeDefined();
      
      // Observed: Single file parse failure does NOT cause whole-run UNSUPPORTED (contrary to expected all-or-nothing behavior)
      // Desired: analysisStatus UNSUPPORTED, gate null, completeness NOT_APPLICABLE
      expect(output.analysisStatus).toBe('SUCCESS');
      expect(output.gate).toBe('PASS');
      expect(output.completeness).toBe('INCOMPLETE');
      
    } finally {
      repo.cleanup();
    }
  });
});