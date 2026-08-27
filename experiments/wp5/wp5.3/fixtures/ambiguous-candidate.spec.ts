// FR-A08-AMBIGUOUS: Ambiguous candidate test
// Linked FM: FM-A08
// Behavior: When a coverage path matches multiple complexity files (ambiguous), attribution must decline (coverage null).

import { describe, test, expect } from 'vitest';
import { createTempRepo, writeSourceFile, writeCoverageFile, stageChanges, callBuildEvidenceOutput, normalizeOutput } from '../../wp5.2/fixtures/helpers.ts';
import { join, resolve } from 'path';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import type { ChangedFunction } from '../../../../src/evidence.ts';

describe('FR-A08-AMBIGUOUS: Ambiguous candidate', () => {
  test('should decline attribution when coverage path matches multiple complexity files', async () => {
    // Arrange: create two files with the same relative path but different locations
    // One under src/ and one at the repo root (both tracked by git)
    const repo = createTempRepo();
    try {
      const srcDir = repo.srcDir;
      const rootDir = repo.tempDir; // the repo root

      // Create src/foo/bar.ts
      const srcFooDir = join(srcDir, 'foo');
      if (!existsSync(srcFooDir)) {
        mkdirSync(srcFooDir, { recursive: true });
      }
      const srcFooBarFile = join(srcFooDir, 'bar.ts');
      const srcFooBarSource = `export function bar() {
  return 1; // line 3
}`;
      writeFileSync(srcFooBarFile, srcFooBarSource, 'utf8');

      // Create foo/bar.ts at repo root
      const rootFooDir = join(rootDir, 'foo');
      if (!existsSync(rootFooDir)) {
        mkdirSync(rootFooDir, { recursive: true });
      }
      const rootFooBarFile = join(rootFooDir, 'bar.ts');
      const rootFooBarSource = `export function bar() {
  return 2; // line 3
}`;
      writeFileSync(rootFooBarFile, rootFooBarSource, 'utf8');

      // Now, we need to make sure both files are tracked by git.
      // The createTempRepo should have initialized a git repo and we can add the files.
      // We'll stage the changes (the helper stageChanges might do that, but we can do it manually).
      // We'll use the stageChanges helper from the fixture.

      // We'll create coverage for the src/foo/bar.ts file (the one under src/)
      // We'll say that the function bar in src/foo/bar.ts is covered (1 hit) and the one in root is not covered (0 hits) - but note: the coverage map is keyed by absolute file path.
      const coverageDataSrc = {
        statementMap: {
          '0': {
            start: { line: 1, column: 0 },
            end: { line: 3, column: 1 }
          }
        },
        fnMap: {
          '0': {
            name: 'bar',
            line: 2
          }
        },
        branchMap: {},
        s: { '0': 1 },
        f: { '0': 1 },
        b: {},
        _coverageSchema: '3.3.2'
      };

      const coverageDataRoot = {
        statementMap: {
          '0': {
            start: { line: 1, column: 0 },
            end: { line: 3, column: 1 }
          }
        },
        fnMap: {
          '0': {
            name: 'bar',
            line: 2
          }
        },
        branchMap: {},
        s: { '0': 0 },
        f: { '0': 0 },
        b: {},
        _coverageSchema: '3.3.2'
      };

      const coverageMap = new Map<string, any>();
      const absoluteSrcFooBarFile = resolve(srcFooBarFile);
      const absoluteRootFooBarFile = resolve(rootFooBarFile);
      coverageMap.set(absoluteSrcFooBarFile, coverageDataSrc);
      coverageMap.set(absoluteRootFooBarFile, coverageDataRoot);

      const coverageJson = JSON.stringify({
        [absoluteSrcFooBarFile]: coverageDataSrc,
        [absoluteRootFooBarFile]: coverageDataRoot
      }, null, 2);
      const coverageDir = repo.coverageDir;
      if (!existsSync(coverageDir)) {
        mkdirSync(coverageDir, { recursive: true });
      }
      const coverageFilePath = join(coverageDir, 'coverage-final.json');
      writeFileSync(coverageFilePath, coverageJson, 'utf8');

      // We'll change the src/foo/bar.ts file (so that we expect to see its function in the output)
      const intervals = new Map<string, { start: number; end: number }[]>();
      intervals.set('src/foo/bar.ts', [{ start: 1, end: 4 }]);

      // Act
      const base = 'HEAD';
      const threshold = 30;
      const output = await callBuildEvidenceOutput(base, intervals, repo.tempDir, threshold);

      // Assert: due to ambiguity (the coverage path for src/foo/bar.ts ends with both "src/foo/bar.ts" and "foo/bar.ts"), attribution should decline -> coverage null
      expect(output).toBeDefined();
      expect(output.changedFunctions).toBeDefined();
      // We expect the function bar from src/foo/bar.ts to be in the changedFunctions (because we changed that file)
const barFunc = (output.changedFunctions as ChangedFunction[]).find(f => f.method === 'bar' && f.file === 'src/foo/bar.ts');
      // Note: we also have the bar function from root/foo/bar.ts, but we didn't change that file, so it shouldn't be in changedFunctions.

      // We expect to find the bar function from src/foo/bar.ts because we changed that file.
      expect(barFunc).toBeDefined();
      // If found, due to ambiguity the coverage should be null.
      if (barFunc) {
        expect(barFunc.coverage).toBeNull();
      }
    } finally {
      repo.cleanup();
    }
  });
});