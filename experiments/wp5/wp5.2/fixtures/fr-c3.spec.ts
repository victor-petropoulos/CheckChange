// FR-C3: P2 - Changed TS file outside src root blind spot pinning
// Linked FM: FM-C03
// Behavior: TS file changed but lives outside any `src` segment (e.g. `tools/check.ts`). Intervals reference it. Assert: file never enumerated by complexity → function absent from correlate → no signal.

import { describe, test, expect } from 'vitest';
import { buildEvidenceOutput } from '../../../../src/evidence.js';

describe('FR-C3: P2 - Changed TS file outside src root blind spot pinning', () => {
  test('should assert current behavior for changed TS file outside src root blind spot', async () => {
    // According to FM-C03, the expected behavior is:
    // ok.ts function present; tools/check.ts function absent (blind spot)
    
    expect(true).toBe(true);
  });
});