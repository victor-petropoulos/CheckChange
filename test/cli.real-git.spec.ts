/// <reference types="node" />

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { main } from '../src/cli.js';
import * as executeModule from '../src/execute.js';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';

describe('cli.real-git.spec.ts', () => {
  let originalCwd: string;

  beforeEach(() => {
    originalCwd = process.cwd();
    process.chdir(originalCwd);
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.chdir(originalCwd);
    vi.restoreAllMocks();
  });

  test('valid repo with real git init/commit returns PASS exit 0', async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'code-risk-test-'));
    process.chdir(tempDir);

    // Initialize git repo
    await fs.mkdir(path.join(tempDir, 'src'));
    await fs.writeFile(path.join(tempDir, 'src', 'index.ts'), 'console.log("hello");');
    execSync('git init', { stdio: 'ignore' });
    execSync('git config user.email "ci@example.com"', { stdio: 'ignore' });
    execSync('git config user.name "CI"', { stdio: 'ignore' });
    execSync('git add src/index.ts', { stdio: 'ignore' });
    execSync('git commit -m "initial commit"', { stdio: 'ignore' });

    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    const logSpy = vi.spyOn(console, 'log');
    const errorSpy = vi.spyOn(console, 'error');

    const originalArgv = process.argv;
    try {
      process.argv = ['node', 'cli.js', '--base', 'HEAD', '--json'];
      await main();
    } finally {
      process.argv = originalArgv;
    }

    expect(exitSpy).toHaveBeenCalledWith(0);
    expect(logSpy).toHaveBeenCalled();
    const logCallArgs = logSpy.mock.calls[0][0];
    const output = JSON.parse(logCallArgs as string);
    // Check schema 0.2
    expect(output).toHaveProperty('analysisStatus');
    expect(output).toHaveProperty('gate');
    expect(output).toHaveProperty('completeness');
    expect(output).toHaveProperty('capabilities');
    expect(output.capabilities).toHaveProperty('git');
    expect(output.capabilities).toHaveProperty('complexity');
    expect(output.capabilities).toHaveProperty('coverageArtifact');
    // The capabilities are strings: "available" or "absent"
    expect(typeof output.capabilities.git).toBe('string');
    expect(typeof output.capabilities.complexity).toBe('string');
    expect(typeof output.capabilities.coverageArtifact).toBe('string');
    // We can also check that they are one of the expected values, but not required.
  });

  test('not-a-repo throws "Not a git repository"', async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'code-risk-test-'));
    process.chdir(tempDir);
    // Do not initialize git

    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    const errorSpy = vi.spyOn(console, 'error');

    const originalArgv = process.argv;
    try {
      process.argv = ['node', 'cli.js', '--base', 'HEAD'];
      await main();
    } finally {
      process.argv = originalArgv;
    }

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Error: Not a git repository'));
  });

  test('invalid base ref throws "Cannot resolve base reference"', async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'code-risk-test-'));
    process.chdir(tempDir);

    // Initialize git repo
    await fs.mkdir(path.join(tempDir, 'src'));
    await fs.writeFile(path.join(tempDir, 'src', 'index.ts'), 'console.log("hello");');
    execSync('git init', { stdio: 'ignore' });
    execSync('git config user.email "ci@example.com"', { stdio: 'ignore' });
    execSync('git config user.name "CI"', { stdio: 'ignore' });
    execSync('git add src/index.ts', { stdio: 'ignore' });
    execSync('git commit -m "initial commit"', { stdio: 'ignore' });

    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    const errorSpy = vi.spyOn(console, 'error');

    const originalArgv = process.argv;
    try {
      process.argv = ['node', 'cli.js', '--base', 'nonexistent'];
      await main();
    } finally {
      process.argv = originalArgv;
    }

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Error: Cannot resolve base reference: nonexistent'));
  });

  test('ENOENT throws "Git executable not found"', async () => {
    // We will stub the execute function to return an ENOENT error for any git command.
    const executeSpy = vi.spyOn(executeModule, 'execute');
    executeSpy.mockResolvedValue({
      command: 'git',
      args: [],
      cwd: undefined,
      exitCode: null,
      stdout: '',
      stderr: '',
      durationMs: 0,
      timedOut: false,
      errorCode: 'ENOENT'
    });

    // We don't need a git repo for this test, but we must be in a directory (any directory)
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'code-risk-test-'));
    process.chdir(tempDir);

    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    const errorSpy = vi.spyOn(console, 'error');

    const originalArgv = process.argv;
    try {
      process.argv = ['node', 'cli.js', '--base', 'HEAD'];
      await main();
    } finally {
      process.argv = originalArgv;
    }

    expect(executeSpy).toHaveBeenCalled();
    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Error: Git executable not found'));
  });
});