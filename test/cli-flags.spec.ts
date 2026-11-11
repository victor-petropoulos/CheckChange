import { describe, expect, test, beforeAll, afterAll } from 'vitest';
import { spawnSync } from 'child_process';
import { join } from 'path';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';

// Plan 20261101T180000Z-flag-validation task 2 — runs the real CLI as a
// subprocess so exit codes and stderr are real (pattern: test/cli-help.spec.ts:15-33).
// Requires a prior `npm run build` (same convention as test/cli-help.spec.ts:10).

const cliPath = join(import.meta.dirname, '..', 'dist', 'cli.js');

function runCli(args: string[], cwd?: string): { status: number | null; stdout: string; stderr: string } {
  const result = spawnSync('node', [cliPath, ...args], {
    encoding: 'utf8',
    timeout: 60_000,
    ...(cwd ? { cwd } : {}),
  });
  return {
    status: result.status,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  };
}

// Rows asserting exit 0 run against a throwaway 2-commit fixture repo (same
// pattern as test/cli-help.spec.ts A1-hermetic) so they don't depend on the
// enclosing repo's git history — the lean snapshot export carries no .git.
// Skipped when `git` is absent; the fixture dir is removed in afterAll.
const gitAvailable = spawnSync('git', ['--version'], { encoding: 'utf8' }).status === 0;

describe('strict flag validation: doctor/explain/trace reject unknown flags', () => {
  for (const command of ['doctor', 'explain', 'trace'] as const) {
    test(`${command} --format sarif exits 1 with Unknown option --format`, () => {
      const { status, stderr } = runCli([command, '--format', 'sarif']);
      expect(status, `exit code of \`${command} --format sarif\``).toBe(1);
      expect(stderr, `stderr of \`${command} --format sarif\``).toContain(
        'Error: Unknown option --format',
      );
    });
  }

  // delta was already strict; this row fails if the shared helper ever
  // regresses into permissive parsing.
  test('delta --format sarif still exits 1 (regression guard)', () => {
    const { status, stderr } = runCli(['delta', '--format', 'sarif']);
    expect(status).toBe(1);
    expect(stderr).toContain('Error: Unknown option --format');
  });

  // Valid flags must still reach their parser: a missing provider config proves
  // the run got past validation into initProviderConfig (raw ENOENT, exit 1).
  test('doctor --json --allow-external-config --provider-config <missing> reaches ENOENT', () => {
    const { status, stderr } = runCli([
      'doctor',
      '--json',
      '--allow-external-config',
      '--provider-config',
      './nonexistent.json',
    ]);
    expect(status).toBe(1);
    expect(stderr).toContain('ENOENT');
    expect(stderr).not.toContain('Unknown option');
  });
});

describe.skipIf(!gitAvailable)('hermetic exit-0 rows in a 2-commit fixture repo', () => {
  let fixture: string | undefined;

  beforeAll(() => {
    fixture = mkdtempSync(join(tmpdir(), 'checkchange-flags-'));
    const git = (argv: string[]): void => {
      const r = spawnSync('git', argv, { cwd: fixture, encoding: 'utf8', timeout: 30_000 });
      if (r.status !== 0) throw new Error(`fixture git ${argv.join(' ')} failed: ${r.stderr}`);
    };
    const ident = ['-c', 'user.email=t@t', '-c', 'user.name=t', '-c', 'commit.gpgsign=false'];
    git(['init']);
    git([...ident, 'commit', '--no-verify', '--allow-empty', '-m', 'c1']);
    mkdirSync(join(fixture, 'src'));
    writeFileSync(join(fixture, 'src', 'sample.ts'), 'export function f(x: number): number {\n  return x + 1;\n}\n');
    git(['add', '-A']);
    git([...ident, 'commit', '--no-verify', '-m', 'c2']);
  });

  afterAll(() => {
    if (fixture) {
      rmSync(fixture, { recursive: true, force: true });
      fixture = undefined;
    }
  });

  // `--base HEAD` consumes `HEAD`; `sarif` is the ruleId positional, not a flag.
  test('explain --base HEAD sarif keeps the ruleId positional valid', () => {
    const { status, stderr } = runCli(['explain', '--base', 'HEAD', 'sarif'], fixture);
    expect(stderr, 'ruleId must not be reported as an unknown option').not.toContain(
      'Unknown option',
    );
    expect(status, 'stderr: ' + stderr).toBe(0);
  });

  // Inline base was previously rejected as an unknown option.
  test('explain --base=HEAD sarif exits 0', () => {
    const { status, stderr } = runCli(['explain', '--base=HEAD', 'sarif'], fixture);
    expect(stderr, 'stderr: ' + stderr).not.toContain('Unknown option');
    expect(status, 'stderr: ' + stderr).toBe(0);
  });
});

describe('value flags: inline-or-next, never silent', () => {
  // Threshold used to be raw parseFloat: 'abc' became NaN and ran.
  test('explain --crap-threshold abc exits 1 with the numeric error', () => {
    const { status, stderr } = runCli(['explain', '--crap-threshold', 'abc']);
    expect(status).toBe(1);
    expect(stderr).toContain('--crap-threshold must be a finite non-negative number');
  });

  // Bare value flag: previously flagValue returned undefined and doctor
  // silently used the default config.
  test('doctor --provider-config (no value) exits 1 with requires a value', () => {
    const { status, stderr } = runCli(['doctor', '--provider-config']);
    expect(status).toBe(1);
    expect(stderr).toContain('--provider-config requires a value');
  });

  test('explain --base (no value) exits 1 with requires a value', () => {
    const { status, stderr } = runCli(['explain', '--base']);
    expect(status).toBe(1);
    expect(stderr).toContain('--base requires a value');
  });

  // Inline form is now honored by doctor (was ignored: exact indexOf).
  test('doctor --provider-config=<missing> is honored (ENOENT)', () => {
    const { status, stderr } = runCli(['doctor', '--provider-config=./nonexistent.json']);
    expect(status).toBe(1);
    expect(stderr).toContain('ENOENT');
    expect(stderr).not.toContain('Unknown option');
  });

  // Inline empty value is an empty value: rejected, never silently defaulted.
  for (const cmd of ['explain', 'trace', 'doctor'] as const) {
    const flag = cmd === 'doctor' ? '--provider-config' : '--base';
    test(`${cmd} ${flag}= (empty inline value) exits 1 with requires a value`, () => {
      const { status, stderr } = runCli([cmd, `${flag}=`]);
      expect(status, `exit code of \`${cmd} ${flag}=\``).toBe(1);
      expect(stderr, `stderr of \`${cmd} ${flag}=\``).toContain(`${flag} requires a value`);
    });
  }
});