import { describe, test, expect } from 'vitest';
import { parseFileMethods } from '@barney-media/crap-typescript-core';
import fs from 'node:fs';
describe('jsPatch.test.ts', () => {
  test('parses .js file', async () => {
    fs.mkdirSync('/tmp/js-sample',{recursive:true});
    fs.writeFileSync('/tmp/js-sample/low.js','function low(a){return a+1}');
    const methods = await parseFileMethods('/tmp/js-sample/low.js');
    expect(methods.length).toBeGreaterThan(0);
  });
});
