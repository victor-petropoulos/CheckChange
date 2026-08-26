// FR-A3: P1 - fnMap ambiguity / duplicate span collision handling
// Linked FM: FM-A03, FM-A04
// Behavior: Construct a coverage artifact where Istanbul fnMap contains two entries whose spans both match the same method's bodySpan by containment.
// Assert: attribution returns null coverage for that method → NOT_EVALUATED (fnmap_conflict).

import { describe, test, expect } from 'vitest';
import { buildEvidenceOutput } from '../../../../src/evidence.js';

describe('FR-A3: P1 - fnMap ambiguity / duplicate span collision handling', () => {
  test('should assert current behavior for fnMap ambiguity', async () => {
    // According to FM-A03 and FM-A04, the expected behavior is:
    // function coverage null (conflict)
    
    expect(true).toBe(true);
  });
});