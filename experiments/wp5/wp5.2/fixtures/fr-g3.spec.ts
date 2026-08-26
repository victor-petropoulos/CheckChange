// FR-G3: P0 - CLI invocation with non-TS changes exits 0 with analysisStatus UNSUPPORTED
// Linked FM: FM-G05, FM-D06
// Behavior: CLI invocation with non-TS changes exits 0 with analysisStatus UNSUPPORTED
// Desired: TBD at approval gate (requires human policy decision)

import { describe, test, expect } from 'vitest';
import { createTempRepo, writeSourceFile, writeCoverageFile, stageChanges, callBuildEvidenceOutput, normalizeOutput } from './helpers.ts';
import { join, resolve } from 'path';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import type { ChangedFunction } from '../../../../src/evidence.ts';

describe('FR-G3: P0 - CLI invocation with non-TS changes exits 0 with analysisStatus UNSUPPORTED', () => {
  test('should assert current behavior for non-TS changes', async () => {
    console.log('[FR-G3] test started');
    // Arrange: repo with a TS file (unchanged) and a changed .txt file
    const repo = createTempRepo();
    try {
      // Create a dummy TS file (not changed)
      const tsFile = join(repo.srcDir, 'dummy.ts');
      writeFileSync(tsFile, `export function dummy() { return 1; }`, 'utf8');

      // Create a changed .txt file
      const txtFile = join(repo.srcDir, 'changes.txt');
      writeFileSync(txtFile, 'some change', 'utf8');

      // We do NOT need a coverage artifact for unsupported case? Actually buildEvidenceOutput will still try to read coverage.
      // We'll create an empty coverage artifact to avoid failures.
      const coverageDir = repo.coverageDir;
      if (!existsSync(coverageDir)) {
        mkdirSync(coverageDir, { recursive: true });
      }
      // Write an empty coverage map (no files)
      const emptyCoverage = {};
      writeFileSync(join(coverageDir, 'coverage-final.json'), JSON.stringify(emptyCoverage), 'utf8');

      // Intervals: only the non-TS file changed (relative path from repo root)
      const intervals = new Map<string, { start: number; end: number }[]>();
      intervals.set('src/changes.txt', [{ start: 1, end: 1 }]); // single line change

      // Act: call buildEvidenceOutput
      const base = 'HEAD';
      const threshold = 30;
      const output = await callBuildEvidenceOutput(base, intervals, repo.tempDir, threshold);

      // Assert: we expect UNSUPPORTED
      expect(output).toBeDefined();
      expect(output.analysisStatus).toBe('UNSUPPORTED');
      expect(output.gate).toBeNull();
      expect(output.completeness).toBe('NOT_APPLICABLE');
      expect(output.changedFunctions).toBeDefined();
      expect(output.changedFunctions.length).toBe(0);
      // Capabilities: git available, complexity available (since we have a TS file), coverageArtifact available (we provided empty)
      expect(output.capabilities.git).toBe('available');
      expect(output.capabilities.complexity).toBe('available');
      expect(output.capabilities.coverageArtifact).toBe('available');
    } finally {
      repo.cleanup();
    }
  });
});