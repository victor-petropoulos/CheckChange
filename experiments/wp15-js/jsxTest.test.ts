import { describe, test, expect } from 'vitest';
import { parseFileMethods } from '@barney-media/crap-typescript-core';

describe('jsxTest.test.ts', () => {
  test('parses .jsx file', async () => {
    const methods = await parseFileMethods('/tmp/js-sample/Hello.jsx');
    expect(methods.length).toBeGreaterThan(0);
  });
});
