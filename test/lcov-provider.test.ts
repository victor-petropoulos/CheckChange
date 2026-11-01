import { describe, expect, test } from 'vitest';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseLcovContent } from '../src/coverage-providers/lcovProvider';

// Statements carry a source span, not a line-number key. Look a unit up by its
// start line so these assertions stay keyed to what the DA record described.
function hitsFor(
  statements: ReadonlyArray<{ span: { startLine: number }; hits: number }>,
  startLine: number
): number | undefined {
  return statements.find(u => u.span.startLine === startLine)?.hits;
}

describe('LCOV provider parsing', () => {
  test('should parse valid LCOV with line data', () => {
    const lcov = `
TN:
SF:src/example.ts
FN:3,anonymous_0
FNDA:1,anonymous_0
FN:4,exampleFunction
FNDA:1,exampleFunction
DA:1,10
DA:2,5
DA:3,0
DA:4,8
LH:3
LF:4
end_of_record
`;
    const coverageMap = parseLcovContent(lcov, '/project');
    expect(coverageMap).toBeInstanceOf(Map);
    expect(coverageMap.size).toBe(1);
    const fileKey = '/project/src/example.ts'; // normalized to absolute
    expect(coverageMap.has(fileKey)).toBe(true);
    const fileCoverage = coverageMap.get(fileKey)!;
    expect(fileCoverage).toHaveProperty('statements');
    expect(fileCoverage).toHaveProperty('branches');
    expect(fileCoverage).toHaveProperty('functions');
    // Check statements: one unit per DA line, in source line order
    expect(fileCoverage.statements).toHaveLength(4); // 4 statements
    expect(hitsFor(fileCoverage.statements, 1)).toBe(10);
    expect(hitsFor(fileCoverage.statements, 2)).toBe(5);
    expect(hitsFor(fileCoverage.statements, 3)).toBe(0);
    expect(hitsFor(fileCoverage.statements, 4)).toBe(8);
  });

  test('should handle empty LCOV', () => {
    const lcov = '';
    const coverageMap = parseLcovContent(lcov, '/project');
    expect(coverageMap.size).toBe(0);
  });

  test('should handle malformed LCOV (should still return what it can)', () => {
    const lcov = `
SF:src/file.ts
DA:1,invalid
DA:2,5
`;
    const coverageMap = parseLcovContent(lcov, '/project');
    expect(coverageMap.size).toBe(1);
    const fileKey = '/project/src/file.ts';
    expect(coverageMap.has(fileKey)).toBe(true);
    const fileCoverage = coverageMap.get(fileKey)!;
    // Only the valid DA line should be parsed
    expect(fileCoverage.statements).toHaveLength(1); // only line 2
    expect(hitsFor(fileCoverage.statements, 2)).toBe(5);
    // line 1 should be skipped because hitCount is not a number
    expect(hitsFor(fileCoverage.statements, 1)).toBeUndefined();
  });

  test('should handle LCOV with function coverage (ignore FN/FNDA)', () => {
    const lcov = `
TN:
SF:src/fn.ts
FN:1,myFunc
FNDA:1,myFunc
DA:1,10
DA:2,0
LH:1
LF:2
end_of_record
`;
    const coverageMap = parseLcovContent(lcov, '/project');
    const fileKey = '/project/src/fn.ts';
    expect(coverageMap.has(fileKey)).toBe(true);
    const fileCoverage = coverageMap.get(fileKey)!;
    // Should have two statements (lines 1 and 2)
    expect(fileCoverage.statements).toHaveLength(2);
    expect(hitsFor(fileCoverage.statements, 1)).toBe(10);
    expect(hitsFor(fileCoverage.statements, 2)).toBe(0);
    // Function and branch data are ignored, so those arrays should be empty
    expect(fileCoverage.functions).toHaveLength(0);
    expect(fileCoverage.branches).toHaveLength(0);
  });

test('should normalize paths correctly', () => {
     const lcov = `
     SF:src/foo.ts
     DA:1,5
     end_of_record
     `;
     const coverageMap = parseLcovContent(lcov, '/home/user/project');
     const fileKey = '/home/user/project/src/foo.ts';
     expect(coverageMap.has(fileKey)).toBe(true);
     // Also test that a relative path in LCOV is made absolute
     const lcov2 = `
     SF:foo.ts
     DA:1,5
     end_of_record
     `;
     const coverageMap2 = parseLcovContent(lcov2, '/home/user/project');
     const fileKey2 = '/home/user/project/foo.ts';
     expect(coverageMap2.has(fileKey2)).toBe(true);
   });

   test('should skip LCOV entries that escape cwd', () => {
     // Test relative path that escapes
     const lcovRelative = `
     SF:../../../etc/passwd
     DA:1,10
     end_of_record
     `;
     const coverageMap = parseLcovContent(lcovRelative, '/project');
     expect(coverageMap.size).toBe(0);

     // Test absolute path that escapes
     const lcovAbsolute = `
     SF:/etc/passwd
     DA:1,10
     end_of_record
     `;
     const coverageMap2 = parseLcovContent(lcovAbsolute, '/project');
     expect(coverageMap2.size).toBe(0);

     // Test a valid file still works
     const lcovValid = `
     SF:src/valid.ts
     DA:1,10
     end_of_record
     `;
     const coverageMap3 = parseLcovContent(lcovValid, '/project');
     expect(coverageMap3.size).toBe(1);
     expect(coverageMap3.has('/project/src/valid.ts')).toBe(true);
   });

  // ====================== WS3.1: `.cs` join + uncovered branches =================
  // Measured uncovered in src/coverage-providers/lcovProvider.ts before this block
  // (see .opencode/validation/csharp-depth-closeout-gaps.md): stmts 37,38,39,46,97,116,
  // 123,126; fn anonymous_1@46; br 36,38,54,96,115,123,125. Each test below names the
  // line it closes.
  describe('LCOV SF-flush: a second SF: record finalizes the previous file', () => {
    // lcovProvider.ts:36 — `if (currentFile && Object.keys(statements).length > 0)`.
    // Reached only when a SECOND `SF:` arrives while statements are still pending, so
    // every pre-existing single-SF test leaves this branch at count 0.
    test('flushes the previous file when a second SF: record starts', () => {
      const lcov = [
        'SF:src/First.cs',
        'DA:1,10',
        'DA:2,5',
        'end_of_record',
        'SF:src/Second.cs',
        'DA:7,3',
        'end_of_record',
      ].join('\n');

      const coverageMap = parseLcovContent(lcov, '/project');

      // First.cs was flushed BY THE MID-STREAM SF:, not by the trailing flush at :74.
      // :46 is the arrow fn `Object.keys(statements).forEach(k => delete statements[k])`
      // — without the reset, Second.cs would inherit First.cs's two statements.
      expect(coverageMap.size).toBe(2);
      expect(coverageMap.has('/project/src/First.cs')).toBe(true);
      expect(coverageMap.has('/project/src/Second.cs')).toBe(true);

      const first = coverageMap.get('/project/src/First.cs')!;
      const second = coverageMap.get('/project/src/Second.cs')!;
      expect(first.statements).toHaveLength(2);
      expect(hitsFor(first.statements, 1)).toBe(10);
      expect(hitsFor(first.statements, 2)).toBe(5);
      // The reset is what keeps the flushed statements off the second record.
      expect(second.statements).toHaveLength(1);
      expect(hitsFor(second.statements, 7)).toBe(3);
      expect(hitsFor(second.statements, 1)).toBeUndefined();
      expect(hitsFor(second.statements, 2)).toBeUndefined();
    });

    // lcovProvider.ts:38 — `if (normalized !== null)` inside the flush. An escaping
    // pending file must be SKIPPED (no map entry) and must not abort the record.
    test('a flushed file that escapes cwd is dropped without aborting the record', () => {
      const lcov = [
        'SF:../../../etc/passwd',
        'DA:1,10',
        'end_of_record',
        'SF:src/Kept.cs',
        'DA:9,4',
        'end_of_record',
      ].join('\n');

      const coverageMap = parseLcovContent(lcov, '/project');

      // The escaping file contributes nothing; the sibling AFTER it still lands.
      expect(coverageMap.has('/etc/passwd')).toBe(false);
      expect(coverageMap.size).toBe(1);
      expect(coverageMap.has('/project/src/Kept.cs')).toBe(true);
      expect(hitsFor(coverageMap.get('/project/src/Kept.cs')!.statements, 9)).toBe(4);
    });

    // Guards the flush against a regression that would silently drop the LAST file:
    // the mid-stream flush and the :74 trailing flush are two independent code paths,
    // and the record above proves only that the mid-stream one ran.
    test('a single SF: record still lands via the trailing flush', () => {
      const coverageMap = parseLcovContent(['SF:src/Only.cs', 'DA:3,6', 'end_of_record'].join('\n'), '/project');

      expect(coverageMap.size).toBe(1);
      expect(hitsFor(coverageMap.get('/project/src/Only.cs')!.statements, 3)).toBe(6);
    });
  });

  describe('LCOV absolute-path rebasing (normalizePath)', () => {
    // lcovProvider.ts:115 — `if (isWithinCwd(filePath, cwd)) return filePath`. An
    // absolute SF path already inside cwd short-circuits BEFORE the rebase loop.
    test('an absolute SF path already inside cwd is kept verbatim', () => {
      const coverageMap = parseLcovContent(['SF:/project/src/Inside.cs', 'DA:5,2', 'end_of_record'].join('\n'), '/project');

      expect(coverageMap.size).toBe(1);
      // Verbatim means the key is the SF path itself — no rebase, no re-resolution.
      expect([...coverageMap.keys()]).toEqual(['/project/src/Inside.cs']);
      expect(hitsFor(coverageMap.get('/project/src/Inside.cs')!.statements, 5)).toBe(2);
    });

    // lcovProvider.ts:125 — `if (fs.existsSync(candidate)) return candidate`. This is
    // the rebase SUCCESS path: a foreign-root absolute path whose tail exists under cwd.
    // Measured: for SF:/foreign/root/src/Foo.cs the loop walks
    // i=1 cwd/foreign/root/src/Foo.cs (absent), i=2 cwd/root/src/Foo.cs (absent),
    // i=3 cwd/src/Foo.cs (PRESENT) and returns there.
    test('an absolute SF path from a foreign root is rebased onto cwd when the suffix exists', () => {
      const cwd = mkdtempSync(join(tmpdir(), 'lcov-rebase-'));
      try {
        mkdirSync(join(cwd, 'src'), { recursive: true });
        writeFileSync(join(cwd, 'src', 'Foo.cs'), 'namespace Foo;\n', 'utf8');

        const coverageMap = parseLcovContent(
          ['SF:/foreign/root/src/Foo.cs', 'DA:12,7', 'end_of_record'].join('\n'),
          cwd
        );

        expect(coverageMap.size).toBe(1);
        // The rebased candidate is keyed under cwd — this is the whole point of :125.
        expect([...coverageMap.keys()]).toEqual([join(cwd, 'src', 'Foo.cs')]);
        expect(hitsFor(coverageMap.get(join(cwd, 'src', 'Foo.cs'))!.statements, 12)).toBe(7);
      } finally {
        rmSync(cwd, { recursive: true, force: true });
      }
    });

    // lcovProvider.ts:123 — `if (rel.startsWith('..') || path.isAbsolute(rel)) continue`.
    // Only an ABSOLUTE SF path containing a literal `..` segment reaches the rebase
    // loop with an escaping candidate (a relative escaping SF resolves at :110 and
    // returns null at :112 before the loop). Measured for
    // SF:/foreign/../etc/passwd with cwd /project: i=2 yields /etc/passwd, rel
    // `../etc/passwd` -> this continue.
    test('the suffix rebase skips candidates that escape cwd', () => {
      const cwd = mkdtempSync(join(tmpdir(), 'lcov-escape-'));
      try {
        // Both suffixes are absent, so the loop runs to exhaustion and returns null
        // at :132 — proving the `continue` did not `return` on the escaping candidate.
        const coverageMap = parseLcovContent(
          ['SF:/foreign/../etc/passwd', 'DA:1,10', 'end_of_record'].join('\n'),
          cwd
        );

        expect(coverageMap.size).toBe(0);
      } finally {
        rmSync(cwd, { recursive: true, force: true });
      }
    });

    // lcovProvider.ts:125 false arm + the :123 continue in one document. The escaping
    // candidate is skipped AND a present-but-later suffix is found, so a regression
    // that removed the `continue` would `return` the escaping path instead.
    test('an escaping rebase candidate is skipped and a later valid suffix still wins', () => {
      const cwd = mkdtempSync(join(tmpdir(), 'lcov-escape-ok-'));
      try {
        mkdirSync(join(cwd, 'src'), { recursive: true });
        writeFileSync(join(cwd, 'src', 'Bar.cs'), 'namespace Bar;\n', 'utf8');

        const coverageMap = parseLcovContent(
          ['SF:/foreign/../elsewhere/src/Bar.cs', 'DA:4,1', 'end_of_record'].join('\n'),
          cwd
        );

        expect(coverageMap.size).toBe(1);
        expect([...coverageMap.keys()]).toEqual([join(cwd, 'src', 'Bar.cs')]);
      } finally {
        rmSync(cwd, { recursive: true, force: true });
      }
    });

    // lcovProvider.ts:96 — `if (!path.isAbsolute(filePath)) filePath = path.resolve(cwd, filePath)`
    // inside isWithinCwd. UNREACHABLE from parseLcovContent: both callers pass an
    // already-resolved absolute path (:110 resolves relative; :115 is only reached for
    // an absolute input). Recorded as untested in the gaps file rather than reached
    // through an exported seam that does not exist.
    test('a relative SF path is resolved against cwd before the join', () => {
      const coverageMap = parseLcovContent(['SF:src/Rel.cs', 'DA:8,1', 'end_of_record'].join('\n'), '/project');

      expect([...coverageMap.keys()]).toEqual(['/project/src/Rel.cs']);
    });
  });

  test('should throw error when LCOV content exceeds size limit', () => {
    const overLimit = 'x'.repeat(100 * 1024 * 1024 + 1); // 100MB + 1 byte
    expect(() => parseLcovContent(overLimit, '/project')).toThrowError(/LCOV content exceeds maximum allowed size of 104857600 bytes/);
  });

  test('should throw error when LCOV contains too many lines', () => {
    // Create 1,000,002 lines (each line empty, plus newline)
    let content = '';
    for (let i = 0; i < 1000002; i++) {
      content += '\n';
    }
    expect(() => parseLcovContent(content, '/project')).toThrowError(/LCOV contains too many lines \(over 1,000,000\)/);
  });
});