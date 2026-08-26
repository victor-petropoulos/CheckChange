// FR-G5: P2 - Output format and ordering determinism
// Linked FM: FM-G10
// Behavior: Run same fixture twice; assert JSON output identical (string-equal).

import { describe, test, expect } from 'vitest';
import { createTempRepo, writeSourceFile, writeCoverageFile, stageChanges, callBuildEvidenceOutput } from './helpers.ts';
import { join, resolve } from 'path';
import { existsSync, writeFileSync } from 'fs';

describe('FR-G5: P2 - Output format and ordering determinism', () => {
  test('should assert current behavior for output format determinism', async () => {
    // Arrange: repo with a simple TS file and coverage data
    const repo = createTempRepo();
    try {
      const srcDir = repo.srcDir;
      const srcFile = join(srcDir, 'index.ts');
      const sourceContent = `export function main() {
  return 1;
}`;
      writeFileSync(srcFile, sourceContent, 'utf8');

      // Create coverage data
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

      // We'll change the function line (line 2)
      const intervals = new Map<string, { start: number; end: number }[]>();
      intervals.set('src/index.ts', [{ start: 2, end: 2 }]);

      // Act: call buildEvidenceOutput twice
      const base = 'HEAD';
      const threshold = 30;
      const output1 = await callBuildEvidenceOutput(base, intervals, repo.tempDir, threshold);
      const output2 = await callBuildEvidenceOutput(base, intervals, repo.tempDir, threshold);

      // Assert: the two outputs are identical (string-equal)
      const json1 = JSON.stringify(output1, null, 2);
      const json2 = JSON.stringify(output2, null, 2);
      expect(json1).toBe(json2);
    } finally {
      repo.cleanup();
    }
  });
});