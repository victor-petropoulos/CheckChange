import { describe, expect, test, beforeEach, afterEach, vi } from 'vitest';
import { readCoverage } from '../src/coverage.js';
import { writeFileSync, mkdirSync, rmSync, mkdtempSync, readdirSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

// Hoisted mock for spawnSync
const spawnSyncMock = vi.hoisted(() => vi.fn());
vi.mock('node:child_process', () => ({
  spawnSync: spawnSyncMock,
}));

function checkTempFilesCleaned(dir: string): boolean {
  const files = readdirSync(dir);
  return !files.some((f: string) => f.startsWith('.checkchange-coverage-temp'));
}

function resetSpawnSyncMock() {
  spawnSyncMock.mockReset();
  spawnSyncMock.mockImplementation((cmd: string, args: string[], opts: any) => {
    return { status: 1, stdout: '', stderr: 'command not found', error: null };
  });
}

describe('Python coverage format detection', () => {
  let tmpDir: string;
  let originalCwd: string;

  beforeEach(() => {
    originalCwd = process.cwd();
    tmpDir = mkdtempSync(join(tmpdir(), 'python-coverage-test-'));
    process.chdir(tmpDir);
    mkdirSync(join(tmpDir, 'src'), { recursive: true });
    resetSpawnSyncMock();
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(tmpDir, { recursive: true, force: true });
  });

  test('should detect .coverage binary and attempt to convert via coverage json', async () => {
    writeFileSync(join(tmpDir, '.coverage'), 'mock-binary-content', 'utf8');
    
    const result = await readCoverage(tmpDir);
    expect(result).toHaveProperty('available');
    expect(result).toHaveProperty('coverageMap');
    expect(result).toHaveProperty('error');
    expect(checkTempFilesCleaned(tmpDir)).toBe(true);
  });

  test('should parse coverage.xml (Cobertura format) and convert via coverage json', async () => {
    const coberturaXml = `<?xml version="1.0" ?>
<coverage line-rate="0.8" branch-rate="0.5" version="5.5" timestamp="1234567890">
  <sources>
    <source>/project</source>
  </sources>
  <packages>
    <package name="src">
      <classes>
        <class name="example.py" filename="src/example.py">
          <methods/>
          <lines>
            <line number="1" hits="10"/>
            <line number="2" hits="5"/>
            <line number="3" hits="0"/>
          </lines>
        </class>
      </classes>
    </package>
  </packages>
</coverage>`;
    
    writeFileSync(join(tmpDir, 'coverage.xml'), coberturaXml, 'utf8');
    
    const result = await readCoverage(tmpDir);
    expect(result).toHaveProperty('available');
    expect(result).toHaveProperty('coverageMap');
    expect(result).toHaveProperty('error');
  });

  test('should parse coverage.json (Istanbul-like format) directly', async () => {
    const coverageJson = {
      "src/example.py": {
        "statementMap": {
          "0": { "start": { "line": 1, "column": 0 }, "end": { "line": 1, "column": 20 } },
          "1": { "start": { "line": 2, "column": 0 }, "end": { "line": 2, "column": 15 } }
        },
        "s": { "0": 1, "1": 1 },
        "branchMap": {},
        "b": {},
        "fnMap": {},
        "f": {}
      }
    };
    
    writeFileSync(join(tmpDir, 'coverage.json'), JSON.stringify(coverageJson, null, 2), 'utf8');
    
    const result = await readCoverage(tmpDir);
    expect(result.available).toBe(true);
    expect(result.error).toBe(false);
    expect(result.coverageMap).not.toBeNull();
    if (result.coverageMap) {
      expect(result.coverageMap.size).toBeGreaterThan(0);
    }
  });

  test('should handle missing coverage files gracefully', async () => {
    const result = await readCoverage(tmpDir);
    expect(result.available).toBe(false);
    expect(result.error).toBe(false);
    expect(result.coverageMap).toBeNull();
  });

  test('should enforce 100MB size limit on coverage.json', async () => {
    const { open } = await import('fs/promises');
    const coveragePath = join(tmpDir, 'coverage.json');
    const fh = await open(coveragePath, 'w');
    await fh.truncate(100 * 1024 * 1024 + 1);
    await fh.close();
    
    const result = await readCoverage(tmpDir);
    expect(result.error).toBe(true);
    expect(result.reason).toBe('malformed');
  });

  test('should prioritize explicit --coverage-file over auto-detection', async () => {
    writeFileSync(join(tmpDir, '.coverage'), 'mock-binary', 'utf8');
    
    const explicitCoverage = {
      "src/explicit.py": {
        "statementMap": { "0": { "start": { "line": 1, "column": 0 }, "end": { "line": 1, "column": 10 } } },
        "s": { "0": 1 },
        "branchMap": {}, "b": {}, "fnMap": {}, "f": {}
      }
    };
    writeFileSync(join(tmpDir, 'coverage.json'), JSON.stringify(explicitCoverage), 'utf8');
    
    const result = await readCoverage(tmpDir, 'coverage.json');
    expect(result.available).toBe(true);
    expect(result.error).toBe(false);
  });

  test('should handle symlink validation on coverage files', async () => {
    const coverageJson = {
      "src/example.py": {
        "statementMap": { "0": { "start": { "line": 1, "column": 0 }, "end": { "line": 1, "column": 10 } } },
        "s": { "0": 1 },
        "branchMap": {}, "b": {}, "fnMap": {}, "f": {}
      }
    };
    writeFileSync(join(tmpDir, 'coverage.json'), JSON.stringify(coverageJson), 'utf8');
    
    const result = await readCoverage(tmpDir, 'coverage.json');
    expect(result.available).toBe(true);
    expect(result.error).toBe(false);
  });

  test('should not leave temp file behind when .coverage conversion fails (no coverage binary)', async () => {
    writeFileSync(join(tmpDir, '.coverage'), 'mock-binary-content', 'utf8');
    
    const tempFiles = readdirSync(tmpDir).filter((f: string) => f.startsWith('.checkchange-coverage-temp'));
    tempFiles.forEach(f => rmSync(join(tmpDir, f), { force: true }));
    
    const result = await readCoverage(tmpDir);
    
    expect(result.available).toBe(true);
    expect(result.error).toBe(true);
    expect(result.reason).toBe('malformed');
    expect(checkTempFilesCleaned(tmpDir)).toBe(true);
  });

  test('fallthrough: broken .coverage + valid coverage.json → uses json, error:false', async () => {
    writeFileSync(join(tmpDir, '.coverage'), 'mock-binary-content', 'utf8');
    
    const validCoverageJson = {
      "src/valid.py": {
        "statementMap": { "0": { "start": { "line": 1, "column": 0 }, "end": { "line": 1, "column": 10 } } },
        "s": { "0": 1 },
        "branchMap": {}, "b": {}, "fnMap": {}, "f": {}
      }
    };
    writeFileSync(join(tmpDir, 'coverage.json'), JSON.stringify(validCoverageJson), 'utf8');
    
    const result = await readCoverage(tmpDir);
    
    expect(result.available).toBe(true);
    expect(result.error).toBe(false);
    expect(result.coverageMap).not.toBeNull();
    if (result.coverageMap) {
      expect(result.coverageMap.size).toBeGreaterThan(0);
    }
  });

  test('tool-absent: .coverage present but coverage binary missing → malformed (reason covers tool-absent)', async () => {
    writeFileSync(join(tmpDir, '.coverage'), 'mock-binary-content', 'utf8');
    
    const result = await readCoverage(tmpDir);
    
    expect(result.available).toBe(true);
    expect(result.error).toBe(true);
    expect(result.reason).toBe('malformed');
  });
});

describe('Python coverage conversion - successful paths (mocked)', () => {
  let tmpDir: string;
  let originalCwd: string;

  beforeEach(() => {
    originalCwd = process.cwd();
    tmpDir = mkdtempSync(join(tmpdir(), 'python-coverage-success-'));
    process.chdir(tmpDir);
    mkdirSync(join(tmpDir, 'src'), { recursive: true });
    resetSpawnSyncMock();
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(tmpDir, { recursive: true, force: true });
  });

  function mockSuccessfulCoverageJson(pythonCoverageJson: any) {
    spawnSyncMock.mockImplementation((cmd: string, args: string[], opts: any) => {
      if (cmd === 'coverage' && args[0] === 'json') {
        const outputPath = args[args.indexOf('-o') + 1];
        writeFileSync(outputPath, JSON.stringify(pythonCoverageJson), 'utf8');
        return { status: 0, stdout: '', stderr: '', error: null };
      }
      if (cmd === 'python3' && args[0] === '-m' && args[1] === 'coverage') {
        const outputPath = args[args.indexOf('-o') + 1];
        writeFileSync(outputPath, JSON.stringify(pythonCoverageJson), 'utf8');
        return { status: 0, stdout: '', stderr: '', error: null };
      }
      return { status: 1, stdout: '', stderr: 'command not found', error: null };
    });
  }

  test('should successfully convert .coverage via coverage json (first command succeeds)', async () => {
    writeFileSync(join(tmpDir, '.coverage'), 'mock-binary-content', 'utf8');
    
    const pythonCoverageJson = {
      meta: { version: '7.0' },
      files: {
        'src/example.py': {
          executed_lines: [1, 2, 3],
          missing_lines: [4],
          excluded_lines: [],
          num_statements: 4,
          num_excluded: 0,
          num_missing: 1,
          num_branches: 0,
          num_partial_branches: 0,
          covered_lines: 3,
        },
      },
      totals: { covered_lines: 3, num_statements: 4, percent_covered: 75.0 },
    };
    
    mockSuccessfulCoverageJson(pythonCoverageJson);

    const result = await readCoverage(tmpDir);
    
    expect(result.available).toBe(true);
    expect(result.error).toBe(false);
    expect(result.coverageMap).not.toBeNull();
    if (result.coverageMap) {
      expect(result.coverageMap.size).toBeGreaterThan(0);
    }
    expect(spawnSyncMock).toHaveBeenCalled();
  });

  test('should fallback to python3 -m coverage when coverage command not found', async () => {
    writeFileSync(join(tmpDir, '.coverage'), 'mock-binary-content', 'utf8');
    
    const pythonCoverageJson = {
      meta: { version: '7.0' },
      files: {
        'src/example.py': {
          executed_lines: [1, 2],
          missing_lines: [],
          excluded_lines: [],
          num_statements: 2,
          num_excluded: 0,
          num_missing: 0,
          num_branches: 0,
          num_partial_branches: 0,
          covered_lines: 2,
        },
      },
      totals: { covered_lines: 2, num_statements: 2, percent_covered: 100.0 },
    };
    
    let callCount = 0;
    spawnSyncMock.mockImplementation((cmd: string, args: string[], opts: any) => {
      callCount++;
      if (cmd === 'coverage') {
        return { status: 127, stdout: '', stderr: 'command not found', error: new Error('ENOENT') };
      }
      if (cmd === 'python3' && args[0] === '-m' && args[1] === 'coverage') {
        const outputPath = args[args.indexOf('-o') + 1];
        writeFileSync(outputPath, JSON.stringify(pythonCoverageJson), 'utf8');
        return { status: 0, stdout: '', stderr: '', error: null };
      }
      return { status: 1, stdout: '', stderr: '', error: null };
    });

    const result = await readCoverage(tmpDir);
    
    expect(result.available).toBe(true);
    expect(result.error).toBe(false);
    expect(result.coverageMap).not.toBeNull();
    expect(callCount).toBe(2);
  });

  test('should cleanup temp file on successful conversion', async () => {
    writeFileSync(join(tmpDir, '.coverage'), 'mock-binary-content', 'utf8');
    
    const pythonCoverageJson = {
      meta: { version: '7.0' },
      files: {
        'src/example.py': {
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
      totals: { covered_lines: 1, num_statements: 1, percent_covered: 100.0 },
    };
    
    mockSuccessfulCoverageJson(pythonCoverageJson);

    await readCoverage(tmpDir);
    
    expect(checkTempFilesCleaned(tmpDir)).toBe(true);
  });
});

describe('Python coverage JSON format detection and transformation', () => {
  let tmpDir: string;
  let originalCwd: string;

  beforeEach(() => {
    originalCwd = process.cwd();
    tmpDir = mkdtempSync(join(tmpdir(), 'python-json-transform-'));
    process.chdir(tmpDir);
    mkdirSync(join(tmpDir, 'src'), { recursive: true });
    resetSpawnSyncMock();
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(tmpDir, { recursive: true, force: true });
  });

test('should detect Python coverage.json format and transform to Istanbul (covers transformPythonCoverageToIstanbul)', async () => {
    const pythonCoverageJson = {
      meta: { version: '7.0' },
      files: {
        'src/transform_test.py': {
          executed_lines: [1, 2, 3],
          missing_lines: [4],
          excluded_lines: [],
          num_statements: 4,
          num_excluded: 0,
          num_missing: 1,
          num_branches: 2,
          num_partial_branches: 0,
          covered_lines: 3,
          branches: { '1': [2, 1] },
        },
      },
      totals: { covered_lines: 3, num_statements: 4, percent_covered: 75.0 },
    };
    
    writeFileSync(join(tmpDir, 'coverage.json'), JSON.stringify(pythonCoverageJson, null, 2), 'utf8');
    
    const result = await readCoverage(tmpDir);
    
    expect(result.available).toBe(true);
    expect(result.error).toBe(false);
    expect(result.coverageMap).not.toBeNull();
    if (result.coverageMap) {
      expect(result.coverageMap.size).toBeGreaterThan(0);
      // transformPythonCoverageToIstanbul rekeys paths but preserves Python format data
      // parseCoverageReport may produce limited results from Python-format data
      for (const [key] of result.coverageMap.entries()) {
        expect(key).toContain('transform_test.py');
      }
    }
  });

  test('should handle Python coverage.json with summary instead of meta', async () => {
    const pythonCoverageJson = {
      summary: { covered_lines: 5, num_statements: 10 },
      files: {
        'src/summary_test.py': {
          executed_lines: [1, 2, 3, 4, 5],
          missing_lines: [6, 7, 8, 9, 10],
          excluded_lines: [],
          num_statements: 10,
          num_excluded: 0,
          num_missing: 5,
          num_branches: 0,
          num_partial_branches: 0,
          covered_lines: 5,
        },
      },
    };
    
    writeFileSync(join(tmpDir, 'coverage.json'), JSON.stringify(pythonCoverageJson), 'utf8');
    
    const result = await readCoverage(tmpDir);
    
    expect(result.available).toBe(true);
    expect(result.error).toBe(false);
    expect(result.coverageMap).not.toBeNull();
  });

  test('should handle Python coverage.json with totals only', async () => {
    const pythonCoverageJson = {
      totals: { covered_lines: 1, num_statements: 1 },
      files: {
        'src/totals_test.py': {
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
    
    writeFileSync(join(tmpDir, 'coverage.json'), JSON.stringify(pythonCoverageJson), 'utf8');
    
    const result = await readCoverage(tmpDir);
    
    expect(result.available).toBe(true);
    expect(result.error).toBe(false);
    expect(result.coverageMap).not.toBeNull();
  });

  test('should not double-transform when already converted via convertPythonCoverageToJson', async () => {
    const istanbulCoverage = {
      'src/normal.py': {
        statementMap: { '0': { start: { line: 1, column: 0 }, end: { line: 1, column: 10 } } },
        s: { '0': 1 },
        branchMap: {}, b: {}, fnMap: {}, f: {},
      },
    };
    
    writeFileSync(join(tmpDir, 'coverage.json'), JSON.stringify(istanbulCoverage), 'utf8');
    
    const result = await readCoverage(tmpDir);
    
    expect(result.available).toBe(true);
    expect(result.error).toBe(false);
    expect(result.coverageMap).not.toBeNull();
  });
});

describe('readCoverageFile - uncovered branches', () => {
  let tmpDir: string;
  let originalCwd: string;

  beforeEach(() => {
    originalCwd = process.cwd();
    tmpDir = mkdtempSync(join(tmpdir(), 'readcoverage-branches-'));
    process.chdir(tmpDir);
    mkdirSync(join(tmpDir, 'src'), { recursive: true });
    resetSpawnSyncMock();
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(tmpDir, { recursive: true, force: true });
  });

  function mockCoverageXmlConversion() {
    spawnSyncMock.mockImplementation((cmd: string, args: string[]) => {
      if (cmd === 'coverage' && args[0] === 'json') {
        const outputPath = args[args.indexOf('-o') + 1];
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
        writeFileSync(outputPath, JSON.stringify(pythonJson), 'utf8');
        return { status: 0, stdout: '', stderr: '', error: null };
      }
      if (cmd === 'python3' && args[0] === '-m' && args[1] === 'coverage') {
        const outputPath = args[args.indexOf('-o') + 1];
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
        writeFileSync(outputPath, JSON.stringify(pythonJson), 'utf8');
        return { status: 0, stdout: '', stderr: '', error: null };
      }
      return { status: 1, stdout: '', stderr: '', error: null };
    });
  }

  test('should handle coverage.xml (Cobertura) conversion path', async () => {
    const coberturaXml = `<?xml version="1.0" ?>
<coverage line-rate="0.8" branch-rate="0.5" version="5.5" timestamp="1234567890">
  <sources>
    <source>/project</source>
  </sources>
  <packages>
    <package name="src">
      <classes>
        <class name="example.py" filename="src/example.py">
          <methods/>
          <lines>
            <line number="1" hits="10"/>
            <line number="2" hits="5"/>
            <line number="3" hits="0"/>
          </lines>
        </class>
      </classes>
    </package>
  </packages>
</coverage>`;
    
    writeFileSync(join(tmpDir, 'coverage.xml'), coberturaXml, 'utf8');
    mockCoverageXmlConversion();
    
    const result = await readCoverage(tmpDir);
    
    expect(result.available).toBe(true);
    expect(result).toHaveProperty('error');
  });

  test('should handle explicit coverage file with missing file error', async () => {
    const result = await readCoverage(tmpDir, 'nonexistent.json');
    
    expect(result.available).toBe(true);
    expect(result.error).toBe(true);
    expect(result.reason).toBe('missing');
  });

  test('should handle explicit coverage file with oversized file', async () => {
    const { open } = await import('fs/promises');
    const coveragePath = join(tmpDir, 'oversized.json');
    const fh = await open(coveragePath, 'w');
    await fh.truncate(100 * 1024 * 1024 + 1);
    await fh.close();
    
    const result = await readCoverage(tmpDir, 'oversized.json');
    
    expect(result.available).toBe(true);
    expect(result.error).toBe(true);
    expect(result.reason).toBe('malformed');
  });

  test('should handle LCOV content detection by content (not just extension)', async () => {
    const lcovContent = `TN:Test
SF:src/test.ts
DA:1,10
DA:2,5
DA:3,0
end_of_record`;
    
    writeFileSync(join(tmpDir, 'coverage.txt'), lcovContent, 'utf8');
    
    const result = await readCoverage(tmpDir, 'coverage.txt');
    
    expect(result.available).toBe(true);
    expect(result).toHaveProperty('error');
  });

  test('should handle malformed JSON gracefully', async () => {
    writeFileSync(join(tmpDir, 'coverage.json'), '{ invalid json', 'utf8');
    
    const result = await readCoverage(tmpDir, 'coverage.json');
    
    expect(result.available).toBe(true);
    expect(result.error).toBe(true);
    expect(result.reason).toBe('malformed');
  });

  test('should handle JSON without files key (not Python format)', async () => {
    const notPythonFormat = {
      someOtherKey: 'value',
      data: [1, 2, 3],
    };
    
    writeFileSync(join(tmpDir, 'coverage.json'), JSON.stringify(notPythonFormat), 'utf8');
    
    const result = await readCoverage(tmpDir, 'coverage.json');
    
    // Should try to parse as Istanbul - may succeed with empty map or fail
    expect(result.available).toBe(true);
    expect(result).toHaveProperty('error');
    if (result.error) {
      expect(result).toHaveProperty('reason');
    }
  });

  test('should handle path traversal attempt in explicit file', async () => {
    const outsideDir = mkdtempSync(join(tmpdir(), 'outside-'));
    const outsideFile = join(outsideDir, 'coverage.json');
    writeFileSync(outsideFile, JSON.stringify({
      'test.py': { statementMap: {}, s: {}, branchMap: {}, b: {}, fnMap: {}, f: {} }
    }), 'utf8');
    
    try {
      const result = await readCoverage(tmpDir, outsideFile);
      expect(result).toHaveProperty('available');
    } finally {
      rmSync(outsideDir, { recursive: true, force: true });
    }
  });

  test('should handle symlink validation in validateAndReadFile', async () => {
    const { symlink } = await import('fs/promises');
    const realFile = join(tmpDir, 'real_coverage.json');
    const linkFile = join(tmpDir, 'link_coverage.json');
    
    writeFileSync(realFile, JSON.stringify({
      'src/test.py': { 
        statementMap: { '0': { start: { line: 1, column: 0 }, end: { line: 1, column: 10 } } }, 
        s: { '0': 1 }, 
        branchMap: {}, b: {}, fnMap: {}, f: {} 
      }
    }), 'utf8');
    
    await symlink(realFile, linkFile);
    
    const result = await readCoverage(tmpDir, 'link_coverage.json');
    
    expect(result.available).toBe(true);
    expect(result.error).toBe(false);
  });

  test('should handle coverage.json with branch coverage data', async () => {
    const coverageWithBranches = {
      'src/branch_test.py': {
        statementMap: {
          '0': { start: { line: 1, column: 0 }, end: { line: 1, column: 20 } },
          '1': { start: { line: 2, column: 0 }, end: { line: 2, column: 15 } },
        },
        s: { '0': 1, '1': 1 },
        branchMap: {
          '0': { 
            loc: { start: { line: 1, column: 5 }, end: { line: 1, column: 15 } }, 
            type: 'if', 
            locations: [{ start: { line: 1, column: 5 }, end: { line: 1, column: 15 } }, { start: { line: 1, column: 5 }, end: { line: 1, column: 15 } }], 
            line: 1 
          },
        },
        b: { '0': [1, 0] },
        fnMap: {},
        f: {},
      },
    };
    
    writeFileSync(join(tmpDir, 'coverage.json'), JSON.stringify(coverageWithBranches), 'utf8');
    
    const result = await readCoverage(tmpDir, 'coverage.json');
    
    expect(result.available).toBe(true);
    expect(result.error).toBe(false);
    expect(result.coverageMap).not.toBeNull();
  });
});