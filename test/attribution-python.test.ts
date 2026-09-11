import { describe, expect, test, beforeEach, afterEach } from 'vitest';
import { writeFileSync, mkdirSync, rmSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { parsePythonFileMethods } from '../src/complexity-providers/pythonDescriptorProvider.js';
import { buildEvidenceOutput } from '../src/evidence.js';

// Seed mirrors experiments/wp18-o01/seeded-CHANGE.md (mem:41224):
//   OICP-MCP src/aicp/health.py, get_health_status CC 1 -> 2 via `if True: marker = 1`,
//   covered 100%, changed interval [5,6] (the added branch lines).
// Pre-fix (seeded-CHANGE.md run1 verbatim): parseFileMethods threw on .py ->
//   coverage null -> analyzerStatus 'skipped' -> NOT_EVALUATED -> completeness INCOMPLETE.
// Post-fix (Task 1 pythonDescriptorProvider): coverage 100 -> crap 2 -> PASS -> COMPLETE.
const SEED_HEALTH_PY = `from aicp import __version__

def get_health_status() -> dict:
    """Return server health status."""
    if True:  # SEEDED-CHANGE-T6
        marker = 1
    return {
        "status": "ok",
        "version": __version__,
    }
`;

// def at line 3 (col 0), end 10:5. cc = 2 (one If).
// Real Python coverage.py artifact shape (seeded-CHANGE.md verbatim):
//   executed_lines [2, 5, 7, 8, 9] with NO statementMap spans.
// coverage.py DOES emit per-function summary: get_health_status percent_covered 100.0.
// NOTE: this mirrors the real artifact. Istanbul statementMap shape would
// pass for the wrong reason (transformPythonCoverageToIstanbul keeps
// fileData Python-shaped; parseCoverageReport yields empty statements).
function seedCoverageData() {
  // Python coverage json format: { meta, files: { path: {...} } }
  return {
    meta: { version: '7.4.0' },
    files: {
      'src/health.py': {
        executed_lines: [2, 5, 7, 8, 9],
        summary: {
          covered_lines: 5,
          num_statements: 5,
          percent_covered: 100.0,
          percent_covered_display: '100',
          missing_lines: 0,
          excluded_lines: 0,
          percent_statements_covered: 100.0,
        },
        missing_lines: [],
        excluded_lines: [],
        functions: {
          get_health_status: {
            executed_lines: [7, 8, 9],
            summary: {
              covered_lines: 3,
              num_statements: 3,
              percent_covered: 100.0,
              percent_covered_display: '100',
            },
            missing_lines: [],
            excluded_lines: [],
            start_line: 3,
          },
        },
        classes: {},
      },
    },
    totals: {
      num_statements: 5,
      covered_lines: 5,
      missing_lines: 0,
      percent_covered: 100.0,
      percent_covered_display: '100',
    },
  };
}

describe('parsePythonFileMethods (seed health.py pattern)', () => {
  let tmpDir: string;
  let originalCwd: string;

  beforeEach(() => {
    originalCwd = process.cwd();
    tmpDir = mkdtempSync(join(tmpdir(), 'attribution-python-'));
    process.chdir(tmpDir);
    mkdirSync(join(tmpDir, 'src'), { recursive: true });
    writeFileSync(join(tmpDir, 'src', 'health.py'), SEED_HEALTH_PY, 'utf8');
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(tmpDir, { recursive: true, force: true });
  });

  test('returns exactly one descriptor with correct startLine and CC for get_health_status', async () => {
    const descriptors = await parsePythonFileMethods(join(tmpDir, 'src', 'health.py'));

    expect(descriptors).toHaveLength(1);
    expect(descriptors[0]).toMatchObject({
      functionName: 'get_health_status',
      containerName: null,
      displayName: 'get_health_status',
      startLine: 3,
      endLine: 10,
      complexity: 2,
      expectsStatementCoverage: true,
      expectsBranchCoverage: true,
    });
  });
});

describe('buildEvidenceOutput on seeded python change', () => {
  let tmpDir: string;
  let originalCwd: string;

  beforeEach(() => {
    originalCwd = process.cwd();
    tmpDir = mkdtempSync(join(tmpdir(), 'attribution-build-'));
    process.chdir(tmpDir);
    mkdirSync(join(tmpDir, 'src'), { recursive: true });
    writeFileSync(join(tmpDir, 'src', 'health.py'), SEED_HEALTH_PY, 'utf8');
    // Real Python artifact: coverage.json at repo root (Python coverage.py format).
    // readCoverage auto-detect precedence: .coverage > coverage.xml > coverage.json > coverage/coverage-final.json
    writeFileSync(
      join(tmpDir, 'coverage.json'),
      JSON.stringify(seedCoverageData(), null, 2),
      'utf8',
    );
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(tmpDir, { recursive: true, force: true });
  });

  test('yields changedFunctions 1 with computed crap, gate PASS, completeness COMPLETE', async () => {
    // Changed interval mirrors seeded-CHANGE.md diff: the added `if True` + `marker` lines (5-6).
    const intervals = new Map<string, { start: number; end: number }[]>();
    intervals.set('src/health.py', [{ start: 5, end: 6 }]);

    const output = await buildEvidenceOutput('HEAD', intervals, tmpDir, 30);

    expect(output.changedFunctions).toHaveLength(1);
    const cf = output.changedFunctions[0];
    expect(cf.method).toBe('get_health_status');
    expect(cf.lineStart).toBe(3);
    expect(cf.cc).toBe(2);
    expect(cf.coverage).toBe(100);
    expect(cf.crap).toBe(2); // calculateCrap(2, 100) = 2^2*(1-1)^3 + 2 = 2
    expect(cf.coverageKind).not.toBe('N/A');
    expect(cf.analyzerStatus).toBe('passed');
    expect(cf.language).toBe('python');

    expect(output.ruleResults).toHaveLength(1);
    expect(output.ruleResults[0]).toMatchObject({
      ruleId: 'changed-function-high-crap',
      result: 'PASS',
      file: 'src/health.py',
      method: 'get_health_status',
      crap: 2,
      threshold: 30,
      cc: 2,
      coverage: 100,
    });

    expect(output.analysisStatus).toBe('SUCCESS');
    expect(output.gate).toBe('PASS');
    expect(output.completeness).toBe('COMPLETE');
  });
});