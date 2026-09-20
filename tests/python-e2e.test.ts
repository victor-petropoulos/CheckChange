import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { execSync } from 'child_process';
import { join } from 'path';
import { existsSync, readFileSync, writeFileSync } from 'fs';

const fixtureDir = join(__dirname, '..', 'test', 'fixtures', 'python-only');

describe('Python-only E2E', () => {
  let originalCwd: string;

  beforeEach(() => {
    originalCwd = process.cwd();
    process.chdir(fixtureDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
  });

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
      expect(pytestAvailable && coverageAvailable).toBe(true);
      return; // skip the test
    }

    // Make a temporary change to src/math.py to ensure there is a changed function
    const mathPath = join(fixtureDir, 'src', 'calc.py');
    const originalContent = readFileSync(mathPath, 'utf8');
    try {
      // Change the add function to include a comment
      const modifiedContent = originalContent.replace(
        'def add(a, b):\n    return a + b',
        'def add(a, b):\n    # temporary change for test\n    return a + b'
      );
      writeFileSync(mathPath, modifiedContent);

      // Run pytest with coverage
      try {
        execSync('pytest --cov=src --cov-report=json:coverage/coverage-final.json --cov-report=xml', { stdio: 'pipe' });
      } catch (e) {
        throw new Error(`pytest failed: ${e}`);
      }

      // Run checkchange
      let output: string;
      try {
        output = execSync('npx checkchange check --base HEAD --json', { stdio: 'pipe' }).toString();
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
    } finally {
      // Revert the change
      writeFileSync(mathPath, originalContent);
    }
  });
});