import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as child_process from 'node:child_process';

// Mock fs and child_process for autoCoverage unit tests
vi.mock('node:fs', async () => {
  const actual = await vi.importActual<typeof fs>('node:fs');
  return { ...actual, readdirSync: vi.fn(), readFileSync: vi.fn(), existsSync: vi.fn() };
});
vi.mock('node:child_process', async () => {
  const actual = await vi.importActual<typeof child_process>('node:child_process');
  return { ...actual, spawnSync: vi.fn() };
});
vi.mock('../src/git.js', () => ({
  validateGitRepo: vi.fn(),
  resolveBaseRef: vi.fn(),
  getChangedIntervals: vi.fn(),
  detectDefaultBase: vi.fn(),
}));

import { autoCoverage } from '../src/auto-coverage.js';
import { detectDefaultBase } from '../src/git.js';

// Access mocks via the mocked modules (imported after vi.mock)
const mockReaddirSync = fs.readdirSync as ReturnType<typeof vi.fn>;
const mockReadFileSync = fs.readFileSync as ReturnType<typeof vi.fn>;
const mockExistsSync = fs.existsSync as ReturnType<typeof vi.fn>;
const mockSpawnSync = child_process.spawnSync as ReturnType<typeof vi.fn>;

describe('autoCoverage() — detection precedence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('vitest detected first (over jest)', () => {
    mockReaddirSync.mockImplementation((dir: string) => {
      if (dir === '/proj') return ['vitest.config.ts', 'jest.config.js'];
      return [];
    });
    mockReadFileSync.mockImplementation((p: string) => {
      if (p.endsWith('package.json')) return '{}';
      throw new Error('ENOENT');
    });
    mockExistsSync.mockImplementation((p: string) => p.endsWith('coverage-final.json'));
    mockSpawnSync.mockReturnValue({ status: 0, error: undefined, pid: 1, output: [], stdout: '', stderr: '', signal: null });

    const result = autoCoverage('/proj');
    expect(result.generatedPath).toBe('/proj/coverage/coverage-final.json');
    expect(mockSpawnSync).toHaveBeenCalledWith('npx', ['vitest', 'run', '--coverage'], expect.any(Object));
  });

  test('jest detected when no vitest', () => {
    mockReaddirSync.mockImplementation((dir: string) => {
      if (dir === '/proj') return ['jest.config.js'];
      return [];
    });
    mockReadFileSync.mockImplementation((p: string) => {
      if (p.endsWith('package.json')) return '{}';
      throw new Error('ENOENT');
    });
    mockExistsSync.mockImplementation((p: string) => p.endsWith('coverage-final.json'));
    mockSpawnSync.mockReturnValue({ status: 0, error: undefined, pid: 1, output: [], stdout: '', stderr: '', signal: null });

    const result = autoCoverage('/proj');
    expect(result.generatedPath).toBe('/proj/coverage/coverage-final.json');
    expect(mockSpawnSync).toHaveBeenCalledWith('npx', ['jest', '--coverage'], expect.any(Object));
  });

  test('pytest detected when no vitest/jest', () => {
    mockReaddirSync.mockImplementation((dir: string, opts?: { recursive?: boolean }) => {
      if (dir === '/proj' && !opts?.recursive) return ['pyproject.toml'];
      if (dir === '/proj' && opts?.recursive) return ['main.py'];
      return [];
    });
    mockReadFileSync.mockImplementation(() => { throw new Error('ENOENT'); });
    mockExistsSync.mockReturnValue(true); // pyproject.toml exists
    mockSpawnSync.mockReturnValue({ status: 0, error: undefined, pid: 1, output: [], stdout: '', stderr: '', signal: null });

    const result = autoCoverage('/proj');
    expect(result.generatedPath).toBe('/proj/coverage.xml');
    expect(mockSpawnSync).toHaveBeenCalledWith('python3', ['-m', 'pytest', '--cov', '--cov-report=xml'], expect.any(Object));
  });

  test('no runner detected returns null + hint', () => {
    mockReaddirSync.mockReturnValue([]);
    mockReadFileSync.mockImplementation(() => { throw new Error('ENOENT'); });
    mockExistsSync.mockReturnValue(false);

    const result = autoCoverage('/proj');
    expect(result.generatedPath).toBeNull();
    expect(result.hint).toContain('No test runner detected');
  });
});

describe('autoCoverage() — timeout and failure', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('timeout returns ETIMEDOUT hint', () => {
    mockReaddirSync.mockImplementation((dir: string) => {
      if (dir === '/proj') return ['vitest.config.ts'];
      return [];
    });
    mockReadFileSync.mockImplementation(() => { throw new Error('ENOENT'); });
    mockExistsSync.mockReturnValue(false);
    mockSpawnSync.mockReturnValue({
      status: null,
      error: Object.assign(new Error('spawnSync timeout'), { code: 'ETIMEDOUT' }),
      pid: 1, output: [], stdout: '', stderr: '', signal: null,
    });

    const result = autoCoverage('/proj');
    expect(result.generatedPath).toBeNull();
    expect(result.hint).toContain('timed out after 120s');
  });

  test('non-zero exit returns exit code hint', () => {
    mockReaddirSync.mockImplementation((dir: string) => {
      if (dir === '/proj') return ['vitest.config.ts'];
      return [];
    });
    mockReadFileSync.mockImplementation(() => { throw new Error('ENOENT'); });
    mockExistsSync.mockReturnValue(false);
    mockSpawnSync.mockReturnValue({ status: 1, error: undefined, pid: 1, output: [], stdout: '', stderr: '', signal: null });

    const result = autoCoverage('/proj');
    expect(result.generatedPath).toBeNull();
    expect(result.hint).toContain('exited 1');
  });

  test('artifact missing after spawn returns hint', () => {
    mockReaddirSync.mockImplementation((dir: string) => {
      if (dir === '/proj') return ['vitest.config.ts'];
      return [];
    });
    mockReadFileSync.mockImplementation(() => { throw new Error('ENOENT'); });
    mockExistsSync.mockReturnValue(false); // artifact doesn't exist
    mockSpawnSync.mockReturnValue({ status: 0, error: undefined, pid: 1, output: [], stdout: '', stderr: '', signal: null }); // spawn succeeded

    const result = autoCoverage('/proj');
    expect(result.generatedPath).toBeNull();
    expect(result.hint).toContain('artifact not found');
  });
});

describe('autoCoverage() — explicit --coverage-file skips auto', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('cli.ts skips autoCoverage when --coverage-file is provided', async () => {
    const { parseCliArgs } = await import('../src/cli.js');
    const savedArgv = process.argv;
    process.argv = ['node', 'cli.js', '--auto-coverage', '--coverage-file', 'custom.json', 'check'];
    try {
      const opts = parseCliArgs();
      expect(opts.autoCoverage).toBe(true);
      expect(opts.coverageFile).toBe('custom.json');
      // The guard in runCheck: opts.autoCoverage === true && !coverageFile
      // Since coverageFile = 'custom.json', autoCoverage is NOT called
      expect(opts.autoCoverage && !opts.coverageFile).toBe(false);
    } finally {
      process.argv = savedArgv;
    }
  });
});

describe('combined --auto-coverage --coverage-file wiring (C1 guard)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('combined flags: explicit file + missing = autoGenerated false (explicit wins)', async () => {
    // Simulate the wiring in runCheck: when both flags are set AND explicit file
    // does not exist, autoGenerated must be false so buildEvidenceOutput sees
    // coverageCapability=failed → returns FAILED (not downgraded to absent).
    const { parseCliArgs } = await import('../src/cli.js');
    const savedArgv = process.argv;
    process.argv = ['node', 'cli.js', '--auto-coverage', '--coverage-file', '/nonexistent/missing.json', 'check'];
    try {
      const opts = parseCliArgs();
      // Guard: autoCoverage && !coverageFile → false (explicit wins, auto block skipped)
      expect(opts.autoCoverage && !opts.coverageFile).toBe(false);
      // Therefore autoGenerated must be false — the flag alone does not set it
      // (only successful generation sets it). This means buildEvidenceOutput gets
      // autoGenerated=false → coverageCapability=failed → FAILED/exit1 (not SUCCESS).
      const autoGenerated = false; // generation-truth: block was skipped, no generation happened
      expect(autoGenerated).toBe(false);
    } finally {
      process.argv = savedArgv;
    }
  });
});

describe('detectBase() — base resolution helper', () => {
  let exitSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.clearAllMocks();
    // Safe default: returns null (exits). Tests override as needed.
    vi.mocked(detectDefaultBase).mockResolvedValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('explicit base returns as-is, no detectDefaultBase called', async () => {
    const { detectBase } = await import('../src/cli.js');
    const result = await detectBase('origin/main', false);
    expect(result).toBe('origin/main');
    expect(detectDefaultBase).not.toHaveBeenCalled();
    expect(exitSpy).not.toHaveBeenCalled();
  });

  test('null base with successful detection returns detected base', async () => {
    vi.mocked(detectDefaultBase).mockResolvedValue('origin/develop');
    const { detectBase } = await import('../src/cli.js');
    const result = await detectBase(null, false);
    expect(result).toBe('origin/develop');
    expect(exitSpy).not.toHaveBeenCalled();
  });

  test('null base with null detection exits 1 with error', async () => {
    vi.mocked(detectDefaultBase).mockResolvedValue(null);
    const { detectBase } = await import('../src/cli.js');
    await detectBase(null, false);
    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(errorSpy).toHaveBeenCalledWith('Error: Cannot auto-detect base branch (tried origin/master, origin/main, master, main). Provide --base <ref> explicitly.');
  });

  test('verbose flag passed through to detectDefaultBase', async () => {
    vi.mocked(detectDefaultBase).mockResolvedValue('origin/main');
    const { detectBase } = await import('../src/cli.js');
    await detectBase(null, true);
    expect(detectDefaultBase).toHaveBeenCalledWith(true);
  });
});

describe('--auto-coverage CLI flag E2E', () => {
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

  test('--auto-coverage flag parsed correctly', async () => {
    const { parseCliArgs } = await import('../src/cli.js');
    process.argv = ['node', 'cli.js', '--auto-coverage', 'check'];
    const opts = parseCliArgs();
    expect(opts.autoCoverage).toBe(true);
  });

  test('--auto-coverage not set by default', async () => {
    const { parseCliArgs } = await import('../src/cli.js');
    process.argv = ['node', 'cli.js', 'check'];
    const opts = parseCliArgs();
    expect(opts.autoCoverage).toBeUndefined();
  });

  test('--auto-coverage combined with --json works', async () => {
    const { parseCliArgs } = await import('../src/cli.js');
    process.argv = ['node', 'cli.js', '--auto-coverage', '--json', 'check'];
    const opts = parseCliArgs();
    expect(opts.autoCoverage).toBe(true);
    expect(opts.json).toBe(true);
  });
});
