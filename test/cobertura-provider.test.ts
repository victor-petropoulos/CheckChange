import { describe, expect, test } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { parseCoberturaContent, CoberturaParseError } from '../src/coverage-providers/coberturaProvider';

// Statements carry a source span, not a line-number key. Look a unit up by its
// start line so these assertions stay keyed to what the <line> element described.
function hitsFor(
  statements: ReadonlyArray<{ span: { startLine: number }; hits: number }>,
  startLine: number
): number | undefined {
  return statements.find(u => u.span.startLine === startLine)?.hits;
}

describe('Cobertura provider parsing', () => {
  test('should parse valid Cobertura XML with line data', () => {
    const xml = `<?xml version="1.0" ?>
<coverage line-rate="0.5" branch-rate="0.5" version="1.9">
  <sources>
    <source>.</source>
  </sources>
  <packages>
    <package name="Sample" line-rate="0.5">
      <classes>
        <class name="Program" filename="src/Program.cs" line-rate="0.5">
          <lines>
            <line number="10" hits="1" branch="false" />
            <line number="11" hits="0" branch="false" />
            <line number="12" hits="7" branch="true" condition-coverage="50% (1/2)" />
          </lines>
        </class>
      </classes>
    </package>
  </packages>
</coverage>
`;
    const coverageMap = parseCoberturaContent(xml, '/project');
    expect(coverageMap).toBeInstanceOf(Map);
    expect(coverageMap.size).toBe(1);
    const fileKey = '/project/src/Program.cs'; // filename normalized against cwd
    expect(coverageMap.has(fileKey)).toBe(true);
    const fileCoverage = coverageMap.get(fileKey)!;
    expect(fileCoverage).toHaveProperty('statements');
    expect(fileCoverage).toHaveProperty('branches');
    expect(fileCoverage).toHaveProperty('functions');
    expect(fileCoverage.statements).toHaveLength(3); // one unit per <line>
    expect(hitsFor(fileCoverage.statements, 10)).toBe(1);
    expect(hitsFor(fileCoverage.statements, 11)).toBe(0);
    expect(hitsFor(fileCoverage.statements, 12)).toBe(7);
    // Column info does not exist in Cobertura — spans are line-wide with column 0
    expect(fileCoverage.statements[0]!.span).toEqual({
      startLine: 10,
      startColumn: 0,
      endLine: 10,
      endColumn: 0
    });
  });

  test('should NOT fabricate a branches array from branch="true" lines', () => {
    // LCOV precedent: BRDA is ignored, branches is always [] (lcovProvider.ts:79).
    // A Cobertura branch="true" line must not change that.
    const xml = `<?xml version="1.0" ?>
<coverage version="1.9">
  <packages>
    <package name="Sample">
      <classes>
        <class name="Program" filename="src/Program.cs">
          <lines>
            <line number="10" hits="3" branch="true" condition-coverage="50% (1/2)" />
            <line number="11" hits="1" branch="true" condition-coverage="100% (2/2)" />
          </lines>
        </class>
      </classes>
    </package>
  </packages>
</coverage>
`;
    const fileCoverage = parseCoberturaContent(xml, '/project').get('/project/src/Program.cs')!;
    expect(fileCoverage.branches).toHaveLength(0);
    expect(fileCoverage.functions).toHaveLength(0);
    expect(fileCoverage.statements).toHaveLength(2);
  });

  test('should parse multiple classes and resolve them against <source>', () => {
    const xml = `<?xml version="1.0" ?>
<coverage version="1.9">
  <sources>
    <source>/project</source>
  </sources>
  <packages>
    <package name="Sample">
      <classes>
        <class name="A" filename="src/A.cs">
          <lines><line number="1" hits="1" branch="false" /></lines>
        </class>
        <class name="B" filename="src/B.cs">
          <lines><line number="2" hits="0" branch="false" /><line number="3" hits="4" branch="false" /></lines>
        </class>
      </classes>
    </package>
  </packages>
</coverage>
`;
    const coverageMap = parseCoberturaContent(xml, '/project');
    expect([...coverageMap.keys()]).toEqual(['/project/src/A.cs', '/project/src/B.cs']);
    expect(coverageMap.get('/project/src/A.cs')!.statements).toHaveLength(1);
    expect(coverageMap.get('/project/src/B.cs')!.statements).toHaveLength(2);
    expect(hitsFor(coverageMap.get('/project/src/B.cs')!.statements, 3)).toBe(4);
  });

  test('should decode XML entities in a filename', () => {
    const xml = `<?xml version="1.0" ?>
<coverage version="1.9">
  <sources><source>.</source></sources>
  <packages><package name="S"><classes>
    <class name="C" filename="src/R&amp;D.cs"><lines><line number="1" hits="1" /></lines></class>
  </classes></package></packages>
</coverage>
`;
    const coverageMap = parseCoberturaContent(xml, '/project');
    expect(coverageMap.has('/project/src/R&D.cs')).toBe(true);
  });

  test('should skip a class with no filename attribute (missing path)', () => {
    const xml = `<?xml version="1.0" ?>
<coverage version="1.9">
  <packages><package name="S"><classes>
    <class name="NoFile"><lines><line number="1" hits="1" /></lines></class>
    <class name="Good" filename="src/Good.cs"><lines><line number="1" hits="1" /></lines></class>
  </classes></package></packages>
</coverage>
`;
    const coverageMap = parseCoberturaContent(xml, '/project');
    expect(coverageMap.size).toBe(1);
    expect(coverageMap.has('/project/src/Good.cs')).toBe(true);
  });

  test('should rebase an absolute cross-checkout path onto cwd by longest existing suffix', () => {
    // Coverlet writes an absolute <source> root. When the artifact is replayed
    // in a different checkout, the absolute prefix no longer exists and the key
    // must be rebased onto cwd — the suffix-rebase idea of coverage.ts:302-336.
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'cobertura-cwd-'));
    fs.mkdirSync(path.join(cwd, 'src'));
    fs.writeFileSync(path.join(cwd, 'src', 'Program.cs'), 'class Program {}');
    // A source root from a machine that no longer exists on this filesystem.
    const foreign = path.join(os.tmpdir(), 'foreign-checkout-does-not-exist', 'checkout');
    try {
      const xml = `<?xml version="1.0" ?>
<coverage version="1.9">
  <sources><source>${foreign}</source></sources>
  <packages><package name="S"><classes>
    <class name="Program" filename="src/Program.cs"><lines><line number="1" hits="2" /></lines></class>
  </classes></package></packages>
</coverage>
`;
      const coverageMap = parseCoberturaContent(xml, cwd);
      expect([...coverageMap.keys()]).toEqual([path.join(cwd, 'src', 'Program.cs')]);
      expect(hitsFor(coverageMap.get(path.join(cwd, 'src', 'Program.cs'))!.statements, 1)).toBe(2);
    } finally {
      fs.rmSync(cwd, { recursive: true, force: true });
    }
  });

  test('should drop an absolute outside-cwd class path that shares no existing suffix', () => {
    // Documented resolution: normalizePath returns null when the path escapes
    // cwd AND no suffix candidate exists on disk (coberturaProvider.ts:158,
    // 182) — flush() then skips the class. A relative cwd is required for the
    // suffix-loop candidates to come out relative, which is the only way
    // isWithinCwd's resolve branch (line 147) executes; with absolute cwds
    // every candidate is absolute and that branch never runs.
    const cwdAbs = fs.mkdtempSync(path.join(os.tmpdir(), 'cobertura-nosuffix-'));
    const cwd = path.relative(process.cwd(), cwdAbs);
    // Foreign root does not exist under tmpdir either, so no suffix candidate
    // can exist on disk.
    const foreignRoot = path.join(os.tmpdir(), 'no-such-foreign-root');
    const foreign = path.join(foreignRoot, 'checkout', 'Widget.cs');
    try {
      const xml = `<?xml version="1.0" ?>
<coverage version="1.9">
  <sources><source>${foreignRoot}</source></sources>
  <packages><package name="S"><classes>
    <class name="Widget" filename="${foreign}"><lines><line number="1" hits="1" /></lines></class>
  </classes></package></packages>
</coverage>
`;
      const coverageMap = parseCoberturaContent(xml, cwd);
      // Actual behavior: dropped (null from normalizePath), not rebased and
      // not keyed under the foreign absolute path.
      expect(coverageMap.size).toBe(0);
      expect(coverageMap.has(foreign)).toBe(false);
    } finally {
      fs.rmSync(cwdAbs, { recursive: true, force: true });
    }
  });

  test('should skip classes whose path escapes cwd', () => {
    const escaping = `<?xml version="1.0" ?>
<coverage version="1.9">
  <packages><package name="S"><classes>
    <class name="Escape" filename="../../../etc/passwd"><lines><line number="1" hits="1" /></lines></class>
  </classes></package></packages>
</coverage>
`;
    expect(parseCoberturaContent(escaping, '/project').size).toBe(0);

    const absoluteEscape = `<?xml version="1.0" ?>
<coverage version="1.9">
  <packages><package name="S"><classes>
    <class name="Escape" filename="/etc/passwd"><lines><line number="1" hits="1" /></lines></class>
  </classes></package></packages>
</coverage>
`;
    expect(parseCoberturaContent(absoluteEscape, '/project').size).toBe(0);
  });

  test('should keep a valid class alongside an escaping one', () => {
    const xml = `<?xml version="1.0" ?>
<coverage version="1.9">
  <packages><package name="S"><classes>
    <class name="Escape" filename="../../outside.cs"><lines><line number="1" hits="1" /></lines></class>
    <class name="Good" filename="src/valid.cs"><lines><line number="1" hits="9" /></lines></class>
  </classes></package></packages>
</coverage>
`;
    const coverageMap = parseCoberturaContent(xml, '/project');
    expect(coverageMap.size).toBe(1);
    expect(coverageMap.has('/project/src/valid.cs')).toBe(true);
  });

  test('should skip non-numeric line numbers and hits (record-level garbage)', () => {
    // Mirrors parseLcovContent: a bad `DA:` line is skipped, not fatal.
    const xml = `<?xml version="1.0" ?>
<coverage version="1.9">
  <packages><package name="S"><classes>
    <class name="C" filename="src/C.cs"><lines>
      <line number="one" hits="1" />
      <line number="2" hits="many" />
      <line number="3" hits="5" />
    </lines></class>
  </classes></package></packages>
</coverage>
`;
    const fileCoverage = parseCoberturaContent(xml, '/project').get('/project/src/C.cs')!;
    expect(fileCoverage.statements).toHaveLength(1);
    expect(hitsFor(fileCoverage.statements, 3)).toBe(5);
  });

  test('should let a repeated line number overwrite (LCOV DA overwrite precedent)', () => {
    const xml = `<?xml version="1.0" ?>
<coverage version="1.9">
  <packages><package name="S"><classes>
    <class name="C" filename="src/C.cs"><lines>
      <line number="7" hits="1" />
      <line number="7" hits="42" />
    </lines></class>
  </classes></package></packages>
</coverage>
`;
    const fileCoverage = parseCoberturaContent(xml, '/project').get('/project/src/C.cs')!;
    expect(fileCoverage.statements).toHaveLength(1);
    expect(hitsFor(fileCoverage.statements, 7)).toBe(42);
  });

  test('should handle empty content', () => {
    expect(parseCoberturaContent('', '/project').size).toBe(0);
    expect(parseCoberturaContent('   \n  \n', '/project').size).toBe(0);
  });

  test('should handle a coverage element with no classes', () => {
    const xml = `<?xml version="1.0" ?>
<coverage line-rate="1" branch-rate="1" version="1.9">
  <packages />
</coverage>
`;
    expect(parseCoberturaContent(xml, '/project').size).toBe(0);
  });

  describe('malformed input throws a typed error mapping to reason "malformed"', () => {
    test('throws CoberturaParseError when the <coverage> root is absent', () => {
      const xml = `<?xml version="1.0" ?>\n<notcoverage><packages /></notcoverage>\n`;
      let caught: unknown;
      try {
        parseCoberturaContent(xml, '/project');
      } catch (e) {
        caught = e;
      }
      expect(caught).toBeInstanceOf(CoberturaParseError);
      // Carries the EXISTING CoverageResult.reason value — no new reason string.
      expect((caught as CoberturaParseError).reason).toBe('malformed');
      expect((caught as Error).message).toMatch(/no <coverage> root element/);
    });

    test('throws CoberturaParseError on a truncated document', () => {
      const truncated = `<?xml version="1.0" ?>\n<coverage><packages><package><classes><class filename="src/A.cs"><lines><line number="1" hits="1" />`;
      let caught: unknown;
      try {
        parseCoberturaContent(truncated, '/project');
      } catch (e) {
        caught = e;
      }
      expect(caught).toBeInstanceOf(CoberturaParseError);
      expect((caught as CoberturaParseError).reason).toBe('malformed');
      expect((caught as Error).message).toMatch(/truncated/);
    });

    test('throws CoberturaParseError when content exceeds the size limit', () => {
      const overLimit = 'x'.repeat(100 * 1024 * 1024 + 1); // 100MB + 1 byte
      expect(() => parseCoberturaContent(overLimit, '/project')).toThrowError(
        /Cobertura content exceeds maximum allowed size of 104857600 bytes/
      );
      expect(() => parseCoberturaContent(overLimit, '/project')).toThrowError(CoberturaParseError);
    });

    test('throws CoberturaParseError when there are too many lines', () => {
      let content = '<coverage>\n';
      for (let i = 0; i < 1_000_002; i++) {
        content += '\n';
      }
      expect(() => parseCoberturaContent(content, '/project')).toThrowError(
        /Cobertura contains too many lines \(over 1,000,000\)/
      );
    });
  });
});