// FR-D2: P1 - Changed functions list excludes unmatched intervals (imports, type declarations, etc.)
// Linked FM: FM-D02
// Behavior: Changed functions list excludes unmatched intervals (imports, type declarations, etc.)
// Desired: Same as current

import { describe, test, expect } from 'vitest';
import { createTempRepo, writeSourceFile, writeCoverageFile, stageChanges, callBuildEvidenceOutput, normalizeOutput } from './helpers.ts';
import { join, resolve } from 'path';
import { existsSync, writeFileSync } from 'fs';
import type { ChangedFunction } from '../../../../src/evidence.ts';

describe('FR-D2: P1 - Changed functions list excludes unmatched intervals', () => {
  test('should assert current behavior for unmatched intervals', async () => {
    // Arrange: TS file with an import and a function
    const repo = createTempRepo();
    try {
      const srcDir = repo.srcDir;
      const srcFile = join(srcDir, 'index.ts');
      const sourceContent = `import { foo } from './foo';
export function main() {
  return 1;
}`;
      writeFileSync(srcFile, sourceContent, 'utf8');

      // Create coverage file that covers the function line (line 3) but not the import line (line 1)
      const coverageData = {
        statementMap: {
          '0': {
            start: { line: 3, column: 0 },
            end: { line: 3, column: 100 }
          }
        },
        fnMap: {
          '0': {
            name: 'main',
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

      // We'll change only the import line (line 1)
      const intervals = new Map<string, { start: number; end: number }[]>();
      intervals.set('src/index.ts', [{ start: 1, end: 1 }]);

      // Act: call buildEvidenceOutput
      const base = 'HEAD';
      const threshold = 30;
      const output = await callBuildEvidenceOutput(base, intervals, repo.tempDir, threshold);

      // Assert: we document the observed behavior for FM-D02
      expect(output).toBeDefined();
      expect(output.changedFunctions).toBeDefined();
      // Since we changed only an import (unmatched interval), we expect no changed functions
      expect(output.changedFunctions.length).toBe(0);
      // Additionally, we expect analysisStatus SUCCESS etc.
      expect(output.analysisStatus).toBe('SUCCESS');
      expect(output.gate).toBe('PASS');
      expect(output.completeness).toBe('COMPLETE');
      expect(output.capabilities.git).toBe('available');
      expect(output.capabilities.complexity).toBe('available');
      expect(output.capabilities.coverageArtifact).toBe('available');
    } finally {
      repo.cleanup();
    }
  });
});