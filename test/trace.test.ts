import { describe, expect, test, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { execSync } from 'child_process';
import { execute, TraceRun } from '../src/execute.js';
import { buildEvidenceOutput } from '../src/evidence.js';

// Tracing seam tests (plan task 7): execute() hook, TraceRun correlation ID,
// pipeline stage spans, and the rule that main EvidenceOutput carries no timing.
const SPAN_STATUSES = ['ok', 'error', 'skipped'];

describe('execute() trace hook', () => {
  test('records an exec span (cmd, durationMs, exitCode, correlationId) into the run', async () => {
    const trace = new TraceRun();
    const result = await execute('echo', ['trace-hook'], {}, trace);
    expect(result.exitCode).toBe(0);
    expect(trace.spans).toHaveLength(1);
    const span = trace.spans[0] as {
      stage: string; command: string; args: string[]; exitCode: number | null; durationMs: number; correlationId: string;
    };
    expect(span.stage).toBe('exec');
    expect(span.command).toBe('echo');
    expect(span.args).toEqual(['trace-hook']);
    expect(span.exitCode).toBe(0);
    expect(span.durationMs).toBeGreaterThanOrEqual(0);
    expect(span.correlationId).toBe(trace.correlationId);
  });

  test('ENOENT exec span records exitCode null truthfully', async () => {
    const trace = new TraceRun();
    await execute('this-command-does-not-exist-12345', [], {}, trace);
    expect(trace.spans).toHaveLength(1);
    expect((trace.spans[0] as { exitCode: number | null }).exitCode).toBeNull();
  });

  test('each TraceRun gets a distinct correlation ID; spans in one run share it', () => {
    const a = new TraceRun();
    const b = new TraceRun();
    expect(a.correlationId).not.toBe(b.correlationId);
    a.recordStage('git', 5, 'ok');
    a.recordStage('complexity', 7, 'ok');
    expect(a.spans.map((s) => s.stage)).toEqual(['git', 'complexity']);
    expect(a.spans.map((s) => s.correlationId)).toEqual([a.correlationId, a.correlationId]);
  });
});

describe('buildEvidenceOutput stage tracing', () => {
  let tmpDir: string;
  let originalCwd: string;

  beforeEach(() => {
    originalCwd = process.cwd();
    tmpDir = mkdtempSync(join(tmpdir(), 'trace-test-'));
    process.chdir(tmpDir);
    mkdirSync(join(tmpDir, 'src'), { recursive: true });
    mkdirSync(join(tmpDir, 'coverage'), { recursive: true });
    // complexity stage lists repo files via `git ls-files` (src/complexity.ts:19); init to keep stderr clean
    execSync('git init', { stdio: 'ignore' });
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

  const intervalsForPass = (): Map<string, Array<{ start: number; end: number }>> => {
    const intervals = new Map<string, Array<{ start: number; end: number }>>();
    intervals.set('src/pass.ts', [{ start: 1, end: 10 }]);
    return intervals;
  };

  const seedHealthyFixture = () => {
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
    return intervalsForPass();
  };

  test('healthy run records complexity..evidence spans; all ok; correlationId stable; no source contents', async () => {
    const intervals = seedHealthyFixture();
    const trace = new TraceRun();
    const output = (await buildEvidenceOutput('HEAD', intervals, '.', 30, undefined, trace)) as any;
    expect(output.analysisStatus).toBe('SUCCESS');

    const stages = trace.spans.map((s) => s.stage);
    expect(stages).toEqual(['complexity', 'coverage', 'attribution', 'crapCalc', 'rules', 'evidence']);
    for (const span of trace.spans) {
      expect(span.durationMs).toBeGreaterThanOrEqual(0);
      expect(SPAN_STATUSES).toContain(span.status);
      expect(span.correlationId).toBe(trace.correlationId);
    }
    expect(trace.spans.every((s) => s.status === 'ok')).toBe(true);

    // Spans carry no source contents and no absolute paths.
    const spanJson = JSON.stringify(trace.spans);
    expect(spanJson).not.toContain('function pass');
    expect(spanJson).not.toContain(tmpDir);

    // Main EvidenceOutput from the traced run carries zero timing/trace fields.
    const outputJson = JSON.stringify(output);
    expect(outputJson).not.toContain('durationMs');
    expect(outputJson).not.toContain('correlationId');
    expect(outputJson).not.toContain('"spans"');
    expect(outputJson).not.toContain('"trace"');
  });

  test('failed coverage records an error span; unrun stages are absent (no invented spans)', async () => {
    const intervals = seedHealthyFixture();
    const trace = new TraceRun();
    const output = (await buildEvidenceOutput(
      'HEAD', intervals, '.', 30, join(tmpDir, 'coverage', 'missing.json'), trace
    )) as any;
    expect(output.analysisStatus).toBe('FAILED');
    expect(trace.spans.map((s) => s.stage)).toEqual(['complexity', 'coverage']);
    expect(trace.spans.find((s) => s.stage === 'coverage')?.status).toBe('error');
  });

  test('trace parameter never mutates main output; untraced runs stay deterministic', async () => {
    const intervals = seedHealthyFixture();
    const out1 = (await buildEvidenceOutput('HEAD', intervals, '.', 30)) as any;
    const out2 = (await buildEvidenceOutput('HEAD', intervals, '.', 30)) as any;
    expect(JSON.stringify(out1)).toBe(JSON.stringify(out2));

    const trace = new TraceRun();
    const out3 = (await buildEvidenceOutput('HEAD', intervals, '.', 30, undefined, trace)) as any;
    expect(JSON.stringify(out3)).toBe(JSON.stringify(out1));
    expect(trace.spans.length).toBeGreaterThan(0);
  });
});