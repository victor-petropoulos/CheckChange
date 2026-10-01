import { describe, expect, test } from 'vitest';
import { parseCrapJson } from './crap.js';

describe('parseCrapJson', () => {
  test('should parse crap-full.json correctly', () => {
    const json = 
      '{\n' +
      '  "status": "failed",\n' +
      '  "threshold": 6,\n' +
      '  "methods": [\n' +
      '    {\n' +
      '      "status": "failed",\n' +
      '      "crap": 7.06721536351166,\n' +
      '      "cc": 7,\n' +
      '      "cov": 88.88888888888889,\n' +
      '      "covKind": "stmt",\n' +
      '      "method": "add",\n' +
      '      "src": "src/math.ts",\n' +
      '      "lineStart": 1,\n' +
      '      "lineEnd": 17\n' +
      '    },\n' +
      '    {\n' +
      '      "status": "passed",\n' +
      '      "crap": 5,\n' +
      '      "cc": 5,\n' +
      '      "cov": 100,\n' +
      '      "covKind": "stmt",\n' +
      '      "method": "multiply",\n' +
      '      "src": "src/math.ts",\n' +
      '      "lineStart": 19,\n' +
      '      "lineEnd": 31\n' +
      '    }\n' +
      '  ]\n' +
      '}';
    const evidence = parseCrapJson(json);
    expect(evidence.length).toBe(2);
    // First method: add
    expect(evidence[0]).toEqual({
      file: 'src/math.ts',
      method: 'add',
      lineStart: 1,
      lineEnd: 17,
      cc: 7,
      crap: 7.06721536351166,
      coverage: 88.88888888888889,
      coverageKind: 'stmt',
      analyzerStatus: 'failed'
    });
    // Second method: multiply
    expect(evidence[1]).toEqual({
      file: 'src/math.ts',
      method: 'multiply',
      lineStart: 19,
      lineEnd: 31,
      cc: 5,
      crap: 5,
      coverage: 100,
      coverageKind: 'stmt',
      analyzerStatus: 'passed'
    });
  });

test('should parse crap-nocov.json correctly', () => {
      const json = 
        '{\n' +
        '  "status": "passed",\n' +
        '  "threshold": 6,\n' +
        '  "methods": [\n' +
        '    {\n' +
        '      "status": "skipped",\n' +
        '      "crap": null,\n' +
        '      "cc": 2,\n' +
        '      "cov": null,\n' +
        '      "covKind": "N/A",\n' +
        '      "method": "orphan",\n' +
        '      "src": "src/orphan.ts",\n' +
        '      "lineStart": 1,\n' +
        '      "lineEnd": 4\n' +
        '    }\n' +
        '  ]\n' +
        '}';
      const evidence = parseCrapJson(json);
      expect(evidence.length).toBe(1);
expect(evidence[0]).toEqual({
         file: 'src/orphan.ts',
         method: 'orphan',
         lineStart: 1,
         lineEnd: 4,
         cc: 2,
         crap: null,
         coverage: null,
         coverageKind: 'N/A',
         analyzerStatus: 'skipped'
       });
    });

  test('should return empty array for invalid JSON', () => {
    const json = 'invalid json';
    const evidence = parseCrapJson(json);
    expect(evidence.length).toBe(0);
  });

  test('should return empty array for JSON without methods array', () => {
    const json = '{"status": "passed"}';
    const evidence = parseCrapJson(json);
    expect(evidence.length).toBe(0);
  });

test('should handle missing fields in method object (should use defaults where possible)', () => {
      const json = 
        '{\n' +
        '  "status": "passed",\n' +
        '  "threshold": 6,\n' +
        '  "methods": [\n' +
        '    {\n' +
        '      "status": "passed",\n' +
        '      "method": "test",\n' +
        '      "src": "test.ts",\n' +
        '      "lineStart": 1,\n' +
        '      "lineEnd": 10\n' +
        '    }\n' +
        '  ]\n' +
        '}';
      const evidence = parseCrapJson(json);
      expect(evidence.length).toBe(1);
expect(evidence[0]).toEqual({
         file: 'test.ts',
         method: 'test',
         lineStart: 1,
         lineEnd: 10,
         cc: undefined,
         crap: null,
         coverage: null,
         coverageKind: undefined,
         analyzerStatus: 'passed'
       });
    });
});