import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest';
import { main } from '../src/cli.js';
import * as git from '../src/git.js';
import * as evidence from '../src/evidence.js';
import * as coverage from '../src/coverage.js';
import * as executeModule from '../src/execute.js';

vi.mock('../src/execute.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/execute.js')>();
  return { ...actual, execute: vi.fn() };
});
vi.mock('../src/git.js', () => ({
  validateGitRepo: vi.fn(),
  resolveBaseRef: vi.fn(),
  getChangedIntervals: vi.fn(),
  detectDefaultBase: vi.fn(),
}));
vi.mock('../src/evidence.js', () => ({ buildEvidenceOutput: vi.fn(), initProviderConfig: vi.fn() }));
vi.mock('../src/coverage.js', () => ({ readCoverage: vi.fn() }));

describe('doctor remediation hints', () => {
  let savedArgv: string[];
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    savedArgv = process.argv;
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.clearAllMocks();

    // Default healthy mocks: git ok, repo ok, base resolved, changed .ts file
    (executeModule.execute as ReturnType<typeof vi.fn>).mockResolvedValue({
      command: 'git', args: ['--version'], cwd: undefined, exitCode: 0, stdout: 'git version 2.39.0', stderr: '', durationMs: 1, timedOut: false, errorCode: undefined,
    });
    (git.validateGitRepo as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (git.detectDefaultBase as ReturnType<typeof vi.fn>).mockResolvedValue('origin/main');
    (git.getChangedIntervals as ReturnType<typeof vi.fn>).mockResolvedValue({
      intervals: new Map([['src/a.ts', [{ start: 1, end: 5 }]]]),
      rawDiff: '',
    });
    (evidence.initProviderConfig as ReturnType<typeof vi.fn>).mockReturnValue({
      config: {},
      registry: new Map([['.ts', { language: 'TypeScript', source: 'native' }]]),
      source: 'builtin',
    });
    (coverage.readCoverage as ReturnType<typeof vi.fn>).mockResolvedValue({
      available: false, coverageMap: null, error: false,
    });
  });

  afterEach(() => {
    process.argv = savedArgv;
    vi.restoreAllMocks();
  });

  function setArgv(args: string[]) {
    process.argv = ['node', 'cli.js', ...args];
  }

  function getLastDoctorOutput(): { command: string; probes: Array<{ name: string; status: string; detail?: string; remediation?: string }> } {
    const outputs = (logSpy.mock.calls as unknown[][]).filter((c) => typeof c[0] === 'string' && (c[0] as string).includes('"command": "doctor"'));
    expect(outputs.length).toBeGreaterThan(0);
    return JSON.parse(outputs[outputs.length - 1][0] as string);
  }

  function getDoctorTextLines(): string[] {
    return (logSpy.mock.calls as unknown[][])
      .filter((c) => typeof c[0] === 'string')
      .map((c) => c[0] as string);
  }

  test('coverageArtifact missing: remediation hint present in JSON', async () => {
    setArgv(['doctor', '--json']);
    await main();
    const out = getLastDoctorOutput();
    const probe = out.probes.find((p) => p.name === 'coverageArtifact');
    expect(probe).toBeDefined();
    expect(probe!.status).toBe('missing');
    expect(probe!.remediation).toContain('coverage artifact not found');
    const base = 'coverage artifact not found — generate one: `npx vitest run --coverage` (JS/TS) or `coverage run -m pytest && coverage json` (Python), then pass `--coverage-file <path>.`';
    if (probe!.remediation.length > base.length) {
      expect(
        probe!.remediation.includes('Detected runners') ||
          probe!.remediation.includes('No test runner') ||
          probe!.remediation.includes('Runner detection failed'),
      ).toBe(true);
    }
  });

  test('providerAvailability no-changed-files: remediation hint present', async () => {
    (git.getChangedIntervals as ReturnType<typeof vi.fn>).mockResolvedValue({
      intervals: new Map(),
      rawDiff: '',
    });
    setArgv(['doctor', '--json']);
    await main();
    const out = getLastDoctorOutput();
    const probe = out.probes.find((p) => p.name === 'providerAvailability');
    expect(probe).toBeDefined();
    expect(probe!.status).toBe('no-changed-files');
    expect(probe!.remediation).toContain('no changed files detected');
  });

  test('coverageArtifact malformed: remediation hint present', async () => {
    (coverage.readCoverage as ReturnType<typeof vi.fn>).mockResolvedValue({
      available: true, coverageMap: null, error: true, reason: 'malformed JSON',
    });
    setArgv(['doctor', '--json']);
    await main();
    const out = getLastDoctorOutput();
    const probe = out.probes.find((p) => p.name === 'coverageArtifact');
    expect(probe).toBeDefined();
    expect(probe!.status).toBe('malformed');
    expect(probe!.remediation).toContain('regenerate a valid coverage JSON');
  });

  test('ok states carry no remediation field', async () => {
    setArgv(['doctor', '--json']);
    await main();
    const out = getLastDoctorOutput();
    const okProbes = ['gitExecutable', 'gitRepo', 'defaultBase', 'providerAvailability'];
    for (const name of okProbes) {
      const probe = out.probes.find((p) => p.name === name);
      expect(probe).toBeDefined();
      expect(probe!.status).toBe('ok');
      expect(probe).not.toHaveProperty('remediation');
    }
  });

  test('gitExecutable missing: remediation hint in JSON and text', async () => {
    (executeModule.execute as ReturnType<typeof vi.fn>).mockResolvedValue({
      command: 'git', args: ['--version'], cwd: undefined, exitCode: 1, stdout: '', stderr: 'git: command not found', durationMs: 1, timedOut: false, errorCode: undefined,
    });
    setArgv(['doctor', '--json']);
    await main();
    const out = getLastDoctorOutput();
    const jsonProbe = out.probes.find((p) => p.name === 'gitExecutable');
    expect(jsonProbe).toBeDefined();
    expect(jsonProbe!.status).toBe('missing');
    expect(jsonProbe!.remediation).toBe('git executable not found — install git and ensure it is on your PATH.');

    logSpy.mockClear();
    setArgv(['doctor']);
    await main();
    const text = getDoctorTextLines().join('\n');
    expect(text).toContain('gitExecutable: missing');
    expect(text).toContain('↳ git executable not found — install git and ensure it is on your PATH.');
  });

  test('gitRepo error: remediation hint in JSON and text', async () => {
    (git.validateGitRepo as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('not a git repository'));
    setArgv(['doctor', '--json']);
    await main();
    const out = getLastDoctorOutput();
    const jsonProbe = out.probes.find((p) => p.name === 'gitRepo');
    expect(jsonProbe).toBeDefined();
    expect(jsonProbe!.status).toBe('error');
    expect(jsonProbe!.remediation).toBe('not a git repository (or git unavailable) — run from a repo root, or initialize one with `git init`.');

    logSpy.mockClear();
    setArgv(['doctor']);
    await main();
    const text = getDoctorTextLines().join('\n');
    expect(text).toContain('gitRepo: error');
    expect(text).toContain('↳ not a git repository (or git unavailable) — run from a repo root, or initialize one with `git init`.');
  });

  test('defaultBase missing: remediation hint in JSON and text', async () => {
    (git.detectDefaultBase as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    setArgv(['doctor', '--json']);
    await main();
    const out = getLastDoctorOutput();
    const jsonProbe = out.probes.find((p) => p.name === 'defaultBase');
    expect(jsonProbe).toBeDefined();
    expect(jsonProbe!.status).toBe('missing');
    expect(jsonProbe!.remediation).toBe('no base ref could be auto-detected — pass `--base <ref>` (e.g. `--base main`).');

    logSpy.mockClear();
    setArgv(['doctor']);
    await main();
    const text = getDoctorTextLines().join('\n');
    expect(text).toContain('defaultBase: missing');
    expect(text).toContain('↳ no base ref could be auto-detected — pass `--base <ref>` (e.g. `--base main`).');
  });

  test('providerAvailability partial: remediation hint in JSON and text', async () => {
    (git.getChangedIntervals as ReturnType<typeof vi.fn>).mockResolvedValue({
      intervals: new Map([['src/b.py', [{ start: 1, end: 5 }]]]),
      rawDiff: '',
    });
    setArgv(['doctor', '--json']);
    await main();
    const out = getLastDoctorOutput();
    const jsonProbe = out.probes.find((p) => p.name === 'providerAvailability');
    expect(jsonProbe).toBeDefined();
    expect(jsonProbe!.status).toBe('partial');
    expect(jsonProbe!.remediation).toBe('some changed extensions have no registered provider — add a provider config (`--provider-config`) or restrict changes to supported file types.');

    logSpy.mockClear();
    setArgv(['doctor']);
    await main();
    const text = getDoctorTextLines().join('\n');
    expect(text).toContain('providerAvailability: partial');
    expect(text).toContain('↳ some changed extensions have no registered provider — add a provider config (`--provider-config`) or restrict changes to supported file types.');
  });

  test('providerAvailability error: remediation hint in JSON and text', async () => {
    (git.getChangedIntervals as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('git diff failed'));
    setArgv(['doctor', '--json']);
    await main();
    const out = getLastDoctorOutput();
    const jsonProbe = out.probes.find((p) => p.name === 'providerAvailability');
    expect(jsonProbe).toBeDefined();
    expect(jsonProbe!.status).toBe('error');
    expect(jsonProbe!.remediation).toBe('failed to compute changed files — verify the base ref and that your git state is healthy.');

    logSpy.mockClear();
    setArgv(['doctor']);
    await main();
    const text = getDoctorTextLines().join('\n');
    expect(text).toContain('providerAvailability: error');
    expect(text).toContain('↳ failed to compute changed files — verify the base ref and that your git state is healthy.');
  });

  test('providerAvailability skipped: remediation hint in JSON and text', async () => {
    (git.detectDefaultBase as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    setArgv(['doctor', '--json']);
    await main();
    const out = getLastDoctorOutput();
    const jsonProbe = out.probes.find((p) => p.name === 'providerAvailability');
    expect(jsonProbe).toBeDefined();
    expect(jsonProbe!.status).toBe('skipped');
    expect(jsonProbe!.remediation).toBe('no base ref was resolved — pass `--base <ref>` so changed files can be detected.');

    logSpy.mockClear();
    setArgv(['doctor']);
    await main();
    const text = getDoctorTextLines().join('\n');
    expect(text).toContain('providerAvailability: skipped');
    expect(text).toContain('↳ no base ref was resolved — pass `--base <ref>` so changed files can be detected.');
  });
});
