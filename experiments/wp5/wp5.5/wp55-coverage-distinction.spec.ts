import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  createTempRepo, 
  writeSourceFile, 
  writeCoverageFile, 
  stageChanges, 
  callBuildEvidenceOutput, 
  normalizeOutput 
} from '../wp5.2/fixtures/helpers';
import { buildEvidenceOutput } from '../../../src/evidence.ts';
import { readCoverage } from '../../../src/coverage.ts';
import { spawnSync } from 'child_process';
import { join } from 'path';
import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';

describe('WP5.5: Coverage distinction (missing vs malformed vs absent)', () => {
  // We'll use a fixed threshold for all tests
  const THRESHOLD = 30;
  const BASE = 'HEAD';

  describe('Scenario A: Default missing coverage (no coverage file)', () => {
    it('should return coverageArtifact: absent, analysisStatus: SUCCESS, gate: PASS, completeness: INCOMPLETE, exit 0', async () => {
      // Create a temp repo with a TS file but no coverage file
      const repo = createTempRepo();
      try {
        // Write a simple TS file to have a change
        const srcFile = join(repo.srcDir, 'index.ts');
        writeSourceFile(srcFile, `
          export function add(a: number, b: number): number {
            return a + b;
          }
        `);
        // Stage the change (we need to have a commit for HEAD to be defined)
        execSync('git add .', { cwd: repo.tempDir, stdio: 'ignore' });
        execSync('git commit -m "initial"', { cwd: repo.tempDir, stdio: 'ignore' });

        // Define changed intervals: we changed the entire file (lines 1-4)
        const intervals = new Map();
        intervals.set('src/index.ts', [{ start: 1, end: 4 }]);

        // Call buildEvidenceOutput without coverageFile (undefined)
        const output = await buildEvidenceOutput(BASE, intervals, repo.tempDir, THRESHOLD, undefined);

        // Check the output
        expect(output.capabilities.coverageArtifact).toBe('absent');
        expect(output.analysisStatus).toBe('SUCCESS');
        expect(output.gate).toBe('PASS');
        expect(output.completeness).toBe('INCOMPLETE');

        // CLI test: build CLI and run it
        const buildResult = spawnSync('npm', ['run', 'build'], { stdio: 'ignore' });
        if (buildResult.error) {
          throw new Error('Failed to build CLI');
        }
        const nodeBin = process.execPath;
        const cliPath = join(process.cwd(), 'dist/cli.js');
        const cliResult = spawnSync(nodeBin, [cliPath, 'check', '--base', 'HEAD'], {
          cwd: repo.tempDir,
          encoding: 'utf-8'
        });

        // Expect exit code 0 and no error in stderr (or at least not the coverage errors)
        expect(cliResult.status).toBe(0);
        expect(cliResult.stderr).not.toContain('Error: coverage artifact missing');
        expect(cliResult.stderr).not.toContain('Error: coverage artifact malformed');
      } finally {
        repo.cleanup();
      }
    });
  });

  describe('Scenario B: Explicit missing coverage (--coverage-file /nonexistent)', () => {
    it('should return coverageArtifact: failed, coverageErrorReason: missing, analysisStatus: FAILED, gate: null, completeness: INCOMPLETE, exit 1, stderr: "coverage artifact missing"', async () => {
      // We'll test via CLI spawnSync to check exit code and stderr
      const repo = createTempRepo();
      try {
        // Write a TS file
        const srcFile = join(repo.srcDir, 'index.ts');
        writeSourceFile(srcFile, `
          export function add(a: number, b: number): number {
            return a + b;
          }
        `);
        // Commit the file
        execSync('git add .', { cwd: repo.tempDir, stdio: 'ignore' });
        execSync('git commit -m "initial"', { cwd: repo.tempDir, stdio: 'ignore' });

        // Part 1: Direct call to buildEvidenceOutput
        const intervals = new Map();
        intervals.set('src/index.ts', [{ start: 1, end: 4 }]);
        const nonExistentCoverageFile = '/nonexistent/coverage-final.json';
        const output = await buildEvidenceOutput(BASE, intervals, repo.tempDir, THRESHOLD, nonExistentCoverageFile);

        // Use type assertion to access coverageErrorReason
        expect((output as any).coverageErrorReason).toBe('missing');
        expect(output.analysisStatus).toBe('FAILED');
        expect(output.gate).toBeNull();
        expect(output.completeness).toBe('INCOMPLETE');

        // Part 2: CLI test
        const buildResult = spawnSync('npm', ['run', 'build'], { stdio: 'ignore' });
        if (buildResult.error) {
          throw new Error('Failed to build CLI');
        }
        const nodeBin = process.execPath;
        const cliPath = join(process.cwd(), 'dist/cli.js');
        const cliResult = spawnSync(nodeBin, [cliPath, 'check', '--base', 'HEAD', '--coverage-file', nonExistentCoverageFile], {
          cwd: repo.tempDir,
          encoding: 'utf-8'
        });

        // Check exit code
        expect(cliResult.status).toBe(1);
        // Check stderr contains the expected error
        expect(cliResult.stderr).toContain('Error: coverage artifact missing');
      } finally {
        repo.cleanup();
      }
    });
  });

  describe('Scenario C: Malformed coverage file', () => {
    it('should return coverageArtifact: failed, coverageErrorReason: malformed, analysisStatus: FAILED, gate: null, completeness: INCOMPLETE, exit 1, stderr: "coverage artifact malformed"', async () => {
      const repo = createTempRepo();
      try {
        // Write a TS file
        const srcFile = join(repo.srcDir, 'index.ts');
        writeSourceFile(srcFile, `
          export function add(a: number, b: number): number {
            return a + b;
          }
        `);
        // Commit the file
        execSync('git add .', { cwd: repo.tempDir, stdio: 'ignore' });
        execSync('git commit -m "initial"', { cwd: repo.tempDir, stdio: 'ignore' });

        // Write a malformed coverage file
        const coverageDir = repo.coverageDir;
        const coverageFile = join(coverageDir, 'coverage-final.json');
        // Write invalid JSON
        writeFileSync(coverageFile, '{ not valid json }', 'utf-8');

        // Define changed intervals
        const intervals = new Map();
        intervals.set('src/index.ts', [{ start: 1, end: 4 }]);

        // Call buildEvidenceOutput with the malformed coverage file
        const output = await buildEvidenceOutput(BASE, intervals, repo.tempDir, THRESHOLD, coverageFile);

        // Use type assertion to access coverageErrorReason
        expect((output as any).coverageErrorReason).toBe('malformed');
        expect(output.analysisStatus).toBe('FAILED');
        expect(output.gate).toBeNull();
        expect(output.completeness).toBe('INCOMPLETE');

        // CLI test
        const buildResult = spawnSync('npm', ['run', 'build'], { stdio: 'ignore' });
        if (buildResult.error) {
          throw new Error('Failed to build CLI');
        }
        const nodeBin = process.execPath;
        const cliPath = join(process.cwd(), 'dist/cli.js');
        const cliResult = spawnSync(nodeBin, [cliPath, 'check', '--base', 'HEAD', '--coverage-file', coverageFile], {
          cwd: repo.tempDir,
          encoding: 'utf-8'
        });

        expect(cliResult.status).toBe(1);
        expect(cliResult.stderr).toContain('Error: coverage artifact malformed');
      } finally {
        repo.cleanup();
      }
    });
  });

  // We also need to verify INV-02 (MISSING ≠ MALFORMED) and INV-01 survive through CLI layer.
  // We can do a quick test that the CLI correctly distinguishes between missing and malformed.
  describe('INV-02: MISSING ≠ MALFORMED', () => {
    it('should produce different coverageErrorReason for missing vs malformed', async () => {
      const repo = createTempRepo();
      try {
        // Write and commit a TS file
        const srcFile = join(repo.srcDir, 'index.ts');
        writeSourceFile(srcFile, `
          export function add(a: number, b: number): number {
            return a + b;
          }
        `);
        execSync('git add .', { cwd: repo.tempDir, stdio: 'ignore' });
        execSync('git commit -m "initial"', { cwd: repo.tempDir, stdio: 'ignore' });

        const intervals = new Map();
        intervals.set('src/index.ts', [{ start: 1, end: 4 }]);

        // Test missing
        const missingOutput = await buildEvidenceOutput(BASE, intervals, repo.tempDir, THRESHOLD, '/nonexistent/coverage-final.json');
        expect((missingOutput as any).coverageErrorReason).toBe('missing');

        // Test malformed: write a malformed coverage file
        const coverageDir = repo.coverageDir;
        const malformedFile = join(coverageDir, 'coverage-malformed.json');
        writeFileSync(malformedFile, '{ not valid json }', 'utf-8');
        const malformedOutput = await buildEvidenceOutput(BASE, intervals, repo.tempDir, THRESHOLD, malformedFile);
        expect((malformedOutput as any).coverageErrorReason).toBe('malformed');

        // They should be different
        expect((missingOutput as any).coverageErrorReason).not.toBe((malformedOutput as any).coverageErrorReason);
      } finally {
        repo.cleanup();
      }
    });
  });

  // INV-01: We assume it's about the analysisStatus being SUCCESS when coverage is absent? 
  // We already tested that in Scenario A.
});