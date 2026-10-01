/// <reference types="node" />

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { main } from '../../src/cli.js';
import { promises as fs, rmSync, symlinkSync, copyFileSync } from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';

// Hermetic CLI anchor (negatives): valid Python .coverage binary with conversion
// tools absent — masks process.env.PATH to a minimal dir holding only a git
// symlink, so spawnSync ENOENTs `coverage`/`python3` while git still resolves.
// Harness: in-process main() + execSync git per Tasks 8–9 lesson (execFile hangs).
// Unlike cli-malformed-coverage (invalid JSON → parse failure), this creates a real
// .coverage dotfile (SQLite DB from coverage.py) whose conversion tools are hidden
// via the masked PATH — convertPythonCoverageToJson(src/coverage.ts:84-141) returns
// null → readCoverageFile(src/coverage.ts:381) early-return reason:'malformed'.
// ponytail: minimal PATH dir = laziest way to hide coverage binaries while keeping
// git resolvable (empty PATH kills validateGitRepo before the coverage stage).

describe('cli-tool-absent (hermetic, in-process)', () => {
  let originalCwd: string;
  let originalPath: string;
  let tempDir: string | undefined;

  beforeEach(() => {
    originalCwd = process.cwd();
    originalPath = process.env.PATH || '';
    vi.restoreAllMocks();
  });

  afterEach(() => {
    // chdir out BEFORE rm — never delete a directory the process is inside.
    process.chdir(originalCwd);
    // Restore original PATH so subsequent tests aren't affected.
    process.env.PATH = originalPath;
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

    // Real .coverage SQLite dotfile (pre-committed fixture). Normally
    // convertPythonCoverageToJson spawnsSync(['coverage','json']) or
    // ['python3','-m','coverage','json']. With PATH masked those commands are
    // unresolvable → spawnSync ENOENT → returns null → readCoverageFile →
    // reason: 'malformed'. Exercises the genuine tool-absent seam.
    // ponytail: fixture copy avoids host `coverage` binary dep (hermetic cross-machine).
    const fixturePath = path.join(__dirname, 'fixtures', '.coverage');
    copyFileSync(fixturePath, path.join(tempDir, '.coverage'));

    // Minimal PATH: symlink only the git binary so validateGitRepo/complexity
    // still resolve git, while `coverage` and `python3` are absent from PATH.
    const gitPath = execSync('which git', { encoding: 'utf8' }).trim();
    const minPathDir = await fs.mkdtemp(path.join(os.tmpdir(), 'min-path-'));
    symlinkSync(gitPath, path.join(minPathDir, 'git'));
    process.env.PATH = minPathDir;

    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    const logSpy = vi.spyOn(console, 'log');

    const originalArgv = process.argv;
    try {
      process.argv = ['node', 'cli.js', '--base', 'HEAD', '--json', 'check'];
      await main();
    } finally {
      process.argv = originalArgv;
      // Restore PATH before cleanup (spawns already done, safe to reset).
      process.env.PATH = originalPath;
      // Clean up minimal-path dir after main() exits (cwd restored by afterEach).
      rmSync(minPathDir, { recursive: true, force: true });
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
