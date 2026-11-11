import { describe, it, expect } from 'vitest';
import { formatJUnit } from '../../src/formatters/junit.js';

// Hand-built fixture — NO engine calls. Mirrors the stable EvidenceOutputShape
// subset the formatters consume (ruleResults index-paired with changedFunctions).
function fixture() {
  return {
    analysisStatus: 'SUCCESS',
    gate: 'WARN',
    completeness: 'INCOMPLETE',
    schemaVersion: '0.5',
    changedFunctions: [
      { file: 'src/a.ts', method: 'alpha', lineStart: 10, lineEnd: 20, cc: 5, crap: 8, coverage: 0.9 },
      { file: 'src/a.ts', method: 'beta', lineStart: 30, lineEnd: 40, cc: 25, crap: 75, coverage: 0.4 },
      { file: 'src/b.ts', method: 'gamma', lineStart: 5, lineEnd: 12, cc: 12, crap: null, coverage: null },
    ],
    ruleResults: [
      { ruleId: 'changed-function-high-crap', result: 'PASS', file: 'src/a.ts', method: 'alpha', crap: 8, threshold: 30, cc: 5, coverage: 0.9 },
      { ruleId: 'changed-function-high-crap', result: 'WARN', file: 'src/a.ts', method: 'beta', crap: 75, threshold: 30, cc: 25, coverage: 0.4 },
      { ruleId: 'changed-function-high-crap', result: 'NOT_EVALUATED', file: 'src/b.ts', method: 'gamma', crap: null, threshold: 30, cc: 12, coverage: null },
    ],
  };
}

describe('formatJUnit', () => {
  it('emits XML declaration and testsuite with tests == changedFunctions.length, failures == WARN count', () => {
    const out = formatJUnit(fixture(), { cwd: '' });
    expect(out.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(out).toContain('<testsuite name="checkchange" tests="3" failures="1">');
  });

  it('emits one testcase per changed function with classname/file/line from paired changedFunctions', () => {
    const out = formatJUnit(fixture(), { cwd: '' });
    expect(out).toContain('<testcase classname="src/a.ts" name="beta" file="src/a.ts" line="30">');
    expect(out).toContain('<testcase classname="src/b.ts" name="gamma" file="src/b.ts" line="5">');
    expect(out).toContain('<testcase classname="src/a.ts" name="alpha" file="src/a.ts" line="10"/>');
  });

  it('emits a <failure> child for WARN results', () => {
    const out = formatJUnit(fixture(), { cwd: '' });
    expect(out).toContain('<failure message="CRAP 75 &gt; 30">');
  });

  it('emits <skipped/> for NOT_EVALUATED results', () => {
    const out = formatJUnit(fixture(), { cwd: '' });
    expect(out).toContain('<skipped/>');
  });

  it('emits no failure/skipped child for PASS results', () => {
    const out = formatJUnit(fixture(), { cwd: '' });
    expect(out).toContain('<testcase classname="src/a.ts" name="alpha" file="src/a.ts" line="10"/>');
  });

  it('escapes XML entities in file/method and message', () => {
    const weird = fixture();
    weird.changedFunctions[0] = { file: 'src/a&b.ts', method: 'f<g"h>', lineStart: 10, lineEnd: 20, cc: 5, crap: 9, coverage: 0.9 };
    weird.ruleResults[0] = { ruleId: 'changed-function-high-crap', result: 'WARN', file: 'src/a&b.ts', method: 'f<g"h>', crap: 9, threshold: 30, cc: 5, coverage: 0.9 };
    const out = formatJUnit(weird, { cwd: '' });
    expect(out).toContain('classname="src/a&amp;b.ts" name="f&lt;g&quot;h&gt;"');
    expect(out).not.toContain('name="f<g"');
  });

it('counts failures across multiple WARN results', () => {
    const two = fixture();
    two.ruleResults[0] = { ruleId: 'changed-function-high-crap', result: 'WARN', file: 'src/a.ts', method: 'alpha', crap: 99, threshold: 30, cc: 5, coverage: 0.9 };
    two.changedFunctions[0] = { file: 'src/a.ts', method: 'alpha', lineStart: 10, lineEnd: 20, cc: 5, crap: 99, coverage: 0.9 };
    const out = formatJUnit(two, { cwd: '' });
    expect(out).toContain('tests="3" failures="2"');
  });
});