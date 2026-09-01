import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest';
import { spawnSync } from 'node:child_process';
import { readFileSync, existsSync, writeFileSync, mkdtempSync, rmSync, copyFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { collectPythonComplexity } from './pythonComplexity.js';
import { readPythonCoverage } from './pythonCoverage.js';

// Mock node:child_process globally for spawnSync tests
vi.mock('node:child_process', () => ({
  spawnSync: vi.fn()
}));

describe('pythonComplexity fault injection', () => {
  test('missing lizard binary (ENOENT) returns empty array', async () => {
    vi.mocked(spawnSync).mockReturnValue({
      status: 1,
      signal: null,
      stdout: '',
      stderr: 'spawn ENOENT',
      error: { code: 'ENOENT' } as any,
      pid: 0,
      output: ['', '']
    } as any);

    const result = await collectPythonComplexity('/tmp');

    expect(result).toEqual([]);
    expect(spawnSync).toHaveBeenCalled();
  });

  test('lizard command fails (non-zero exit) returns empty array', async () => {
    vi.mocked(spawnSync).mockReturnValue({
      status: 1,
      signal: null,
      stdout: '',
      stderr: 'command not found',
      error: { code: 'spawnStatus' } as any,
      pid: 0,
      output: ['', '']
    } as any);

    const result = await collectPythonComplexity('/tmp');

    expect(result).toEqual([]);
  });

  test('spawnSync throws ENOENT caught gracefully', async () => {
    vi.mocked(spawnSync).mockImplementation(() => {
      throw new Error('spawn ENOENT');
    });

    const result = await collectPythonComplexity('/tmp');

    expect(result).toEqual([]);
  });

  test('shell command failure handled gracefully', async () => {
    // Mock to simulate shell command returning non-zero status
    vi.mocked(spawnSync)
      .mockReturnValueOnce({
        status: 0,
        signal: null,
        stdout: 'src/sample.py\n',
        stderr: '',
        error: undefined,
        pid: 0,
        output: ['src/sample.py\n', '']
      } as any)
      .mockReturnValueOnce({
        status: 1,
        signal: null,
        stdout: '',
        stderr: 'lizard: command not found',
        error: { code: 'ENOENT' } as any,
        pid: 0,
        output: ['', 'lizard: command not found']
      } as any);

    const result = await collectPythonComplexity('/tmp');

    expect(result).toEqual([]);
  });
});

describe('pythonCoverage fault injection', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'wp13-coverage-'));
  });

  test('missing coverage.json returns {available:false, coverageMap:null, error:false}', async () => {
    const result = await readPythonCoverage(tmpDir, 'coverage.json');

    expect(result).toEqual({ available: false, coverageMap: null, error: false });
  });

  test('malformed JSON coverage file returns {available:true, coverageMap:null, error:true, reason:"malformed"}', async () => {
    const malformedFile = join(tmpDir, 'coverage.json');
    writeFileSync(malformedFile, '{ invalid json content', 'utf8');

    const result = await readPythonCoverage(tmpDir, 'coverage.json');

    expect(result).toEqual({
      available: true,
      coverageMap: null,
      error: true,
      reason: 'malformed'
    });
  });

  test('valid coverage.json with files object returns {available:true, coverageMap:Map, error:false}', async () => {
    const validCoverage = {
      files: {
        'sample.py': {
          executed_lines: [1, 2, 3],
          missing_lines: [4, 5],
          functions: {
            'test_func': {
              start_line: 1,
              executed_lines: [1, 2]
            }
          },
          summary: {
            percent_covered: 60,
            percent_branches_covered: 50
          }
        }
      }
    };

    const coverageFile = join(tmpDir, 'coverage.json');
    writeFileSync(coverageFile, JSON.stringify(validCoverage), 'utf8');

    const result = await readPythonCoverage(tmpDir, 'coverage.json');

    expect(result.available).toBe(true);
    expect(result.error).toBe(false);
    expect(result.coverageMap).toBeInstanceOf(Map);
    expect(result.coverageMap?.size).toBe(1);
  });

  test('coverage.json with missing files property returns error:true', async () => {
    const incompleteCoverage = { status: 'passed' };
    const coverageFile = join(tmpDir, 'coverage.json');
    writeFileSync(coverageFile, JSON.stringify(incompleteCoverage), 'utf8');

    const result = await readPythonCoverage(tmpDir, 'coverage.json');

    expect(result).toEqual({
      available: true,
      coverageMap: null,
      error: true,
      reason: 'malformed'
    });
  });

  test('coverage.json with empty files object returns empty map', async () => {
    const emptyCoverage = { files: {} };
    const coverageFile = join(tmpDir, 'coverage.json');
    writeFileSync(coverageFile, JSON.stringify(emptyCoverage), 'utf8');

    const result = await readPythonCoverage(tmpDir, 'coverage.json');

    expect(result.available).toBe(true);
    expect(result.error).toBe(false);
    expect(result.coverageMap).toBeInstanceOf(Map);
    expect(result.coverageMap?.size).toBe(0);
  });

  test('coverage.json with null functions handled gracefully', async () => {
    const coverage = {
      files: {
        'sample.py': {
          executed_lines: [1, 2],
          missing_lines: [3],
          functions: null
        }
      }
    };
    const coverageFile = join(tmpDir, 'coverage.json');
    writeFileSync(coverageFile, JSON.stringify(coverage), 'utf8');

    const result = await readPythonCoverage(tmpDir, 'coverage.json');

    expect(result.available).toBe(true);
    expect(result.error).toBe(false);
    expect(result.coverageMap?.size).toBe(1);
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });
});
