import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest';
import { main } from '../src/cli.js';

vi.mock('../src/git.js', () => ({
  validateGitRepo: vi.fn(),
  resolveBaseRef: vi.fn(),
  getChangedIntervals: vi.fn()
}));

vi.mock('../src/evidence.js', () => ({
  buildEvidenceOutput: vi.fn()
}));

import * as git from '../src/git.js';
import * as evidence from '../src/evidence.js';

describe('main() integration tests', () => {
  let savedArgv: string[];
  let exitSpy: ReturnType<typeof vi.spyOn>;
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;
  let validateGitRepoMock: any;
  let resolveBaseRefMock: any;
  let getChangedIntervalsMock: any;
  let buildEvidenceOutputMock: any;

  beforeEach(() => {
    savedArgv = process.argv;
    exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    
    validateGitRepoMock = git.validateGitRepo;
    resolveBaseRefMock = git.resolveBaseRef;
    getChangedIntervalsMock = git.getChangedIntervals;
    buildEvidenceOutputMock = evidence.buildEvidenceOutput;
    
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.argv = savedArgv;
    vi.restoreAllMocks();
  });

  function setArgv(args: string[]) {
    process.argv = ['node', 'cli.js', ...args];
  }

  function mockCwd(path: string) {
    vi.spyOn(process, 'cwd').mockReturnValue(path);
  }

  test('success PASS json false (no json output, exit 0)', async () => {
    // Arrange
    setArgv(['--base', 'main', 'check']);
    mockCwd('/fake/cwd');
    
    validateGitRepoMock.mockResolvedValue(undefined);
    resolveBaseRefMock.mockResolvedValue('abc123');
    getChangedIntervalsMock.mockResolvedValue({ intervals: new Map() });
    
    const mockOutput = {
      analysisStatus: 'SUCCESS',
      gate: 'PASS',
      completeness: 'COMPLETE',
      changedFunctions: [],
      coverageErrorReason: undefined
    };
    buildEvidenceOutputMock.mockResolvedValue(mockOutput);
    
    // Act
    await main();
    
    // Assert
    expect(exitSpy).toHaveBeenCalledWith(0);
    expect(logSpy).toHaveBeenCalledWith(`Analysis complete. Base: abc123, Changed functions: 0`);
    expect(errorSpy).not.toHaveBeenCalled();
  });

  test('success PASS json true (console.log JSON, exit 0)', async () => {
    // Arrange
    setArgv(['--base', 'main', '--json', 'check']);
    mockCwd('/fake/cwd');
    
    validateGitRepoMock.mockResolvedValue(undefined);
    resolveBaseRefMock.mockResolvedValue('abc123');
    getChangedIntervalsMock.mockResolvedValue({ intervals: new Map() });
    
    const mockOutput = {
      analysisStatus: 'SUCCESS',
      gate: 'PASS',
      completeness: 'COMPLETE',
      changedFunctions: [],
      coverageErrorReason: undefined
    };
    buildEvidenceOutputMock.mockResolvedValue(mockOutput);
    
    // Act
    await main();
    
    // Assert
    expect(exitSpy).toHaveBeenCalledWith(0);
    expect(logSpy).toHaveBeenCalledWith(JSON.stringify(mockOutput, null, 2));
    expect(errorSpy).not.toHaveBeenCalled();
  });

  test('verbose true prints [verbose] to stderr', async () => {
    // Arrange
    setArgv(['--base', 'main', '--verbose', 'check']);
    mockCwd('/fake/cwd');
    
    validateGitRepoMock.mockResolvedValue(undefined);
    resolveBaseRefMock.mockResolvedValue('abc123');
    getChangedIntervalsMock.mockResolvedValue({ intervals: new Map() });
    
    const mockOutput = {
      analysisStatus: 'SUCCESS',
      gate: 'PASS',
      completeness: 'COMPLETE',
      changedFunctions: [],
      coverageErrorReason: undefined
    };
    buildEvidenceOutputMock.mockResolvedValue(mockOutput);
    
    // Act
    await main();
    
    // Assert
    expect(errorSpy).toHaveBeenCalledWith(`[verbose] analysisStatus=SUCCESS gate=PASS completeness=COMPLETE changedFunctions=0`);
  });

  test('gate WARN → exit 1', async () => {
    // Arrange
    setArgv(['--base', 'main', 'check']);
    mockCwd('/fake/cwd');
    
    validateGitRepoMock.mockResolvedValue(undefined);
    resolveBaseRefMock.mockResolvedValue('abc123');
    getChangedIntervalsMock.mockResolvedValue({ intervals: new Map() });
    
    const mockOutput = {
      analysisStatus: 'SUCCESS',
      gate: 'WARN',
      completeness: 'COMPLETE',
      changedFunctions: [],
      coverageErrorReason: undefined
    };
    buildEvidenceOutputMock.mockResolvedValue(mockOutput);
    
    // Act
    await main();
    
    // Assert
    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(logSpy).toHaveBeenCalledWith(`Analysis complete. Base: abc123, Changed functions: 0`);
  });

  test('analysisStatus FAILED coverageErrorReason missing → console.error missing, exit 1', async () => {
    // Arrange
    setArgv(['--base', 'main', 'check']);
    mockCwd('/fake/cwd');
    
    validateGitRepoMock.mockResolvedValue(undefined);
    resolveBaseRefMock.mockResolvedValue('abc123');
    getChangedIntervalsMock.mockResolvedValue({ intervals: new Map() });
    
    const mockOutput = {
      analysisStatus: 'FAILED',
      gate: null,
      completeness: 'INCOMPLETE',
      changedFunctions: [],
      coverageErrorReason: 'missing'
    };
    buildEvidenceOutputMock.mockResolvedValue(mockOutput);
    
    // Act
    await main();
    
    // Assert
    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(errorSpy).toHaveBeenCalledWith('Error: coverage artifact missing');
  });

  test('analysisStatus FAILED coverageErrorReason malformed → exit 1', async () => {
    // Arrange
    setArgv(['--base', 'main', 'check']);
    mockCwd('/fake/cwd');
    
    validateGitRepoMock.mockResolvedValue(undefined);
    resolveBaseRefMock.mockResolvedValue('abc123');
    getChangedIntervalsMock.mockResolvedValue({ intervals: new Map() });
    
    const mockOutput = {
      analysisStatus: 'FAILED',
      gate: null,
      completeness: 'INCOMPLETE',
      changedFunctions: [],
      coverageErrorReason: 'malformed'
    };
    buildEvidenceOutputMock.mockResolvedValue(mockOutput);
    
    // Act
    await main();
    
    // Assert
    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(errorSpy).toHaveBeenCalledWith('Error: coverage artifact malformed');
  });

  test('git error path (validateGitRepo rejects) → catch → exit 1', async () => {
    // Arrange
    setArgv(['--base', 'main', 'check']);
    mockCwd('/fake/cwd');
    
    validateGitRepoMock.mockRejectedValue(new Error('Not a git repository'));
    
    // Act
    await main();
    
    // Assert
    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(errorSpy).toHaveBeenCalledWith('Error: Not a git repository');
    expect(resolveBaseRefMock).not.toHaveBeenCalled();
    expect(getChangedIntervalsMock).not.toHaveBeenCalled();
    expect(buildEvidenceOutputMock).not.toHaveBeenCalled();
  });

  test('UNSUPPORTED branch if feasible (gate null completeness NOT_APPLICABLE → exit 0)', async () => {
    // Arrange
    setArgv(['--base', 'main', 'check']);
    mockCwd('/fake/cwd');
    
    validateGitRepoMock.mockResolvedValue(undefined);
    resolveBaseRefMock.mockResolvedValue('abc123');
    // Create intervals map with a non-TS file
    const intervalsMap = new Map();
    intervalsMap.set('README.md', [{ start: 1, end: 10 }]);
    getChangedIntervalsMock.mockResolvedValue({ intervals: intervalsMap });
    
    const mockOutput = {
      analysisStatus: 'UNSUPPORTED',
      gate: null,
      completeness: 'NOT_APPLICABLE',
      changedFunctions: [],
      coverageErrorReason: undefined
    };
    buildEvidenceOutputMock.mockResolvedValue(mockOutput);
    
    // Act
    await main();
    
    // Assert
    expect(exitSpy).toHaveBeenCalledWith(0);
    expect(logSpy).toHaveBeenCalledWith(`Analysis complete. Base: abc123, Changed functions: 0`);
  });
});