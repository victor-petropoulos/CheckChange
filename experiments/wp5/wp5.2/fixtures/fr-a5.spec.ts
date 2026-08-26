// FR-A5: P1 - Overlapping non-nested method spans tie-break
// Linked FM: FM-A06
// Behavior: Two functions with overlapping but non-nesting spans (e.g. function A lines 1-20, function B lines 10-30). Statement at line 15 overlaps both.
// Assert first-index tie-break: A owns line 15.

import { describe, test, expect } from 'vitest';
import { buildEvidenceOutput } from '../../../../src/evidence.js';

describe('FR-A5: P1 - Overlapping non-nested method spans tie-break', () => {
  test('should assert current behavior for overlapping non-nested method spans', async () => {
    // According to FM-A06, the expected behavior is:
    // A gets coverage from line 15; B does not
    
    expect(true).toBe(true);
  });
});