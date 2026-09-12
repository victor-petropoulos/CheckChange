import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest';
import { main } from '../src/cli.js';

// Subcommand dispatcher tests (plan task 6). The check path itself is covered
// unchanged by cli.unit.spec.ts + cli.integration.spec.ts + cli.real-git.spec.ts;
// here we cover dispatch, doctor/explain/trace/delta sidecars, and the rule that
// sidecar commands never emit EvidenceOutput-shaped data.
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

const EVIDENCE_OUTPUT_FIELDS = ['schemaVersion', 'analysis', 'analysisStatus', 'gate', 'completeness', 'coverageErrorReason'];

describe('subcommand dispatcher (plan task 6)', () => {
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
  }

  test('check via explicit subcommand runs the check path (flag-first equivalence)', async () => {
    mockHealthyEnv();
    (evidence.buildEvidenceOutput as ReturnType<typeof vi.fn>).mockResolvedValue({
      analysisStatus: 'SUCCESS', gate: 'PASS', completeness: 'COMPLETE',
      changedFunctions: [], coverageErrorReason: undefined,
    });
    setArgv(['check', '--base', 'main', '--json']);
    await main();
    expect(exitSpy).toHaveBeenCalledWith(0);
    expect(git.validateGitRepo).toHaveBeenCalled();
    expect(evidence.buildEvidenceOutput).toHaveBeenCalled();
  });

  test('doctor --json emits probes only (no EvidenceOutput fields)', async () => {
    mockHealthyEnv();
    setArgv(['doctor', '--json']);
    await main();
    expect(errorSpy).not.toHaveBeenCalled();
    const call = (logSpy.mock.calls as unknown[][]).find((c) => typeof c[0] === 'string' && (c[0] as string).includes('"command": "doctor"')) ?? (logSpy.mock.calls as unknown[][])[0] ?? ['{}'];
    const out = JSON.parse(call[0] as string);
    expect(out.command).toBe('doctor');
    const names = out.probes.map((p: { name: string }) => p.name);
    expect(names).toEqual(['gitExecutable', 'gitRepo', 'defaultBase', 'providerAvailability', 'coverageArtifact']);
    for (const field of EVIDENCE_OUTPUT_FIELDS) {
      expect(out).not.toHaveProperty(field);
    }
  });

  test('doctor text mode prints probe lines', async () => {
    mockHealthyEnv();
    setArgv(['doctor']);
    await main();
    expect(errorSpy).not.toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith('gitExecutable: ok');
    expect(logSpy).toHaveBeenCalledWith('gitRepo: ok');
    expect(logSpy).toHaveBeenCalledWith('defaultBase: ok (origin/main)');
    expect(logSpy).toHaveBeenCalledWith('coverageArtifact: missing');
  });

  test('doctor reports coverage artifact present when readCoverage finds one', async () => {
    mockHealthyEnv();
    (coverage.readCoverage as ReturnType<typeof vi.fn>).mockResolvedValue({
      available: true, coverageMap: new Map(), error: false,
    });
    setArgv(['doctor', '--json']);
    await main();
    expect(errorSpy).not.toHaveBeenCalled();
    const out = JSON.parse((logSpy.mock.calls[0] ?? ['{}'])[0] as string);
    expect(out.probes.find((p: { name: string }) => p.name === 'coverageArtifact').status).toBe('present');
  });

  test('explain --json prints derivation from a real run (reuses engine)', async () => {
    mockHealthyEnv();
    (evidence.buildEvidenceOutput as ReturnType<typeof vi.fn>).mockResolvedValue({
      analysisStatus: 'SUCCESS', gate: 'PASS', completeness: 'COMPLETE',
      changedFunctions: [{ file: 'src/a.ts' }],
      capabilities: { complexity: 'available', coverageArtifact: 'available' },
      diagnostics: { quality: { complexity: 'NATIVE', coverage: 'DIRECT' } },
      ruleResults: [{ ruleId: 'changed-function-high-crap', result: 'PASS' }],
    });
    setArgv(['explain', 'changed-function-high-crap', '--json']);
    await main();
    expect(errorSpy).not.toHaveBeenCalled();
    const out = JSON.parse((logSpy.mock.calls[0] ?? ['{}'])[0] as string);
    expect(out.command).toBe('explain');
    expect(out.ruleId).toBe('changed-function-high-crap');
    expect(out.threshold).toBe(30);
    expect(out.provider).toEqual({ complexity: 'NATIVE', coverage: 'DIRECT' });
    expect(out.input.changedFunctionCount).toBe(1);
    expect(out.ruleResults).toEqual([{ ruleId: 'changed-function-high-crap', result: 'PASS' }]);
  });

  test('explain without ruleId returns all rule results', async () => {
    mockHealthyEnv();
    (evidence.buildEvidenceOutput as ReturnType<typeof vi.fn>).mockResolvedValue({
      analysisStatus: 'SUCCESS', gate: 'PASS', completeness: 'COMPLETE',
      changedFunctions: [],
      capabilities: { complexity: 'failed', coverageArtifact: 'absent' },
      ruleResults: [{ ruleId: 'changed-function-high-crap', result: 'WARN' }],
    });
    setArgv(['explain', '--json']);
    await main();
    expect(errorSpy).not.toHaveBeenCalled();
    const out = JSON.parse((logSpy.mock.calls[0] ?? ['{}'])[0] as string);
    expect(out.ruleId).toBe('changed-function-high-crap');
    expect(out.provider.complexity).toBe('UNAVAILABLE');
    expect(out.ruleResults).toHaveLength(1);
  });

  test('trace --json runs the real pipeline and emits correlationId + git span (sidecar only)', async () => {
    mockHealthyEnv();
    (evidence.buildEvidenceOutput as ReturnType<typeof vi.fn>).mockResolvedValue({
      analysisStatus: 'SUCCESS', gate: 'PASS', completeness: 'COMPLETE',
      changedFunctions: [], coverageErrorReason: undefined,
    });
    setArgv(['trace', '--json']);
    await main();
    expect(errorSpy).not.toHaveBeenCalled();
    const out = JSON.parse((logSpy.mock.calls[0] ?? ['{}'])[0] as string);
    expect(out.command).toBe('trace');
    expect(out.correlationId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    expect(Array.isArray(out.spans)).toBe(true);
    const gitSpan = out.spans.find((s: { stage: string }) => s.stage === 'git');
    expect(gitSpan).toBeDefined();
    expect(gitSpan.status).toBe('ok');
    expect(gitSpan.durationMs).toBeGreaterThanOrEqual(0);
    expect(gitSpan.correlationId).toBe(out.correlationId);
    // one correlation ID propagated into the engine call (6th arg = TraceRun)
    const call = (evidence.buildEvidenceOutput as ReturnType<typeof vi.fn>).mock.calls[0] as unknown[];
    expect((call[5] as { correlationId: string }).correlationId).toBe(out.correlationId);
    // sidecar only — never EvidenceOutput-shaped data
    for (const field of EVIDENCE_OUTPUT_FIELDS) {
      expect(out).not.toHaveProperty(field);
    }
  });

  test('delta --json emits explicit NOT_IMPLEMENTED, never fabricated evidence', async () => {
    setArgv(['delta', '--json']);
    await main();
    expect(errorSpy).not.toHaveBeenCalled();
    const out = JSON.parse((logSpy.mock.calls[0] ?? ['{}'])[0] as string);
    expect(out.command).toBe('delta');
    expect(out.status).toBe('NOT_IMPLEMENTED');
  });

  test('unknown first positional is rejected (legacy single-command gate)', async () => {
    setArgv(['bogus']);
    await main();
    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(errorSpy).toHaveBeenCalledWith('Error: Command must be "check"');
  });

  test('doctor reports failure probes without crashing', async () => {
    mockHealthyEnv();
    // git executable missing, repo undetectable, no base, no coverage artifact
    (executeModule.execute as ReturnType<typeof vi.fn>).mockResolvedValue({
      command: 'git', args: ['--version'], cwd: undefined, exitCode: 1, stdout: '', stderr: '', durationMs: 1, timedOut: false, errorCode: undefined,
    });
    (git.validateGitRepo as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Not a git repository'));
    (git.detectDefaultBase as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (coverage.readCoverage as ReturnType<typeof vi.fn>).mockResolvedValue({
      available: false, coverageMap: null, error: true, reason: 'malformed',
    });
    setArgv(['doctor', '--json']);
    await main();
    expect(errorSpy).not.toHaveBeenCalled();
    const out = JSON.parse((logSpy.mock.calls[0] ?? ['{}'])[0] as string);
    expect(out.probes.find((p: { name: string }) => p.name === 'gitExecutable').status).toBe('missing');
    expect(out.probes.find((p: { name: string }) => p.name === 'gitRepo').status).toBe('error');
    expect(out.probes.find((p: { name: string }) => p.name === 'gitRepo').detail).toContain('Not a git repository');
    expect(out.probes.find((p: { name: string }) => p.name === 'defaultBase').status).toBe('missing');
    expect(out.probes.find((p: { name: string }) => p.name === 'providerAvailability').status).toBe('skipped');
    expect(out.probes.find((p: { name: string }) => p.name === 'coverageArtifact').status).toBe('malformed');
  });

  test('explain base detection failure reports error and exits 1', async () => {
    mockHealthyEnv();
    (git.detectDefaultBase as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    setArgv(['explain', '--json']);
    await main();
    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(errorSpy).toHaveBeenCalledWith('Error: Cannot auto-detect base branch. Provide --base <ref> explicitly.');
  });

  test('trace base detection failure reports error and exits 1', async () => {
    mockHealthyEnv();
    (git.detectDefaultBase as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    setArgv(['trace', '--json']);
    await main();
    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(errorSpy).toHaveBeenCalledWith('Error: Cannot auto-detect base branch. Provide --base <ref> explicitly.');
  });

  test('trace git failure propagates error and exits 1 (git span recorded, sidecar never emitted)', async () => {
    mockHealthyEnv();
    (git.validateGitRepo as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Not a git repository'));
    setArgv(['trace', '--json']);
    await main();
    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(errorSpy).toHaveBeenCalledWith('Error: Not a git repository');
    // pipeline halted before engine; no fabricated stage spans, no partial sidecar
    expect(evidence.buildEvidenceOutput).not.toHaveBeenCalled();
  });

  test('doctor and delta sidecars never invoke the evidence engine', async () => {
    mockHealthyEnv();
    for (const cmd of ['doctor', 'delta']) {
      setArgv([cmd, '--json']);
      await main();
      expect(evidence.buildEvidenceOutput).not.toHaveBeenCalled();
    }
  });
});