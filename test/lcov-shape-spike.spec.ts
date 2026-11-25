import { describe, expect, test, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseFileMethods } from '@barney-media/crap-typescript-core';
import { parseLcovContent } from '../src/coverage-providers/lcovProvider';
import { attachCoverage } from '../src/attribution';
import type { CoverageResult } from '../src/coverage';

// RED spike for tech-debt row 2.1 (docs/tech-debt.md:22).
//
// Seam under test (unmocked, no vi.mock of @barney-media/crap-typescript-core):
//   parseLcovContent  ->  CoverageResult.coverageMap  ->  attachCoverage  ->  coverageForMethods
//
// Before Task 2, parseLcovContent emitted raw Istanbul keys
// (statementMap/s/branchMap/b/fnMap/f), while the core package's
// parseCoverageReport emitted FileCoverage ({statements,branches,functions}) and
// coverageForMethods read only the latter (coverageAttribution.js:8,13,19). This
// file pinned that mismatch as an executed, failing fact on unmodified main; Task 2
// fixed the parser and turned these assertions green.
describe('LCOV entry shape matches what the core package reads (row 2.1 spike)', () => {
  let cwd: string;
  let absFixture: string;

  const FIXTURE = `export function covered(): number {
  return 1;
}
export function uncovered(): number {
  return 2;
}
`;

  // line 3 = covered() body, line 6 = uncovered() body
  const LCOV = `TN:
SF:src/spike.ts
DA:3,1
DA:6,0
end_of_record
`;

  beforeEach(() => {
    cwd = mkdtempSync(join(tmpdir(), 'lcov-shape-spike-'));
    mkdirSync(join(cwd, 'src'), { recursive: true });
    absFixture = join(cwd, 'src', 'spike.ts');
    writeFileSync(absFixture, FIXTURE, 'utf8');
  });

  afterEach(() => {
    rmSync(cwd, { recursive: true, force: true });
  });

  test('entry carries FileCoverage shape {statements,branches,functions}', () => {
    const coverageMap = parseLcovContent(LCOV, cwd);
    expect(coverageMap.size).toBe(1);
    const entry = coverageMap.get(absFixture);

    // Shape the core package's parseCoverageReport guarantees
    // (coverageUnits.d.ts:21-25) and coverageForMethods consumes.
    expect(entry).toHaveProperty('statements');
    expect(entry).toHaveProperty('branches');
    expect(entry).toHaveProperty('functions');
  });

  test('LCOV report attributes method-level coverage through the real seam', async () => {
    const descriptors = await parseFileMethods(absFixture);
    expect(descriptors.length).toBeGreaterThan(0);

    const complexityInfo = descriptors.map(d => ({
      file: 'src/spike.ts',
      method: d.functionName,
      lineStart: d.startLine,
      lineEnd: d.endLine,
      cc: 1
    }));

    const coverageResult: CoverageResult = {
      available: true,
      error: false,
      coverageMap: parseLcovContent(LCOV, cwd)
    };

    const attributed = await attachCoverage(complexityInfo, coverageResult);
    expect(attributed).toHaveLength(complexityInfo.length);

    // An LCOV report must yield a coverage percentage per method. A bare null here
    // is the silent degradation this spike exists to expose.
    for (const entry of attributed) {
      expect(entry.coveragePercent, `${entry.info.method} got no coverage`).not.toBeNull();
    }
  });
});