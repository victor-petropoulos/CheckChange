import { describe, expect, test, vi, afterEach } from 'vitest';
import { correlate, buildOutput, buildEvidenceOutput } from '../src/evidence.js';
import { MethodEvidence } from '../src/crap.js';
import * as complexity from '../src/complexity.js';
import * as coverage from '../src/coverage.js';
import * as attribution from '../src/attribution.js';

describe('correlate', () => {
  test('should match modified add (1-17 vs 2-15)', () => {
    const methodEvidence: MethodEvidence[] = [{
      file: 'src/math.ts',
      method: 'add',
      lineStart: 1,
      lineEnd: 17,
      cc: 5,
      crap: 0,
      coverage: null,
      coverageKind: 'N/A',
      analyzerStatus: 'passed'
    }];

    const intervals = new Map<string, Array<{ start: number; end: number }>>();
    intervals.set('src/math.ts', [{ start: 2, end: 15 }]);

    const result = correlate(methodEvidence, intervals);
    expect(result.length).toBe(1);
    expect(result[0]).toEqual({
      file: 'src/math.ts',
      method: 'add',
      lineStart: 1,
      lineEnd: 17,
      cc: 5,
      crap: 0,
      coverage: null,
      coverageKind: 'N/A',
      analyzerStatus: 'passed',
      source: {
        tool: '@barney-media/crap-typescript',
        version: '0.5.0'
      }
    });
  });

  test('should match new multiply (19-31 vs 17-30)', () => {
    const methodEvidence: MethodEvidence[] = [{
      file: 'src/math.ts',
      method: 'multiply',
      lineStart: 19,
      lineEnd: 31,
      cc: 3,
      crap: 2.5,
      coverage: 80,
      coverageKind: 'stmt',
      analyzerStatus: 'passed'
    }];

    const intervals = new Map<string, Array<{ start: number; end: number }>>();
    intervals.set('src/math.ts', [{ start: 17, end: 30 }]);

    const result = correlate(methodEvidence, intervals);
    expect(result.length).toBe(1);
    expect(result[0]).toEqual({
      file: 'src/math.ts',
      method: 'multiply',
      lineStart: 19,
      lineEnd: 31,
      cc: 3,
      crap: 2.5,
      coverage: 80,
      coverageKind: 'stmt',
      analyzerStatus: 'passed',
      source: {
        tool: '@barney-media/crap-typescript',
        version: '0.5.0'
      }
    });
  });

  test('should match rename single-line hunk @19 vs 19-31 (matched via lines not name)', () => {
    const methodEvidence: MethodEvidence[] = [{
      file: 'src/math.ts',
      method: 'oldName', // method name doesn't matter for correlation
      lineStart: 19,
      lineEnd: 19,
      cc: 1,
      crap: 0,
      coverage: null,
      coverageKind: 'N/A',
      analyzerStatus: 'passed'
    }];

    const intervals = new Map<string, Array<{ start: number; end: number }>>();
    intervals.set('src/math.ts', [{ start: 19, end: 31 }]);

    const result = correlate(methodEvidence, intervals);
    expect(result.length).toBe(1);
    expect(result[0]).toEqual({
      file: 'src/math.ts',
      method: 'oldName',
      lineStart: 19,
      lineEnd: 19,
      cc: 1,
      crap: 0,
      coverage: null,
      coverageKind: 'N/A',
      analyzerStatus: 'passed',
      source: {
        tool: '@barney-media/crap-typescript',
        version: '0.5.0'
      }
    });
  });

  test('should not match non-overlapping intervals', () => {
    const methodEvidence: MethodEvidence[] = [{
      file: 'src/math.ts',
      method: 'test',
      lineStart: 1,
      lineEnd: 10,
      cc: 1,
      crap: 0,
      coverage: null,
      coverageKind: 'N/A',
      analyzerStatus: 'passed'
    }];

    const intervals = new Map<string, Array<{ start: number; end: number }>>();
    intervals.set('src/math.ts', [{ start: 20, end: 30 }]); // No overlap

    const result = correlate(methodEvidence, intervals);
    expect(result.length).toBe(0);
  });

  test('should not match different file', () => {
    const methodEvidence: MethodEvidence[] = [{
      file: 'src/other.ts',
      method: 'test',
      lineStart: 1,
      lineEnd: 10,
      cc: 1,
      crap: 0,
      coverage: null,
      coverageKind: 'N/A',
      analyzerStatus: 'passed'
    }];

    const intervals = new Map<string, Array<{ start: number; end: number }>>();
    intervals.set('src/math.ts', [{ start: 1, end: 10 }]); // Different file

    const result = correlate(methodEvidence, intervals);
    expect(result.length).toBe(0);
  });

  test('should preserve uncovered skip case', () => {
    const methodEvidence: MethodEvidence[] = [{
      file: 'src/orphan.ts',
      method: 'orphan',
      lineStart: 1,
      lineEnd: 4,
      cc: 2,
      crap: 0,
      coverage: null,
      coverageKind: 'N/A',
      analyzerStatus: 'skipped'
    }];

    const intervals = new Map<string, Array<{ start: number; end: number }>>();
    // No intervals for this file - should be uncovered/skipped

    const result = correlate(methodEvidence, intervals);
    expect(result.length).toBe(0); // Not changed, so not included in result
  });
});

describe('buildOutput', () => {
  test('should build correct JSON shape', () => {
    const changedFunctions: any[] = [{
      file: 'src/math.ts',
      method: 'add',
      lineStart: 1,
      lineEnd: 10,
      cc: 1,
      crap: 0,
      coverage: null,
      coverageKind: 'N/A',
      analyzerStatus: 'passed',
      source: {
        tool: '@barney-media/crap-typescript',
        version: '0.5.0'
      }
    }];

    const result = buildOutput('HEAD~1', changedFunctions, 30, { git: 'available', crapTypescript: 'available' });
    
    expect(result).toEqual({
      schemaVersion: '0.1',
      analysis: {
        base: 'HEAD~1',
        target: 'current'
      },
      capabilities: {
        git: 'available',
        crapTypescript: 'available'
      },
      changedFunctions: changedFunctions,
      policy: {
        crapThreshold: 30
      },
      ruleResults: [{
        ruleId: 'changed-function-high-crap',
        result: 'PASS',
        file: 'src/math.ts',
        method: 'add',
        crap: 0,
        threshold: 30,
        cc: 1,
        coverage: null
      }],
      gate: 'PASS',
      completeness: 'COMPLETE'
    });
  });

  test('should handle capabilities overrides', () => {
    const changedFunctions: any[] = [];
    
    const result = buildOutput('HEAD~1', changedFunctions, 30, {
      git: 'failed',
      crapTypescript: 'unavailable'
    });
    
    expect(result.capabilities.git).toBe('failed');
    expect(result.capabilities.crapTypescript).toBe('unavailable');
  });
});

// FN/FNDA Task 3: carriage of CoverageResult.functionCoverage into
// EvidenceOutput.diagnostics.functionCoverage. Upstream stages mocked via the
// wp11.contract.spec.ts spyOn idiom (real buildEvidenceOutput + correlate +
// withDiagnostics run). cwd '/tmp' + info.file 'src/math.ts' ⇒ absolute key
// '/tmp/src/math.ts' (resolve normalization, attribution.ts:105-121).
describe('diagnostics.functionCoverage carriage (FN/FNDA task 3)', () => {
  afterEach(() => vi.restoreAllMocks());

  const intervals = () => new Map([['src/math.ts', [{ start: 1, end: 10 }]]]);
  const info = () => ({ file: 'src/math.ts', method: 'add', lineStart: 1, lineEnd: 10, cc: 2 });

  test('lcov: diagnostics.functionCoverage present with hits for a known attributed method', async () => {
    vi.spyOn(complexity, 'collectComplexity').mockResolvedValue([info()]);
    vi.spyOn(coverage, 'readCoverage').mockResolvedValue({
      available: true, coverageMap: new Map(), error: false,
      functionCoverage: new Map([['/tmp/src/math.ts', [{ name: 'add', line: 1, hits: 7 }]]]),
    } as any);
    vi.spyOn(attribution, 'attachCoverage').mockResolvedValue([
      { info: info(), coveragePercent: 100, coverageKind: 'stmt' },
    ]);

    const out = await buildEvidenceOutput('HEAD', intervals(), '/tmp', 30);

    expect(out.diagnostics!.functionCoverage).toEqual([
      { file: 'src/math.ts', method: 'add', line: 1, hits: 7 },
    ]);
    // Serialization: key survives JSON round-trip (no undefined emission).
    const json = JSON.parse(JSON.stringify(out)) as any;
    expect(json.diagnostics.functionCoverage).toEqual([
      { file: 'src/math.ts', method: 'add', line: 1, hits: 7 },
    ]);
    // changedFunctions shape untouched: no functionCoverage key leaked onto
    // entries (exact toEqual pins above still hold).
    expect(out.changedFunctions[0]).toEqual({
      file: 'src/math.ts', method: 'add', lineStart: 1, lineEnd: 10, cc: 2,
      crap: 2, coverage: 100, coverageKind: 'stmt', analyzerStatus: 'passed',
      source: { tool: '@barney-media/crap-typescript-core', version: '0.5.0' },
      language: 'typescript',
    });
    expect(out.changedFunctions[0]).not.toHaveProperty('functionCoverage');
  });

  test('istanbul/cobertura (no functionCoverage): field absent entirely', async () => {
    vi.spyOn(complexity, 'collectComplexity').mockResolvedValue([info()]);
    vi.spyOn(coverage, 'readCoverage').mockResolvedValue({
      available: true, coverageMap: new Map(), error: false,
    } as any);
    vi.spyOn(attribution, 'attachCoverage').mockResolvedValue([
      { info: info(), coveragePercent: 100, coverageKind: 'stmt' },
    ]);

    const out = await buildEvidenceOutput('HEAD', intervals(), '/tmp', 30);

    expect(out.diagnostics).toBeDefined();
    expect(out.diagnostics!.functionCoverage).toBeUndefined();
    expect(out.diagnostics).not.toHaveProperty('functionCoverage');
    const json = JSON.parse(JSON.stringify(out)) as any;
    expect(json.diagnostics).not.toHaveProperty('functionCoverage');
  });
});