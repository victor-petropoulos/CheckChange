/// <reference types="node" />
import { describe, test, expect, afterEach } from 'vitest';
import { promises as fs, rmSync } from 'fs';
import * as path from 'path';
import * as os from 'os';
import { readCoverage } from '../../src/coverage.js';

// COVERAGE_FILE_MALFORMED extension contract (option b): explicit coverage
// file that is LCOV-by-extension (.info/.lcov), parses to an empty map, and
// carries NO SF:/DA: token is garbage — not a valid zero-record artifact.
// Seam: src/coverage.ts readCoverage(cwd, coverageFile) explicit-file lane →
// readCoverageFile(..., true) → detectCoverageFormat → parseLcovContent.
// Distinct from coverage-errors.test.ts (mocked readCoverage: cannot exercise
// the real-file parse lane) and cli-malformed-coverage.spec.ts (JSON.parse
// throw lane). Valid LCOV with SF: + zero DA: stays lenient.

describe('coverage-malformed-empty (real-file readCoverage seam)', () => {
  let tempDir: string | undefined;

  afterEach(() => {
    if (tempDir !== undefined) {
      rmSync(tempDir, { recursive: true, force: true });
      tempDir = undefined;
    }
  });

  async function fixture(name: string, content: string): Promise<string> {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'coverage-malformed-empty-'));
    await fs.writeFile(path.join(tempDir, name), content);
    return tempDir;
  }

  test('garbage .info (no SF:/DA: token) → malformed, error true, map null', async () => {
    const dir = await fixture('garbage.info', 'this is not lcov\n~!@#$ garbage line\n');
    const result = await readCoverage(dir, 'garbage.info');
    expect(result.available).toBe(true);
    expect(result.coverageMap).toBeNull();
    expect(result.error).toBe(true);
    expect(result.reason).toBe('malformed');
  });

  test('garbage .lcov (no SF:/DA: token) → malformed, error true, map null', async () => {
    const dir = await fixture('garbage.lcov', 'this is not lcov\n~!@#$ garbage line\n');
    const result = await readCoverage(dir, 'garbage.lcov');
    expect(result.available).toBe(true);
    expect(result.coverageMap).toBeNull();
    expect(result.error).toBe(true);
    expect(result.reason).toBe('malformed');
  });

  test('GREEN pin: valid SF:-only zero-DA LCOV stays lenient (empty map, no error)', async () => {
    const dir = await fixture('sf-only.info', 'SF:src/empty.ts\nend_of_record\n');
    const result = await readCoverage(dir, 'sf-only.info');
    expect(result.available).toBe(true);
    expect(result.error).toBe(false);
    expect(result.coverageMap).not.toBeNull();
    expect(result.coverageMap!.size).toBe(0);
  });

  test('GREEN pin: valid SF:+DA: LCOV stays lenient (map size 1, no error)', async () => {
    const dir = await fixture(
      'valid.info',
      'SF:src/valid.ts\nDA:1,1\nDA:2,0\nend_of_record\n'
    );
    const result = await readCoverage(dir, 'valid.info');
    expect(result.available).toBe(true);
    expect(result.error).toBe(false);
    expect(result.coverageMap).not.toBeNull();
    expect(result.coverageMap!.size).toBe(1);
  });
});
