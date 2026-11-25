import { describe, expect, test, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { buildEvidenceOutput, buildOutput } from '../src/evidence.js';

describe('diagnostics quality (task 4)', () => {
  let tmpDir: string;
  let originalCwd: string;

  beforeEach(() => {
    originalCwd = process.cwd();
    tmpDir = mkdtempSync(join(tmpdir(), 'quality-test-'));
    process.chdir(tmpDir);
    mkdirSync(join(tmpDir, 'src'), { recursive: true });
    mkdirSync(join(tmpDir, 'coverage'), { recursive: true });
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(tmpDir, { recursive: true, force: true });
  });

  const createTsFile = (relPath: string, content: string) => {
    writeFileSync(join('src', relPath), content, 'utf8');
  };

  const createCoverage = (covObj: any) => {
    writeFileSync(join('coverage', 'coverage-final.json'), JSON.stringify(covObj, null, 2), 'utf8');
  };

  // Proven geometry (mirrors test/wp4.2.test.ts case 5): each statement spans
  // the single-line function body starting at column 21 ('return 1;').
  const coverageFor = (stmtLines: Record<string, number>, executed: Record<string, number>) => ({
    'src/mix.ts': {
      statementMap: Object.fromEntries(
        Object.entries(stmtLines).map(([idx, line]) => [
          idx,
          { start: { line, column: 21 }, end: { line, column: 34 } },
        ])
      ),
      s: executed,
    },
  });

  const intervals = (): Map<string, Array<{ start: number; end: number }>> => {
    const m = new Map<string, Array<{ start: number; end: number }>>();
    m.set('src/mix.ts', [{ start: 1, end: 10 }]);
    return m;
  };

  test('all-covered happy path: score 100, DIRECT/NATIVE quality, all stages complete', async () => {
    createTsFile('mix.ts', '\nfunction covered() { return 1; }\n');
    createCoverage(coverageFor({ 0: 2 }, { 0: 1 })); // statement line 2, executed once
    const out = (await buildEvidenceOutput('HEAD', intervals(), '.', 30)) as any;

    expect(out.analysisStatus).toBe('SUCCESS');
    const q = out.diagnostics.quality;
    expect(q).toBeDefined();
    expect(q.coverage).toBe('DIRECT');
    expect(q.complexity).toBe('NATIVE');
    expect(q.score).toBe(100);
    expect(q.stageComplete).toEqual({
      git: true,
      complexity: true,
      coverage: true,
      attribution: true,
      rules: true,
    });
    expect(q.uncoveredFunctions).toEqual([]);
  });

  test('uncovered function: coverage 0 not null (INV-01), listed in uncoveredFunctions, score < 100; deterministic', async () => {
    createTsFile('mix.ts', '\nfunction covered() { return 1; }\nfunction uncovered() { return 0; }\n');
    createCoverage(coverageFor({ 0: 2, 1: 3 }, { 0: 1, 1: 0 })); // line 2 covered (s=1), line 3 uncovered (s=0)

    const first = (await buildEvidenceOutput('HEAD', intervals(), '.', 30)) as any;
    expect(first.analysisStatus).toBe('SUCCESS');

    const uncovered = first.changedFunctions.find((f: any) => f.method === 'uncovered');
    const covered = first.changedFunctions.find((f: any) => f.method === 'covered');
    expect(uncovered).toBeDefined();
    expect(covered).toBeDefined();
    // INV-01 ZERO≠NULL: measured 0% coverage stays numeric 0, never null
    expect(uncovered.coverage).toBe(0);
    expect(uncovered.coverage).not.toBeNull();
    expect(covered.coverage).toBe(100);

    const q = first.diagnostics.quality;
    expect(q.score).toBe(85); // completeness 100 + coverageRatio 1/2: round(70 + 0.3*100*0.5)
    expect(q.uncoveredFunctions).toEqual([
      { file: 'src/mix.ts', method: 'uncovered', lineStart: 3, lineEnd: 3 },
    ]);

    // Determinism: same inputs -> identical JSON
    const second = (await buildEvidenceOutput('HEAD', intervals(), '.', 30)) as any;
    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
  });

  test('no coverage artifact (absent): score null, UNAVAILABLE coverage, no uncoveredFunctions', async () => {
    createTsFile('mix.ts', '\nfunction covered() { return 1; }\n');
    const out = (await buildEvidenceOutput('HEAD', intervals(), '.', 30)) as any;

    expect(out.analysisStatus).toBe('SUCCESS');
    const q = out.diagnostics.quality;
    expect(q.coverage).toBe('UNAVAILABLE');
    expect(q.complexity).toBe('NATIVE');
    expect(q.score).toBeNull(); // no coverage evidence at all -> null, per INV-01 never a fake 0
    expect(q.stageComplete).toEqual({
      git: true,
      complexity: true,
      coverage: false,
      attribution: true,
      rules: true,
    });
    expect(q.uncoveredFunctions).toBeUndefined();
    // Functions remain analyzed with null coverage (existing semantics unchanged)
    expect(out.changedFunctions[0].coverage).toBeNull();
  });

  test('malformed coverage: FAILED, score null, coverage stage incomplete', async () => {
    createTsFile('mix.ts', '\nfunction covered() { return 1; }\n');
    writeFileSync(join('coverage', 'coverage-final.json'), '{ not valid json', 'utf8');
    const out = (await buildEvidenceOutput('HEAD', intervals(), '.', 30)) as any;

    expect(out.analysisStatus).toBe('FAILED');
    const q = out.diagnostics.quality;
    expect(q.coverage).toBe('UNAVAILABLE');
    expect(q.complexity).toBe('NATIVE');
    expect(q.score).toBeNull();
    expect(q.stageComplete).toEqual({
      git: true,
      complexity: true,
      coverage: false,
      attribution: false,
      rules: false,
    });
    expect(q.uncoveredFunctions).toBeUndefined();
  });

  test('unsupported path: quality present, only git+complexity complete, score null', async () => {
    writeFileSync(join('src', 'README.md'), '# Unsupported\n', 'utf8');
    const m = new Map<string, Array<{ start: number; end: number }>>();
    m.set('src/README.md', [{ start: 1, end: 10 }]);
    const out = (await buildEvidenceOutput('HEAD', m, '.', 30)) as any;

    expect(out.analysisStatus).toBe('UNSUPPORTED');
    const q = out.diagnostics.quality;
    expect(q.score).toBeNull();
    expect(q.stageComplete).toEqual({
      git: true,
      complexity: true,
      coverage: false,
      attribution: false,
      rules: false,
    });
    expect(q.uncoveredFunctions).toBeUndefined();
  });

  test('legacy buildOutput stays byte-identical: no diagnostics, no quality', () => {
    const legacy = buildOutput('HEAD~1', [], 30, {}) as any;
    expect(legacy.diagnostics).toBeUndefined();
    expect(legacy).toEqual({
      schemaVersion: '0.1',
      analysis: { base: 'HEAD~1', target: 'current' },
      capabilities: { git: 'available', crapTypescript: 'available' },
      changedFunctions: [],
      policy: { crapThreshold: 30 },
      ruleResults: [],
      gate: 'PASS',
      completeness: 'COMPLETE'
    });
  });
});