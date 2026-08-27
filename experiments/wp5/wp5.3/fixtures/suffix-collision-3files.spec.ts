// FR-A08-SUFFIX3: Suffix collision (3+ files) test
// Linked FM: FM-A08
// Behavior: With three files sharing the same suffix, each file's coverage should be attributed correctly (no wrong-file attribution).

import { describe, test, expect } from 'vitest';
import { createTempRepo, writeSourceFile, writeCoverageFile, stageChanges, callBuildEvidenceOutput, normalizeOutput } from '../../wp5.2/fixtures/helpers.ts';
import { join, resolve } from 'path';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import type { ChangedFunction } from '../../../../src/evidence.ts';

describe('FR-A08-SUFFIX3: Suffix collision (3+ files)', () => {
  test('should attribute coverage correctly for each file in a 3-way suffix collision', async () => {
    // Arrange: three files with same suffix but different paths
    const repo = createTempRepo();
    try {
      const srcDir = repo.srcDir;
      const pkgADir = join(srcDir, 'pkg-a');
      const pkgBDir = join(srcDir, 'pkg-b');
      const pkgCDir = join(srcDir, 'pkg-c');
      [pkgADir, pkgBDir, pkgCDir].forEach(dir => {
        if (!existsSync(dir)) {
          mkdirSync(dir, { recursive: true });
        }
      });
      const pkgASrcFile = join(pkgADir, 'index.ts');
      const pkgBSrcFile = join(pkgBDir, 'index.ts');
      const pkgCSrcFile = join(pkgCDir, 'index.ts');
      const pkgASource = `export function alpha() {
  return 1; // line 2
}`;
      const pkgBSource = `export function beta() {
  return 2; // line 2
}`;
      const pkgCSource = `export function gamma() {
  return 3; // line 2
}`;
      writeFileSync(pkgASrcFile, pkgASource, 'utf8');
      writeFileSync(pkgBSrcFile, pkgBSource, 'utf8');
      writeFileSync(pkgCSrcFile, pkgCSource, 'utf8');

      // Coverage: alpha covered (1), beta not covered (0), gamma covered (2 hits)
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

      const coverageDataPkgc = {
        statementMap: {
          '0': {
            start: { line: 1, column: 0 },
            end: { line: 3, column: 1 }
          }
        },
        fnMap: {
          '0': {
            name: 'gamma',
            line: 1
          }
        },
        branchMap: {},
        s: { '0': 2 },
        f: { '0': 2 },
        b: {},
        _coverageSchema: '3.3.2'
      };

      const coverageMap = new Map<string, any>();
      const absolutePkgaFile = resolve(pkgASrcFile);
      const absolutePkgbFile = resolve(pkgBSrcFile);
      const absolutePkgcFile = resolve(pkgCSrcFile);
      coverageMap.set(absolutePkgaFile, coverageDataPkga);
      coverageMap.set(absolutePkgbFile, coverageDataPkgb);
      coverageMap.set(absolutePkgcFile, coverageDataPkgc);

      const coverageJson = JSON.stringify({
        [absolutePkgaFile]: coverageDataPkga,
        [absolutePkgbFile]: coverageDataPkgb,
        [absolutePkgcFile]: coverageDataPkgc
      }, null, 2);
      const coverageDir = repo.coverageDir;
      if (!existsSync(coverageDir)) {
        mkdirSync(coverageDir, { recursive: true });
      }
      const coverageFilePath = join(coverageDir, 'coverage-final.json');
      writeFileSync(coverageFilePath, coverageJson, 'utf8');

      // Change all three files
      const intervals = new Map<string, { start: number; end: number }[]>();
      intervals.set('src/pkg-a/index.ts', [{ start: 1, end: 2 }]);
      intervals.set('src/pkg-b/index.ts', [{ start: 1, end: 2 }]);
      intervals.set('src/pkg-c/index.ts', [{ start: 1, end: 2 }]);

      // Act
      const base = 'HEAD';
      const threshold = 30;
      const output = await callBuildEvidenceOutput(base, intervals, repo.tempDir, threshold);

      // Assert: correct attribution for each
      expect(output).toBeDefined();
      expect(output.changedFunctions).toBeDefined();
      expect(output.changedFunctions.length).toBeGreaterThan(0);

      const alphaFunc = (output.changedFunctions as ChangedFunction[]).find(f => f.method === 'alpha');
      const betaFunc = (output.changedFunctions as ChangedFunction[]).find(f => f.method === 'beta');
      const gammaFunc = (output.changedFunctions as ChangedFunction[]).find(f => f.method === 'gamma');

      // All three functions should be found
      expect(alphaFunc).toBeDefined();
      expect(betaFunc).toBeDefined();
      expect(gammaFunc).toBeDefined();

      // Alpha: 100%, Beta: 0%, Gamma: 100%
      if (alphaFunc) {
        expect(alphaFunc.coverage).toBe(100);
      }
      if (betaFunc) {
        expect(betaFunc.coverage).toBe(0);
      }
      if (gammaFunc) {
        expect(gammaFunc.coverage).toBe(100);
      }
    } finally {
      repo.cleanup();
    }
  });
});