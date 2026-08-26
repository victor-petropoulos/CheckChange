// FR-D3: P2 - Newly added TS file evaluation
// Linked FM: FM-D03
// Behavior: Newly added file with functions. Interval covers entire file.
// Assert all functions are evaluable.
// Desired: Both functions evaluated, numeric coverage, PASS or WARN

import { describe, test, expect } from 'vitest';
import { createTempRepo, writeSourceFile, writeCoverageFile, stageChanges, callBuildEvidenceOutput, normalizeOutput } from './helpers.ts';
import { join, resolve } from 'path';
import { existsSync, writeFileSync, mkdirSync } from 'fs';
import type { ChangedFunction } from '../../../../src/evidence.ts';

describe('FR-D3: P2 - Newly added TS file evaluation', () => {
  test('should assert current behavior for newly added TS file evaluation', async () => {
    // Arrange: repo with a TS file containing two functions
    const repo = createTempRepo();
    try {
      const srcDir = repo.srcDir;
      const srcFile = join(srcDir, 'index.ts');
      const sourceContent = `export function funcA() {
    return 1;
  }

export function funcB() {
    return 2;
  }`;
      writeFileSync(srcFile, sourceContent, 'utf8');
      
      // Create coverage data with coverage for both functions
      const coverageData = {
        statementMap: {
          '0': {
            start: { line: 2, column: 0 },
            end: { line: 2, column: 100 }
          },
          '1': {
            start: { line: 5, column: 0 },
            end: { line: 5, column: 100 }
          }
        },
        fnMap: {
          '0': {
            name: 'funcA',
            line: 1
          },
          '1': {
            name: 'funcB',
            line: 4
          }
        },
        branchMap: {},
        s: { '0': 1, '1': 1 },
        f: { '0': 1, '1': 1 },
        b: {},
        _coverageSchema: '3.3.2'
      };
      
      const coverageMap = new Map<string, any>();
      const absoluteSrcFile = resolve(srcFile);
      coverageMap.set(absoluteSrcFile, coverageData);
      writeCoverageFile(repo.coverageDir, coverageMap);
      
      // We'll change the entire file (lines 1-6)
      const intervals = new Map<string, { start: number; end: number }[]>();
      intervals.set('src/index.ts', [{ start: 1, end: 6 }]);
      
      // Act: call buildEvidenceOutput
      const base = 'HEAD';
      const threshold = 30;
      const output = await callBuildEvidenceOutput(base, intervals, repo.tempDir, threshold);
      
      // Assert: we document the observed behavior for FM-D03
      expect(output).toBeDefined();
      expect(output.changedFunctions).toBeDefined();
      expect(output.analysisStatus).toBeDefined();
      expect(output.gate).toBeDefined();
      expect(output.completeness).toBeDefined();
      
      // We expect to see both functions in changedFunctions since we changed the entire file
      const changedFuncA = (output.changedFunctions as ChangedFunction[]).find(f => f.method === 'funcA');
      const changedFuncB = (output.changedFunctions as ChangedFunction[]).find(f => f.method === 'funcB');
      
      expect(changedFuncA).toBeDefined();
      expect(changedFuncB).toBeDefined();
      
      if (changedFuncA) {
        expect(changedFuncA.file).toBe('src/index.ts');
        expect(changedFuncA.method).toBe('funcA');
        // Observed: despite having coverage data, coverage is null (systemic issue)
        // Desired: coverage should be numeric
        expect(changedFuncA.coverage).toBeNull();
        expect(changedFuncA.cc).toBeDefined();
        expect(changedFuncA.crap).toBeNull();
      }
      
      if (changedFuncB) {
        expect(changedFuncB.file).toBe('src/index.ts');
        expect(changedFuncB.method).toBe('funcB');
        // Observed: despite having coverage data, coverage is null (systemic issue)
        // Desired: coverage should be numeric
        expect(changedFuncB.coverage).toBeNull();
        expect(changedFuncB.cc).toBeDefined();
        expect(changedFuncB.crap).toBeNull();
      }
      
      // Overall output observations (based on systemic coverage issue)
      expect(output.analysisStatus).toBe('SUCCESS');
      expect(output.gate).toBe('PASS');
      expect(output.completeness).toBe('INCOMPLETE');
      
    } finally {
      repo.cleanup();
    }
  });
});