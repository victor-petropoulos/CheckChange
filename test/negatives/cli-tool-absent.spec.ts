/// <reference types="node" />

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { main } from '../../src/cli.js';
import { promises as fs, rmSync, mkdirSync } from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';

// Hermetic CLI anchor (negatives): Python .coverage binary with unavailable tools.
// Harness: in-process main() + execSync git per Tasks 8–9 lesson (execFile hangs).
// Unlike cli-malformed-coverage (invalid JSON → parse failure), this creates a real
// .coverage dotfile whose conversion tools (coverage / python3 -m coverage json) are
// hidden via masked PATH — coverage.ts:convertPythonCoverageToJson:47-67 returns null
// → fallback readCoverageFile:195 → reason: 'malformed'. Tests the tool-absent seam.
// ponytail: masks empty PATH dir for execSync env — laziest way to make coverage
// binaries absent without altering source or adding deps.

describe('cli-tool-absent (hermetic, in-process)', () => {
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

  test('.coverage with tool binaries absent → analysisStatus FAILED, coverageErrorReason malformed, exit 1', async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cli-tool-absent-'));
    process.chdir(tempDir);

    // Repo: src/ with a real TS function so intervals is non-empty and complexity stays available.
    // This ensures execution proceeds past git→complexity into the coverage stage.
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

    // Uncommitted src change → git diff HEAD yields supported-file interval.
    await fs.writeFile(
      path.join(tempDir, 'src', 'index.ts'),
      'export function hello(): number { return 2; }\nexport function world(): number { return 3; }\n'
    );

    // Real .coverage dotfile with valid-ish content. Normally convertPythonCoverageToJson
    // would spawnSync(['coverage','json']) or ['python3','-m','coverage','json']. With PATH
    // masked to an empty dir those commands vanish → conversion fails → reason: 'malformed'.
    await fs.writeFile(path.join(tempDir, '.coverage'), '{}');

    // Mask PATH with empty tmpdir so coverage/python3 are not found.
    const emptyPathDir = await fs.mkdtemp(path.join(os.tmpdir(), 'empty-path-'));
    const maskedEnv = { ...process.env, PATH: emptyPathDir, CHECKCHANGE_CACHE: '0' };

    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    const logSpy = vi.spyOn(console, 'log');
    // parseCliArgs fires console.error('Error: Command must be "check"') + exit(1)
    // on missing positional (cli.ts:152-153); silenced — same pattern as
    // test/negatives/cli-empty-evidence.spec.ts + test/cli.real-git.spec.ts.
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const originalArgv = process.argv;
    try {
      process.argv = ['node', 'cli.js', '--base', 'HEAD', '--json'];
      await main();
    } finally {
      process.argv = originalArgv;
      // Clean up empty path dir after main() exits (cwd already restored by afterEach).
      rmSync(emptyPathDir, { recursive: true, force: true });
    }

    expect(logSpy).toHaveBeenCalled();
    const output = JSON.parse(logSpy.mock.calls[0][0] as string);

    // Acceptance anchors: tool-absent .coverage → FAILED/malformed/INCOMPLETE.
    expect(output.analysisStatus).toBe('FAILED');
    expect(output.gate).toBeNull();
    expect(output.completeness).toBe('INCOMPLETE');
    expect(output.coverageErrorReason).toBe('malformed');
    expect(output.changedFunctions).toEqual([]);

    // FAILED with changed functions → exit 1 (cli.ts:236).
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
