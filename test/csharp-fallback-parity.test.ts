import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { MethodDescriptor as CoreMethodDescriptor } from '@barney-media/crap-typescript-core';
import { parseCsharpFileMethods } from '../src/complexity-providers/csharpFallbackParser.js';
import { parsePythonFileMethods } from '../src/complexity-providers/pythonDescriptorProvider.js';
import { parseCoberturaContent } from '../src/coverage-providers/coberturaProvider.js';
import { attachCoverage } from '../src/attribution.js';

// Fallback .cs parser (Task 2). The rich path (Roslyn via a .NET SDK) is Task 3
// and is NOT testable in this repo — `dotnet` may be absent, and even when
// present the rich vehicle (dotnet-crap) is an unverified probe per plan
// risk "Roslyn vehicle for the rich path NOT VERIFIED". So every rich-path value
// below is a DOCUMENTED EXPECTATION, not a captured measurement. See
// "FALLBACK vs RICH DELTA" at the bottom: that table is the contract Task 3 must
// satisfy, and Task 3 replaces the expectation column with measured values.
//
// Fixtures are inline strings written to a fresh tmpdir rather than files under
// test/fixtures/. Two reasons, both binding:
//   1. Task 2 acceptance item 10 pins `rg --files test | wc -l` at 79 (78 + this
//      one test file). Three committed .cs fixtures would make it 82.
//   2. Task 1 acceptance item 7 used the same arithmetic (76 -> 78) for the same
//      reason.
// The plan's DEC-1 (flat test/fixtures/csharp-*.cs naming) therefore does NOT
// apply here; DEC-1 governs the Task 3/Task 5 committed fixtures. Flagged, not
// silently ignored.
//
// ---------------------------------------------------------------- CC TABLE ----
// base 1, +1 per: if / else if / foreach / for / while / case / catch / && /
// || / ?? / ?:      (`else` alone is NOT a decision; `else if` counts once,
// via its `if`. `foreach` is NOT also counted as `for`.)
const CC_RULE = 'base 1 + 1 per if | else if | foreach | for | while | case | catch | && | || | ?? | ?:';

const HIGH_CC = `using System;

namespace Sample
{
    public class Foo
    {
        public int Classify(int value)
        {
            if (value < 0)
            {
                return -1;
            }
            else if (value == 0)
            {
                return 0;
            }

            for (var i = 0; i < value; i++)
            {
                value -= i;
            }

            while (value > 100)
            {
                value /= 2;
            }

            try
            {
                return value;
            }
            catch (InvalidOperationException)
            {
                return -2;
            }
        }

        public bool Combine(string a, string b)
        {
            if (a != null && b != null)
            {
                return true;
            }

            var value = a ?? b;
            var flag = value.Length > 0 ? true : false;
            return flag || value == "x";
        }

        public Foo(int seed)
        {
            Seed = seed;
        }
    }
}
`;

const CLEAN = `namespace Sample
{
    public class Clean
    {
        public int Add(int a, int b)
        {
            return a + b;
        }

        public string Name => "clean";

        public int Bump(int n)
        {
            n++;
            return n;
        }
    }
}
`;

const ZERO_COVERAGE = `namespace Sample
{
    public class Uncovered
    {
        // if (x) && y || z ?? w ? a : b
        /* case 1: while (x) for (;;) catch (E) && || ?? ?: */

        public string Note()
        {
            // if (a) { }
            var sample = "if (x) && y ?? z ? a : b";
            var verbatim = @"while (x) case 2: && || ??";
            var ch = '>';
            return sample + verbatim + ch;
        }

        public int Plain()
        {
            return 1;
        }
    }
}
`;

const NULLABLE = `public class N
{
    public int F(int? maybe, List<int?> list)
    {
        var v = maybe ?? 0;
        var m = list.Count;
        return m > 0 && v > 1 ? v : m;
    }

    // A nullable annotation and a ternary in the SAME statement, with a null-
    // coalesce between them. The regex lookbehind is what stops the annotation's
    // question mark from scanning forward to the ternary's colon and swallowing
    // BOTH the ternary and the coalesce. Remove the lookbehind and this method
    // reads 3, not 4.
    public int G(bool flag, int? maybe)
    {
        int? picked = maybe ?? (flag ? 1 : 2);
        return picked ?? 0;
    }
}
`;

const TOP_LEVEL = `int TopLevel(int n)
{
    return n;
}
`;

let dir: string;
const path = (name: string): string => join(dir, name);

// Cobertura reports no columns, so a statement is a LINE (startColumn 0).
// <class filename> is relative to <sources><source> (coberturaProvider.ts:67)
// — exactly what Coverlet emits, and passing an ABSOLUTE filename here would
// double-join the base into a key that matches nothing.
const cobertura = (fileInClass: string, lines: readonly (readonly [number, number])[]): string => `<?xml version="1.0" ?>
<coverage version="1.9" timestamp="0">
  <sources><source>${dir}</source></sources>
  <packages><package name="Demo" line-rate="0.67" branch-rate="0" complexity="2">
    <classes><class name="Calc" filename="${fileInClass}" line-rate="0.67" branch-rate="0" complexity="2">
      <lines>
${lines.map(([n, hits]) => `        <line number="${n}" hits="${hits}"/>`).join('\n')}
      </lines>
    </class></classes>
  </package></packages>
</coverage>`;

beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), 'cc-cs-fallback-'));
  writeFileSync(path('high-cc.cs'), HIGH_CC);
  writeFileSync(path('clean.cs'), CLEAN);
  writeFileSync(path('zero-coverage.cs'), ZERO_COVERAGE);
  writeFileSync(path('nullable.cs'), NULLABLE);
  writeFileSync(path('top.cs'), TOP_LEVEL);
  writeFileSync(path('empty.cs'), '');
  writeFileSync(path('garbage.cs'), '}}}{{{ <<< ??? @@@ ');
});

afterAll(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe('parseCsharpFileMethods: CC approximation pinned per fixture', () => {
  test(`CC rule: ${CC_RULE}`, async () => {
    const methods = await parseCsharpFileMethods(path('high-cc.cs'));

    // Classify: if(1) + else if(2) + for(3) + while(4) + catch(5) = 5 + base 1.
    expect(methods[0]).toMatchObject({ displayName: 'Foo.Classify', complexity: 6 });
    // Combine: if(1) + &&(2) + ??(3) + ?:(4) + ||(5) = 5 + base 1.
    expect(methods[1]).toMatchObject({ displayName: 'Foo.Combine', complexity: 6 });
    // Constructor: no decisions, base 1.
    expect(methods[2]).toMatchObject({ displayName: 'Foo.Foo', complexity: 1 });
    expect(methods.map((m) => m.complexity)).toEqual([6, 6, 1]);
  });

  test('clean.cs: two plain methods, both base 1; the `=>` property is not a method', async () => {
    const methods = await parseCsharpFileMethods(path('clean.cs'));
    expect(methods.map((m) => m.displayName)).toEqual(['Clean.Add', 'Clean.Bump']);
    expect(methods.map((m) => m.complexity)).toEqual([1, 1]);
  });

  test('zero-coverage.cs: decision tokens inside line comments, block comments, strings and verbatim strings do NOT count', async () => {
    const methods = await parseCsharpFileMethods(path('zero-coverage.cs'));
    expect(methods.map((m) => m.displayName)).toEqual(['Uncovered.Note', 'Uncovered.Plain']);
    // All four would be >= 2 if comment/string stripping were broken. This is the
    // regression lock for the naive-regex failure mode: a commented-out `if` must
    // not inflate CC against the 30/15 thresholds.
    expect(methods.map((m) => m.complexity)).toEqual([1, 1]);
  });

  test('nullable.cs: `int?` / `List<int?>` annotations are not ternaries; ??, && and ?: are', async () => {
    const methods = await parseCsharpFileMethods(path('nullable.cs'));
    // F: ??(1) + &&(2) + ?:(3) + base 1 = 4. Counting the `?` in `int? maybe` or
    // in `List<int?>` would make this 6.
    // G: ?:(1) + ??(2) + ??(3) + base 1 = 4. This is the load-bearing case: the
    // `int?` annotation, the ternary and both null-coalesces share one
    // statement, so without the lookbehind the annotation's `?` swallows the
    // ternary and this reads 3. Verified by mutation, not by inspection.
    expect(methods.map((m) => m.complexity)).toEqual([4, 4]);
  });
});

describe('parseCsharpFileMethods: shape parity with pythonDescriptorProvider', () => {
  test('every descriptor is structurally a crap-typescript-core MethodDescriptor', async () => {
    const methods = await parseCsharpFileMethods(path('high-cc.cs'));
    const core: CoreMethodDescriptor[] = methods;
    expect(core).toHaveLength(3);
  });

  test('field set is exactly pythonDescriptorProvider.ts:4-19 — no missing, no extra', async () => {
    const methods = await parseCsharpFileMethods(path('high-cc.cs'));
    expect(Object.keys(methods[0]!).sort()).toEqual(
      [
        'bodySpan',
        'complexity',
        'containerName',
        'displayName',
        'endLine',
        'expectsBranchCoverage',
        'expectsStatementCoverage',
        'functionName',
        'startLine',
      ].sort()
    );
    expect(Object.keys(methods[0]!.bodySpan).sort()).toEqual(
      ['endColumn', 'endLine', 'startColumn', 'startLine'].sort()
    );
  });

  test('key ORDER is identical to pythonDescriptorProvider.ts:95-110 (attribution display + snapshots)', async () => {
    const methods = await parseCsharpFileMethods(path('high-cc.cs'));
    expect(Object.keys(methods[0]!)).toEqual([
      'functionName',
      'containerName',
      'displayName',
      'startLine',
      'endLine',
      'complexity',
      'bodySpan',
      'expectsStatementCoverage',
      'expectsBranchCoverage',
    ]);
  });

  test('coverage-expectation flags are true/true like the python provider', async () => {
    const methods = await parseCsharpFileMethods(path('clean.cs'));
    for (const m of methods) {
      expect(m.expectsStatementCoverage).toBe(true);
      expect(m.expectsBranchCoverage).toBe(true);
    }
  });

  test('python provider reports the same key order for the same field set', async () => {
    // Guard against pythonDescriptorProvider.ts:95-110 being reordered later: the
    // parity claim is about BOTH providers, not just this one.
    const methods = await parsePythonFileMethods(join(process.cwd(), 'test', 'fixtures', 'python-only', 'src', 'calc.py'));
    expect(Object.keys(methods[0]!)).toEqual([
      'functionName',
      'containerName',
      'displayName',
      'startLine',
      'endLine',
      'complexity',
      'bodySpan',
      'expectsStatementCoverage',
      'expectsBranchCoverage',
    ]);
  });
});

describe('parseCsharpFileMethods: nesting and displayName', () => {
  test('a method inside `class Foo` yields containerName "Foo" and displayName "Foo.Method"', async () => {
    const methods = await parseCsharpFileMethods(path('high-cc.cs'));
    expect(methods[0]).toMatchObject({
      functionName: 'Classify',
      containerName: 'Foo',
      displayName: 'Foo.Classify',
    });
  });

  // displayName format (documented per acceptance item 6):
  //   containerName ? `${containerName}.${functionName}` : functionName
  // i.e. identical to pythonDescriptorProvider.ts:93
  // (`f"{container_name}.{name}" if container_name else name`), and it is the
  // exact string src/attribution.ts:143 builds its descriptor key from. Overloads
  // are NOT disambiguated here — the key's `:${startLine}` suffix is what keeps
  // two same-named methods apart, so overload resolution is Task 3's concern.
  test('a top-level method yields containerName null and a bare displayName', async () => {
    const methods = await parseCsharpFileMethods(path('top.cs'));
    expect(methods).toHaveLength(1);
    expect(methods[0]).toMatchObject({
      functionName: 'TopLevel',
      containerName: null,
      displayName: 'TopLevel',
    });
  });

  test('nested namespaces do not invent a container', async () => {
    const methods = await parseCsharpFileMethods(path('clean.cs'));
    // `namespace Sample` wraps `class Clean`; only the class is a container.
    expect(methods.every((m) => m.containerName === 'Clean')).toBe(true);
  });
});

describe('parseCsharpFileMethods: bodySpan is computed, not hardcoded', () => {
  test('high-cc.cs: exact spans (8-space class indentation -> startColumn 8)', async () => {
    const methods = await parseCsharpFileMethods(path('high-cc.cs'));
    expect(methods.map((m) => [m.startLine, m.endLine])).toEqual([
      [7, 36],
      [38, 48],
      [50, 53],
    ]);
    // startColumn 8 = the column of `public`, not 0. endColumn is exclusive and
    // lands just past the closing `}`.
    expect(methods.map((m) => [m.bodySpan.startLine, m.bodySpan.startColumn, m.bodySpan.endLine, m.bodySpan.endColumn])).toEqual([
      [7, 8, 36, 9],
      [38, 8, 48, 9],
      [50, 8, 53, 9],
    ]);
    expect(methods.every((m) => m.bodySpan.startColumn > 0)).toBe(true);
  });

  test('bodySpan.startLine/endLine mirror the descriptor startLine/endLine', async () => {
    const methods = await parseCsharpFileMethods(path('nullable.cs'));
    for (const m of methods) {
      expect(m.bodySpan.startLine).toBe(m.startLine);
      expect(m.bodySpan.endLine).toBe(m.endLine);
    }
  });

  test('a differently-indented file yields a different startColumn (not a constant)', async () => {
    // NULLABLE uses 4-space class indentation, HIGH_CC uses 8. Same code shape,
    // different column — proof the column is computed.
    const nullable = await parseCsharpFileMethods(path('nullable.cs'));
    const clean = await parseCsharpFileMethods(path('clean.cs'));
    expect(nullable[0]!.bodySpan.startColumn).toBe(4);
    expect(clean[0]!.bodySpan.startColumn).toBe(8);
  });

  test('a zero-indent top-level method has startColumn 0 and endColumn 1 (honest, not padded)', async () => {
    const methods = await parseCsharpFileMethods(path('top.cs'));
    expect(methods[0]!.bodySpan).toEqual({ startLine: 1, startColumn: 0, endLine: 4, endColumn: 1 });
  });
});

describe('parseCsharpFileMethods: degradation never throws on unparseable content', () => {
  test('empty file -> []', async () => {
    expect(await parseCsharpFileMethods(path('empty.cs'))).toEqual([]);
  });

  test('brace-unbalanced garbage -> [] (no throw, batch survives)', async () => {
    expect(await parseCsharpFileMethods(path('garbage.cs'))).toEqual([]);
  });

  test('a file whose only members are expression-bodied is []', async () => {
    // `=>` heads are never methods (documented limitation), so this degrades to
    // [] rather than throwing or inventing a phantom descriptor.
    //
    // The second member is `int B(int x) => new int[] { x }.Length;` — its head
    // REACHES a `{` (the collection initialiser) while still containing `(` and
    // `=>`. That is what makes the `=>` guard load-bearing: remove the guard and
    // this test's expected `[]` becomes `['P.B']`, a phantom method. The first
    // member alone (`int A => 1;`) does NOT exercise it — no `(` in that head.
    const only = path('only-props.cs');
    writeFileSync(only, 'class P { public int A => 1; public int B(int x) => new int[] { x }.Length; }\n');
    expect(await parseCsharpFileMethods(only)).toEqual([]);
  });

  test('a valid method followed by unbalanced braces still yields the valid method', async () => {
    const partial = path('partial.cs');
    writeFileSync(partial, 'class P { public int A() { return 1; }\n');
    expect((await parseCsharpFileMethods(partial)).map((m) => m.displayName)).toEqual(['P.A']);
  });
});

describe('parseCsharpFileMethods: expression-bodied methods are discovered (B2)', () => {
  // Block body + single-line `=>` + multi-line `=>` (NCrontab's GetNextOccurrence
  // shape, /tmp/NCrontab/NCrontab/CrontabSchedule.cs:187-188) + a `=>` expression
  // full of decision tokens (pins complexity 1 — the expression is NOT
  // branch-parsed) + an expression-bodied PROPERTY + a lambda field initializer.
  // Only the four METHODS may be reported. Inline fixture, not a committed file:
  // same binding convention as every other fixture in this file (header, lines
  // 19-27) — a new test/fixtures file shifts the `rg --files test | wc -l` gate.
  const EXPR = [
    'namespace Sample',
    '{',
    '    public class Expr',
    '    {',
    '        public int Add(int a, int b)',
    '        {',
    '            return a + b;',
    '        }',
    '',
    '        public int Square(int x) => x * x;',
    '',
    '        public int Decide(int a, int b) => a > 0 && b > 0 ? 1 : 0;',
    '',
    '        public DateTime GetNextOccurrence(DateTime baseTime) =>',
    '            GetNextOccurrence(baseTime, DateTime.MaxValue);',
    '',
    '        public string Name => "not a method";',
    '',
    '        public Func<int> Factory = () => 5;',
    '    }',
    '}',
    '',
  ].join('\n');

  beforeAll(() => {
    writeFileSync(path('expr-bodied.cs'), EXPR);
  });

  test('all four methods are discovered; the property and the lambda field are not', async () => {
    const methods = await parseCsharpFileMethods(path('expr-bodied.cs'));
    expect(methods.map((m) => m.displayName)).toEqual([
      'Expr.Add',
      'Expr.Square',
      'Expr.Decide',
      'Expr.GetNextOccurrence',
    ]);
  });

  test('spans run from the declaration start to the statement terminator (the `;`)', async () => {
    const methods = await parseCsharpFileMethods(path('expr-bodied.cs'));
    expect(methods.map((m) => [m.startLine, m.endLine])).toEqual([
      [5, 8],
      [10, 10],
      [12, 12],
      [14, 15], // multi-line: endLine is the `;` line, not the `=>` line
    ]);
    // Exact bodySpan for the two expression-bodied shapes. Square is a SINGLE-LINE
    // body, so its span anchors at column 0 — not at `public` (col 8). That is the
    // Cobertura-compatibility rule (statements are LINES with startColumn 0;
    // the attribution join compares columns on a shared start line), and an
    // 8-column anchor left every statement unowned -> null coverage. Square's `;`
    // sits at 0-based col 41 -> endColumn 42, mirroring the block-bodied
    // convention (endColumn = 1-based col of the terminator, same formula as the
    // `}` terminator). GetNextOccurrence spans two lines, so its startColumn is
    // still the declaration column (8) — a multi-line span never has its start
    // column read for containment — and its `;` on the continuation line is at
    // 0-based 58 -> endColumn 59.
    const byName = new Map(methods.map((m) => [m.displayName, m]));
    expect(byName.get('Expr.Square')!.bodySpan).toEqual({
      startLine: 10,
      startColumn: 0,
      endLine: 10,
      endColumn: 42,
    });
    expect(byName.get('Expr.GetNextOccurrence')!.bodySpan).toEqual({
      startLine: 14,
      startColumn: 8,
      endLine: 15,
      endColumn: 59,
    });
    // bodySpan mirrors the descriptor lines for every member, block-bodied too.
    for (const m of methods) {
      expect(m.bodySpan.startLine).toBe(m.startLine);
      expect(m.bodySpan.endLine).toBe(m.endLine);
    }
  });

  test('complexity is 1 for every `=>` body — the expression is not branch-parsed', async () => {
    const methods = await parseCsharpFileMethods(path('expr-bodied.cs'));
    // Decide's expression contains `&&` and `?:`: a branch parse would read 3.
    expect(methods.map((m) => [m.displayName, m.complexity])).toEqual([
      ['Expr.Add', 1],
      ['Expr.Square', 1],
      ['Expr.Decide', 1],
      ['Expr.GetNextOccurrence', 1],
    ]);
  });
});

describe('parseCsharpFileMethods: a member is named by its own declaration, not by its attributes or initialiser', () => {
  // Task 2r locks. Both parsers (F1 attribute hijack, F2 target-typed `new()`)
  // were FIXED but shipped unpinned: reverting either fix leaves every other test
  // in this file green, because no fixture contained a parameterised attribute
  // or a target-typed `new()` field. These two tests are the regression locks.
  // Both are load-bearing — verified by mutation, not by inspection.

  test('a parameterised attribute does not swallow the method', async () => {
    const attrs = path('attrs.cs');
    writeFileSync(attrs, [
      'class C {',
      '  [Authorize(Roles = "Admin")]',
      '  public int Delete(int id) { if (id > 0) { } else { } return id; }',
      '  [TestCase(1,2)] public int Param(int a, int b) { if (a > b) { } else { } return a; }',
      '}',
    ].join('\n'));
    expect((await parseCsharpFileMethods(attrs)).map((m) => m.displayName)).toEqual(['C.Delete', 'C.Param']);
  });

  test('a target-typed new() field yields no phantom method', async () => {
    const init = path('field-init.cs');
    writeFileSync(init, [
      'class A {',
      '  static readonly Dictionary<string,int> Map = new()',
      '  {',
      '      { "a", 1 }',
      '  };',
      '  public int Real(int x) { if (x > 0) { } else { } return x; }',
      '}',
    ].join('\n'));
    expect((await parseCsharpFileMethods(init)).map((m) => m.displayName)).toEqual(['A.Real']);
  });
});

describe('parseCsharpFileMethods: filename guard (pythonDescriptorProvider.ts:21-24 parity)', () => {
  // The guard is copied byte-for-byte and MUST stay behaviour-identical:
  // Task 2r acceptance requires byte-equivalence. It checks BASENAME only, so a
  // traversal payload in the DIRECTORY part passes it. That is not a regression
  // introduced here — it is the python provider's existing behaviour, and
  // "fixing" it in one provider only would break the parity lock. Recorded here
  // so the next reader does not mistake it for a new hole.
  test('`../../etc/passwd.cs` PASSES the guard (basename "passwd.cs" is clean), then throws ENOENT on read', async () => {
    await expect(parseCsharpFileMethods('../../etc/passwd.cs')).rejects.toThrow(/ENOENT|no such file/i);
  });

  test('a filename containing `;` throws Invalid file name', async () => {
    await expect(parseCsharpFileMethods('bad;name.cs')).rejects.toThrow('Invalid file name: bad;name.cs');
  });

  test('a filename containing `|` throws', async () => {
    await expect(parseCsharpFileMethods('pipe|name.cs')).rejects.toThrow('Invalid file name: pipe|name.cs');
  });

  test('a filename containing a newline throws', async () => {
    await expect(parseCsharpFileMethods('nl\nname.cs')).rejects.toThrow('Invalid file name');
  });

  test('a basename containing `..` throws', async () => {
    await expect(parseCsharpFileMethods('a..cs')).rejects.toThrow('Invalid file name: a..cs');
  });

  test('a well-formed absolute path is accepted by the guard (reaches readFile)', async () => {
    // Proves the guard is not simply rejecting everything non-relative.
    await expect(parseCsharpFileMethods(path('clean.cs'))).resolves.toHaveLength(2);
  });
});

// ------------------------------------------------- FALLBACK vs RICH DELTA ----
// EXPECTED RICH values are DOCUMENTED ASSUMPTIONS, not measurements: the rich
// path cannot run in this repo (no .NET SDK guaranteed, vehicle unverified —
// plan risk "Roslyn vehicle for the rich path NOT VERIFIED"). Task 3 owns
// replacing this column with probed values.
//
// Invariants Task 3 MUST preserve, whichever vehicle it picks:
//   I1  IDENTICAL shape both modes: same 9 keys, same order, same types. Only
//       `complexity` may differ in value (plan Task 3 acceptance item 7).
//   I2  IDENTICAL functionName / containerName / displayName / startLine /
//       endLine / bodySpan both modes. Attribution's descriptor key
//       (src/attribution.ts:143) and its lineStart join (:161) both depend on
//       these, so a rich/fallback split here silently drops coverage attribution.
//       The ONE known exception is the CONSTRUCTOR name: fallback reports
//       `Foo.Foo`, a Roslyn-based tool may report `.ctor`. Task 3 must pin
//       whichever it emits.
//   I3  Rich CC >= fallback CC is EXPECTED but NOT guaranteed by the spec, so it
//       is asserted as a documented expectation, never as a test.
//   I4  Rich CC counts `when` filters on catch/foreach, switch EXPRESSION arms,
//       and logical operators inside interpolated strings, all of which the
//       fallback under-counts by design.
//
// fixture method      fallback  rich (EXPECTED)  why they differ
// ------------------------------------------------------------------
// Foo.Classify             6            6+      Roslyn adds nothing here; the
//                                                `catch` counts in both.
// Foo.Combine              6           7+      `value.Length > 0 ? true : false`
//                                                — a Roslyn walk counts the
//                                                conditional expression AND the
//                                                null-check flow.
// Foo.Foo                  1            1      ctor naming may differ (I2).
// Clean.Add                1            1      agree.
// Clean.Bump               1            1      agree.
// Uncovered.Note           1            1      agree; both strip comments and
//                                                string literals.
// Uncovered.Plain          1            1      agree.
// N.F                      4           4+      nullable annotations are not
//                                                decisions for either.
// N.G                      4           4+      agree on the count; the fallback
//                                                needed a lookbehind to reach it.
// TopLevel                 1            1      agree.
const FALLBACK_VS_RICH: ReadonlyArray<[string, number, number]> = [
  ['Foo.Classify', 6, 6],
  ['Foo.Combine', 6, 7],
  ['Foo.Foo', 1, 1],
  ['Clean.Add', 1, 1],
  ['Clean.Bump', 1, 1],
  ['Uncovered.Note', 1, 1],
  ['Uncovered.Plain', 1, 1],
  ['N.F', 4, 4],
  ['N.G', 4, 4],
  ['TopLevel', 1, 1],
];

describe('fallback vs rich delta (fallback column measured, rich column expected)', () => {
  test('the fallback column matches what the parser actually produces', async () => {
    const measured = new Map<string, number>();
    for (const f of ['high-cc.cs', 'clean.cs', 'zero-coverage.cs', 'nullable.cs', 'top.cs']) {
      for (const m of await parseCsharpFileMethods(path(f))) measured.set(m.displayName, m.complexity);
    }
    const fallbackColumn = Object.fromEntries(FALLBACK_VS_RICH.map(([name, fb]) => [name, fb]));
    expect(Object.fromEntries(measured)).toEqual(fallbackColumn);
  });

  test('I3: the documented rich expectation is never BELOW the measured fallback', async () => {
    // HONEST SCOPE: a static lint. It calls the parser ZERO times — the
    // assertion compares a string built from `FALLBACK_VS_RICH` against the same
    // literals, so it is tautological and CANNOT detect a fallback-parser edit.
    // It only breaks if someone edits a row to invert rich < fallback. The real
    // binding check that the fallback column matches reality is the test above.
    for (const [name, fallback, richExpected] of FALLBACK_VS_RICH) {
      expect(`${name}:${richExpected >= fallback}`).toBe(`${name}:true`);
    }
  });
});

// ----------------------------------------------- MEASURED RICH OUTCOME (T3) ----
// Task 3 measured the rich path for real instead of assuming it. The Roslyn
// vehicle probe was REJECTED on the implementing machine, so every run degrades
// to the fallback parser and the MEASURED rich column equals the fallback column.
//
// Probe evidence (verbatim, argv-only, recorded in the Task 3 report):
//   dotnet-crap --help        → error_code ENOENT
//   dotnet dotnet-crap --help → exit_code 1
//                                "dotnet-crap does not exist."
//   dotnet --version          → exit_code 0, stdout "9.0.121"
//
// So the table above keeps its Roslyn EXPECTATIONS for a future verified
// vehicle, and this block pins what actually happens TODAY. Both are asserted
// separately because a machine with no dotnet SDK yields
// `csharp-sdk-missing` rather than `csharp-analysis-failed` — the DESCRIPTORS
// are identical either way, which is the invariant that matters.
describe('MEASURED rich-path outcome: the vehicle is probed, not assumed', () => {
  const fixtureFiles = ['high-cc.cs', 'clean.cs', 'zero-coverage.cs', 'nullable.cs', 'top.cs'];

  test('every fixture yields the fallback CC under BOTH the rich attempt and the pure fallback', async () => {
    const { analyzeCsharpFile } = await import('../src/complexity-providers/csharpDescriptorProvider.js');

    // Accumulate across fixtures: FALLBACK_VS_RICH is the union of all of them,
    // so a per-file comparison would compare one fixture against all five.
    const measuredCc: Record<string, number> = {};
    for (const f of fixtureFiles) {
      for (const d of (await analyzeCsharpFile(path(f))).descriptors) measuredCc[d.displayName] = d.complexity;
    }
    expect(measuredCc).toEqual(Object.fromEntries(FALLBACK_VS_RICH.map(([name, fb]) => [name, fb])));
  });

  test('the run reports a diagnostic — never a silent empty list', async () => {
    const { analyzeCsharpFile } = await import('../src/complexity-providers/csharpDescriptorProvider.js');

    for (const f of fixtureFiles) {
      const measured = await analyzeCsharpFile(path(f));
      expect(measured.mode).toBe('fallback');
      // `csharp-analysis-failed` when an SDK was found but the vehicle was not;
      // `csharp-sdk-missing` on a host with no .NET SDK at all. Both are loud.
      expect(['csharp-analysis-failed', 'csharp-sdk-missing']).toContain(measured.diagnostic?.code);
      expect(measured.diagnostic?.fix).toBeTruthy();
      expect(measured.diagnostic?.detail).toBeTruthy();
      // Anti-phantom-PASS: all five fixtures contribute to FALLBACK_VS_RICH's
      // 10 rows, so none may come back empty. An empty descriptor list here is
      // exactly the "zero-scored phantom PASS" the diagnostic exists to prevent.
      expect(measured.descriptors.length).toBeGreaterThan(0);
    }
  });

  test('descriptor shape is byte-identical across the dispatcher and the raw fallback parser', async () => {
    const { analyzeCsharpFile } = await import('../src/complexity-providers/csharpDescriptorProvider.js');

    for (const f of fixtureFiles) {
      const dispatched = await analyzeCsharpFile(path(f));
      const raw = await parseCsharpFileMethods(path(f));
      expect(Object.keys(dispatched.descriptors)).toEqual(Object.keys(raw));
      expect(dispatched.descriptors).toEqual(raw);
    }
  });
});

// ---------------------------------------------------------------------------
// THE ATTRIBUTION JOIN (Task 6). Everything above pins the PARSER; this pins
// the place the parser is CONSUMED.
//
// MEASURED defect, not a guess. `descriptorsForFile` (attribution.ts:129-131)
// routed every NON-.py file to `parseFileMethods`, the TypeScript AST parser.
// A .cs file is not TypeScript, so it threw ParseError; the catch at
// attribution.ts:134 swallowed it and returned undefined; the caller
// (attribution.ts:57-63) then wrote `nullCoverageEntry()` for every method on
// the file. Result: `coveragePercent: null` -> CRAP uncomputable ->
// changed-function-high-crap = NOT_EVALUATED -> completeness INCOMPLETE.
// The Cobertura artifact was found, parsed, and had every statement — it just
// never attached to a method.
//
// ponytail: the fix is one `.cs` arm on the existing ternary, mirroring the
// `.py` arm that is already there. No new abstraction, no new dep.
describe('attribution join: .cs is routed to a C# descriptor parser, not the TS one', () => {
  // One method, three statements inside its bodySpan (lines 5..12):
  // `if (x > 0)`, `return x * 2;`, `return 0;`. Two hit, one missed -> 66.67%.
  const ATTRIB_SRC = `namespace Demo
{
    public class Calc
    {
        public int Compute(int x)
        {
            if (x > 0)
            {
                return x * 2;
            }
            return 0;
        }
    }
}
`;

  const TS_SRC = `export function foo(a: number): number {
  if (a > 0) {
    return a * 2;
  }
  return 0;
}
`;

  // Calc.Compute bodySpan is lines 5..12; foo's is lines 1..6. Each file gets
  // its OWN line numbers — reusing one set across both silently puts every
  // statement outside the other's bodySpan and reads as a join failure.
  const CALC_LINES = [[7, 1], [9, 1], [11, 0]] as const; // 2 of 3 hit -> 66.67%
  const FOO_LINES = [[2, 1], [3, 1], [5, 0]] as const;

  beforeAll(() => {
    writeFileSync(path('Calc.cs'), ATTRIB_SRC);
    writeFileSync(path('foo.ts'), TS_SRC);
  });

  test('coverage ATTACHES to a .cs method instead of resolving to null', async () => {
    const file = path('Calc.cs');
    const coverageMap = parseCoberturaContent(cobertura('Calc.cs', CALC_LINES), dir);

    // Pin the premise: the coverage map is keyed by the real, existing file.
    // Without this the next assertion could pass for the wrong reason.
    expect([...coverageMap.keys()]).toEqual([file]);

    const attributed = await attachCoverage(
      [{ file, method: 'Calc.Compute', lineStart: 5, lineEnd: 12, cc: 2 }],
      { available: true, error: false, coverageMap }
    );

    expect(attributed).toHaveLength(1);
    // The regression itself: non-null, and EQUAL to the value bodySpan
    // containment must produce (2 of 3 statements hit). A null here would be
    // indistinguishable from a different bug, so the exact number is asserted.
    expect(attributed[0]!.coveragePercent).not.toBeNull();
    expect(attributed[0]!.coveragePercent).toBeCloseTo(66.6667, 3);
    // Cobertura yields statements and no branches -> kind is 'stmt'
    // (attribution.ts:179-181), never null.
    expect(attributed[0]!.coverageKind).toBe('stmt');
  });

  test('the route the join used to take throws on .cs — so null was never the truth', async () => {
    // Proof the old `.cs` arm could only ever have produced null: the TS
    // parser rejects the file outright. `descriptorsForFile`'s catch turned
    // that throw into undefined, silently. If this ever stops throwing, the
    // assertion above is no longer measuring the defect it claims to.
    const { parseFileMethods } = await import('@barney-media/crap-typescript-core');
    await expect(parseFileMethods(path('Calc.cs'))).rejects.toThrow();
  });

  test('.ts routing is untouched — the .cs arm is additive, not a replacement', async () => {
    // Guards the "do NOT touch .py/TS routing" constraint at the join. The .ts
    // descriptor key is `foo:1` (no container), bodySpan lines 1..6.
    const file = path('foo.ts');
    const coverageMap = parseCoberturaContent(cobertura('foo.ts', FOO_LINES), dir);
    expect([...coverageMap.keys()]).toEqual([file]);

    const attributed = await attachCoverage(
      [{ file, method: 'foo', lineStart: 1, lineEnd: 6, cc: 2 }],
      { available: true, error: false, coverageMap }
    );
    expect(attributed[0]!.coveragePercent).toBeCloseTo(66.6667, 3);
  });

  test('a .cs file whose statements are ALL missed reports 0, not null', async () => {
    // null (no attribution) and 0 (attributed, nothing executed) are different
    // facts. Before the fix every .cs method reported null; a repo with fully
    // uncovered C# looked identical to one with no coverage data at all.
    const file = path('Calc.cs');
    const zeroed = cobertura('Calc.cs', CALC_LINES).replace(/hits="1"/g, 'hits="0"');
    const coverageMap = parseCoberturaContent(zeroed, dir);

    const attributed = await attachCoverage(
      [{ file, method: 'Calc.Compute', lineStart: 5, lineEnd: 12, cc: 2 }],
      { available: true, error: false, coverageMap }
    );
    expect(attributed[0]!.coveragePercent).toBe(0);
    expect(attributed[0]!.coverageKind).toBe('stmt');
  });
});

// --------------------------------------------------------- SINGLE-LINE BODIES --
// Cobertura emits statements as whole LINES with `startColumn: 0`
// (coberturaProvider.ts:121). The join in
// @barney-media/crap-typescript-core's coverageAttribution.js:117-124 is
// `spanContains || spanContainsPosition`, and BOTH compare columns whenever
// `candidate.startLine == container.startLine` — `comparePosition` returns
// `leftColumn - rightColumn` for equal lines (coverageAttribution.js:127-133).
//
// The parser anchored a single-line bodySpan at the DECLARATION column (8 for
// an indented member, 12 in GuardClauses), so the containment test read
// `comparePosition(43, 12, 43, 0) <= 0` -> false on both paths. The statement
// was owned by nobody -> coverage null -> changed-function-high-crap
// NOT_EVALUATED -> completeness INCOMPLETE.
//
// Multi-line bodies were never affected: the statement and the span start on
// DIFFERENT lines, `comparePosition` returns `leftLine - rightColumn > 0`
// before the column is ever read.
//
// ponytail: fix lives in the SPAN, not in the shared join — the join is
// node_modules (patched upstream, not ours to widen here) and column-0 for a
// one-line span is the honest Cobertura-compatible answer, not a fudge.
describe('single-line C# method bodies are coverage-visible', () => {
  // Same three shapes as GuardClauses/TriggerBehaviour.cs: an expression-bodied
  // member, a one-liner block-bodied method, and a multi-line method as the
  // control that must stay byte-identical.
  const SINGLE = `namespace Demo
{
    public class Guard
    {
        public bool GuardConditionsMet() => flag;

        public int Note() { return 1; }

        public int Spans(int a)
        {
            if (a > 0)
            {
                return a;
            }
            return 0;
        }
    }
}
`;

  beforeAll(() => {
    writeFileSync(path('single-line.cs'), SINGLE);
  });

  test('a single-line `=>` bodySpan starts at column 0, not at the declaration column', async () => {
    const methods = await parseCsharpFileMethods(path('single-line.cs'));
    const arrow = methods.find(m => m.displayName === 'Guard.GuardConditionsMet')!;
    // The defect itself: startColumn was 8 (the column of `public`), which put
    // the Cobertura statement at column 0 OUTSIDE the span.
    expect(arrow.bodySpan).toEqual({ startLine: 5, startColumn: 0, endLine: 5, endColumn: 49 });
  });

  test('a one-liner BLOCK-bodied method gets the same column-0 anchor', async () => {
    const methods = await parseCsharpFileMethods(path('single-line.cs'));
    const one = methods.find(m => m.displayName === 'Guard.Note')!;
    expect(one.bodySpan).toEqual({ startLine: 7, startColumn: 0, endLine: 7, endColumn: 39 });
  });

  test('startLine/endLine are UNCHANGED — change detection still works', async () => {
    const methods = await parseCsharpFileMethods(path('single-line.cs'));
    expect(methods.map(m => [m.displayName, m.startLine, m.endLine])).toEqual([
      ['Guard.GuardConditionsMet', 5, 5],
      ['Guard.Note', 7, 7],
      ['Guard.Spans', 9, 16],
    ]);
    // bodySpan lines still mirror the descriptor lines — attribution keys on
    // them (attribution.ts:161) and a divergence would drop the join entirely.
    for (const m of methods) {
      expect(m.bodySpan.startLine).toBe(m.startLine);
      expect(m.bodySpan.endLine).toBe(m.endLine);
    }
  });

  test('a MULTI-LINE bodySpan is byte-identical to the pre-fix shape', async () => {
    // The control. Spans spans lines 9..16, starts at `public` (col 8) and
    // ends just past `}` — exactly what the parser emitted before the fix,
    // because it was never coverage-invisible. If this moved, the fix leaked
    // into the path that was already correct.
    const methods = await parseCsharpFileMethods(path('single-line.cs'));
    const multi = methods.find(m => m.displayName === 'Guard.Spans')!;
    expect(multi.bodySpan).toEqual({ startLine: 9, startColumn: 8, endLine: 16, endColumn: 9 });
  });

  test('coverage ATTACHES to both single-line shapes instead of resolving to null', async () => {
    // The end-to-end regression: pre-fix these two read coveragePercent null,
    // which is what turned a real C# repo into completeness INCOMPLETE.
    const file = path('single-line.cs');
    const coverageMap = parseCoberturaContent(
      cobertura('single-line.cs', [[5, 1], [7, 0], [12, 1]]),
      dir
    );
    expect([...coverageMap.keys()]).toEqual([file]);

    const attributed = await attachCoverage(
      [
        { file, method: 'Guard.GuardConditionsMet', lineStart: 5, lineEnd: 5, cc: 1 },
        { file, method: 'Guard.Note', lineStart: 7, lineEnd: 7, cc: 1 },
        { file, method: 'Guard.Spans', lineStart: 9, lineEnd: 16, cc: 3 },
      ],
      { available: true, error: false, coverageMap }
    );

    const byMethod = new Map(attributed.map(a => [a.info.method, a]));
    // Exact values, not just "not null" — null is indistinguishable from a
    // different bug (an empty coverageMap would also produce null here).
    expect(byMethod.get('Guard.GuardConditionsMet')!.coveragePercent).toBe(100);
    expect(byMethod.get('Guard.GuardConditionsMet')!.coverageKind).toBe('stmt');
    // Line 7 reports hits=0: attributed-but-uncovered (0), which is a
    // DIFFERENT fact from the null pre-fix reported.
    expect(byMethod.get('Guard.Note')!.coveragePercent).toBe(0);
    expect(byMethod.get('Guard.Note')!.coverageKind).toBe('stmt');
    expect(byMethod.get('Guard.Spans')!.coveragePercent).toBe(100);
  });

  test('a single-line body missed by every statement reports 0, not null', async () => {
    const file = path('single-line.cs');
    const coverageMap = parseCoberturaContent(
      cobertura('single-line.cs', [[5, 0], [7, 0], [12, 0]]),
      dir
    );
    const attributed = await attachCoverage(
      [{ file, method: 'Guard.GuardConditionsMet', lineStart: 5, lineEnd: 5, cc: 1 }],
      { available: true, error: false, coverageMap }
    );
    expect(attributed[0]!.coveragePercent).toBe(0);
  });
});

// ------------------------------------------- GENERIC METHOD HEADS (G-1) -------
// Every head here ends in `>`, so the name regex (csharpFallbackParser.ts:264)
// could not match and the whole method was SILENTLY DROPPED — no descriptor, no
// span, no coverage attribution. Six CRAPPY methods were invisible that way (see
// the header note). The shapes below are lifted from those six:
//   NCrontab CrontabField.cs:159        Accumulate<T>
//   NCrontab CrontabSchedule.cs:105     TryParse<T>
//   NCrontab Schedule.cs:54             Merge<T>          (static/extension)
//   NCrontab CrontabFieldImpl.cs:182    InternalParse<T>
//   Stateless StateMachine.Async.cs:237 ProcessHandler<TTriggerBehaviour>
//   Stateless StateInfo.cs:38           AddRelationships<TState, TTrigger>
describe('parseCsharpFileMethods: generic method heads are recognised', () => {
  // Line numbers in GENERICS are asserted below, so this fixture is written one
  // line per array entry (never a \n-wrapped template) — index + 1 IS the line.
  const GENERICS = [
    'namespace Nc', // 1
    '{', // 2
    '    public class CrontabField', // 3
    '    {', // 4
    '        public T Accumulate<T>(int a, int b, int c, T init, Func<ExceptionProvider, T> onError)', // 5
    '        {', // 6
    '            var value = init;', // 7
    '            if (a > 0)', // 8
    '            {', // 9
    '                value = Step(a, value, onError);', // 10
    '            }', // 11
    '            else if (b > 0)', // 12
    '            {', // 13
    '                value = Step(b, value, onError);', // 14
    '            }', // 15
    '            for (var i = 0; i < c; i++)', // 16
    '            {', // 17
    '                value = Step(i, value, onError);', // 18
    '            }', // 19
    '            return value;', // 20
    '        }', // 21
    '', // 22
    '        public bool TryParse<T>(string text, ParseOptions? options, Func<CrontabSchedule, T> read, Func<ExceptionProvider, T> onError)', // 23
    '        {', // 24
    '            if (text == null)', // 25
    '            {', // 26
    '                return false;', // 27
    '            }', // 28
    '            return true;', // 29
    '        }', // 30
    '    }', // 31
    '', // 32
    '    public class Schedule', // 33
    '    {', // 34
    '        public static IEnumerable<KeyValuePair<T, DateTime>> Merge<T>(this IEnumerable<KeyValuePair<T, DateTime>> source, Func<KeyValuePair<T, DateTime>, bool> where)', // 35
    '        {', // 36
    '            var outp = new List<KeyValuePair<T, DateTime>>();', // 37
    '            foreach (var pair in source)', // 38
    '            {', // 39
    '                if (where(pair))', // 40
    '                {', // 41
    '                    outp.Add(pair);', // 42
    '                }', // 43
    '            }', // 44
    '            return outp;', // 45
    '            // generator: yields nothing, but the closing `}` is still ours', // 46
    '        }', // 47
    '            }', // 48
    '', // 49
    '    public class CrontabFieldImpl', // 50
    '    {', // 51
    '        public T InternalParse<T>(string text, CrontabFieldAccumulator<T> acc, T onError)', // 52
    '        {', // 53
    '            var value = onError;', // 54
    '            while (text != null)', // 55
    '            {', // 56
    '                value = Parse(text, acc);', // 57
    '                text = null;', // 58
    '            }', // 59
    '            return value;', // 60
    '        }', // 61
    '    }', // 62
    '}', // 63
    '', // 64
    'public class StateMachine<TState, TTrigger>', // 65
    '{', // 66
    '    private void ProcessHandler<TTriggerBehaviour>(object message)', // 67
    '    {', // 68
    '        if (message != null)', // 69
    '        {', // 70
    '            Handle(message);', // 71
    '        }', // 72
    '        else', // 73
    '        {', // 74
    '            Skip();', // 75
    '        }', // 76
    '    }', // 77
    '', // 78
    '    private static void AddRelationships<TState2, TTrigger2>(object info)', // 79
    '    {', // 80
    '        if (info != null)', // 81
    '        {', // 82
    '            Add(info);', // 83
    '        }', // 84
    '    }', // 85
    '}', // 86
    '',
  ].join('\n');

  beforeAll(() => {
    writeFileSync(path('generics.cs'), GENERICS);
  });

  test('all six generic heads are named by their bare method name', async () => {
    const methods = await parseCsharpFileMethods(path('generics.cs'));
    expect(methods.map((m) => m.displayName)).toEqual([
      'CrontabField.Accumulate',
      'CrontabField.TryParse',
      'Schedule.Merge',
      'CrontabFieldImpl.InternalParse',
      'StateMachine.ProcessHandler',
      'StateMachine.AddRelationships',
    ]);
  });

  test('spans run declaration -> closing brace, and bodySpan mirrors them', async () => {
    const methods = await parseCsharpFileMethods(path('generics.cs'));
    expect(methods.map((m) => [m.startLine, m.endLine])).toEqual([
      [5, 21],
      [23, 30],
      [35, 47],
      [52, 61],
      [67, 77],
      [79, 85],
    ]);
    for (const m of methods) {
      expect(m.bodySpan.startLine).toBe(m.startLine);
      expect(m.bodySpan.endLine).toBe(m.endLine);
      // The declaration column, measured per member — not a constant. The four
      // `CrontabField`/`Schedule`/`CrontabFieldImpl` methods sit at 8 spaces;
      // `StateMachine` is declared at column 0, so its members start at 4.
      expect(methods.map((m) => m.bodySpan.startColumn)).toEqual([8, 8, 8, 8, 4, 4]);
    }
    // Exact span for the multi-parameter shape: `}` at 0-based col 8 on line 21.
    expect(methods[0]!.bodySpan).toEqual({
      startLine: 5,
      startColumn: 8,
      endLine: 21,
      endColumn: 9,
    });
  });

  test('a generic head still gets its own body branch-counted (CC is not 1)', async () => {
    const methods = await parseCsharpFileMethods(path('generics.cs'));
    // Base 1 + if + else-if + for = 4; + foreach + if = 3 for Merge, etc.
    expect(methods.map((m) => m.complexity)).toEqual([4, 2, 3, 2, 2, 2]);
  });
});

describe('parseCsharpFileMethods: the generic stripper opens no new members', () => {
  // Regression lock for the guards `signatureOf` already had. Every head below
  // carries `<...>` because that is the risk the stripper introduces: it edits
  // the very string those guards read. If stripping changed a rejection into an
  // acceptance, a FIELD or a PROPERTY would surface as a phantom method.
  const GENERIC_GUARDS = [
    'class G',
    '{',
    '    static readonly Dictionary<string,int> Map = new()', // target-typed new() + generic type
    '    {',
    '        { "a", 1 }',
    '    };',
    '    private readonly Func<int,int> _f = new Func<int,int>((a, b) => a + b);',
    '    public string Name => "not a method";',
    '    public IReadOnlyList<int> Items => new List<int>();',
    '    public Dictionary<string, Func<int,int>> Lookup => new Dictionary<string, Func<int,int>>();',
    '    public int Real(int x) { if (x > 0) { } else { } return x; }',
    '    public T Echo<T>(T value) { return value; }',
    '}',
    '',
  ].join('\n');

  beforeAll(() => {
    writeFileSync(path('generic-guards.cs'), GENERIC_GUARDS);
  });

  test('generic fields, lambda fields and `=>` properties are still not methods', async () => {
    expect((await parseCsharpFileMethods(path('generic-guards.cs'))).map((m) => m.displayName)).toEqual([
      'G.Real',
      'G.Echo',
    ]);
  });

  test('an unbalanced `<` leaves the head untouched — same misname as before, not a new one', async () => {
    const file = path('generic-unbalanced.cs');
    writeFileSync(
      file,
      ['class U', '{', '    public T Broken<T(int x) { return default(T); }', '    public int Ok(int y) { if (y > 0) { } else { } return y; }', '}', ''].join('\n')
    );
    // PRE-EXISTING, NOT INTRODUCED HERE: `public T Broken<T` ends in the
    // identifier `T`, so the name regex has always matched it and reported the
    // method under the name `T`. The stripper gives up on an unclosed `<` and
    // hands the head back byte-identical, so this stays `U.T` — pinned as a
    // parity lock (the stripper must not make malformed source worse), NOT as
    // an endorsement of the name. Fixing it is a separate, out-of-scope change.
    expect((await parseCsharpFileMethods(file)).map((m) => m.displayName)).toEqual(['U.T', 'U.Ok']);
  });

  test('a stray `>` with no `<` is still dropped (no stripper path at all)', async () => {
    const file = path('generic-stray-gt.cs');
    writeFileSync(
      file,
      ['class S', '{', '    public int Broken>(int x) { if (x > 0) { } else { } return x; }', '    public int Ok(int y) { if (y > 0) { } else { } return y; }', '}', ''].join('\n')
    );
    // No `<` means the stripper early-returns the head untouched, so this is
    // byte-identical to pre-fix behaviour: the head ends in `>`, the name regex
    // finds no identifier, and the malformed head yields nothing.
    expect((await parseCsharpFileMethods(file)).map((m) => m.displayName)).toEqual(['S.Ok']);
  });
});

describe('parseCsharpFileMethods: nested generic head (DECLARED LIMITATION)', () => {
  // Documented limitation, pinned as CURRENT behaviour so a future change to it
  // is a deliberate act. The stripper counts `<>` depth rather than matching
  // `<.*?>`, so a NESTED argument list is removed whole — this is NOT a blind
  // spot. The surviving limitation is an UNBALANCED bracket (see the previous
  // block), because an unclosed `<` makes the stripper give up and hand the head
  // back unchanged, which the name regex then rejects.
  test('a nested argument list in the return type keeps the method visible', async () => {
    const file = path('nested-generic.cs');
    writeFileSync(
      file,
      [
        'class N',
        '{',
        '    public Func<Func<int>> Make<T>(int seed)',
        '    {',
        '        if (seed > 0) { } else { }',
        '        return () => () => seed;',
        '    }',
        '',
        '    public IEnumerable<KeyValuePair<T, DateTime>> Merge<T>(IEnumerable<KeyValuePair<T, DateTime>> src)',
        '    {',
        '        return src;',
        '    }',
        '}',
        '',
      ].join('\n')
    );
    const methods = await parseCsharpFileMethods(file);
    expect(methods.map((m) => m.displayName)).toEqual(['N.Make', 'N.Merge']);
    expect(methods[0]!.complexity).toBe(2);
  });
});