import { describe, test, expect } from 'vitest';
import { buildEvidenceOutput } from '../../src/evidence.js';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

function mkTempDir(prefix){ return fs.mkdtempSync(path.join(os.tmpdir(), prefix)); }

describe('Next dispatcher', () => {
  test('next dep only emits next', async () => {
    const dir = mkTempDir('next-dep-');
    fs.writeFileSync(path.join(dir,'package.json'), JSON.stringify({dependencies:{next:'14.0.0'}}));
    fs.mkdirSync(path.join(dir,'src'),{recursive:true});
    fs.writeFileSync(path.join(dir,'src','a.ts'), 'export function foo(){ return 1;}');
    const intervals = new Map([['src/a.ts',[{start:1,end:3}]]]);
    const out = await buildEvidenceOutput('HEAD', intervals, dir, 30);
    expect(['next'].includes(out.changedFunctions[0]?.framework)).toBe(true);
    expect(out.schemaVersion).toBe('0.4');
    fs.rmSync(dir,{recursive:true,force:true});
  });
  test('next.config.js only emits next', async () => {
    const dir = mkTempDir('next-config-');
    fs.writeFileSync(path.join(dir,'next.config.js'), 'module.exports={}');
    fs.mkdirSync(path.join(dir,'src'),{recursive:true});
    fs.writeFileSync(path.join(dir,'src','b.ts'), 'export function bar(){ return 2;}');
    const intervals = new Map([['src/b.ts',[{start:1,end:3}]]]);
    const out = await buildEvidenceOutput('HEAD', intervals, dir, 30);
    expect(out.changedFunctions[0]?.framework).toBe('next');
    fs.rmSync(dir,{recursive:true,force:true});
  });
  test('next + react priority next wins', async () => {
    const dir = mkTempDir('next-react-');
    fs.writeFileSync(path.join(dir,'package.json'), JSON.stringify({dependencies:{next:'14.0.0', react:'18.0.0'}}));
    fs.mkdirSync(path.join(dir,'src'),{recursive:true});
    fs.writeFileSync(path.join(dir,'src','c.tsx'), 'export function C(){ return <div/> }');
    const intervals = new Map([['src/c.tsx',[{start:1,end:3}]]]);
    const out = await buildEvidenceOutput('HEAD', intervals, dir, 30);
    expect(out.changedFunctions[0]?.framework).toBe('next');
    fs.rmSync(dir,{recursive:true,force:true});
  });
  test('react only emits react', async () => {
    const dir = mkTempDir('react-only-');
    fs.writeFileSync(path.join(dir,'package.json'), JSON.stringify({dependencies:{react:'18.0.0'}}));
    fs.mkdirSync(path.join(dir,'src'),{recursive:true});
    fs.writeFileSync(path.join(dir,'src','d.jsx'), 'export function D(){ return <div/>}');
    const intervals = new Map([['src/d.jsx',[{start:1,end:3}]]]);
    const out = await buildEvidenceOutput('HEAD', intervals, dir, 30);
    expect(out.changedFunctions[0]?.framework).toBe('react');
    fs.rmSync(dir,{recursive:true,force:true});
  });
  test('app/page.tsx marker emits next', async () => {
    const dir = mkTempDir('app-marker-');
    // no package.json next, but app/page exists
    fs.mkdirSync(path.join(dir,'app'),{recursive:true});
    fs.writeFileSync(path.join(dir,'app','page.tsx'), 'export default function Page(){ return <h1/>}');
    fs.mkdirSync(path.join(dir,'src'),{recursive:true});
    fs.writeFileSync(path.join(dir,'src','e.ts'), 'export function e(){ return 1;}');
    const intervals = new Map([['src/e.ts',[{start:1,end:3}]]]);
    const out = await buildEvidenceOutput('HEAD', intervals, dir, 30);
    expect(out.changedFunctions[0]?.framework).toBe('next');
    fs.rmSync(dir,{recursive:true,force:true});
  });
});
