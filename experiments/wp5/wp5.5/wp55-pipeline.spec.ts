import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  createTempRepo, 
  writeSourceFile, 
  writeCoverageFile, 
  stageChanges, 
  callBuildEvidenceOutput, 
  normalizeOutput 
} from '../wp5.2/fixtures/helpers';
import { buildEvidenceOutput } from '../../../src/evidence.ts';
import { resolve } from 'path';

describe('WP5.5 T2: End-to-end composed pipeline tests (using buildEvidenceOutput directly)', () => {
  let tempDir: ReturnType<typeof createTempRepo>;

  beforeEach(() => {
    tempDir = createTempRepo();
  });

  afterEach(() => {
    tempDir.cleanup();
  });

  // Scenario A: high CC + zero coverage → analyzerStatus 'passed', crap computed (CC high + coverage 0 → CRAP high), gate PASS/WARN varies but not null, coverageArtifact 'available'
  it('scenario A: high CC + zero coverage', async () => {
    // Create a TypeScript file with high cyclomatic complexity (e.g., many if statements)
    const srcFile = `${tempDir.srcDir}/complex.ts`;
    // Let's create a function with high CC (say 15) by having many branches
    const content = `
    export function highComplexity(x: number): number {
      if (x > 0) return 1;
      if (x > 1) return 2;
      if (x > 2) return 3;
      if (x > 3) return 4;
      if (x > 4) return 5;
      if (x > 5) return 6;
      if (x > 6) return 7;
      if (x > 7) return 8;
      if (x > 8) return 9;
      if (x > 9) return 10;
      if (x > 10) return 11;
      if (x > 11) return 12;
      if (x > 12) return 13;
      if (x > 13) return 14;
      if (x > 14) return 15;
      return 0;
    }
    `;
    writeSourceFile(srcFile, content);

    // Define intervals: the whole function (lines 2-18) -> let's say from line 3 to 17 (the function body)
    // We'll use the entire file for simplicity, but we need to set intervals for the changed function.
    // Since we are testing the composition, we can set the interval to the whole file.
    const intervals = new Map<string, { start: number; end: number }[]>();
    intervals.set('src/complex.ts', [{ start: 1, end: 20 }]); // approximate

    // Write coverage file with zero coverage (all zeros) for the file
    const coverageMap = new Map<string, any>();
    // We'll create a coverage object that represents zero coverage: cover the function definition line with count 0.
    // Note: the coverage object should NOT include a "path" field; the path is the key in the map.
    const relativePath = 'src/complex.ts'; // This is the key in the map (relative to tempDir? Actually, we will use the absolute path in the map)
    const absolutePath = resolve(tempDir.tempDir, relativePath);
    const zeroCoverage = {
      "statementMap": {
        "0": { "start": { "line": 2, "column": 0 }, "end": { "line": 2, "column": 100 } }
      },
      "fnMap": {
        "0": {
          name: "highComplexity",
          line: 2
        }
      },
      "branchMap": {},
      "s": {
        "0": 0
      },
      "f": {
        "0": 0
      },
      "b": {},
      "_coverageSchema": "urn:schema:istanbul:coverage:2"
    };
    coverageMap.set(absolutePath, zeroCoverage);

    const coverageFilePath = writeCoverageFile(tempDir.coverageDir, coverageMap);

    // Now call buildEvidenceOutput
    const output = await callBuildEvidenceOutput(
      'HEAD', // base
      intervals,
      tempDir.tempDir,
      30 // threshold
    );

    // console.log('Output A:', JSON.stringify(output, null, 2));

    const normalized = normalizeOutput(output);

    // Assertions for scenario A
    expect(normalized.analysisStatus).toBe('SUCCESS');
    expect(normalized.gate).toBeDefined(); // not null
    expect(['PASS', 'WARN']).toContain(normalized.gate);
    expect(normalized.capabilities.coverageArtifact).toBe('available');
    // We expect at least one changed function
    expect(normalized.changedFunctions).toHaveLength(1);
    const changedFunc = normalized.changedFunctions[0];
    expect(changedFunc.analyzerStatus).toBe('passed'); // INV-04: analyzerStatus truthful (from evaluation state)
    expect(changedFunc.crap).not.toBeNull(); // crap computed
    expect(changedFunc.coverage).toBe(0); // zero coverage
    // INV-01: ZERO ≠ NULL -> coverage 0 -> analyzerStatus passed (not skipped)
  });

  // Scenario B: high CC + unavailable coverage (no coverage file, default missing) → analyzerStatus 'skipped', crap null, ruleResult NOT_EVALUATED, coverageArtifact 'absent', analysisStatus SUCCESS
  it('scenario B: high CC + unavailable coverage (default missing)', async () => {
    // Same high CC file as in scenario A
    const srcFile = `${tempDir.srcDir}/complex.ts`;
    const content = `
    export function highComplexity(x: number): number {
      if (x > 0) return 1;
      if (x > 1) return 2;
      if (x > 2) return 3;
      if (x > 3) return 4;
      if (x > 5) return 6;
      if (x > 6) return 7;
      if (x > 7) return 8;
      if (x > 8) return 9;
      if (x > 9) return 10;
      if (x > 10) return 11;
      if (x > 11) return 12;
      if (x > 12) return 13;
      if (x > 13) return 14;
      if (x > 14) return 15;
      return 0;
    }
    `;
    writeSourceFile(srcFile, content);

    const intervals = new Map<string, { start: number; end: number }[]>();
    intervals.set('src/complex.ts', [{ start: 1, end: 20 }]);

    // Do NOT write a coverage file -> default missing

    const output = await callBuildEvidenceOutput(
      'HEAD',
      intervals,
      tempDir.tempDir,
      30
    );

    // console.log('Output B:', JSON.stringify(output, null, 2));

    const normalized = normalizeOutput(output);

    // Assertions for scenario B
    expect(normalized.analysisStatus).toBe('SUCCESS');
    expect(normalized.gate).toBe('PASS'); // As deduced
    expect(normalized.completeness).toBe('INCOMPLETE');
    expect(normalized.capabilities.coverageArtifact).toBe('absent');
    // We expect at least one changed function
    expect(normalized.changedFunctions).toHaveLength(1);
    const changedFunc = normalized.changedFunctions[0];
    expect(changedFunc.analyzerStatus).toBe('skipped'); // INV-01: ZERO ≠ NULL -> coverage null (missing) -> analyzerStatus skipped (not passed)
    expect(changedFunc.crap).toBeNull();
    expect(changedFunc.coverage).toBeNull();
    expect(normalized.ruleResults).toHaveLength(1);
    expect(normalized.ruleResults[0].result).toBe('NOT_EVALUATED');
  });

  // Scenario C: complexity provider failure (simulate via empty intervals? Or mock complexity? Check evidence.ts unsupported path: intervals with only non-TS files → analysisStatus 'UNSUPPORTED', gate null, completeness 'NOT_APPLICABLE')
  it('scenario C: complexity provider failure (non-TS files only)', async () => {
    // Create a JavaScript file (non-TS)
    const srcFile = `${tempDir.srcDir}/simple.js`;
    const content = `
    function simple() {
      return 1;
    }
    `;
    writeSourceFile(srcFile, content);

    // Intervals for the JS file
    const intervals = new Map<string, { start: number; end: number }[]>();
    intervals.set('src/simple.js', [{ start: 1, end: 5 }]);

    // We do not write a coverage file (or we can write one, but it shouldn't matter because unsupported)

    const output = await callBuildEvidenceOutput(
      'HEAD',
      intervals,
      tempDir.tempDir,
      30
    );

    // console.log('Output C:', JSON.stringify(output, null, 2));

    const normalized = normalizeOutput(output);

    // Assertions for scenario C
    expect(normalized.analysisStatus).toBe('UNSUPPORTED');
    expect(normalized.gate).toBeNull();
    expect(normalized.completeness).toBe('NOT_APPLICABLE');
    expect(normalized.capabilities.coverageArtifact).toBe('available'); // Note: in the unsupported branch, coverageArtifact is set to 'available' (line 131)
    // We expect no changed functions because the complexity provider returns empty for non-TS
    expect(normalized.changedFunctions).toEqual([]); // or at least not contain any TS functions
    expect(normalized.ruleResults).toEqual([]);
  });
});