import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest';
import { main } from '../src/cli.js';
import * as providers from '../src/providers/index.js';

// Mock the prepare-phase functions so we can control approval/install/verify flow.
vi.mock('../src/providers/index.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/providers/index.js')>();
  return {
    ...actual,
    promptApproval: vi.fn(),
    executeInstallPlan: vi.fn(),
    flushConfigUpdates: vi.fn(),
    verifyInstall: vi.fn(),
    detectStack: vi.fn(),
    createInstallPlan: vi.fn(),
  };
});

vi.mock('../src/evidence.js', () => ({
  buildEvidenceOutput: vi.fn(),
  initProviderConfig: vi.fn(() => ({
    config: { version: 1, providers: [] },
    registry: new Map(),
  })),
}));

vi.mock('../src/git.js', () => ({
  validateGitRepo: vi.fn(),
  resolveBaseRef: vi.fn(),
  getChangedIntervals: vi.fn(),
  detectDefaultBase: vi.fn(),
}));

vi.mock('../src/coverage.js', () => ({ readCoverage: vi.fn() }));
vi.mock('../src/delta.js', () => ({ compareFromFiles: vi.fn() }));
vi.mock('../src/auto-coverage.js', () => ({ autoCoverage: vi.fn() }));
vi.mock('../src/execute.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/execute.js')>();
  return { ...actual, execute: vi.fn() };
});

describe('prepare-repo CLI: declined report', () => {
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

    // Stub detectStack/createInstallPlan so runPreparePhases doesn't depend on real detection.
    vi.mocked(providers.detectStack).mockReturnValue({
      languages: ['typescript'],
      runners: new Map(),
      lockfiles: new Map(),
    });
    vi.mocked(providers.createInstallPlan).mockReturnValue([]);
  });

  afterEach(() => {
    process.argv = savedArgv;
    vi.restoreAllMocks();
  });

  function setArgv(args: string[]) {
    process.argv = ['node', 'cli.js', ...args];
  }

  test('declined --json emits {status:declined} on stdout, exits 1', async () => {
    vi.mocked(providers.promptApproval).mockResolvedValue({ approved: false, preamble: 'test preamble' });

    setArgv(['prepare-repo', '--json']);
    await main();

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(errorSpy).not.toHaveBeenCalled();
    const output = JSON.parse(logSpy.mock.calls[0][0] as string);
    expect(output.status).toBe('declined');
  });

  test('declined text emits error to stderr, exits 1', async () => {
    vi.mocked(providers.promptApproval).mockResolvedValue({ approved: false, preamble: 'test preamble' });

    setArgv(['prepare-repo']);
    await main();

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(errorSpy).toHaveBeenCalledWith('Declined — no changes made.');
  });
});
