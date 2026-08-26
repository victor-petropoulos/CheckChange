// FR-C3: P2 - Changed TS file outside src root blind spot pinning
// Linked FM: FM-C03
// Behavior: TS file changed but lives outside any `src` segment (e.g. `tools/check.ts`). Intervals reference it. Assert: file never enumerated by complexity → function absent from correlate → no signal.
// Desired: Same as current (no defect)

import { describe, test, expect } from 'vitest';
import { createTempRepo, writeSourceFile, writeCoverageFile, stageChanges, callBuildEvidenceOutput, normalizeOutput } from './helpers.ts';
import { join, resolve } from 'path';
import { existsSync, writeFileSync, mkdirSync } from 'fs';
import type { ChangedFunction } from '../../../../src/evidence.ts';

describe('FR-C3: P2 - Changed TS file outside src root blind spot pinning', () => {
  test('should assert current behavior for changed TS file outside src root blind spot', async () => {
    // Arrange: repo with src directory containing a valid TS file, and a TS file outside src (in tools/)
    const repo = createTempRepo();
    try {
      const srcDir = repo.srcDir;
      
      // Create a TS file inside src/ (should be processed)
      const srcFilePath = join(srcDir, 'ok.ts');
      const srcFileContent = `export function okFunc() {
    return 1;
  }`;
      writeFileSync(srcFilePath, srcFileContent, 'utf8');
      
      // Create a TS file outside src/ (in tools/ at repo root) - should be blind spot
      const toolsFilePath = join(repo.tempDir, 'tools', 'check.ts');
      const toolsDir = join(repo.tempDir, 'tools');
      if (!existsSync(toolsDir)) {
        mkdirSync(toolsDir, { recursive: true });
      }
      const toolsFileContent = `export function toolsFunc() {
    return 2;
  }`;
      writeFileSync(toolsFilePath, toolsFileContent, 'utf8');
      
      // Create coverage data for both files
      const coverageDataSrc = {
        statementMap: {
          '0': {
            start: { line: 2, column: 0 },
            end: { line: 2, column: 100 }
          }
        },
        fnMap: {
          '0': {
            name: 'okFunc',
            line: 1
          }
        },
        branchMap: {},
        s: { '0': 1 },
        f: { '0': 1 },
        b: {},
        _coverageSchema: '3.3.2'
      };
      
      const coverageDataTools = {
        statementMap: {
          '0': {
            start: { line: 2, column: 0 },
            end: { line: 2, column: 100 }
          }
        },
        fnMap: {
          '0': {
            name: 'toolsFunc',
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
      const absoluteSrcFile = resolve(srcFilePath);
      const absoluteToolsFile = resolve(toolsFilePath);
      coverageMap.set(absoluteSrcFile, coverageDataSrc);
      coverageMap.set(absoluteToolsFile, coverageDataTools);
      writeCoverageFile(repo.coverageDir, coverageMap);
      
      // We'll change both files: the one inside src/ and the one outside src/
      const intervals = new Map<string, { start: number; end: number }[]>();
      intervals.set('src/ok.ts', [{ start: 2, end: 2 }]);
      intervals.set('tools/check.ts', [{ start: 2, end: 2 }]); // This is outside src/ and should be blind spot
      
      // Act: call buildEvidenceOutput
      const base = 'HEAD';
      const threshold = 30;
      const output = await callBuildEvidenceOutput(base, intervals, repo.tempDir, threshold);
      
      // Assert: we document the observed behavior for FM-C03
      expect(output).toBeDefined();
      expect(output.changedFunctions).toBeDefined();
      
      // Observed behavior: TS file outside src root is blind spot
      const changedSrcFunction = (output.changedFunctions as ChangedFunction[]).find(f => f.file === 'src/ok.ts');
      const changedToolsFunction = (output.changedFunctions as ChangedFunction[]).find(f => f.file === 'tools/check.ts');
      
      expect(changedSrcFunction).toBeDefined(); // Function inside src should be present
      expect(changedToolsFunction).toBeUndefined();   // Function outside src should be absent (blind spot)
      
      if (changedSrcFunction) {
        expect(changedSrcFunction.method).toBe('okFunc');
        // We don't assert coverage value here as it may vary, but we know the function is present
      }
      
    } finally {
      repo.cleanup();
    }
  });
});