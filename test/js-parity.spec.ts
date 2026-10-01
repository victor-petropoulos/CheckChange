import { describe, it, expect } from 'vitest';
import { execSync, execFileSync } from 'child_process';
import { copyFileSync, mkdtempSync, rmSync, appendFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const repoRoot = join(import.meta.dirname, '..');
const cliPath = join(repoRoot, 'dist', 'cli.js');
const fixtureDir = join(repoRoot, 'test', 'fixtures', 'js-parity');

// The JS-family extensions the patched core must analyze natively.
const EXTENSIONS = ['.js', '.jsx', '.mjs', '.cjs'];

interface ComplexityLineageEntry {
  stage: string;
  inputs: { extension: string; functions: number; quality: string };
}

interface CheckJson {
  diagnostics?: { lineage?: ComplexityLineageEntry[] };
}

describe('JS-family extension parity', () => {
  // Regression guard for the phantom-dep fix. src/complexity.ts imports
  // @barney-media/crap-typescript-core as a bare specifier but never declared it, so
  // dist/cli.js walked past the repo's patched copy and landed on a machine-global
  // UNPATCHED core — which only knows .ts/.tsx. Every .jsx parse then failed
  // ("Unterminated regular expression literal") and the run reported 3 of 4 files.
  // The direct devDependency now pins resolution back to the patched copy.
  // Prior 3/4 artifact + resolution trace: ses_f26d1bf34.
  it('analyzes .js/.jsx/.mjs/.cjs natively regardless of cwd', () => {
    // Skip guard, repo convention (tests/python-e2e.test.ts:29-31): missing tool => early return.
    try {
      execSync('git --version', { stdio: 'ignore' });
    } catch {
      return;
    }

    // Isolate in a fresh tmp git repo so the real worktree is never mutated and the
    // CLI runs from a cwd that has no node_modules of its own — the exact condition
    // that used to trigger the global fallback.
    let tmpDir: string | undefined;
    try {
      tmpDir = mkdtempSync(join(tmpdir(), 'js-parity-'));
      for (const ext of EXTENSIONS) {
        copyFileSync(join(fixtureDir, `sample${ext}`), join(tmpDir, `sample${ext}`));
      }

      execSync('git init -q', { cwd: tmpDir });
      execSync('git config user.email "test@test.com"', { cwd: tmpDir });
      execSync('git config user.name "Test"', { cwd: tmpDir });
      execSync('git add -A', { cwd: tmpDir });
      execSync('git commit -q -m "init"', { cwd: tmpDir });

      // Touch every file so git reports all four as changed.
      for (const ext of EXTENSIONS) {
        appendFileSync(join(tmpDir, `sample${ext}`), '\n// touched\n');
      }

      // Absolute cliPath is load-bearing: it is what makes ESM resolve the PATCHED
      // core from dist/, independent of cwd. execFileSync (no shell) because the repo
      // path contains a space.
      const output = execFileSync('node', [cliPath, 'check', '--json'], {
        cwd: tmpDir,
        encoding: 'utf8',
        stdio: 'pipe',
      });

      const result: CheckJson = JSON.parse(output);
      const complexity = result.diagnostics?.lineage?.find((e) => e.stage === 'complexity');

      expect(complexity, 'complexity lineage entry missing').toBeDefined();
      expect(complexity?.inputs.functions, 'functions analyzed across the 4 fixtures').toBe(4);
      expect(complexity?.inputs.quality, 'native analyzer present').toBe('NATIVE');
    } finally {
      if (tmpDir) {
        rmSync(tmpDir, { recursive: true, force: true });
      }
    }
  });
});
