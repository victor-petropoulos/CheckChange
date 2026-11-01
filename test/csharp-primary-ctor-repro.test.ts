import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseCsharpFileMethods } from '../src/complexity-providers/csharpFallbackParser.js';

// REGRESSION (permanent): a primary-constructor type declaration
// (`record X(P)`, `record struct X(P)`, `class X(P)`) must contribute its BODY
// members, never a phantom method named after the type.
//
// Historical bug (was csharpFallbackParser.ts:319-324 + :427-435, pre-fix): the
// first token of `public record CtorRecord(int X)` is `public`, which is NOT in
// STATEMENT_KEYWORDS (record/class/struct are, but they are not FIRST), so
// isMethodHead returned a Signature, pushMember emitted the phantom, and
// `i = close + 1` skipped the entire body — every real member silently dropped.
// Fixed by a CONTAINER_RE guard at the top of isMethodHead (csharpFallbackParser.ts). A second,
// independent defect is pinned here too: `record struct NormalStruct(int Y)`
// must yield container `NormalStruct`, not `struct` (CONTAINER_RE first-
// alternation). Both assertions are exact-value, so a regression names the
// wrong descriptor rather than merely failing a count.
const SOURCE = `public record CtorRecord(int X)
{
    public int Sum(int a)
    {
        if (a > 0) return a;
        return 0;
    }
}

public record struct NormalStruct(int Y)
{
    public int S(int a)
    {
        if (a > 0) return a;
        return 0;
    }
}

public class PrimaryCtorClass(int Z)
{
    public int M(int a)
    {
        if (a > 0) return a;
        return 0;
    }
}
`;

let dir: string;
const path = (f: string) => join(dir, f);

beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), 'cc-cs-primary-ctor-'));
  writeFileSync(path('repro.cs'), SOURCE);
});

afterAll(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe('primary-constructor type declarations', () => {
  test('real body members Sum / S / M are found with their own complexity', async () => {
    const methods = await parseCsharpFileMethods(path('repro.cs'));
    const byName = new Map(methods.map((m) => [m.displayName, m.complexity]));
    expect(byName.get('CtorRecord.Sum')).toBe(2); // base 1 + if
    expect(byName.get('NormalStruct.S')).toBe(2);
    expect(byName.get('PrimaryCtorClass.M')).toBe(2);
  });

  test('no phantom method named after the type declaration itself', async () => {
    const methods = await parseCsharpFileMethods(path('repro.cs'));
    const names = methods.map((m) => m.displayName).sort();
    // Exact expected set — any phantom (CtorRecord / NormalStruct /
    // PrimaryCtorClass without a member suffix) fails this equality.
    expect(names).toEqual(['CtorRecord.Sum', 'NormalStruct.S', 'PrimaryCtorClass.M']);
  });
});
