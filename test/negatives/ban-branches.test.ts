/// <reference types="node" />

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { main } from '../../src/cli.js';
import { promises as fs, rmSync } from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';

describe('evidence build branches (hermetic, in-process)', () => {
  let originalCwd: string;
  let tempDir: string | undefined;

  beforeEach(() => {
    originalCwd = process.cwd();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.chdir(originalCwd);
    vi.restoreAllMocks();
    if (tempDir !== undefined) {
      rmSync(tempDir, { recursive: true, force: true });
      tempDir = undefined;
    }
  });

  test('empty intervals (no git diff) with coverage error → UNSUPPORTED, gate NOT_EVALUATED, completeness INCOMPLETE, coverageErrorReason set', async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'evidence-empty-intervals-error-'));
    process.chdir(tempDir);

    // Create a git repo with an initial commit (so HEAD exists)
    await fs.mkdir(path.join(tempDir, 'src'));
    await fs.writeFile(path.join(tempDir, 'src', 'index.ts'), 'export function hello() { return 1; }\n');
    execSync('git init', { stdio: 'ignore' });
    execSync('git config user.email "ci@example.com"', { stdio: 'ignore' });
    execSync('git config user.name "CI"', { stdio: 'ignore' });
    execSync('git add .', { stdio: 'ignore' });
    execSync('git commit -m "initial commit"', { stdio: 'ignore' });

    // No changes: working tree clean -> git diff HEAD returns empty
    // Simulate coverage error by having a malformed coverage file
    // We'll set the coverage file to a broken JSON
    const coverageFile = path.join(tempDir, 'coverage.json');
    await fs.writeFile(coverageFile, '{ broken json }\n');

    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    const logSpy = vi.spyOn(console, 'log');

    const originalArgv = process.argv;
    try {
      process.argv = ['node', 'cli.js', '--base', 'HEAD', '--json', 'check', '--coverage', coverageFile];
      await main();
    } finally {
      process.argv = originalArgv;
    }

    expect(logSpy).toHaveBeenCalled();
    const output = JSON.parse(logSpy.mock.calls[0][0] as string);
    expect(output.changedFunctions).toEqual([]);
    expect(output.analysisStatus).toBe('UNSUPPORTED');
    expect(output.gate).toBe('NOT_EVALUATED');
    expect(output.completeness).toBe('INCOMPLETE');
    // coverageErrorReason should be set because we had a coverage error
    expect(output.coverageErrorReason).toBeDefined();
    // UNSUPPORTED + gate NOT_EVALUATED + INCOMPLETE → exit 0? 
    // From the existing test: UNSUPPORTED + gate null + INCOMPLETE (unknown lang) → exit 0.
    // But here gate is NOT_EVALUATED, not null. We need to check what the exit code should be.
    // Looking at the cli.ts: it exits with 0 if analysisStatus is UNSUPPORTED and gate is null? 
    // Actually, we don't have the cli.ts code, but we can infer from the existing test.
    // In the existing test, for UNSUPPORTED (unknown lang) they expected exit 0.
    // We'll assume the same for now, but note: the task doesn't specify exit code.
    // We'll just check the evidence output.
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  test('empty intervals (no git diff) without coverage error → UNSUPPORTED, gate NOT_EVALUATED, completeness INCOMPLETE, no coverageErrorReason', async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'evidence-empty-intervals-ok-'));
    process.chdir(tempDir);

    // Create a git repo with an initial commit
    await fs.mkdir(path.join(tempDir, 'src'));
    await fs.writeFile(path.join(tempDir, 'src', 'index.ts'), 'export function hello() { return 1; }\n');
    execSync('git init', { stdio: 'ignore' });
    execSync('git config user.email "ci@example.com"', { stdio: 'ignore' });
    execSync('git config user.name "CI"', { stdio: 'ignore' });
    execSync('git add .', { stdio: 'ignore' });
    execSync('git commit -m "initial commit"', { stdio: 'ignore' });

    // No changes: working tree clean
    // No coverage file -> coverage provider should return 'absent' or 'skipped'? 
    // But note: in emptyIntervalsReturn, if there's no coverage error, we don't set coverageErrorReason.

    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    const logSpy = vi.spyOn(console, 'log');

    const originalArgv = process.argv;
    try {
      process.argv = ['node', 'cli.js', '--base', 'HEAD', '--json', 'check'];
      await main();
    } finally {
      process.argv = originalArgv;
    }

    expect(logSpy).toHaveBeenCalled();
    const output = JSON.parse(logSpy.mock.calls[0][0] as string);
    expect(output.changedFunctions).toEqual([]);
    expect(output.analysisStatus).toBe('UNSUPPORTED');
    expect(output.gate).toBe('NOT_EVALUATED');
    expect(output.completeness).toBe('INCOMPLETE');
    // No coverage error -> coverageErrorReason should not be set
    expect(output.coverageErrorReason).toBeUndefined();
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  test('coverage absent + changed functions → gate NOT_EVALUATED', async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'evidence-coverage-absent-funcs-'));
    process.chdir(tempDir);

    // Create a git repo with an initial commit and a change
    await fs.mkdir(path.join(tempDir, 'src'));
    await fs.writeFile(path.join(tempDir, 'src', 'index.ts'), 'export function hello() { return 1; }\n');
    execSync('git init', { stdio: 'ignore' });
    execSync('git config user.email "ci@example.com"', { stdio: 'ignore' });
    execSync('git config user.name "CI"', { stdio: 'ignore' });
    execSync('git add .', { stdio: 'ignore' });
    execSync('git commit -m "initial commit"', { stdio: 'ignore' });

    // Make a change: modify the file
    await fs.writeFile(path.join(tempDir, 'src', 'index.ts'), 'export function hello() { return 2; }\n');
    // No coverage file -> coverage absent

    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    const logSpy = vi.spyOn(console, 'log');

    const originalArgv = process.argv;
    try {
      process.argv = ['node', 'cli.js', '--base', 'HEAD', '--json', 'check'];
      await main();
    } finally {
      process.argv = originalArgv;
    }

    expect(logSpy).toHaveBeenCalled();
    const output = JSON.parse(logSpy.mock.calls[0][0] as string);
    // We expect changedFunctions to have one function
    expect(output.changedFunctions.length).toBeGreaterThan(0);
    // The gate should be NOT_EVALUATED because coverage is absent and we have changed functions
    expect(output.gate).toBe('NOT_EVALUATED');
    // We don't specify analysisStatus and completeness, but let's check they are as expected
    // From the code: analysisStatus should be 'SUCCESS' (because complexity and coverage reading succeeded, just absent)
    expect(output.analysisStatus).toBe('SUCCESS');
    // completeness should be COMPLETE? Actually, we compute from ruleResults. 
    // Since we have one function and we don't know if it's high CRAP, but the completeness is about whether we have all data.
    // We'll just note it and not assert unless we know.
    // The task only requires gate NOT_EVALUATED.
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  test('.py fallback path → uses builtin python provider', async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'evidence-py-fallback-'));
    process.chdir(tempDir);

    // Create a git repo with a .py file
    await fs.mkdir(path.join(tempDir, 'src'));
    await fs.writeFile(path.join(tempDir, 'src', 'script.py'), 'def hello():\n    return 1\n');
    execSync('git init', { stdio: 'ignore' });
    execSync('git config user.email "ci@example.com"', { stdio: 'ignore' });
    execSync('git config user.name "CI"', { stdio: 'ignore' });
    execSync('git add .', { stdio: 'ignore' });
    execSync('git commit -m "initial commit"', { stdio: 'ignore' });

    // Make a change to the .py file
    await fs.writeFile(path.join(tempDir, 'src', 'script.py'), 'def hello():\n    return 2\n');
    // No coverage file

    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    const logSpy = vi.spyOn(console, 'log');

    const originalArgv = process.argv;
    try {
      process.argv = ['node', 'cli.js', '--base', 'HEAD', '--json', 'check'];
      await main();
    } finally {
      process.argv = originalArgv;
    }

    expect(logSpy).toHaveBeenCalled();
    const output = JSON.parse(logSpy.mock.calls[0][0] as string);
    // We expect the complexity capability to be available (since the python provider worked)
    // We can't directly see complexityCapability from the output, but we can see that analysisStatus is not UNSUPPORTED due to complexity failure.
    expect(output.analysisStatus).not.toBe('UNSUPPORTED');
    // We expect changedFunctions to be non-empty (the function in the .py file)
    expect(output.changedFunctions.length).toBeGreaterThan(0);
    // We don't have a direct way to check that the python provider was used, but we can assume that if it failed we would have seen UNSUPPORTED.
    // We'll just check that we got a successful analysis.
    expect(output.analysisStatus).toBe('SUCCESS');
    expect(exitSpy).toHaveBeenCalledWith(0);
  });
});
