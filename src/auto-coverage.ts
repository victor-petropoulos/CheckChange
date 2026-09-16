import * as fs from 'node:fs';
import * as path from 'node:path';
import { spawnSync } from 'node:child_process';

const COV_TIMEOUT = 120_000;

/**
 * Detect which test runner is available and return its coverage command + expected artifact path.
 * Precedence: vitest > jest > pytest.
 * ponytail: config glob + package.json dep check is enough; no runner introspection needed.
 */
function detectRunner(cwd: string): { command: string; args: string[]; artifact: string } | null {
  // Vitest: config files exist or vitest in devDependencies
  if (hasVitest(cwd)) {
    return { command: 'npx', args: ['vitest', 'run', '--coverage'], artifact: path.join(cwd, 'coverage', 'coverage-final.json') };
  }
  // Jest: config files exist or jest in devDependencies
  if (hasJest(cwd)) {
    return { command: 'npx', args: ['jest', '--coverage'], artifact: path.join(cwd, 'coverage', 'coverage-final.json') };
  }
  // pytest: pyproject.toml/pytest.ini + .py files
  if (hasPytest(cwd)) {
    return { command: 'python3', args: ['-m', 'pytest', '--cov', '--cov-report=xml'], artifact: path.join(cwd, 'coverage.xml') };
  }
  return null;
}

function hasVitest(cwd: string): boolean {
  const configGlob = fs.readdirSync(cwd).some(f => f.startsWith('vitest.config'));
  if (configGlob) return true;
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(cwd, 'package.json'), 'utf8'));
    return !!(pkg.devDependencies?.vitest || pkg.dependencies?.vitest);
  } catch { return false; }
}

function hasJest(cwd: string): boolean {
  const configGlob = fs.readdirSync(cwd).some(f => f.startsWith('jest.config'));
  if (configGlob) return true;
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(cwd, 'package.json'), 'utf8'));
    return !!(pkg.devDependencies?.jest || pkg.dependencies?.jest);
  } catch { return false; }
}

function hasPytest(cwd: string): boolean {
  const configFiles = ['pyproject.toml', 'pytest.ini', 'setup.cfg'];
  const hasConfig = configFiles.some(f => fs.existsSync(path.join(cwd, f)));
  if (!hasConfig) return false;
  return fs.readdirSync(cwd, { recursive: true }).some(f => typeof f === 'string' && f.endsWith('.py'));
}

/**
 * Detect runner, spawn ONE coverage run (120s timeout), return expected artifact path or null.
 * On timeout/failure: returns null (caller falls back to absent path — never forced FAILED).
 */
export function autoCoverage(cwd: string): { generatedPath: string | null; hint: string | null } {
  const runner = detectRunner(cwd);
  if (!runner) {
    return { generatedPath: null, hint: 'No test runner detected. Install vitest, jest, or pytest to use --auto-coverage.' };
  }

  const result = spawnSync(runner.command, runner.args, {
    cwd,
    encoding: 'utf8',
    timeout: COV_TIMEOUT,
  });

  if (result.status !== 0) {
    const exitDesc = (result.error as NodeJS.ErrnoException)?.code === 'ETIMEDOUT' ? 'timed out after 120s' : `exited ${result.status}`;
    return { generatedPath: null, hint: `Coverage generation failed (${runner.command} ${exitDesc}). Run manually: ${runner.command} ${runner.args.join(' ')}` };
  }

  // Verify artifact was created
  if (!fs.existsSync(runner.artifact)) {
    return { generatedPath: null, hint: `Coverage command succeeded but artifact not found at ${runner.artifact}. Run manually: ${runner.command} ${runner.args.join(' ')}` };
  }

  return { generatedPath: runner.artifact, hint: null };
}
