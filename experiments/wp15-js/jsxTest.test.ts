import { describe, test, expect } from 'vitest';
import { parseFileMethods } from '@barney-media/crap-typescript-core';
import fs from 'node:fs';
describe('jsxTest.test.ts', () => {
  test('parses .jsx file', async () => {
    fs.mkdirSync('/tmp/js-sample',{recursive:true});
    fs.writeFileSync('/tmp/js-sample/Hello.jsx',"export function Hello({name}){ return <div>{name}</div>}");
    const methods = await parseFileMethods('/tmp/js-sample/Hello.jsx');
    expect(methods.length).toBeGreaterThan(0);
  });
});
