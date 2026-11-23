import { describe, expect, test } from 'vitest';
import { mergeCoverageMaps } from '../src/coverage';
import { parseCoberturaContent } from '../src/coverage-providers/coberturaProvider';
import { parseLcovContent } from '../src/coverage-providers/lcovProvider';

type Entry = Parameters<typeof mergeCoverageMaps>[0] extends Map<string, infer V> ? V : never;

function unit(startLine: number, hits: number) {
  return {
    span: { startLine, startColumn: 0, endLine: startLine, endColumn: 0 },
    hits
  };
}

function entry(statements: Array<ReturnType<typeof unit>>): Entry {
  return { statements, branches: [], functions: [] };
}

function hitsFor(entryValue: Entry, startLine: number): number | undefined {
  return entryValue.statements.find(u => u.span.startLine === startLine)?.hits;
}

describe('mergeCoverageMaps', () => {
  test('union: keys are exactly the union of both inputs', () => {
    const a = new Map([['a.cs', entry([unit(1, 1)])]]);
    const b = new Map([['b.cs', entry([unit(2, 2)])]]);
    const merged = mergeCoverageMaps(a, b);
    expect([...merged.keys()]).toEqual(['a.cs', 'b.cs']);
    expect(merged.size).toBe(2);
  });

  test('concat: a path in both maps has its statements concatenated', () => {
    const A = entry([unit(1, 1), unit(2, 0)]);
    const B = entry([unit(10, 5), unit(20, 9)]);
    const merged = mergeCoverageMaps(new Map([['a.cs', A]]), new Map([['a.cs', B]]));
    const mergedEntry = merged.get('a.cs')!;
    expect(mergedEntry.statements.length).toBe(A.statements.length + B.statements.length);
    expect(mergedEntry.statements).toHaveLength(4);
    expect(hitsFor(mergedEntry, 1)).toBe(1);
    expect(hitsFor(mergedEntry, 20)).toBe(9);
  });

  test('dedupe by line: same startLine collapses to one entry keeping MAX hits', () => {
    const merged = mergeCoverageMaps(
      new Map([['a.cs', entry([unit(5, 1), unit(6, 3)])]]),
      new Map([['a.cs', entry([unit(5, 9), unit(6, 0)])]])
    );
    const mergedEntry = merged.get('a.cs')!;
    expect(mergedEntry.statements).toHaveLength(2); // 4 units collapsed to 2
    expect(hitsFor(mergedEntry, 5)).toBe(9); // MAX(1, 9)
    expect(hitsFor(mergedEntry, 6)).toBe(3); // MAX(3, 0)
  });

  test('immutability: neither input Map is mutated', () => {
    const a = new Map([['a.cs', entry([unit(1, 1)])]]);
    const b = new Map([['a.cs', entry([unit(1, 9)])]]);
    const sizeA = a.size;
    const sizeB = b.size;
    const statementsA = a.get('a.cs')!.statements.length;
    const statementsB = b.get('a.cs')!.statements.length;

    mergeCoverageMaps(a, b);

    expect(a.size).toBe(sizeA);
    expect(b.size).toBe(sizeB);
    expect(a.get('a.cs')!.statements).toHaveLength(statementsA);
    expect(b.get('a.cs')!.statements).toHaveLength(statementsB);
    // The un-merged inputs are untouched: the shared line still differs per side.
    expect(hitsFor(a.get('a.cs')!, 1)).toBe(1);
    expect(hitsFor(b.get('a.cs')!, 1)).toBe(9);
  });

  test('empty inputs behave as identities', () => {
    const a = new Map([['a.cs', entry([unit(1, 1)])]]);
    expect([...mergeCoverageMaps(a, new Map()).keys()]).toEqual(['a.cs']);
    expect([...mergeCoverageMaps(new Map(), a).keys()]).toEqual(['a.cs']);
    expect(mergeCoverageMaps(new Map(), new Map()).size).toBe(0);
  });

  test('branch and function units are concatenated, not deduped', () => {
    const withBranch = (hits: number[]): Entry => ({
      statements: [],
      branches: [{ span: { startLine: 1, startColumn: 0, endLine: 1, endColumn: 0 }, hits }],
      functions: []
    });
    const merged = mergeCoverageMaps(
      new Map([['a.cs', withBranch([1, 0])]]),
      new Map([['a.cs', withBranch([0, 1])]])
    );
    expect(merged.get('a.cs')!.branches).toHaveLength(2);
  });
});

describe('Cobertura + LCOV parity through the merge seam', () => {
  test('equivalent LCOV and Cobertura artifacts merge to the same line set', () => {
    const lcov = `
SF:src/Program.cs
DA:10,1
DA:11,0
DA:12,7
end_of_record
`;
    const cobertura = `<?xml version="1.0" ?>
<coverage version="1.9">
  <sources><source>.</source></sources>
  <packages><package name="S"><classes>
    <class name="Program" filename="src/Program.cs"><lines>
      <line number="10" hits="1" branch="false" />
      <line number="11" hits="0" branch="false" />
      <line number="12" hits="7" branch="true" />
    </lines></class>
  </classes></package></packages>
</coverage>
`;

    const fromLcov = parseLcovContent(lcov, '/project');
    const fromCobertura = parseCoberturaContent(cobertura, '/project');

    // Same normalized key from both parsers — that is what makes the union work.
    expect([...fromCobertura.keys()]).toEqual([...fromLcov.keys()]);
    expect(fromLcov.get('/project/src/Program.cs')!.statements).toHaveLength(3);

    const merged = mergeCoverageMaps(fromLcov, fromCobertura);
    expect(merged.size).toBe(1);
    const mergedEntry = merged.get('/project/src/Program.cs')!;
    // Every line is reported by both formats, so the union dedupes back to 3.
    expect(mergedEntry.statements).toHaveLength(3);
    expect(hitsFor(mergedEntry, 10)).toBe(1);
    expect(hitsFor(mergedEntry, 11)).toBe(0);
    expect(hitsFor(mergedEntry, 12)).toBe(7);
  });

  test('a line covered only by one artifact survives the union', () => {
    const lcov = `
SF:src/A.cs
DA:1,0
DA:2,4
end_of_record
`;
    const cobertura = `<?xml version="1.0" ?>
<coverage version="1.9">
  <sources><source>.</source></sources>
  <packages><package name="S"><classes>
    <class name="A" filename="src/A.cs"><lines><line number="2" hits="0" /><line number="3" hits="8" /></lines></class>
    <class name="B" filename="src/B.cs"><lines><line number="1" hits="6" /></lines></class>
  </classes></package></packages>
</coverage>
`;
    const merged = mergeCoverageMaps(
      parseLcovContent(lcov, '/project'),
      parseCoberturaContent(cobertura, '/project')
    );
    expect([...merged.keys()].sort()).toEqual(['/project/src/A.cs', '/project/src/B.cs']);
    const a = merged.get('/project/src/A.cs')!;
    expect(a.statements).toHaveLength(3); // lines 1, 2 deduped; 3 added
    expect(hitsFor(a, 1)).toBe(0); // LCOV only
    expect(hitsFor(a, 2)).toBe(4); // MAX(LCOV 4, Cobertura 0)
    expect(hitsFor(a, 3)).toBe(8); // Cobertura only
    expect(hitsFor(merged.get('/project/src/B.cs')!, 1)).toBe(6);
  });
});