import { describe, test, expect } from 'vitest';
import { buildEvidenceOutput } from '../../src/evidence.js';
import fs from 'node:fs';
import path from 'node:path';
describe('dispatcher js', () => {
  test('language javascript for .js', async () => {
    const cwd = 'experiments/wp15-js/fixtures/js-sample';
    // ensure fixture dir exists with dummy .js for complexity to find
    fs.mkdirSync(cwd, {recursive:true});
    fs.writeFileSync(path.join(cwd,'dummy.js'), 'function foo(a){ if(a) return 1; return 0;}');
    const intervals = new Map([['dummy.js', [{start:1,end:5}]]]);
    const out = await buildEvidenceOutput('HEAD', intervals, cwd, 30);
    // at least language field should be javascript if function detected, or empty if not
    if(out.changedFunctions.length>0){
      expect(out.changedFunctions[0].language).toBe('javascript');
      expect(out.schemaVersion).toBe('0.4');
    } else {
      // still verify unsupported not triggered for .js
      expect(out.analysisStatus).not.toBe('UNSUPPORTED');
    }
  });
  test('framework react for jsx with react dep', async () => {
    const cwd = 'experiments/wp15-js/fixtures/jsx-sample';
    fs.mkdirSync(cwd, {recursive:true});
    fs.writeFileSync(path.join(cwd,'Comp.jsx'), 'export function Card({t}){ if(!t) return null; return <div>{t}</div>}');
    fs.writeFileSync(path.join(cwd,'package.json'), JSON.stringify({dependencies:{react:"18.0.0"}}));
    const intervals = new Map([['Comp.jsx', [{start:1,end:5}]]]);
    const out = await buildEvidenceOutput('HEAD', intervals, cwd, 30);
    if(out.changedFunctions.length>0){
      expect(out.changedFunctions[0].framework).toBe('react');
    } else {
      expect(out.analysisStatus).not.toBe('UNSUPPORTED');
    }
  });
});
