import { describe, expect, test, beforeEach, afterEach } from 'vitest';
import { detectCoverageFormat } from './coverage.js';
import { writeFileSync, mkdirSync, rmSync, mkdtempSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

describe('detectCoverageFormat', () => {
  let tmpDir: string;
  let originalCwd: string;

  beforeEach(() => {
    originalCwd = process.cwd();
    tmpDir = mkdtempSync(join(tmpdir(), 'detect-format-test-'));
    process.chdir(tmpDir);
    mkdirSync(join(tmpDir, 'src'), { recursive: true });
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(tmpDir, { recursive: true, force: true });
  });

  function tempFilesCleaned(): boolean {
    return !readdirSync(tmpDir).some((f: string) => f.startsWith('.checkchange-coverage-temp'));
  }

  const istanbulJson = {
    'src/example.py': {
      statementMap: { '0': { start: { line: 1, column: 0 }, end: { line: 1, column: 10 } } },
      s: { '0': 1 },
      branchMap: {}, b: {}, fnMap: {}, f: {},
    },
  };

  test('LCOV by content (TN:/SF:/DA: sniff, no .info/.lcov extension)', async () => {
    const content = 'TN:Test\nSF:src/example.py\nDA:1,10\nDA:2,0\nend_of_record\n';
    const file = join(tmpDir, 'cov.txt');
    writeFileSync(file, content, 'utf8');

    const map = await detectCoverageFormat(content, file, tmpDir, false, false);

    expect(map.size).toBeGreaterThan(0);
  });

  test('LCOV by extension (isLcovByExt=true, non-LCOV content ignored)', async () => {
    const content = 'not real lcov content at all';
    const file = join(tmpDir, 'cov.info');
    writeFileSync(file, content, 'utf8');

    // Extension wins: parsed as LCOV lines, no throw.
    const map = await detectCoverageFormat(content, file, tmpDir, true, false);
    expect(map).toBeInstanceOf(Map);
  });

  test('Istanbul JSON parses directly (alreadyConverted=true skips transform sniff)', async () => {
    const file = join(tmpDir, 'coverage-final.json');
    writeFileSync(file, JSON.stringify(istanbulJson), 'utf8');

    const map = await detectCoverageFormat(JSON.stringify(istanbulJson), file, tmpDir, false, true);

    expect(map.size).toBeGreaterThan(0);
    expect(map.has(join(tmpDir, 'src/example.py')) || [...map.keys()].some((k: string) => k.endsWith('src/example.py'))).toBe(true);
  });

  test('Python coverage JSON (files key + meta) transforms to Istanbul and cleans temp', async () => {
    const pythonJson = {
      meta: { version: '7.0' },
      files: {
        'src/example.py': {
          executed_lines: [1, 2],
          missing_lines: [3],
          excluded_lines: [],
          num_statements: 3,
          num_excluded: 0,
          num_missing: 1,
          num_branches: 0,
          num_partial_branches: 0,
          covered_lines: 2,
        },
      },
      totals: { covered_lines: 2, num_statements: 3, percent_covered: 66.67 },
    };
    const file = join(tmpDir, 'coverage.json');
    writeFileSync(file, JSON.stringify(pythonJson), 'utf8');

    const map = await detectCoverageFormat(JSON.stringify(pythonJson), file, tmpDir, false, false);

    expect(map.size).toBeGreaterThan(0);
    expect(tempFilesCleaned()).toBe(true);
  });

  test('Python JSON with summary (no meta) detected', async () => {
    const pythonJson = {
      summary: { covered_lines: 1, num_statements: 1 },
      files: {
        'src/sum.py': {
          executed_lines: [1],
          missing_lines: [],
          excluded_lines: [],
          num_statements: 1,
          num_excluded: 0,
          num_missing: 0,
          num_branches: 0,
          num_partial_branches: 0,
          covered_lines: 1,
        },
      },
    };
    const file = join(tmpDir, 'coverage.json');
    writeFileSync(file, JSON.stringify(pythonJson), 'utf8');

    const map = await detectCoverageFormat(JSON.stringify(pythonJson), file, tmpDir, false, false);
    expect(map.size).toBeGreaterThan(0);
  });

  test('non-JSON content falls through to istanbul parse without transform', async () => {
    const file = join(tmpDir, 'coverage.json');
    writeFileSync(file, '{ not json at all', 'utf8');

    // JSON.parse fails inside helper; parseCoverageReport throws on garbage file.
    await expect(detectCoverageFormat('{ not json at all', file, tmpDir, false, false)).rejects.toThrow();
  });
});