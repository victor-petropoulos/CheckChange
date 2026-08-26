// FR-C2: P2 - Zero functions / missing src root graceful empty SUCCESS
// Linked FM: FM-C02
// Behavior: No `src` segment directories, or src exists but has no TS files. Assert SUCCESS/PASS/COMPLETE with empty changedFunctions.
// Desired: Same as current (no defect)

import { describe, test, expect } from 'vitest';
import { createTempRepo, writeSourceFile, writeCoverageFile, stageChanges, callBuildEvidenceOutput, normalizeOutput } from './helpers.ts';
import { join, resolve } from 'path';
import { existsSync, writeFileSync, mkdirSync } from 'fs';
import type { ChangedFunction } from '../../../../src/evidence.ts';

describe('FR-C2: P2 - Zero functions / missing src root graceful empty SUCCESS', () => {
  test('should assert current behavior for zero functions / missing src root', async () => {
    // Arrange: repo with src directory but no TS files
    const repo = createTempRepo();
    try {
      // Note: srcDir is automatically created by createTempRepo, but we leave it empty
      // No TS files in src/
      
      // Create empty coverage file (no coverage data)
      const coverageMap = new Map<string, any>();
      writeCoverageFile(repo.coverageDir, coverageMap);
      
      // No intervals to change (no TS files)
      const intervals = new Map<string, { start: number; end: number }[]>();
      
      // Act: call buildEvidenceOutput
      const base = 'HEAD';
      const threshold = 30;
      const output = await callBuildEvidenceOutput(base, intervals, repo.tempDir, threshold);
      
      // Assert: we document the observed behavior for FM-C02
      expect(output).toBeDefined();
      expect(output.analysisStatus).toBeDefined();
      expect(output.gate).toBeDefined();
      expect(output.completeness).toBeDefined();
      expect(output.changedFunctions).toBeDefined();
      expect(Array.isArray(output.changedFunctions)).toBe(true);
      
      // Observed behavior for zero TS files
      expect(output.analysisStatus).toBe('SUCCESS');
      expect(output.gate).toBe('PASS');
      expect(output.completeness).toBe('COMPLETE');
      expect(output.changedFunctions.length).toBe(0);
      
    } finally {
      repo.cleanup();
    }
  });
});