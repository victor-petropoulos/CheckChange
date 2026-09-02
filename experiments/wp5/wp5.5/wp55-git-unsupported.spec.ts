import { describe, it, expect, vi, beforeAll } from 'vitest';
import { validateGitRepo } from '../../../src/git.ts';
import * as executeModule from '../../../src/execute.ts';
import { buildEvidenceOutput } from '../../../src/evidence.ts';
import { spawnSync } from 'child_process';
import { join } from 'path';
import { tmpdir } from 'os';
import { mkdtempSync, mkdirSync, rmSync } from 'fs';

describe('WP5.5 Git ENOENT vs not-a-repo + unsupported/empty changes', () => {
  // Variables for caching CLI build
  let cliPath: string;
  let nodeBin: string;

  // Build CLI once before all tests
  beforeAll(() => {
    const buildResult = spawnSync('npm', ['run', 'build'], { stdio: 'ignore' });
    if (buildResult.error) {
      throw new Error('Failed to build CLI');
    }
    cliPath = join(process.cwd(), 'dist/cli.js');
    nodeBin = process.execPath;
  });

  // Scenario A: ENOENT
  describe('ENOENT (git executable not found)', () => {
    it('validateGitRepo throws \"Git executable not found\" when execute returns errorCode ENOENT', async () => {
      // Mock execute to return { errorCode: 'ENOENT' }
      vi.spyOn(executeModule, 'execute').mockResolvedValueOnce({
        command: 'git',
        args: ['rev-parse', '--git-dir'],
        cwd: undefined,
        exitCode: null,
        stdout: '',
        stderr: '',
        durationMs: 0,
        timedOut: false,
        errorCode: 'ENOENT'
      });

      await expect(validateGitRepo()).rejects.toThrow('Git executable not found');
    });

it('CLI exits with 1 and stderr \"Git executable not found\" when git missing via PATH', async () => {
       // Create a temporary directory and run cli with PATH that does not contain git
       const tempDir = mkdtempSync(join(tmpdir(), 'crap-test-enopath-'));
       try {
         // Modify PATH to exclude typical git locations
         const env = { ...process.env, PATH: '' }; // empty PATH should cause ENOENT for git
         const cliResult = spawnSync(nodeBin, [cliPath, 'check', '--base', 'HEAD'], {
           cwd: tempDir,
           env,
           encoding: 'utf-8'
         });

        expect(cliResult.status).toBe(1);
        expect(cliResult.stderr.trim()).toBe('Error: Git executable not found');
      } finally {
        rmSync(tempDir, { recursive: true, force: true });
      }
    });
  });

  // Scenario B: not-a-repo
  describe('not-a-repo', () => {
it('CLI exits with 1 and stderr \"Not a git repository\" when run in non-git directory', async () => {
       const tempDir = mkdtempSync(join(tmpdir(), 'crap-test-norepo-'));
       try {
         // Ensure no .git directory
         const cliResult = spawnSync(nodeBin, [cliPath, 'check', '--base', 'HEAD'], {
           cwd: tempDir,
           encoding: 'utf-8'
         });

        expect(cliResult.status).toBe(1);
        expect(cliResult.stderr.trim()).toBe('Error: Not a git repository');
      } finally {
        rmSync(tempDir, { recursive: true, force: true });
      }
    });
  });

  // Scenario C: unsupported (non-TS changes only)
  describe('unsupported (non-TS changes only)', () => {
    it('buildEvidenceOutput returns UNSUPPORTED analysisStatus, gate null, completeness NOT_APPLICABLE, empty changedFunctions for non-TS intervals', async () => {
      const { createTempRepo, writeSourceFile } = await import('../wp5.2/fixtures/helpers.ts');
      const repo = createTempRepo();
      try {
        // Write a markdown file (unsupported)
        writeSourceFile(join(repo.tempDir, 'notes.md'), '# Notes dummy');
        // intervals map with .md file (unsupported)
        const intervals = new Map();
        intervals.set('notes.md', [{ start: 1, end: 1 }]);

        const output = await buildEvidenceOutput('HEAD', intervals, repo.tempDir, 30);
        expect(output.analysisStatus).toBe('UNSUPPORTED');
        expect(output.gate).toBeNull();
        expect(output.completeness).toBe('NOT_APPLICABLE');
        expect(output.changedFunctions).toHaveLength(0);
      } finally {
        repo.cleanup();
      }
    });
  });
});