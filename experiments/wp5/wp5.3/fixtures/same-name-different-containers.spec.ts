// FR-A07-SAMENAME: Same-name methods in different containers test
// Linked FM: FM-A07
// Behavior: Same method name in different containers (e.g., Foo.bar and Baz.bar) must be attributed to different coverage entries.

import { describe, test, expect } from 'vitest';
import { createTempRepo, writeSourceFile, writeCoverageFile, stageChanges, callBuildEvidenceOutput, normalizeOutput } from '../../wp5.2/fixtures/helpers.ts';
import { join, resolve } from 'path';
import type { ChangedFunction } from '../../../../src/evidence.ts';

describe('FR-A07-SAMENAME: Same-name methods in different containers', () => {
  test('should attribute coverage correctly to same-named methods in different containers', async () => {
    // Arrange: two classes with same method name but different coverage
    const repo = createTempRepo();
    try {
      const srcFile = join(repo.srcDir, 'classes.ts');
      const sourceContent = `class Foo {
  bar() {
    return 1; // line 3
  }
}

class Baz {
  bar() {
    return 2; // line 8
  }
}`;
      writeSourceFile(srcFile, sourceContent);

      // Coverage: Foo.bar covered (1 hit), Baz.bar not covered (0 hits)
      // statement spans cover each method body separately for correct attribution
      const coverageData = {
        statementMap: {
          '0': {
            start: { line: 2, column: 8 },
            end: { line: 4, column: 3 }
          },
          '1': {
            start: { line: 8, column: 8 },
            end: { line: 10, column: 3 }
          }
        },
        fnMap: {
          '0': {
            name: 'bar',
            line: 2
          },
          '1': {
            name: 'bar',
            line: 8
          }
        },
        branchMap: {},
        s: { '0': 1, '1': 0 },
        f: { '0': 1, '1': 0 },
        b: {},
        _coverageSchema: '3.3.2'
      };

      const coverageMap = new Map<string, any>();
      const absoluteSrcFile = resolve(srcFile);
      coverageMap.set(absoluteSrcFile, coverageData);

      writeCoverageFile(repo.coverageDir, coverageMap);

      // Change the file (entire file)
      const intervals = new Map<string, { start: number; end: number }[]>();
      intervals.set('src/classes.ts', [{ start: 1, end: 10 }]);

      // Act
      const base = 'HEAD';
      const threshold = 30;
      const output = await callBuildEvidenceOutput(base, intervals, repo.tempDir, threshold);

      // Assert: each method gets its own coverage
      expect(output).toBeDefined();
      expect(output.changedFunctions).toBeDefined();
      expect(output.changedFunctions.length).toBeGreaterThan(0);

      // We expect two functions: Foo.bar and Baz.bar (the method field in ChangedFunction is just the method name? 
      // Looking at the evidence.ts, the ChangedFunction has a 'method' field that is the method name (without container)?
      // Actually, in the fr-a6.spec.ts, they looked for f.method === 'bar' and f.method === 'baz'. So the method field is the function name only.
      // However, the container is part of the file and line? We need to distinguish by the file and line? 
      // The ChangedFunction does not have container. So how do we tell them apart?
      // We can use the fact that they are in the same file but different lines? The ChangedFunction has a 'file' field (relative path) and 'lineStart'.
      // So we can look for the function name and the lineStart.

      // Let's look for the function 'Foo.bar' at line 2 and 'Baz.bar' at line 7
      const fooBarFunc = (output.changedFunctions as ChangedFunction[]).find(f => f.method === 'Foo.bar' && f.lineStart === 2);
      const bazBarFunc = (output.changedFunctions as ChangedFunction[]).find(f => f.method === 'Baz.bar' && f.lineStart === 8);

      expect(fooBarFunc).toBeDefined();
      expect(bazBarFunc).toBeDefined();

      // Foo.bar: 100%, Baz.bar: 0%
      if (fooBarFunc) {
        expect(fooBarFunc.coverage).toBe(100);
      }
      if (bazBarFunc) {
        expect(bazBarFunc.coverage).toBe(0);
      }
    } finally {
      repo.cleanup();
    }
  });
});