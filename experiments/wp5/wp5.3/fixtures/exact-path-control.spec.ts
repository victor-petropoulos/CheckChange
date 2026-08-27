// FR-A08-EXACT: Exact-path control test
// Linked FM: FM-A08
// Behavior: Exact path match should work correctly when coverageMap key equals complexityByFile key after normalization.

import { describe, test, expect } from 'vitest';
import { createTempRepo, writeSourceFile, writeCoverageFile, stageChanges, callBuildEvidenceOutput, normalizeOutput } from '../../wp5.2/fixtures/helpers.ts';
import { join, resolve } from 'path';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import type { ChangedFunction } from '../../../../src/evidence.ts';

describe('FR-A08-EXACT: Exact-path control', () => {
  test('should attribute coverage correctly when exact path match exists', async () => {
    // Arrange: two different files with no suffix collision
    const repo = createTempRepo();
    try {
      const srcDir = repo.srcDir;
      const utilsADir = join(srcDir, 'utils', 'a');
      const utilsBDir = join(srcDir, 'utils', 'b');
      if (!existsSync(utilsADir)) {
        mkdirSync(utilsADir, { recursive: true });
      }
      if (!existsSync(utilsBDir)) {
        mkdirSync(utilsBDir, { recursive: true });
      }
      const utilsASrcFile = join(utilsADir, 'alpha.ts');
      const utilsBSrcFile = join(utilsBDir, 'beta.ts');
      const utilsASource = `export function alpha() {
  return 1; // line 2
}`;
      const utilsBSource = `export function beta() {
  return 2; // line 2
}`;
      writeFileSync(utilsASrcFile, utilsASource, 'utf8');
      writeFileSync(utilsBSrcFile, utilsBSource, 'utf8');

      // Coverage: alpha covered (1 hit), beta not covered (0 hits)
      // statement spans cover entire file (3 lines) to satisfy bodySpan requirement
      const coverageDataPkga = {
        statementMap: {
          '0': {
            start: { line: 1, column: 0 },
            end: { line: 3, column: 1 }
          }
        },
        fnMap: {
          '0': {
            name: 'alpha',
            line: 1
          }
        },
        branchMap: {},
        s: { '0': 1 },
        f: { '0': 1 },
        b: {},
        _coverageSchema: '3.3.2'
      };

      const coverageDataPkgb = {
        statementMap: {
          '0': {
            start: { line: 1, column: 0 },
            end: { line: 3, column: 1 }
          }
        },
        fnMap: {
          '0': {
            name: 'beta',
            line: 1
          }
        },
        branchMap: {},
        s: { '0': 0 },
        f: { '0': 0 },
        b: {},
        _coverageSchema: '3.3.2'
      };

      const coverageMap = new Map<string, any>();
      const absolutePkgaFile = resolve(utilsASrcFile);
      const absolutePkgbFile = resolve(utilsBSrcFile);
      coverageMap.set(absolutePkgaFile, coverageDataPkga);
      coverageMap.set(absolutePkgbFile, coverageDataPkgb);

      const coverageJson = JSON.stringify({
        [absolutePkgaFile]: coverageDataPkga,
        [absolutePkgbFile]: coverageDataPkgb
      }, null, 2);
      const coverageDir = repo.coverageDir;
      if (!existsSync(coverageDir)) {
        mkdirSync(coverageDir, { recursive: true });
      }
      const coverageFilePath = join(coverageDir, 'coverage-final.json');
      writeFileSync(coverageFilePath, coverageJson, 'utf8');

      // Change both files
      const intervals = new Map<string, { start: number; end: number }[]>();
      intervals.set('src/utils/a/alpha.ts', [{ start: 1, end: 2 }]);
      intervals.set('src/utils/b/beta.ts', [{ start: 1, end: 2 }]);

      // Act
      const base = 'HEAD';
      const threshold = 30;
      const output = await callBuildEvidenceOutput(base, intervals, repo.tempDir, threshold);

      // Assert: correct attribution
      expect(output).toBeDefined();
      expect(output.changedFunctions).toBeDefined();
      expect(output.changedFunctions.length).toBeGreaterThan(0);

      const alphaFunc = (output.changedFunctions as ChangedFunction[]).find(f => f.method === 'alpha');
      const betaFunc = (output.changedFunctions as ChangedFunction[]).find(f => f.method === 'beta');

      // Both functions should be found
      expect(alphaFunc).toBeDefined();
      expect(betaFunc).toBeDefined();

      // Alpha: 100% covered, beta: 0% (not covered)
      if (alphaFunc) {
        expect(alphaFunc.coverage).toBe(100);
      }
      if (betaFunc) {
        expect(betaFunc.coverage).toBe(0);
      }
    } finally {
      repo.cleanup();
    }
  });
});