import { describe, test, expect } from 'vitest';
import { evaluateHighCrap } from '../src/rules.js';
import { ChangedFunction } from '../src/evidence.js';
import { buildOutput } from '../src/evidence.js';

describe('evaluateHighCrap', () => {
  const baseChangedFunction: ChangedFunction = {
    file: 'test.ts',
    method: 'testMethod',
    lineStart: 1,
    lineEnd: 10,
    cc: 5,
    crap: 0, // will be overridden
    coverage: 80,
    coverageKind: 'lines',
    analyzerStatus: 'passed',
    source: {
      tool: '@barney-media/crap-typescript',
      version: '0.5.0'
    }
  };

  test('should return PASS for crap below threshold', () => {
    const cf: ChangedFunction = { ...baseChangedFunction, crap: 29 };
    const results = evaluateHighCrap([cf], 30);
    expect(results).toHaveLength(1);
    const result = results[0]!;
    expect(result).toEqual({
      ruleId: 'changed-function-high-crap',
      result: 'PASS',
      file: 'test.ts',
      method: 'testMethod',
      crap: 29,
      threshold: 30,
      cc: 5,
      coverage: 80
    });
  });

  test('should return PASS for crap exactly at threshold', () => {
    const cf: ChangedFunction = { ...baseChangedFunction, crap: 30 };
    const results = evaluateHighCrap([cf], 30);
    expect(results).toHaveLength(1);
    const result = results[0]!;
    expect(result.result).toBe('PASS');
    expect(result.crap).toBe(30);
  });

  test('should return WARN for crap above threshold', () => {
    const cf: ChangedFunction = { ...baseChangedFunction, crap: 31 };
    const results = evaluateHighCrap([cf], 30);
    expect(results).toHaveLength(1);
    const result = results[0]!;
    expect(result.result).toBe('WARN');
    expect(result.crap).toBe(31);
  });

  test('should return NOT_EVALUATED for crap null', () => {
    const cf: ChangedFunction = { ...baseChangedFunction, crap: null };
    const results = evaluateHighCrap([cf], 30);
    expect(results).toHaveLength(1);
    const result = results[0]!;
    expect(result.result).toBe('NOT_EVALUATED');
    expect(result.crap).toBeNull();
  });

  test('should return PASS for crap zero', () => {
    const cf: ChangedFunction = { ...baseChangedFunction, crap: 0 };
    const results = evaluateHighCrap([cf], 30);
    expect(results).toHaveLength(1);
    const result = results[0]!;
    expect(result.result).toBe('PASS');
    expect(result.crap).toBe(0);
  });

  test('should change result with custom threshold', () => {
    const cf: ChangedFunction = { ...baseChangedFunction, crap: 25 };
    const resultsLow = evaluateHighCrap([cf], 20); // threshold 20 -> WARN
    const resultsHigh = evaluateHighCrap([cf], 30); // threshold 30 -> PASS
    expect(resultsLow).toHaveLength(1);
    expect(resultsHigh).toHaveLength(1);
    const lowResult = resultsLow[0]!;
    const highResult = resultsHigh[0]!;
    expect(lowResult.result).toBe('WARN');
    expect(highResult.result).toBe('PASS');
  });

  test('should compute gate WARN when any rule result is WARN', () => {
    const cf1: ChangedFunction = { ...baseChangedFunction, crap: 20, method: 'method1' };
    const cf2: ChangedFunction = { ...baseChangedFunction, crap: 35, method: 'method2' };
    const changed: ChangedFunction[] = [cf1, cf2];
    const output = buildOutput('base', changed, 30, { git: 'available', crapTypescript: 'available' });
    expect(output.gate).toBe('WARN');
    expect(output.ruleResults).toHaveLength(2);
    expect(output.ruleResults.find(r => r.method === 'method1')?.result).toBe('PASS');
    expect(output.ruleResults.find(r => r.method === 'method2')?.result).toBe('WARN');
  });

  test('should compute completeness INCOMPLETE when any rule result is NOT_EVALUATED', () => {
    const cf1: ChangedFunction = { ...baseChangedFunction, crap: 20, method: 'method1' };
    const cf2: ChangedFunction = { ...baseChangedFunction, crap: null, method: 'method2' };
    const changed: ChangedFunction[] = [cf1, cf2];
    const output = buildOutput('base', changed, 30, { git: 'available', crapTypescript: 'available' });
    expect(output.completeness).toBe('INCOMPLETE');
    expect(output.ruleResults).toHaveLength(2);
    expect(output.ruleResults.find(r => r.method === 'method1')?.result).toBe('PASS');
    expect(output.ruleResults.find(r => r.method === 'method2')?.result).toBe('NOT_EVALUATED');
  });

  test('should return gate PASS and completeness COMPLETE when no changed functions', () => {
    const changed: ChangedFunction[] = [];
    const output = buildOutput('base', changed, 30, { git: 'available', crapTypescript: 'available' });
    expect(output.gate).toBe('PASS');
    expect(output.completeness).toBe('COMPLETE');
    expect(output.ruleResults).toHaveLength(0);
  });

  // Additional test for invalid threshold is covered in CLI tests, but we can test that evaluateHighCrap works with any number
  test('should work with threshold zero', () => {
    const cf: ChangedFunction = { ...baseChangedFunction, crap: 0 };
    const results = evaluateHighCrap([cf], 0);
    expect(results).toHaveLength(1);
    const result = results[0]!;
    expect(result.result).toBe('PASS'); // 0 <= 0
    const cf2: ChangedFunction = { ...baseChangedFunction, crap: 1 };
    const results2 = evaluateHighCrap([cf2], 0);
    expect(results2).toHaveLength(1);
    const result2 = results2[0]!;
    expect(result2.result).toBe('WARN'); // 1 > 0
  });
});