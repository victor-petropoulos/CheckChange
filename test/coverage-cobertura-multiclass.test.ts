import { describe, expect, test } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseCoberturaContent } from '../src/coverage-providers/coberturaProvider';

// B1: one C# file can declare several types, and Coverlet emits one <class>
// per type — all sharing filename="StateMachine.cs". flush() is called per
// class, so a plain result.set() kept only the LAST class's lines and left
// every earlier type with null coverage. Assert every class's lines survive.
const FIXTURE = readFileSync(
  new URL('./fixtures/csharp/multiclass-cobertura.xml', import.meta.url),
  'utf8'
);
const CWD = '/project';
const KEY = '/project/src/StateMachine.cs';

function hitsFor(
  statements: ReadonlyArray<{ span: { startLine: number }; hits: number }>,
  startLine: number
): number | undefined {
  return statements.find(u => u.span.startLine === startLine)?.hits;
}

describe('Cobertura multi-class merge (B1)', () => {
  test('keeps statements from every <class> that shares a filename', () => {
    const map = parseCoberturaContent(FIXTURE, CWD);

    // One map entry per FILE, not per class.
    expect(map.size).toBe(1);
    expect(map.has(KEY)).toBe(true);
    const fileCoverage = map.get(KEY)!;

    // StateMachine`2 (lines 10-12) + StateMachine`1 (30-31) + Transition (11, 40).
    // 7 <line> elements, one duplicate start line (11) → 6 deduped units.
    expect(fileCoverage.statements).toHaveLength(6);

    // From the FIRST class — dropped by the old overwrite.
    expect(hitsFor(fileCoverage.statements, 10)).toBe(1);
    expect(hitsFor(fileCoverage.statements, 12)).toBe(4);
    // From the MIDDLE class — also dropped before.
    expect(hitsFor(fileCoverage.statements, 30)).toBe(2);
    expect(hitsFor(fileCoverage.statements, 31)).toBe(0);
    // From the LAST class (the only one that survived pre-fix).
    expect(hitsFor(fileCoverage.statements, 40)).toBe(3);
  });

  test('dedupes a shared start line with MAX hits', () => {
    const fileCoverage = parseCoberturaContent(FIXTURE, CWD).get(KEY)!;

    // Line 11 is reported hits=0 by StateMachine`2 and hits=9 by Transition.
    expect(hitsFor(fileCoverage.statements, 11)).toBe(9);
  });

  test('a later <class> reporting FEWER hits keeps the existing MAX', () => {
    const xml = `<?xml version="1.0" ?>
<coverage version="1.9">
  <packages>
    <package name="P">
      <classes>
        <class name="A" filename="src/A.cs">
          <lines><line number="5" hits="9" branch="false" /></lines>
        </class>
        <class name="B" filename="src/A.cs">
          <lines><line number="5" hits="2" branch="false" /></lines>
        </class>
      </classes>
    </package>
  </packages>
</coverage>
`;
    const fileCoverage = parseCoberturaContent(xml, CWD).get('/project/src/A.cs')!;
    expect(fileCoverage.statements).toHaveLength(1);
    // First class wins 9; later class's 2 must NOT overwrite — pins the keep-existing
    // branch (coberturaProvider.ts:86) where unit.hits is NOT strictly greater.
    expect(hitsFor(fileCoverage.statements, 5)).toBe(9);
  });

  test('a line missed by one type but hit by another stays covered', () => {
    const xml = `<?xml version="1.0" ?>
<coverage version="1.9">
  <packages>
    <package name="P">
      <classes>
        <class name="A" filename="src/A.cs">
          <lines><line number="5" hits="0" branch="false" /></lines>
        </class>
        <class name="B" filename="src/A.cs">
          <lines><line number="5" hits="4" branch="false" /></lines>
        </class>
      </classes>
    </package>
  </packages>
</coverage>
`;
    const fileCoverage = parseCoberturaContent(xml, CWD).get('/project/src/A.cs')!;
    expect(fileCoverage.statements).toHaveLength(1);
    expect(hitsFor(fileCoverage.statements, 5)).toBe(4);
  });

  test('branches/functions stay empty — merging must not fabricate them', () => {
    const fileCoverage = parseCoberturaContent(FIXTURE, CWD).get(KEY)!;
    expect(fileCoverage.branches).toEqual([]);
    expect(fileCoverage.functions).toEqual([]);
  });

  test('single-class output is unchanged by the merge path', () => {
    const xml = `<?xml version="1.0" ?>
<coverage version="1.9">
  <packages>
    <package name="P">
      <classes>
        <class name="Solo" filename="src/Solo.cs">
          <lines>
            <line number="1" hits="1" branch="false" />
            <line number="2" hits="0" branch="false" />
          </lines>
        </class>
      </classes>
    </package>
  </packages>
</coverage>
`;
    const fileCoverage = parseCoberturaContent(xml, CWD).get('/project/src/Solo.cs')!;
    expect(fileCoverage.statements).toHaveLength(2);
    expect(hitsFor(fileCoverage.statements, 1)).toBe(1);
    expect(hitsFor(fileCoverage.statements, 2)).toBe(0);
    expect(fileCoverage.branches).toEqual([]);
    expect(fileCoverage.functions).toEqual([]);
  });
});
