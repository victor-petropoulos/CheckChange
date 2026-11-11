import { describe, expect, test, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseFileMethods } from '@barney-media/crap-typescript-core';
import { attachCoverage, type AttributedComplexity } from '../src/attribution';
import type { ComplexityInfo } from '../src/complexity';
import type { CoverageResult } from '../src/coverage';

// RED: pins key-space mismatch; goes GREEN after task 2 cwd normalization.
// Seam under test (unmocked, real parsers, no vi.mock of
// @barney-media/crap-typescript-core):
//   src/attribution.ts attachCoverage() (:35-77) / matchingComplexityForFile() (:92-116)
// Coverage-map keys arrive ABSOLUTE (parseLcovContent/normalizeCoveragePaths
// resolve to cwd-absolute); complexity info.file values are RELATIVE repo
// paths (src/complexity.ts:128-138 `relative(cwd, filePath)`).
// matchingComplexityForFile suffix-matches the absolute coverage key against
// each relative complexity path; exactly one match wins, ambiguous
// multi-match declines attribution (null coverage / coverageKind null).
//
// Bug pinned here: with TWO complexity rels where one is a suffix of the
// other (`src/helper.ts` and `helper.ts`), one absolute coverage key
// (`<cwd>/src/helper.ts`) suffix-matches BOTH -> ambiguous -> decline, so a
// covered file reports coverageKind null. Task 2 adds optional cwd to
// attachCoverage and matches absolute-vs-absolute (path.resolve(cwd, rel)),
// leaving only the exact match -> attributes.
//
// Contract pinned by the attachWithCwd helper below: attachCoverage gains
// an optional trailing `cwd?: string` param. Before task 2 the extra arg is
// ignored by the runtime (RED); after task 2 it drives absolute resolution
// (GREEN). The helper casts forward so the file typechecks both before and
// after with no edit.

type AttachWithCwd = (
  complexityInfo: ComplexityInfo[],
  coverageResult: CoverageResult,
  cwd: string,
) => Promise<AttributedComplexity[]>;

const attachWithCwd = attachCoverage as unknown as AttachWithCwd;

const FIXTURE_SRC_HELPER = `export function coveredHelper(): number {
  return 1;
}
`;

const FIXTURE_ROOT_HELPER = `export function rootHelper(): number {
  return 2;
}
`;

const FIXTURE_ONLY = `export function onlyFn(): number {
  return 42;
}
`;

// FileCoverage shape per src/coverage-providers/lcovProvider.ts:14:
// statements Array<{ span: { startLine, startColumn, endLine, endColumn }, hits }>,
// branches [], functions []. Lines 1..50 all hits=1 over-covers any small
// fixture function bodySpan, so statement attribution succeeds once matched.
function allCoveredFileCoverage(): { statements: Array<{ span: { startLine: number; startColumn: number; endLine: number; endColumn: number }; hits: number }>; branches: []; functions: [] } {
  const statements = [];
  for (let line = 1; line <= 50; line += 1) {
    statements.push({
      span: { startLine: line, startColumn: 0, endLine: line, endColumn: 0 },
      hits: 1,
    });
  }
  return { statements, branches: [], functions: [] };
}

async function complexityFor(cwd: string, rel: string): Promise<ComplexityInfo[]> {
  const absPath = join(cwd, rel);
  const descriptors = await parseFileMethods(absPath);
  return descriptors.map((d) => ({
    file: rel,
    method: d.containerName ? `${d.containerName}.${d.functionName}` : d.functionName,
    lineStart: d.startLine,
    lineEnd: d.endLine,
    cc: d.complexity,
  }));
}

describe('attribution path normalization (task 1 RED pin)', () => {
  let cwd: string;

  beforeEach(() => {
    cwd = mkdtempSync(join(tmpdir(), 'attribution-path-norm-'));
    mkdirSync(join(cwd, 'src'), { recursive: true });
  });

  afterEach(() => {
    rmSync(cwd, { recursive: true, force: true });
  });

  test('control: single unambiguous rel attributes coverage (green before and after)', async () => {
    writeFileSync(join(cwd, 'src', 'only.ts'), FIXTURE_ONLY, 'utf8');

    const complexityInfo = await complexityFor(cwd, 'src/only.ts');
    expect(complexityInfo.length).toBeGreaterThan(0);

    const absKey = join(cwd, 'src', 'only.ts');
    const coverageMap = new Map([[absKey, allCoveredFileCoverage()]]);
    const coverageResult: CoverageResult = { available: true, error: false, coverageMap } as unknown as CoverageResult;

    const result = await attachWithCwd(complexityInfo, coverageResult, cwd);

    expect(result).toHaveLength(complexityInfo.length);
    const only = result.find((r) => r.info.file === 'src/only.ts');
    expect(only).toBeDefined();
    expect(only!.coveragePercent).toBe(100);
    expect(only!.coverageKind).toBe('stmt');
  });

  test('RED: suffix-ambiguous rels decline a covered file (green after task 2 cwd normalization)', async () => {
    writeFileSync(join(cwd, 'src', 'helper.ts'), FIXTURE_SRC_HELPER, 'utf8');
    writeFileSync(join(cwd, 'helper.ts'), FIXTURE_ROOT_HELPER, 'utf8');

    const complexityInfo = [
      ...(await complexityFor(cwd, 'src/helper.ts')),
      ...(await complexityFor(cwd, 'helper.ts')),
    ];
    expect(complexityInfo.map((c) => c.file)).toEqual(['src/helper.ts', 'helper.ts']);

    // One absolute coverage key for the covered file only. This key
    // suffix-matches BOTH rels today (endsWith 'src/helper.ts' and endsWith
    // 'helper.ts'), so matchingComplexityForFile declines the whole file.
    const absCoveredKey = join(cwd, 'src', 'helper.ts');
    const coverageMap = new Map([[absCoveredKey, allCoveredFileCoverage()]]);
    const coverageResult: CoverageResult = { available: true, error: false, coverageMap } as unknown as CoverageResult;

    const result = await attachWithCwd(complexityInfo, coverageResult, cwd);

    expect(result).toHaveLength(complexityInfo.length);
    const srcEntry = result.find((r) => r.info.file === 'src/helper.ts');
    const rootEntry = result.find((r) => r.info.file === 'helper.ts');
    expect(srcEntry).toBeDefined();
    expect(rootEntry).toBeDefined();

    // After task 2 absolute-vs-absolute matching disambiguates: only the
    // exact `src/helper.ts` file attributes; `helper.ts` stays uncovered.
    expect(srcEntry!.coveragePercent).toBe(100);
    expect(srcEntry!.coverageKind).toBe('stmt');
    expect(rootEntry!.coveragePercent).toBeNull();
    expect(rootEntry!.coverageKind).toBeNull();
  });
});
