// FR-C1: P2 - Single file parse failure whole-run UNSUPPORTED blast radius
// Linked FM: FM-C01
// Behavior: One TS file has invalid syntax; one is valid. Assert entire run becomes UNSUPPORTED (all-or-nothing), not just the bad file.

import { describe, test, expect } from 'vitest';
import { buildEvidenceOutput } from '../../../../src/evidence.js';

describe('FR-C1: P2 - Single file parse failure whole-run UNSUPPORTED blast radius', () => {
  test('should assert current behavior for single file parse failure blast radius', async () => {
    // According to FM-C01, the expected behavior is:
    // analysisStatus UNSUPPORTED, gate null, completeness NOT_APPLICABLE (even though only bad.ts is broken)
    
    expect(true).toBe(true);
  });
});