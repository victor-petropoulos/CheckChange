// FR-A08-REVERSE: Reversed coverage-map order test
// Linked FM: FM-A08
// Behavior: Reversing the order of entries in the coverage map should not change attribution results.

import { describe, test, expect } from 'vitest';
import { createTempRepo, writeSourceFile, writeCoverageFile, stageChanges, callBuildEvidenceOutput, normalizeOutput } from '../../wp5.2/fixtures/helpers.ts';
import { join, resolve } from 'path';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import type { ChangedFunction } from '../../../../src/evidence.ts';

describe('FR-A08-REVERSE: Reversed coverage-map order', () => {
  test('should produce identical attribution when coverage map order is reversed', async () => {
    // Arrange: two files with different coverage
    const repo = createTempRepo();
    try {
      const srcDir = repo.srcDir;
      const pkgADir = join(srcDir, 'pkg-a');
      const pkgBDir = join(srcDir, 'pkg-b');
      [pkgADir, pkgBDir].forEach(dir => {
        if (!existsSync(dir)) {
          mkdirSync(dir, { recursive: true });
        }
      });
      const pkgASrcFile = join(pkgADir, 'index.ts');
      const pkgBSrcFile = join(pkgBDir, 'index.ts');
      const pkgASource = `export function alpha() {
  return 1; // line 2
}`;
      const pkgBSource = `export function beta() {
  return 2; // line 2
}`;
      writeFileSync(pkgASrcFile, pkgASource, 'utf8');
      writeFileSync(pkgBSrcFile, pkgBSource, 'utf8');

      // Coverage: alpha covered (5 hits), beta not covered (0 hits)
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
        s: { '0': 5 },
        f: { '0': 5 },
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

      // We'll create two coverage maps: order AB and order BA
      const coverageMapAB = new Map<string, any>();
      const absolutePkgaFile = resolve(pkgASrcFile);
      const absolutePkgbFile = resolve(pkgBSrcFile);
      coverageMapAB.set(absolutePkgaFile, coverageDataPkga);
      coverageMapAB.set(absolutePkgbFile, coverageDataPkgb);

      const coverageMapBA = new Map<string, any>();
      coverageMapBA.set(absolutePkgbFile, coverageDataPkgb);
      coverageMapBA.set(absolutePkgaFile, coverageDataPkga);

      const coverageJsonAB = JSON.stringify({
        [absolutePkgaFile]: coverageDataPkga,
        [absolutePkgbFile]: coverageDataPkgb
      }, null, 2);
      const coverageJsonBA = JSON.stringify({
        [absolutePkgbFile]: coverageDataPkgb,
        [absolutePkgaFile]: coverageDataPkga
      }, null, 2);

      const coverageDir = repo.coverageDir;
      if (!existsSync(coverageDir)) {
        mkdirSync(coverageDir, { recursive: true });
      }
      const coverageFilePath = join(coverageDir, 'coverage-final.json');

      // Change both files
      const intervals = new Map<string, { start: number; end: number }[]>();
      intervals.set('src/pkg-a/index.ts', [{ start: 1, end: 2 }]);
      intervals.set('src/pkg-b/index.ts', [{ start: 1, end: 2 }]);

      // Act: run with order AB
      writeFileSync(coverageFilePath, coverageJsonAB, 'utf8');
      const base = 'HEAD';
      const threshold = 30;
      const outputAB = await callBuildEvidenceOutput(base, intervals, repo.tempDir, threshold);

      // Act: run with order BA
      writeFileSync(coverageFilePath, coverageJsonBA, 'utf8');
      const outputBA = await callBuildEvidenceOutput(base, intervals, repo.tempDir, threshold);

      // Assert: the two outputs should be identical in terms of coverage for each function
      expect(outputAB).toBeDefined();
      expect(outputBA).toBeDefined();
      expect(outputAB.changedFunctions).toBeDefined();
      expect(outputBA.changedFunctions).toBeDefined();

      const funcsAB = outputAB.changedFunctions as ChangedFunction[];
      const funcsBA = outputBA.changedFunctions as ChangedFunction[];

      // Find alpha and beta in both
      const alphaAB = funcsAB.find(f => f.method === 'alpha');
      const betaAB = funcsAB.find(f => f.method === 'beta');
      const alphaBA = funcsBA.find(f => f.method === 'alpha');
      const betaBA = funcsBA.find(f => f.method === 'beta');

      expect(alphaAB).toBeDefined();
      expect(betaAB).toBeDefined();
      expect(alphaBA).toBeDefined();
      expect(betaBA).toBeDefined();

      // Coverage should be the same in both orders
      if (alphaAB && alphaBA) {
        expect(alphaAB.coverage).toBe(alphaBA.coverage);
      }
      if (betaAB && betaBA) {
        expect(betaAB.coverage).toBe(betaBA.coverage);
      }
    } finally {
      repo.cleanup();
    }
  });
});