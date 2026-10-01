/// <reference types="node" />

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { main } from '../../src/cli.js';
import { promises as fs, rmSync } from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';

// Hermetic CLI anchor (negatives): malformed coverage artifact at the CLI seam.
// Harness follows test/cli.real-git.spec.ts:25-48 + test/negatives/cli-empty-evidence.spec.ts —
// in-process main(), real git via execSync, mkdtemp + chdir, no child_process
// execFile (await on non-promisified execFile hangs; Task 8 verified the stall).
//
// Scenario: repo with a real TS src change (so intervals is non-empty and
// complexityCapability !== 'failed'), plus a malformed coverage.json at cwd.
// Coverage auto-detect picks up coverage.json, JSON.parse fails →
// coverage.ts:445 → { available: true, error: true, reason: 'malformed' } →
// evidence.ts:503-509 → analysisStatus FAILED, gate null, completeness INCOMPLETE,
// coverageErrorReason 'malformed', exit(1) (cli.ts:228-237).
describe('cli-malformed-coverage (hermetic, in-process)', () => {
  let originalCwd: string;
  let tempDir: string | undefined;

  beforeEach(() => {
    originalCwd = process.cwd();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    // chdir out BEFORE rm — never delete a directory the process is inside.
    process.chdir(originalCwd);
    vi.restoreAllMocks();
    if (tempDir !== undefined) {
      rmSync(tempDir, { recursive: true, force: true });
      tempDir = undefined;
    }
  });

  test('malformed coverage.json → analysisStatus FAILED, coverageErrorReason malformed, exit 1', async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cli-malformed-coverage-'));
    process.chdir(tempDir);

    // Repo: src/ with a real TS function so complexity capability stays 'available'
    // and git diff produces non-empty supported intervals.
    await fs.mkdir(path.join(tempDir, 'src'));
    await fs.writeFile(
      path.join(tempDir, 'src', 'index.ts'),
      'export function hello(): number { return 1; }\n'
    );
    execSync('git init', { stdio: 'ignore' });
    execSync('git config user.email "ci@example.com"', { stdio: 'ignore' });
    execSync('git config user.name "CI"', { stdio: 'ignore' });
    execSync('git add .', { stdio: 'ignore' });
    execSync('git commit -m "initial commit"', { stdio: 'ignore' });

    // Uncommitted src change → git diff HEAD yields a supported-file interval.
    await fs.writeFile(
      path.join(tempDir, 'src', 'index.ts'),
      'export function hello(): number { return 2; }\nexport function world(): number { return 3; }\n'
    );

    // Malformed coverage.json — invalid JSON content. Auto-detect picks it up
    // via PYTHON_COVERAGE_FILES precedence (no .coverage / coverage.xml present).
    await fs.writeFile(path.join(tempDir, 'coverage.json'), '{ not valid json');

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
    // Acceptance anchors for malformed coverage path.
    expect(output.analysisStatus).toBe('FAILED');
    expect(output.gate).toBeNull();
    expect(output.completeness).toBe('INCOMPLETE');
    expect(output.coverageErrorReason).toBe('malformed');
    expect(output.changedFunctions).toEqual([]);
    // FAILED → exit 1 (cli.ts:236).
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
