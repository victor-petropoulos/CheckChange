/// <reference types="node" />

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { main } from '../../src/cli.js';
import { promises as fs, rmSync } from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';

// Hermetic CLI anchor (negatives): unknown-language taxonomy at the CLI seam.
// Scenario: repo with two commits, working tree carrying an UNCOMMITTED
// .rs edit → `git diff HEAD` yields intervals containing only an
// unsupported .rs file → evidence.ts isUnsupportedIntervals branch →
// UNSUPPORTED / gate null / completeness INCOMPLETE / changedFunctions [].
describe('cli-lang-unknown (hermetic, in-process)', () => {
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

  test('unknown .rs diff vs HEAD → UNSUPPORTED, completeness INCOMPLETE, exit 0', async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cli-lang-unknown-'));
    process.chdir(tempDir);

    // Repo: src file + Rust file, two commits so HEAD has history.
    await fs.mkdir(path.join(tempDir, 'src'));
    await fs.writeFile(path.join(tempDir, 'src', 'index.ts'), 'export function hello() { return 1; }\n');
    await fs.writeFile(path.join(tempDir, 'src', 'lib.rs'), 'fn main() { println!("hello"); }\n');
    execSync('git init', { stdio: 'ignore' });
    execSync('git config user.email "ci@example.com"', { stdio: 'ignore' });
    execSync('git config user.name "CI"', { stdio: 'ignore' });
    execSync('git add .', { stdio: 'ignore' });
    execSync('git commit -m "initial commit"', { stdio: 'ignore' });
    await fs.writeFile(path.join(tempDir, 'src', 'lib.rs'), 'fn main() { println!("updated"); }\n');
    execSync('git add src/lib.rs', { stdio: 'ignore' });
    execSync('git commit -m "update rust file"', { stdio: 'ignore' });

    // Uncommitted .rs change: diff vs HEAD contains only lib.rs (unknown ext).
    await fs.writeFile(path.join(tempDir, 'src', 'lib.rs'), 'fn main() { println!("uncommitted"); }\n');

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
    expect(output.completeness).toBe('INCOMPLETE');
    expect(output.ruleResults).toEqual([]);
    // UNSUPPORTED + gate null + INCOMPLETE (unknown lang) → exit 0.
    expect(exitSpy).toHaveBeenCalledWith(0);
  });
});
