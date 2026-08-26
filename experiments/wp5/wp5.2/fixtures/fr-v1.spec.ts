// FR-V1: P0 - Default-missing coverage → capabilities envelope mislabel
// Linked FM: FM-V01
// Behavior: coverageArtifact='available' when default coverage is missing, all changed NOT_EVALUATED
// Desired: coverageArtifact='absent' or equivalent when default coverage is missing

import { describe, test, expect } from 'vitest';
import { createTempRepo, writeSourceFile, writeCoverageFile, stageChanges, callBuildEvidenceOutput, normalizeOutput } from './helpers.ts';
import { join, resolve } from 'path';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import type { ChangedFunction } from '../../../../src/evidence.ts';

describe('FR-V1: P0 - Default-missing coverage → capabilities envelope mislabel', () => {
  test('should assert current behavior for missing coverage artifact', async () => {
    // Arrange: based on FM-V01 sketch
    const repo = createTempRepo();
    try {
      const srcDir = repo.srcDir;
      const srcFile = join(srcDir, 'index.ts');
      if (!existsSync(srcDir)) {
        mkdirSync(srcDir, { recursive: true });
      }
      const sourceContent = `export function main() {
  return 1; // line 2
}`;
      writeFileSync(srcFile, sourceContent, 'utf8');

      // We do NOT create a coverage artifact (no coverage file on disk).
      // We'll leave the coverageDir non-existent.

      // We'll change the file (intervals: [1, 2])
      const intervals = new Map<string, { start: number; end: number }[]>();
      intervals.set('src/index.ts', [{ start: 1, end: 2 }]);

      // Act: call buildEvidenceOutput
      const base = 'HEAD';
      const threshold = 30;
      const output = await callBuildEvidenceOutput(base, intervals, repo.tempDir, threshold);

      // Assert: we document the observed behavior for FM-V01
      expect(output).toBeDefined();
      expect(output.capabilities).toBeDefined();
      expect(output.capabilities.coverageArtifact).toBeDefined();
      // According to FM-V01, when no coverage artifact exists, the capabilities.coverageArtifact is 'available' (mislabel).
      // We'll assert the observed value.
      expect(output.capabilities.coverageArtifact).toBe('available');
      // Additionally, we expect changed functions to be NOT_EVALUATED.
      // The changedFunctions array may be empty or contain entries.
      // We'll check each changed function's coverageKind? Actually NOT_EVALUATED appears in ruleResults.result.
      // Let's check ruleResults.
      expect(output.ruleResults).toBeDefined();
      // If there are changed functions, each ruleResult should have result 'NOT_EVALUATED'.
      // If there are no changed functions, ruleResults may be empty, which is also OK.
      for (const result of output.ruleResults) {
        expect(result.result).toBe('NOT_EVALUATED');
      }
    } finally {
      repo.cleanup();
    }
  });
});