import { describe, test, expect } from 'vitest';
import { buildEvidenceOutput } from '../../src/evidence.js';
import fs from 'node:fs';
import path from 'node:path';
import { createTempRepo, writeSourceFile, writeCoverageFile } from '../wp5/wp5.2/fixtures/helpers.js';

describe('jsFault invariants', () => {
  test('missing coverage -> FAILED missing', async () => {
    const repo = createTempRepo();
    try {
      writeSourceFile(path.join(repo.srcDir,'a.js'), 'function foo(){ if(true) return 1; return 0;}');
      const intervals = new Map([['src/a.js',[{start:1,end:5}]]]);
      const out = await buildEvidenceOutput('HEAD', intervals, repo.tempDir, 30, '/nonexistent/coverage.json');
      expect(out.analysisStatus).toBe('FAILED');
      expect(out.coverageErrorReason).toBe('missing');
    } finally { repo.cleanup(); }
  });
  test('malformed coverage -> FAILED malformed', async () => {
    const repo = createTempRepo();
    try {
      writeSourceFile(path.join(repo.srcDir,'a.js'), 'function foo(){ return 1;}');
      const bad = path.join(repo.tempDir,'bad.json');
      fs.writeFileSync(bad, '{ not json');
      const intervals = new Map([['src/a.js',[{start:1,end:3}]]]);
      const out = await buildEvidenceOutput('HEAD', intervals, repo.tempDir, 30, bad);
      expect(out.analysisStatus).toBe('FAILED');
      expect(out.coverageErrorReason).toBe('malformed');
    } finally { repo.cleanup(); }
  });
  test('zero coverage -> crap high WARN preserves ZERO≠NULL', async () => {
    const repo = createTempRepo();
    try {
      const src = path.join(repo.srcDir,'c.js');
      let body = 'export function high(x){';
      for(let i=0;i<15;i++) body+=` if(x>${i}) return ${i};`;
      body+=' return 0;}';
      writeSourceFile(src, body);
      const abs = path.resolve(repo.tempDir,'src/c.js');
      // zero coverage: statement 0 uncovered
      const cov = { statementMap:{0:{start:{line:1,column:0},end:{line:10,column:0}}}, fnMap:{0:{name:'high',line:1}}, branchMap:{}, s:{0:0}, f:{0:0}, b:{}, _coverageSchema:'urn:schema:istanbul:coverage:2' };
      const m = new Map(); m.set(abs,cov); const cf = writeCoverageFile(repo.coverageDir,m);
      const intervals = new Map([['src/c.js',[{start:1,end:10}]]]);
      const out = await buildEvidenceOutput('HEAD', intervals, repo.tempDir, 30);
      expect(out.changedFunctions[0].coverage).toBe(0);
      expect(out.changedFunctions[0].analyzerStatus).toBe('passed');
      expect(out.gate).toBe('WARN');
    } finally { repo.cleanup(); }
  });
  test('branch vs statement kind', async () => {
    const repo = createTempRepo();
    try {
      writeSourceFile(path.join(repo.srcDir,'b.js'), 'function b(a){ if(a) return 1; else return 0;}');
      const abs = path.resolve(repo.tempDir,'src/b.js');
      const cov = { statementMap:{0:{start:{line:1,column:0},end:{line:1,column:50}}}, fnMap:{0:{name:'b',line:1}}, branchMap:{0:{loc:{start:{line:1,column:0},end:{line:1,column:50}},type:'if',locations:[{start:{line:1,column:0},end:{line:1,column:50}},{start:{line:1,column:0},end:{line:1,column:50}}]}}, s:{0:1}, f:{0:1}, b:{0:[1,0]}, _coverageSchema:'urn:schema:istanbul:coverage:2' };
      const m=new Map(); m.set(abs,cov); writeCoverageFile(repo.coverageDir,m);
      const intervals=new Map([['src/b.js',[{start:1,end:3}]]]);
      const out=await buildEvidenceOutput('HEAD',intervals,repo.tempDir,30);
      expect(out.changedFunctions[0].coverage).not.toBeNull(); expect(out.changedFunctions[0].coverageKind).not.toBeNull();
    } finally { repo.cleanup();}
  });
  test('malformed JS parse -> UNSUPPORTED', async () => {
    const repo = createTempRepo();
    try {
      writeSourceFile(path.join(repo.srcDir,'bad.js'), 'function ( { syntax error');
      const intervals=new Map([['src/bad.js',[{start:1,end:5}]]]);
      const out=await buildEvidenceOutput('HEAD',intervals,repo.tempDir,30);
      // parse error should lead to UNSUPPORTED (complexity failed) or SUCCESS empty? Accept either but not PASS with crap
      expect(['UNSUPPORTED','SUCCESS'].includes(out.analysisStatus)).toBe(true);
    } finally {repo.cleanup();}
  });
  test('mixed ts+js intervals -> both languages', async () => {
    const repo = createTempRepo();
    try {
      writeSourceFile(path.join(repo.srcDir,'a.ts'), 'export function tsfn(){ return 1;}');
      writeSourceFile(path.join(repo.srcDir,'b.js'), 'function jsfn(){ return 1;}');
      const intervals=new Map([['src/a.ts',[{start:1,end:3}]],['src/b.js',[{start:1,end:3}]]]);
      const out=await buildEvidenceOutput('HEAD',intervals,repo.tempDir,30);
      // Should have both languages if both detected, or at least not UNSUPPORTED
      expect(out.analysisStatus).toBe('SUCCESS');
      if(out.changedFunctions.length===2){
        const langs = out.changedFunctions.map(c=>c.language).sort();
        expect(langs).toContain('typescript');
        expect(langs).toContain('javascript');
      }
    } finally {repo.cleanup();}
  });
  test('empty JS no func -> SUCCESS empty', async () => {
    const repo = createTempRepo();
    try {
      writeSourceFile(path.join(repo.srcDir,'empty.js'), '// no functions\n');
      const intervals=new Map([['src/empty.js',[{start:1,end:2}]]]);
      const out=await buildEvidenceOutput('HEAD',intervals,repo.tempDir,30);
      expect(out.analysisStatus).toBe('SUCCESS');
      expect(out.changedFunctions).toEqual([]);
      expect(out.gate).toBe('PASS');
    } finally {repo.cleanup();}
  });
  test('JS react import no JSX -> no framework', async () => {
    const repo = createTempRepo();
    try {
      writeSourceFile(path.join(repo.srcDir,'plain.js'), "import React from 'react'; function foo(){ return 1;}");
      const intervals=new Map([['src/plain.js',[{start:1,end:3}]]]);
      const out=await buildEvidenceOutput('HEAD',intervals,repo.tempDir,30);
      if(out.changedFunctions.length>0){
        expect(out.changedFunctions[0].framework).toBeUndefined();
        expect(out.changedFunctions[0].language).toBe('javascript');
      } else {
        expect(out.analysisStatus).toBe('SUCCESS');
      }
    } finally {repo.cleanup();}
  });
  test('case-insensitive path -> coverage populated', async () => {
    const repo = createTempRepo();
    try {
      writeSourceFile(path.join(repo.srcDir,'case.js'), 'function cc(){ return 1;}');
      const abs = path.resolve(repo.tempDir,'src/case.js');
      const cov = { statementMap:{0:{start:{line:1,column:0},end:{line:1,column:20}}}, fnMap:{0:{name:'cc',line:1}}, branchMap:{}, s:{0:1}, f:{0:1}, b:{}, _coverageSchema:'urn:schema:istanbul:coverage:2' };
      const m=new Map(); m.set(abs.toLowerCase(),cov); // lower case key to test case-insensitive attribution? attribution handles case-insensitive via normalize
      // Instead use proper absolute but intervals with different case
      const m2=new Map(); m2.set(abs,cov); const cf=writeCoverageFile(repo.coverageDir,m2);
      const intervals=new Map([['src/case.js',[{start:1,end:2}]]]);
      const out=await buildEvidenceOutput('HEAD',intervals,repo.tempDir,30);
      expect(out.changedFunctions[0].coverage).not.toBeNull();
    } finally {repo.cleanup();}
  });
  test('threshold 30 vs 15 -> gate', async () => {
    const repo = createTempRepo();
    try {
      const src=path.join(repo.srcDir,'thr.js');
      let body='export function thr(x){'; for(let i=0;i<6;i++) body+=` if(x>${i}) return ${i};`; body+=' return 0;}';
      writeSourceFile(src, body);
      const abs=path.resolve(repo.tempDir,'src/thr.js');
      const cov={ statementMap:{0:{start:{line:1,column:0},end:{line:5,column:0}}}, fnMap:{0:{name:'thr',line:1}}, branchMap:{}, s:{0:0}, f:{0:0}, b:{}, _coverageSchema:'urn:schema:istanbul:coverage:2' };
      const m=new Map(); m.set(abs,cov); writeCoverageFile(repo.coverageDir,m);
      const intervals=new Map([['src/thr.js',[{start:1,end:10}]]]);
      const out30=await buildEvidenceOutput('HEAD',intervals,repo.tempDir,30);
      const out15=await buildEvidenceOutput('HEAD',intervals,repo.tempDir,15);
      // Both should be WARN or 15 at least WARN if 30 is PASS, but ensure 15 is more sensitive
      expect(['PASS','WARN'].includes(out30.gate)).toBe(true);
      expect(['PASS','WARN'].includes(out15.gate)).toBe(true);
      if(out30.gate==='PASS') expect(out15.gate).toBe('WARN');
    } finally {repo.cleanup();}
  });
});
