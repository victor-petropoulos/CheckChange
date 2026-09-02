import { describe, expect, test } from 'vitest';
import { buildEvidenceOutput } from './index.js';

describe('buildEvidenceOutput (barrel)', () => {
  test('is a function', () => {
    expect(typeof buildEvidenceOutput).toBe('function');
  });

test('returns schemaVersion 0.4 with gate PASS for no changes', async () => {
     const base = 'HEAD'; // we can use HEAD as base, but note: we are in a git repo? We are in the project repo.
     // However, we want to test with no changes. We can use an empty intervals map.
     const intervals = new Map(); // empty intervals
     const cwd = process.cwd();
     const threshold = 30;

     const result = await buildEvidenceOutput(base, intervals, cwd, threshold);

     expect(result.schemaVersion).toBe('0.4');
    // With no changes and assuming we have coverage and complexity available, we expect gate to be PASS.
    // However, note: if there are no changed functions, the gate should be PASS (if no WARN).
    // We'll check that the gate is either PASS or WARN? But with no changed functions, ruleResults will be empty, so no WARN -> PASS.
    expect(result.gate).toBe('PASS');
    // Also, we expect analysisStatus to be SUCCESS (if complexity and coverage are available) or at least not FAILED.
    // We'll just check the gate and schemaVersion as per the acceptance criteria.
  });
});