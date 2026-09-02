import { describe, test, expect } from 'vitest';
import { buildEvidenceOutput } from '../../src/evidence.js';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
function mkTemp(prefix){ return fs.mkdtempSync(path.join(os.tmpdir(), prefix)); }
describe('Next faults', () => {
  test('missing package.json falls back to app marker -> next', async () => {
    const dir = mkTemp('next-missing-pkg-');
    fs.mkdirSync(path.join(dir,'app'),{recursive:true});
    fs.writeFileSync(path.join(dir,'app','page.tsx'), 'export default function Page(){ return <h1/>}');
    fs.mkdirSync(path.join(dir,'src'),{recursive:true});
    fs.writeFileSync(path.join(dir,'src','a.ts'), 'export function a(){ return 1;}');
    const intervals = new Map([['src/a.ts',[{start:1,end:3}]]]);
    const out = await buildEvidenceOutput('HEAD', intervals, dir, 30);
    expect(out.changedFunctions[0]?.framework).toBe('next');
    fs.rmSync(dir,{recursive:true,force:true});
  });
  test('unreadable app dir does not throw', async () => {
    const dir = mkTemp('next-unread-');
    fs.mkdirSync(path.join(dir,'src'),{recursive:true});
    fs.writeFileSync(path.join(dir,'src','b.ts'), 'export function b(){ return 2;}');
    // mock readdirSync to throw for app
    const orig = fs.readdirSync;
    // @ts-ignore
    fs.readdirSync = ((p,opts)=>{ if(String(p).endsWith('app')) throw new Error('Permission denied'); return orig(p,opts); }) as any;
    try {
      const intervals = new Map([['src/b.ts',[{start:1,end:3}]]]);
      const out = await buildEvidenceOutput('HEAD', intervals, dir, 30);
      // should not throw, framework maybe undefined or react/next depending, but not throw
      expect(out.analysisStatus).toBeDefined();
    } finally {
      fs.readdirSync = orig;
      fs.rmSync(dir,{recursive:true,force:true});
    }
  });
});
