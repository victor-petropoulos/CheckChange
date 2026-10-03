import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { execSync } from 'child_process';
import { buildEvidenceOutput, buildOutput, type EvidenceOutput } from '../src/evidence.js';
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

  const createCoverage = (covObj: unknown) => {
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

    const first = await buildEvidenceOutput('HEAD', intervals, '.', 30);
    expect(first.diagnostics).toBeDefined();
    const firstLineage = first.diagnostics?.lineage ?? [];
    const stages = firstLineage.map((entry) => entry.stage);
    expect(stages).toEqual(EXPECTED_STAGES);
    for (const entry of firstLineage) {
      expect(typeof entry.tool).toBe('string');
      expect(typeof entry.version).toBe('string');
      expect(entry.inputs).toBeTypeOf('object');
    }
    // Canonical quality vocabulary present (ADR-0001)
    const complexityEntry = firstLineage.find((entry) => entry.stage === 'complexity');
    expect(complexityEntry?.inputs.quality).toBe('NATIVE');
    const coverageEntry = firstLineage.find((entry) => entry.stage === 'coverage');
    expect(coverageEntry?.inputs.quality).toBe('DIRECT');
    const attributionEntry = firstLineage.find((entry) => entry.stage === 'attribution');
    expect(attributionEntry?.inputs.quality).toBe('ATTRIBUTED');
    // Input identity: relative paths only, no absolute cwd leak
    const serialized = JSON.stringify(first);
    expect(serialized).not.toContain(tmpDir);
    // No timing fields in main output
    expect(serialized).not.toContain('durationMs');
    expect(serialized).not.toContain('timestamp');
    // Determinism: same inputs -> identical JSON
    const second = await buildEvidenceOutput('HEAD', intervals, '.', 30);
    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
  });

  test('existing fields unchanged; diagnostics optional and absent on legacy path', async () => {
    // Legacy sync builder must never gain diagnostics (byte-identical output)
    const legacy = buildOutput('HEAD~1', [], 30, { git: 'available' });
    expect('diagnostics' in legacy).toBe(false);
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
    const out = await buildEvidenceOutput('HEAD', intervals, '.', 30);
    expect(out.analysisStatus).toBe('UNSUPPORTED');
    expect(out.diagnostics?.lineage.map((entry) => entry.stage)).toEqual(['git', 'complexity']);
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
      expect(first.analysisStatus).toBe('UNSUPPORTED');
      expect(first.diagnostics).toBeDefined();
      // Empty intervals → early return: only git, complexity, coverage stages completed
      expect(first.diagnostics.lineage.map((entry: { stage: string }) => entry.stage)).toEqual(['git', 'complexity', 'coverage']);

      // Determinism check output: same inputs -> identical JSON (excludes nothing)
      expect(firstJson).toBe(secondJson);
    } finally {
      process.argv = originalArgv;
      exitSpy.mockRestore();
      logSpy.mockRestore();
    }
  });

  test('evidence path calls git rev-parse HEAD once in one fresh module instance', async () => {
    createTsFile('pass.ts', `
      function pass() { return 1; }
    `);
    createCoverage({
      'src/pass.ts': {
        statementMap: { '0': { start: { line: 2, column: 0 }, end: { line: 2, column: 20 } } },
        s: { '0': 1 }
      }
    });
    const intervals = new Map<string, Array<{ start: number; end: number }>>();
    intervals.set('src/pass.ts', [{ start: 1, end: 10 }]);

    const engine = '0.4.1/' + process.version;
    const execFileSync = vi.fn((command: string, args: readonly string[]) => {
      throw new Error(`${command} ${args.join(' ')} unavailable`);
    });
    vi.resetModules();
    vi.doMock('node:child_process', async (importOriginal) => ({
      ...await importOriginal<typeof import('node:child_process')>(),
      execFileSync,
    }));

    try {
      const { buildEvidenceOutput: freshBuildEvidenceOutput } = await import('../src/evidence.js');
      const first: EvidenceOutput = await freshBuildEvidenceOutput('HEAD', intervals, '.', 30);
      const second: EvidenceOutput = await freshBuildEvidenceOutput('HEAD', intervals, '.', 30);
      const evidenceLineage = (output: EvidenceOutput) => output.diagnostics?.lineage.find((entry) => entry.stage === 'evidence');
      const gitCalls = execFileSync.mock.calls.filter(([command, args]) =>
        command === 'git' && Array.isArray(args) && args[0] === 'rev-parse' && args[1] === 'HEAD'
      );

      expect(evidenceLineage(first)?.inputs.engine).toBe(engine);
      expect(evidenceLineage(second)?.inputs.engine).toBe(engine);
      expect(evidenceLineage(second)).toEqual(evidenceLineage(first));
      expect(gitCalls).toHaveLength(1);
    } finally {
      vi.doUnmock('node:child_process');
      vi.resetModules();
    }
  });
});
