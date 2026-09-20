import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import { join } from 'path';
import { readFileSync, writeFileSync, rmSync, cpSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';

const repoRoot = join(__dirname, '..');
const fixtureDir = join(repoRoot, 'test', 'fixtures', 'python-only');

describe('Python-only E2E', () => {
  it('should run pytest and checkchange and pass assertions', async () => {
    // Check if pytest and coverage are available
    let pytestAvailable = false;
    let coverageAvailable = false;
    try {
      execSync('pytest --version', { stdio: 'ignore' });
      pytestAvailable = true;
    } catch (e) {
      // pytest not available
    }
    try {
      execSync('coverage --version', { stdio: 'ignore' });
      coverageAvailable = true;
    } catch (e) {
      // coverage not available
    }

    if (!pytestAvailable || !coverageAvailable) {
      return; // skip the test
    }

    // Isolate in a fresh tmp git repo so the real worktree is never mutated.
    let tmpDir: string | undefined;
    try {
      tmpDir = mkdtempSync(join(tmpdir(), 'py-e2e-'));
      // Copy only the fixture source + tests (no stale generated artifacts).
      for (const child of ['src', 'tests', 'package.json']) {
        cpSync(join(fixtureDir, child), join(tmpDir, child), { recursive: true });
      }
      // Ignore python-generated artifacts so they never appear as "changed".
      writeFileSync(
        join(tmpDir, '.gitignore'),
        '__pycache__/\n*.pyc\n.coverage\ncoverage/\n.pytest_cache/\n'
      );

      // Bootstrap a git repo with an initial commit (unmodified calc.py).
      execSync('git init -q', { cwd: tmpDir });
      execSync('git config user.email "test@test.com"', { cwd: tmpDir });
      execSync('git config user.name "Test"', { cwd: tmpDir });
      execSync('git add -A', { cwd: tmpDir });
      execSync('git commit -q -m "init"', { cwd: tmpDir });

      // Make a temporary change to calc.py so git sees a changed function.
      const calcPath = join(tmpDir, 'src', 'calc.py');
      const originalContent = readFileSync(calcPath, 'utf8');
      const modifiedContent = originalContent.replace(
        'def add(a, b):\n    return a + b',
        'def add(a, b):\n    # temporary change for test\n    return a + b'
      );
      writeFileSync(calcPath, modifiedContent);

      // Run pytest with coverage in the tmp repo (coverage lands at coverage/coverage-final.json).
      try {
        execSync('pytest --cov=src --cov-report=json:coverage/coverage-final.json', {
          cwd: tmpDir,
          stdio: 'pipe',
        });
      } catch (e) {
        throw new Error(`pytest failed: ${e}`);
      }

      // Run checkchange from the tmp repo root (--base HEAD = tmp repo's initial commit).
      let output: string;
      try {
        output = execSync(
          'npx checkchange check --base HEAD --json --coverage-file coverage/coverage-final.json',
          { cwd: tmpDir, stdio: 'pipe' }
        ).toString();
      } catch (e) {
        throw new Error(`checkchange failed: ${e}`);
      }

      const result = JSON.parse(output);

      // Assertions
      expect(result.changedFunctions.length).toBeGreaterThan(0);
      expect(result.capabilities.complexity).toBe('available');
      expect(result.capabilities.coverageArtifact).toBe('available');
      expect(result.gate).toBeOneOf(['WARN', 'PASS']);
      expect(result.analysisStatus).toBe('SUCCESS');
      expect(result.diagnostics.quality.complexity).toBe('NATIVE');
      expect(result.diagnostics.quality.coverage).toBe('DIRECT');
      expect(result.diagnostics.quality.score).not.toBeNull();

      // Prove Python attribution: at least one changed function file ends with calc.py
      const hasPythonChange = result.changedFunctions.some(
        (f: { file: string }) => f.file.endsWith('calc.py')
      );
      expect(hasPythonChange).toBe(true);
    } finally {
      if (tmpDir) {
        rmSync(tmpDir, { recursive: true, force: true });
      }
    }
  });
});
