import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest';
import { main } from '../src/cli.js';

// --format integration tests (plan task 3). Engine mocks mirror
// cli-dispatcher.test.ts:8-19; formatters run REAL — the sidecar path through
// cli.ts:195-197 is the integration point under test.
vi.mock('../src/execute.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/execute.js')>();
  return { ...actual, execute: vi.fn() }; // real TraceRun; execute stubbed
});
vi.mock('../src/git.js', () => ({
  validateGitRepo: vi.fn(),
  resolveBaseRef: vi.fn(),
  getChangedIntervals: vi.fn(),
  detectDefaultBase: vi.fn(),
}));
vi.mock('../src/evidence.js', () => ({ buildEvidenceOutput: vi.fn() }));
vi.mock('../src/coverage.js', () => ({ readCoverage: vi.fn() }));

import * as git from '../src/git.js';
import * as evidence from '../src/evidence.js';
import * as coverage from '../src/coverage.js';
import * as executeModule from '../src/execute.js';

// Sidecar invariant: formatter output never mixes EvidenceOutput fields
// (mirror cli-dispatcher.test.ts:26).
const EVIDENCE_OUTPUT_FIELDS = ['schemaVersion', 'analysis', 'analysisStatus', 'gate', 'completeness', 'coverageErrorReason'];

// Engine output: 1 WARN + 1 PASS + 1 NOT_EVALUATED so all three formatter
// branches (annotation/failure/skipped) are exercised; gate WARN -> exit 1.
const evidenceOutput = {
  schemaVersion: '0.5',
  analysisStatus: 'SUCCESS',
  gate: 'WARN',
  completeness: 'COMPLETE',
  changedFunctions: [
    { file: 'src/a.ts', method: 'foo', lineStart: 1, lineEnd: 5, cc: 10, crap: 41, coverage: 0.2 },
    { file: 'src/b.ts', method: 'bar', lineStart: 8, lineEnd: 12, cc: 4, crap: 12, coverage: 0.8 },
    { file: 'src/c.py', method: 'baz', lineStart: 20, lineEnd: 25, cc: 3, crap: null, coverage: null },
  ],
  ruleResults: [
    { ruleId: 'changed-function-high-crap', result: 'WARN', file: 'src/a.ts', method: 'foo', crap: 41, threshold: 30, cc: 10, coverage: 0.2 },
    { ruleId: 'changed-function-high-crap', result: 'PASS', file: 'src/b.ts', method: 'bar', crap: 12, threshold: 30, cc: 4, coverage: 0.8 },
    { ruleId: 'changed-function-high-crap', result: 'NOT_EVALUATED', file: 'src/c.py', method: 'baz', crap: null, threshold: 30, cc: 3, coverage: null },
  ],
  capabilities: {},
};

describe('--format integration (plan task 3)', () => {
  let savedArgv: string[];
  let exitSpy: ReturnType<typeof vi.spyOn>;
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    savedArgv = process.argv;
    exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.argv = savedArgv;
    vi.restoreAllMocks();
  });

  function setArgv(args: string[]) {
    process.argv = ['node', 'cli.js', ...args];
  }

  // Default "healthy" mocks: git + provider ok, no coverage artifact.
  function mockHealthyEnv() {
    (executeModule.execute as ReturnType<typeof vi.fn>).mockResolvedValue({
      command: 'git', args: ['--version'], cwd: undefined, exitCode: 0, stdout: 'git version 2.39.0', stderr: '', durationMs: 1, timedOut: false, errorCode: undefined,
    });
    (git.validateGitRepo as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (git.detectDefaultBase as ReturnType<typeof vi.fn>).mockResolvedValue('origin/main');
    (git.resolveBaseRef as ReturnType<typeof vi.fn>).mockResolvedValue('abc123');
    (git.getChangedIntervals as ReturnType<typeof vi.fn>).mockResolvedValue({
      intervals: new Map([['src/a.ts', [{ start: 1, end: 5 }]]]),
      rawDiff: '',
    });
    (coverage.readCoverage as ReturnType<typeof vi.fn>).mockResolvedValue({
      available: false, coverageMap: null, error: false,
    });
    (evidence.buildEvidenceOutput as ReturnType<typeof vi.fn>).mockResolvedValue(evidenceOutput);
  }

  function sidecar(): string {
    return (logSpy.mock.calls[0] ?? [''])[0] as string;
  }

  function jsonOutput(): Record<string, unknown> {
    return JSON.parse((logSpy.mock.calls[1] ?? [''])[0] as string) as Record<string, unknown>;
  }

  test('--format github --json emits github sidecar + EvidenceOutput JSON as separate console.log calls', async () => {
    mockHealthyEnv();
    setArgv(['check', '--base', 'main', '--format', 'github', '--json']);
    await main();
    expect(errorSpy).not.toHaveBeenCalled();
    // two distinct calls: sidecar first, JSON EvidenceOutput second
    expect(logSpy.mock.calls).toHaveLength(2);
    const out = sidecar();
    expect(out).toContain('::warning file=src/a.ts,line=1,endLine=5,title=high CRAP:: foo CRAP 41 > 30 (cc 10, cov 0.2)');
    expect(out).toContain('::warning file=src/c.py,line=20,endLine=25,title=high CRAP:: baz CRAP null > 30 (cc 3, cov null)');
    expect(out).toContain('\n\n---\n\n');
    expect(out).toContain('Gate: WARN');
    expect(out).toContain('Completeness: COMPLETE');
    // EvidenceOutput JSON unmodified, on its own call
    const parsed = jsonOutput();
    expect(parsed.gate).toBe('WARN');
    expect(parsed.completeness).toBe('COMPLETE');
    expect(parsed.analysisStatus).toBe('SUCCESS');
    expect(parsed.changedFunctions).toHaveLength(3);
    expect(exitSpy).toHaveBeenCalledWith(1); // gate WARN -> exit 1
  });

  test('--format junit --json emits JUnit XML sidecar (failure + pass + skipped)', async () => {
    mockHealthyEnv();
    setArgv(['check', '--base', 'main', '--format', 'junit', '--json']);
    await main();
    expect(errorSpy).not.toHaveBeenCalled();
    expect(logSpy.mock.calls).toHaveLength(2);
    const out = sidecar();
    expect(out).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(out).toContain('<testsuite name="checkchange" tests="3" failures="1">');
    expect(out).toContain('<testcase classname="src/a.ts" name="foo" file="src/a.ts" line="1">');
    expect(out).toContain('<failure message="CRAP 41 &gt; 30">foo CRAP 41 &gt; 30</failure>');
    expect(out).toContain('<testcase classname="src/b.ts" name="bar" file="src/b.ts" line="8"/>');
    expect(out).toContain('<skipped/>');
    expect(jsonOutput().gate).toBe('WARN');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  test('--format sarif --json emits SARIF 2.1.0 sidecar with verbatim relative uri', async () => {
    mockHealthyEnv();
    setArgv(['check', '--base', 'main', '--format', 'sarif', '--json']);
    await main();
    expect(errorSpy).not.toHaveBeenCalled();
    expect(logSpy.mock.calls).toHaveLength(2);
    const out = JSON.parse(sidecar()) as {
      version: string;
      runs: Array<{
        tool: { driver: { name: string; version: string } };
        results: Array<{
          ruleId: string;
          level: string;
          locations: Array<{
            physicalLocation: { artifactLocation: { uri: string }; region: { startLine: number; endLine: number } };
          }>;
        }>;
      }>;
    };
    expect(out.version).toBe('2.1.0');
    expect(out.runs[0]!.tool.driver.name).toBe('checkchange');
    expect(out.runs[0]!.tool.driver.version).toBe('0.5'); // schemaVersion passthrough
    expect(out.runs[0]!.results).toHaveLength(1); // WARN count only
    expect(out.runs[0]!.results[0]!.ruleId).toBe('changed-function-high-crap');
    expect(out.runs[0]!.results[0]!.level).toBe('warning');
    expect(out.runs[0]!.results[0]!.locations[0]!.physicalLocation.artifactLocation.uri).toBe('src/a.ts');
    expect(out.runs[0]!.results[0]!.locations[0]!.physicalLocation.region).toEqual({ startLine: 1, endLine: 5 });
    expect(jsonOutput().gate).toBe('WARN');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  test('formatter sidecars never mix EVIDENCE_OUTPUT_FIELDS (sidecar invariant)', async () => {
    mockHealthyEnv();
    for (const fmt of ['github', 'junit', 'sarif'] as const) {
      vi.clearAllMocks();
      setArgv(['check', '--base', 'main', '--format', fmt, '--json']);
      await main();
      expect(logSpy.mock.calls).toHaveLength(2);
      const out = sidecar();
      if (fmt === 'sarif') {
        const parsed = JSON.parse(out) as Record<string, unknown>;
        expect(parsed.version).toBe('2.1.0');
        for (const field of EVIDENCE_OUTPUT_FIELDS) {
          expect(parsed).not.toHaveProperty(field);
        }
      } else {
        // non-JSON sidecars: must not parse as EvidenceOutput-shaped JSON
        expect(() => JSON.parse(out)).toThrow();
      }
    }
  });

  test('gate/completeness/analysisStatus identical with vs without --format', async () => {
    mockHealthyEnv();
    setArgv(['check', '--base', 'main', '--format', 'junit', '--json']);
    await main();
    expect(logSpy.mock.calls).toHaveLength(2);
    const withFormatJson = (logSpy.mock.calls[1] ?? [''])[0] as string;
    vi.clearAllMocks();
    setArgv(['check', '--base', 'main', '--json']);
    await main();
    expect(logSpy.mock.calls).toHaveLength(1);
    const withoutFormatJson = (logSpy.mock.calls[0] ?? [''])[0] as string;
    // byte-identical EvidenceOutput JSON — formatter sidecar is additive only
    expect(withFormatJson).toBe(withoutFormatJson);
    const withFormat = JSON.parse(withFormatJson) as Record<string, unknown>;
    const withoutFormat = JSON.parse(withoutFormatJson) as Record<string, unknown>;
    expect(withFormat.gate).toBe(withoutFormat.gate);
    expect(withFormat.completeness).toBe(withoutFormat.completeness);
    expect(withFormat.analysisStatus).toBe(withoutFormat.analysisStatus);
    expect(withFormat.gate).toBe('WARN');
    // identical exit behavior in both runs
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  test('--format junit without --json keeps the human summary line unmodified', async () => {
    mockHealthyEnv();
    setArgv(['check', '--base', 'main', '--format', 'junit']);
    await main();
    expect(errorSpy).not.toHaveBeenCalled();
    expect(logSpy.mock.calls).toHaveLength(2);
    expect(sidecar()).toContain('<testsuite name="checkchange" tests="3" failures="1">');
    expect((logSpy.mock.calls[1] ?? [''])[0]).toBe('Analysis complete. Base: abc123, Changed functions: 3');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  test('unknown --format value exits 1 with error before running the check', async () => {
    mockHealthyEnv();
    setArgv(['check', '--base', 'main', '--format', 'bogus']);
    await main();
    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(errorSpy).toHaveBeenCalledWith('Error: Unknown --format value: bogus');
  });
});