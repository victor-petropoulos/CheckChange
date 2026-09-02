import { describe, test, expect } from 'vitest';
import { parseFileMethods } from '@barney-media/crap-typescript-core';

describe('jsPatch.test.ts', () => {
  test('parses .js file', async () => {
    const methods = await parseFileMethods('/tmp/js-sample/low.js');
    expect(methods.length).toBeGreaterThan(0);
  });
});