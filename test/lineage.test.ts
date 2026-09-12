import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { execSync } from 'child_process';
import { buildEvidenceOutput, buildOutput } from '../src/evidence.js';
import { gitProvenance } from '../src/git.js';
import { complexityProvenance } from '../src/complexity.js';
import { coverageProvenance } from '../src/coverage.js';
import { attributionProvenance } from '../src/attribution.js';
import { crapCalcProvenance } from '../src/crapCalc.js';
import { rulesProvenance } from '../src/rules.js';
import { main } from '../src/cli.js';

const EXPECTED_STAGES = ['git', 'complexity', 'coverage', 'attribution', 'crapCalc', 'rules', 'evidence'];

describe('diagnostics lineage (task 3)', () => {
  let tmpDir: string;
  let originalCwd: string;

  beforeEach(() => {
    originalCwd = process.cwd();
    tmpDir = mkdtempSync(join(tmpdir(), 'lineage-test-'));
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

  test('every stage module exposes provenance (tool + version)', () => {
    const all = [gitProvenance, complexityProvenance, coverageProvenance, attributionProvenance, crapCalcProvenance, rulesProvenance];
    for (const p of all) {
      expect(typeof p.tool).toBe('string');
      expect(p.tool.length).toBeGreaterThan(0);
      expect(typeof p.version).toBe('string');
      expect(p.version.length).toBeGreaterThan(0);
    }
    expect(crapCalcProvenance.tool).toBe('checkchange');
  });

  test('happy path emits lineage with all 7 stages in order; runs are deterministic', async () => {
    createTsFile('pass.ts', `
      function pass() { return 1; }
    `);
    const coverageData = {
      'src/pass.ts': {
        statementMap: { '0': { start: { line: 2, column: 0 }, end: { line: 2, column: 20 } } },
        s: { '0': 1 }
      }
    };
    createCoverage(coverageData);
    const intervals = new Map<string, Array<{ start: number; end: number }>>();
    intervals.set('src/pass.ts', [{ start: 1, end: 10 }]);

    const first = (await buildEvidenceOutput('HEAD', intervals, '.', 30)) as any;
    const stages = first.diagnostics.lineage.map((e: any) => e.stage);
    expect(stages).toEqual(EXPECTED_STAGES);
    for (const entry of first.diagnostics.lineage) {
      expect(typeof entry.tool).toBe('string');
      expect(typeof entry.version).toBe('string');
      expect(entry.inputs).toBeTypeOf('object');
    }
    // Canonical quality vocabulary present (ADR-0001)
    const complexityEntry = first.diagnostics.lineage.find((e: any) => e.stage === 'complexity');
    expect(complexityEntry.inputs.quality).toBe('NATIVE');
    const coverageEntry = first.diagnostics.lineage.find((e: any) => e.stage === 'coverage');
    expect(coverageEntry.inputs.quality).toBe('DIRECT');
    const attributionEntry = first.diagnostics.lineage.find((e: any) => e.stage === 'attribution');
    expect(attributionEntry.inputs.quality).toBe('ATTRIBUTED');
    // Input identity: relative paths only, no absolute cwd leak
    const serialized = JSON.stringify(first);
    expect(serialized).not.toContain(tmpDir);
    // No timing fields in main output
    expect(serialized).not.toContain('durationMs');
    expect(serialized).not.toContain('timestamp');
    // Determinism: same inputs -> identical JSON
    const second = (await buildEvidenceOutput('HEAD', intervals, '.', 30)) as any;
    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
  });

  test('existing fields unchanged; diagnostics optional and absent on legacy path', async () => {
    // Legacy sync builder must never gain diagnostics (byte-identical output)
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
    // Unsupported path: lineage present but only completed stages (git + complexity)
    writeFileSync(join('src', 'README.md'), '# Unsupported\n', 'utf8');
    const intervals = new Map<string, Array<{ start: number; end: number }>>();
    intervals.set('src/README.md', [{ start: 1, end: 10 }]);
    const out = (await buildEvidenceOutput('HEAD', intervals, '.', 30)) as any;
    expect(out.analysisStatus).toBe('UNSUPPORTED');
    expect(out.diagnostics.lineage.map((e: any) => e.stage)).toEqual(['git', 'complexity']);
  });

  test('CLI --json output includes diagnostics.lineage; two same-input runs identical', async () => {
    writeFileSync(join('src', 'index.ts'), 'console.log("hello");', 'utf8');
    execSync('git init', { stdio: 'ignore' });
    execSync('git config user.email "ci@example.com"', { stdio: 'ignore' });
    execSync('git config user.name "CI"', { stdio: 'ignore' });
    execSync('git add src/index.ts', { stdio: 'ignore' });
    execSync('git commit -m "initial commit"', { stdio: 'ignore' });

    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    const logSpy = vi.spyOn(console, 'log');

    const originalArgv = process.argv;
    try {
      const runTwice = async (): Promise<string> => {
        vi.clearAllMocks();
        process.argv = ['node', 'cli.js', '--base', 'HEAD', '--json'];
        await main();
        const arg = logSpy.mock.calls[0]?.[0];
        expect(typeof arg).toBe('string');
        return arg as string;
      };
      const firstJson = await runTwice();
      const secondJson = await runTwice();

      const first = JSON.parse(firstJson);
      expect(first.analysisStatus).toBe('SUCCESS');
      expect(first.diagnostics).toBeDefined();
      expect(first.diagnostics.lineage.map((e: any) => e.stage)).toEqual(EXPECTED_STAGES);

      // Determinism check output: same inputs -> identical JSON (excludes nothing)
      expect(firstJson).toBe(secondJson);
    } finally {
      process.argv = originalArgv;
      exitSpy.mockRestore();
      logSpy.mockRestore();
    }
  });
});
