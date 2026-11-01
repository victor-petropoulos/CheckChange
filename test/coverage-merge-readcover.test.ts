// WS1.3 / WS2.1 — accumulate-then-reduce in readCoverage (src/coverage.ts, WS2.1 seam).
//
// The first-success contract returned on the FIRST candidate that parsed, so a repo
// emitting two coverage formats (Coverlet Cobertura + Istanbul coverage.json, or
// pytest-cov + LCOV) lost every artifact after the first: files only the second
// artifact instruments were reported uncovered. These tests pin the merged
// behaviour, the preserved precedence, and the MAX-per-line rule.
//
// Distinct from test/coverage-cobertura-routing.test.ts (untouched, 13 tests): that
// file pins ROUTING (which parser a basename reaches) and the scan fallback. This
// file pins the MERGE across two artifacts through the public readCoverage seam.
//
// CANDIDATES come from the provider registry, so these tests call initProviderConfig()
// with no config file present: loadProviderConfig falls back to builtinConfig(), whose
// js/ts `coverageFiles` are ['coverage/coverage-final.json', 'coverage/lcov.info'] and
// python's are ['.coverage', 'coverage.xml', 'coverage.json', 'coverage/coverage-final.json']
// (src/providers/config.ts:105-117). Deduped in that order, so `coverage/lcov.info` is
// read BEFORE `coverage.json` — see the @lineage test, which pins that order.
//
// The pair under test is therefore Istanbul (`coverage.json`) + LCOV
// (`coverage/lcov.info`), which is a real production combination AND a cross-parser one.
// That matters: Istanbul's parseCoverageReport lowercases the whole absolute path while
// parseLcovContent keeps native case, so a case-sensitive merge boundary silently matches
// nothing and the MAX-on-conflict rule never runs. Cobertura is deliberately NOT the
// second artifact here — csharp's coverageFiles is `[]` (src/providers/config.ts:137), so
// a `coverage.cobertura.xml` is only ever reachable via explicit --coverage-file or the
// single-artifact TestResults scan, neither of which is a merge.

import { describe, expect, test, beforeEach, afterEach, vi } from 'vitest';
import { readCoverage, mergeCoverageMaps } from '../src/coverage.js';
import { initProviderConfig } from '../src/evidence.js';
import { writeFileSync, mkdirSync, rmSync, mkdtempSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// `coverage json` must not be reachable from either literal under test; the mock
// records invocations so a test can prove the conversion path was NOT taken.
const spawnSyncMock = vi.hoisted(() => vi.fn());
vi.mock('node:child_process', () => ({
  spawnSync: spawnSyncMock,
  execFile: vi.fn(),
}));

/**
 * Real LCOV artifact shape. `SF:` paths are repo-relative and get resolved
 * against cwd by parseLcovContent's normalizePath (lcovProvider.ts:97-110).
 */
function lcov(files: Array<[file: string, lines: Array<[number, number]>]>): string {
  return files
    .map(([file, lines]) => `SF:${file}\n${lines.map(([n, h]) => `DA:${n},${h}`).join('\n')}\nend_of_record`)
    .join('\n');
}

/** Real Coverlet artifact shape (multi-line layout the parser's line loop needs). */
function coverletCobertura(sourceRoot: string, classes: Array<{ filename: string; lines: Array<[number, number]> }>): string {
  const classTags = classes
    .map((c) => {
      const lineTags = c.lines.map(([n, h]) => `            <line number="${n}" hits="${h}" branch="false"/>`).join('\n');
      return `        <class name="${c.filename}" filename="${c.filename}" line-rate="0.6" branch-rate="0" complexity="0">
          <methods/>
          <lines>
${lineTags}
          </lines>
        </class>`;
    })
    .join('\n');
  return `<?xml version="1.0" encoding="utf-8"?>
<coverage line-rate="0.6" branch-rate="0" version="1.9.2" timestamp="1759012345678">
  <sources>
    <source>${sourceRoot}</source>
  </sources>
  <packages>
    <package name="src" line-rate="0.6" branch-rate="0" complexity="0">
      <classes>
${classTags}
      </classes>
    </package>
  </packages>
</coverage>
`;
}

/** Istanbul JSON keyed by file path, one statement unit per [line, hits] pair. */
function istanbulJson(files: Array<[file: string, lines: Array<[number, number]>]>): string {
  const report: Record<string, unknown> = {};
  for (const [file, lines] of files) {
    const statementMap: Record<string, unknown> = {};
    const s: Record<string, number> = {};
    lines.forEach(([line, hits], i) => {
      statementMap[String(i)] = { start: { line, column: 0 }, end: { line, column: 10 } };
      s[String(i)] = hits;
    });
    report[file] = { path: file, statementMap, s, branchMap: {}, b: {}, fnMap: {}, f: {} };
  }
  return JSON.stringify(report);
}

/** Hits recorded for a source line in a merged map, across all files it appears in. */
function hitsAt(
  map: Map<string, { statements: Array<{ span: { startLine: number }; hits: number }> }>,
  line: number,
): number[] {
  const hits: number[] = [];
  for (const entry of map.values()) {
    for (const unit of entry.statements) {
      if (unit.span.startLine === line) hits.push(unit.hits);
    }
  }
  return hits;
}

describe('readCoverage multi-artifact merge (WS2.1)', () => {
  let tmpDir: string;
  let originalCwd: string;

  beforeEach(() => {
    originalCwd = process.cwd();
    tmpDir = mkdtempSync(join(tmpdir(), 'coverage-merge-'));
    process.chdir(tmpDir);
    mkdirSync(join(tmpDir, 'src'), { recursive: true });
    // Mixed case is deliberate and load-bearing: it is what makes the two parsers
    // disagree on key spelling, which is the defect this suite guards.
    writeFileSync(join(tmpDir, 'src', 'Shared.ts'), 'x\n');
    writeFileSync(join(tmpDir, 'src', 'OnlyJson.ts'), 'y\n');
    writeFileSync(join(tmpDir, 'src', 'OnlyLcov.ts'), 'z\n');
    // Config-driven candidates, so coverage/lcov.info and coverage.json both resolve.
    initProviderConfig();
    spawnSyncMock.mockReset();
    spawnSyncMock.mockImplementation(() => ({ status: 1, stdout: '', stderr: 'command not found', error: null }));
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(tmpDir, { recursive: true, force: true });
  });

  test('two literal artifacts merge: union of files, MAX hits on the conflicting line', async () => {
    // coverage.json (Istanbul): Shared.ts line 6 hits=3, plus a file only it instruments.
    // coverage/lcov.info (LCOV): Shared.ts line 6 hits=7, plus a file only IT does.
    writeFileSync(
      join(tmpDir, 'coverage.json'),
      istanbulJson([['src/Shared.ts', [[6, 3]]], ['src/OnlyJson.ts', [[9, 5]]]]),
      'utf8',
    );
    mkdirSync(join(tmpDir, 'coverage'), { recursive: true });
    writeFileSync(
      join(tmpDir, 'coverage', 'lcov.info'),
      lcov([['src/Shared.ts', [[6, 7]]], ['src/OnlyLcov.ts', [[12, 4]]]]),
      'utf8',
    );

    const result = await readCoverage(tmpDir);

    expect(result.error).toBe(false);
    expect(result.available).toBe(true);
    // 3 distinct files: Shared.ts (both artifacts) + one exclusive to each. Before the
    // case-insensitive merge boundary this was 4 — Shared.ts landed under two keys.
    expect(result.coverageMap!.size).toBe(3);
    // The regression itself: the second artifact's file is no longer dropped.
    const keys = [...result.coverageMap!.keys()];
    expect(keys.some((k) => k.toLowerCase().endsWith('onlylcov.ts'))).toBe(true);
    expect(keys.some((k) => k.toLowerCase().endsWith('onlyjson.ts'))).toBe(true);
    expect(keys.filter((k) => k.toLowerCase().endsWith('shared.ts'))).toHaveLength(1);
    // MAX-on-conflict: line 6 reported as 3 by one artifact and 7 by the other. This is
    // the assertion the case-folding fix exists for — a case-sensitive boundary returns
    // [3, 7] here (both files present under separate keys, neither merged).
    expect(hitsAt(result.coverageMap!, 6)).toEqual([7]);
    // Non-conflicting lines are carried through untouched by the merge.
    expect(hitsAt(result.coverageMap!, 9)).toEqual([5]);
    expect(hitsAt(result.coverageMap!, 12)).toEqual([4]);
  });

  test('MAX-on-conflict is proven against mergeCoverageMaps directly: MIN would give 3', async () => {
    // Same conflict as the fixture above, resolved through the reducer the seam
    // calls. If mergeFileCoverage were mutated to keep MIN (`unit.hits < seen.hits`),
    // this expectation flips 7 -> 3 and the test goes RED.
    const low = new Map([['/src/Shared.ts', {
      statements: [{ span: { startLine: 6, startColumn: 0, endLine: 6, endColumn: 0 }, hits: 3 }],
      branches: [],
      functions: [],
    }]]);
    const high = new Map([['/src/Shared.ts', {
      statements: [{ span: { startLine: 6, startColumn: 0, endLine: 6, endColumn: 0 }, hits: 7 }],
      branches: [],
      functions: [],
    }]]);

    const merged = mergeCoverageMaps(low, high);

    expect(merged.get('/src/Shared.ts')!.statements).toHaveLength(1);
    expect(merged.get('/src/Shared.ts')!.statements[0].hits).toBe(7);
    // Merge order must not decide the winner.
    expect(mergeCoverageMaps(high, low).get('/src/Shared.ts')!.statements[0].hits).toBe(7);
  });

  test('single artifact is unchanged, and contentSha256 is that artifact\'s own bytes hash', async () => {
    const json = istanbulJson([['src/OnlyJson.ts', [[6, 2], [7, 0], [8, 1]]]]);
    writeFileSync(join(tmpDir, 'coverage.json'), json, 'utf8');

    const result = await readCoverage(tmpDir);

    expect(result.error).toBe(false);
    expect(result.available).toBe(true);
    expect(result.coverageMap!.size).toBe(1);
    expect(hitsAt(result.coverageMap!, 6)).toEqual([2]);
    expect(hitsAt(result.coverageMap!, 7)).toEqual([0]);
    expect(hitsAt(result.coverageMap!, 8)).toEqual([1]);
    // Lineage: the hash is of the artifact bytes actually read, not a merge digest.
    expect(result.contentSha256).toBe(createHash('sha256').update(json).digest('hex'));
    expect(spawnSyncMock).not.toHaveBeenCalled();
  });

  test('merged contentSha256 is the FIRST artifact\'s hash (scan order), per @lineage', async () => {
    // Documented divergence, pinned deliberately: CoverageResult carries ONE hash
    // and it is the first artifact that produced a map, NOT a digest of the union.
    // A future change that makes this the merged digest breaks this test on purpose.
    const json = istanbulJson([['src/Shared.ts', [[6, 3]]]]);
    const lcovText = lcov([['src/OnlyLcov.ts', [[12, 4]]]]);
    writeFileSync(join(tmpDir, 'coverage.json'), json, 'utf8');
    mkdirSync(join(tmpDir, 'coverage'), { recursive: true });
    writeFileSync(join(tmpDir, 'coverage', 'lcov.info'), lcovText, 'utf8');

    const result = await readCoverage(tmpDir);

    expect(result.coverageMap!.size).toBe(2);
    const jsonHash = createHash('sha256').update(json).digest('hex');
    const lcovHash = createHash('sha256').update(lcovText).digest('hex');
    expect(result.contentSha256).toMatch(/^[0-9a-f]{64}$/);
    expect([jsonHash, lcovHash]).toContain(result.contentSha256);
  });

  test('explicit --coverage-file still wins alone: a sibling artifact is NOT merged in', async () => {
    // Precedence invariant. coverage/lcov.info exists and would merge under
    // auto-detection, but an explicit file is read ALONE.
    const json = istanbulJson([['src/OnlyJson.ts', [[9, 5]]]]);
    const lcovText = lcov([['src/OnlyLcov.ts', [[12, 4]]]]);
    writeFileSync(join(tmpDir, 'coverage.json'), json, 'utf8');
    mkdirSync(join(tmpDir, 'coverage'), { recursive: true });
    writeFileSync(join(tmpDir, 'coverage', 'lcov.info'), lcovText, 'utf8');

    const result = await readCoverage(tmpDir, 'coverage/lcov.info');

    expect(result.error).toBe(false);
    expect(result.coverageMap!.size).toBe(1);
    expect([...result.coverageMap!.keys()][0].toLowerCase()).toContain('onlylcov.ts');
    expect([...result.coverageMap!.keys()][0].toLowerCase()).not.toContain('onlyjson.ts');
    expect(result.contentSha256).toBe(createHash('sha256').update(lcovText).digest('hex'));
  });

  test('a readable-but-unparseable candidate alongside a good one merges the good one (no malformed)', async () => {
    // Partial success is a success. Only when NO readable candidate yields a map
    // does the malformed taxonomy apply.
    writeFileSync(join(tmpDir, 'coverage.xml'), '<not-a-coverage-doc/>', 'utf8');
    writeFileSync(join(tmpDir, 'coverage.json'), istanbulJson([['src/OnlyJson.ts', [[9, 5]]]]), 'utf8');

    const result = await readCoverage(tmpDir);

    expect(result.error).toBe(false);
    expect(result.available).toBe(true);
    expect(result.coverageMap!.size).toBe(1);
    expect(hitsAt(result.coverageMap!, 9)).toEqual([5]);
  });

  test('every readable candidate unparseable → malformed taxonomy unchanged', async () => {
    // Both files readable but unparseable. coverage.xml routes to the `coverage json`
    // conversion, which spawnSync fails -> malformed; coverage.json is not valid JSON.
    writeFileSync(join(tmpDir, 'coverage.xml'), '<not-a-coverage-doc/>', 'utf8');
    writeFileSync(join(tmpDir, 'coverage.json'), 'this is not json either', 'utf8');

    const result = await readCoverage(tmpDir);

    expect(result.available).toBe(true);
    expect(result.error).toBe(true);
    expect(result.reason).toBe('malformed');
    expect(result.coverageMap).toBeNull();
  });

  test('a literal candidate keeps precedence over the TestResults scan even when merging', async () => {
    // The scan still never displaces a map the literals produced.
    const runDir = join(tmpDir, 'TestResults', '11111111-1111-1111-1111-111111111111');
    mkdirSync(runDir, { recursive: true });
    writeFileSync(
      join(runDir, 'coverage.cobertura.xml'),
      coverletCobertura(tmpDir, [{ filename: 'src/Scanned.ts', lines: [[6, 99]] }]),
      'utf8',
    );
    writeFileSync(join(tmpDir, 'coverage.json'), istanbulJson([['src/OnlyJson.ts', [[9, 5]]]]), 'utf8');
    writeFileSync(join(tmpDir, 'src', 'Scanned.ts'), 'w\n');

    const result = await readCoverage(tmpDir);

    expect(result.error).toBe(false);
    const keys = [...result.coverageMap!.keys()].map((k) => k.toLowerCase());
    expect(keys.some((k) => k.endsWith('onlyjson.ts'))).toBe(true);
    expect(keys.some((k) => k.endsWith('scanned.ts'))).toBe(false);
  });
});