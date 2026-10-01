import { describe, expect, test, afterAll, beforeAll } from 'vitest';
import { spawnSync } from 'child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

// T1 (plan 2026-09-27T01-50-01Z-cli-help.md) — RED suite for uniform --help/--version.
// Runs the real CLI as a subprocess so exit codes and stdout are real, per plan T1
// open_questions ("prefer execFileSync('node', ['dist/cli.js', ...]) so exit codes are real").
// Requires a prior `npm run build` (package.json:14) — same convention as test/js-parity.spec.ts:7.

const cliPath = join(import.meta.dirname, '..', 'dist', 'cli.js');
const SUBCOMMANDS = ['check', 'doctor', 'explain', 'trace', 'delta', 'prepare-repo'] as const;

function runCli(args: string[], cwd?: string): {
  status: number | null;
  stdout: string;
  stderr: string;
} {
  const result = spawnSync('node', [cliPath, ...args], {
    encoding: 'utf8',
    timeout: 60_000,
    // Optional cwd: the CLI reads process.cwd() for all git operations
    // (src/cli.ts:338/386, src/git.ts:35), so steering the spawn's cwd
    // steers base resolution — lets a row run inside a fixture repo.
    ...(cwd ? { cwd } : {}),
  });
  return {
    status: result.status,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  };
}

// INV-HELP-07/08 fixture: the live 12-line `check --help` output captured VERBATIM
// from `node dist/cli.js check --help` on 6ba1cbb BEFORE any src change (plan risk 1:
// "T1 pins source-of-truth = current 12-line output"). T3 appends Examples + footer
// AFTER these 12 lines without touching them.
const CHECK_HELP_LIVE_FIRST_12 = [
  'Usage: checkchange check [--base <ref>] [--json] [--cache] [--auto-coverage] [--crap-threshold <number>] [--coverage-file <path>] [--format github|junit|sarif] [--provider-config <path>] [--allow-external-config] [--verbose]',
  'Options:',
  '  --base <ref>             Git base reference to compare against (optional, default: auto-detect)',
  '  --json                   Output JSON (default: false)',
  '  --cache                  Enable incremental caching (default: off; also CHECKCHANGE_CACHE=1 env)',
  '  --crap-threshold <number> CRAP threshold for WARN (default: 30)',
  '  --coverage-file <path>   Istanbul coverage JSON file path',
  '  --auto-coverage          Detect test runner, generate coverage artifact, retry [experimental]',
  '  --format <name>          Output format: github, junit, sarif (default: none)',
  '  --provider-config <path> Path to checkchange.providers.json (overrides builtin defaults)',
  '  --allow-external-config  Authorize an external provider config path (default: false)',
  '  --verbose                Print diagnostic info to stderr',
].join('\n');

describe('INV-HELP-01: subcommand --help exits 0 with Usage:', () => {
  for (const cmd of SUBCOMMANDS) {
    test(`${cmd} --help exits 0 and prints a Usage: line`, () => {
      const { status, stdout } = runCli([cmd, '--help']);
      expect(status, `exit code of \`${cmd} --help\``).toBe(0);
      expect(stdout, `stdout of \`${cmd} --help\``).toContain('Usage:');
    });
  }
});

describe('INV-HELP-02: subcommand --help --json emits schema-shaped JSON', () => {
  for (const cmd of SUBCOMMANDS) {
    test(`${cmd} --help --json parses with command/usage/flags/examples`, () => {
      const { status, stdout } = runCli([cmd, '--help', '--json']);
      expect(status, `exit code of \`${cmd} --help --json\``).toBe(0);
      const parsed: unknown = JSON.parse(stdout); // fails today: stdout is text/probe output
      expect(parsed).toBeTypeOf('object');
      const obj = parsed as Record<string, unknown>;
      expect(obj, `command key of \`${cmd}\` JSON`).toHaveProperty('command');
      expect(obj, `usage key of \`${cmd}\` JSON`).toHaveProperty('usage');
      expect(Array.isArray(obj.flags), `flags array of \`${cmd}\` JSON`).toBe(true);
      expect(Array.isArray(obj.examples), `examples array of \`${cmd}\` JSON`).toBe(true);
    });
  }
});

describe('INV-HELP-04: --version', () => {
  test('--version prints package.json version and exits 0', () => {
    const pkg = JSON.parse(
      readFileSync(join(import.meta.dirname, '..', 'package.json'), 'utf8'),
    ) as { version: string };
    const { status, stdout } = runCli(['--version']);
    expect(status, 'exit code of --version').toBe(0);
    expect(stdout.trim(), '--version output').toBe(`checkchange ${pkg.version}`);
  });
});

// A1 (plan 2026-09-27T16-00-57-ab-cleanup.md) — a value-taking flag's value slot
// must never be read as the --version flag. Before the fix, main() tested
// `args.includes('--version')` positionally, so `check --base --version` printed
// the version banner and exited 0 instead of treating `--version` as the base ref.
//
// Exit codes and error text are per-flag and pinned from live post-fix behavior.
// Note: run these against a FRESH build — a stale dist/ reports a different
// `--coverage-file` exit (verified: stale Sep-26 dist gave 0, fresh gives 1).
// F1: `delta`'s --baseline/--current were missing from the skip-lists, so
// `delta --current --version` printed the banner and exited 0 (verified live on
// a fresh build). Rows carry the argv prefix so one loop covers every command.
// Tree-state note: the 6 rows below are parse-time errors (verified live: all
// exit 1 pre-analysis, clean tree) — state-independent. The --coverage-file row
// was the only one reaching analysis, so it depended on the enclosing repo's
// history (`--base HEAD~1`): empty diff on clean tree → UNSUPPORTED → exit 0,
// and GitHub Actions' checkout cannot resolve HEAD~1 at all
// (`Error: Cannot resolve base reference: HEAD~1`, reproduced verbatim in a
// 1-commit fixture). It now lives in its own hermetic describe BELOW, running
// against a throwaway 2-commit fixture repo — no dependence on this repo's
// history, clean tree, dirty tree, or CI checkout depth.
const VALUE_FLAG_VERSION_HIJACK = [
  { argv: ['check', '--base'], status: 1, error: 'Cannot resolve base reference: --version' },
  { argv: ['check', '--format'], status: 1, error: 'Unknown --format value: --version' },
  { argv: ['check', '--crap-threshold'], status: 1, error: '--crap-threshold must be a finite non-negative number' },
  { argv: ['check', '--provider-config'], status: 1, error: 'ENOENT' },
  { argv: ['delta', '--baseline'], status: 1, error: '--baseline requires a value' },
  { argv: ['delta', '--current'], status: 1, error: '--current requires a value' },
] as const;

describe('A1: a value flag\'s value slot is not --version (no value-hijack)', () => {
  const pkg = JSON.parse(
    readFileSync(join(import.meta.dirname, '..', 'package.json'), 'utf8'),
  ) as { version: string };
  const banner = `checkchange ${pkg.version}`;

  for (const { argv, status: expected, error } of VALUE_FLAG_VERSION_HIJACK) {
    const args = [...argv, '--version'];
    test(`\`${args.join(' ')}\` treats --version as the value, not the flag`, () => {
      const { status, stdout, stderr } = runCli(args);
      expect(status, `exit code of \`${args.join(' ')}\``).toBe(expected);
      expect(stdout, `stdout of \`${args.join(' ')}\` must not print the version banner`).not.toContain(banner);
      expect(stderr, `stderr of \`${args.join(' ')}\``).toContain(error);
    });
  }
});

// A1 hermetic (CI red 2026-09-27): the --coverage-file row must reach
// analysisStatus FAILED without touching the enclosing repo's git history.
// On GitHub Actions the checkout cannot resolve HEAD~1 (outer-history
// dependence), so the row died on
// `Error: Cannot resolve base reference: HEAD~1` before ever reaching the
// pinned `coverage artifact missing` — reproduced verbatim locally by running
// the same argv in a 1-commit fixture repo. Fixture below is a throwaway repo
// under os.tmpdir() with two commits (git init, two `git -c user.email=t@t
// -c user.name=t commit`s, second adds a .ts file), so HEAD~1 resolves and
// HEAD~1..HEAD is a non-empty committed diff — identical on a clean tree, a
// dirty tree, and any CI checkout. Skipped when `git` is absent; the fixture
// dir is removed in afterAll.
describe.skipIf(
  spawnSync('git', ['--version'], { encoding: 'utf8' }).status !== 0,
)('A1 (hermetic): `check --base HEAD~1 --coverage-file --version` in a fixture repo', () => {
  const pkg = JSON.parse(
    readFileSync(join(import.meta.dirname, '..', 'package.json'), 'utf8'),
  ) as { version: string };
  const banner = `checkchange ${pkg.version}`;
  let fixture: string | undefined;

  beforeAll(() => {
    fixture = mkdtempSync(join(tmpdir(), 'checkchange-a1-'));
    // Engram rev-1790534756661-2 (modified): neutralize ambient git config so
    // a globally gpg-signed/hooked machine can't hang or fail the fixture —
    // commits pass `-c commit.gpgsign=false` + `--no-verify`, and the spawn
    // carries a timeout so a stray pinentry prompt can't wedge the suite.
    const git = (argv: string[]): void => {
      const r = spawnSync('git', argv, {
        cwd: fixture,
        encoding: 'utf8',
        timeout: 30_000,
      });
      if (r.status !== 0) {
        throw new Error(`fixture git ${argv.join(' ')} failed: ${r.stderr}`);
      }
    };
    const ident = ['-c', 'user.email=t@t', '-c', 'user.name=t', '-c', 'commit.gpgsign=false'];
    git(['init']);
    git([...ident, 'commit', '--no-verify', '--allow-empty', '-m', 'c1']);
    mkdirSync(join(fixture, 'src'));
    writeFileSync(
      join(fixture, 'src', 'sample.ts'),
      'export function f(x: number): number {\n  return x + 1;\n}\n',
    );
    git(['add', '-A']);
    git([...ident, 'commit', '--no-verify', '-m', 'c2']);
  });

  afterAll(() => {
    if (fixture) {
      rmSync(fixture, { recursive: true, force: true });
      fixture = undefined;
    }
  });

  test('`--version` lands in the value slot; normal flow reaches `coverage artifact missing`', () => {
    const args = ['check', '--base', 'HEAD~1', '--coverage-file', '--version'];
    const { status, stdout, stderr } = runCli(args, fixture);
    expect(status, `exit code of \`${args.join(' ')}\` in fixture repo`).toBe(1);
    expect(
      stdout,
      `stdout of \`${args.join(' ')}\` must not print the version banner`,
    ).not.toContain(banner);
    expect(stderr, `stderr of \`${args.join(' ')}\` in fixture repo`).toContain(
      'coverage artifact missing',
    );
  });
});

// A2 (plan 2026-09-27T16-00-57-ab-cleanup.md) — `--help` is flag-first: the
// dispatcher's subcommand resolution falls back to `check` for any argv whose
// first token is not a subcommand, so `--base HEAD bogus --help` must render
// CHECK help, not the overview. Routing the same resolved command to two help
// bodies depending on arg order is the desync class A3 exists to kill.
// The no-positional case (`--base HEAD --help`) keeps the overview — pinned
// here so the fix cannot collapse it.
describe('A2: flag-first --help resolves the subcommand the dispatcher would run', () => {
  test('`--base HEAD bogus --help` renders check help, byte-identical to `check --help`', () => {
    const flagFirst = runCli(['--base', 'HEAD', 'bogus', '--help']);
    expect(flagFirst.status, 'exit code of `--base HEAD bogus --help`').toBe(0);
    expect(flagFirst.stdout, 'stdout of `--base HEAD bogus --help`').toBe(
      runCli(['check', '--help']).stdout,
    );
  });

  test('`--base HEAD --help` (no positional) still renders the overview', () => {
    const noPositional = runCli(['--base', 'HEAD', '--help']);
    expect(noPositional.status, 'exit code of `--base HEAD --help`').toBe(0);
    expect(noPositional.stdout, 'stdout of `--base HEAD --help`').toBe(
      runCli(['--help']).stdout,
    );
  });
});

describe('INV-HELP-05: unknown command --help', () => {
  test('bogus --help exits 1 with Error: Unknown command', () => {
    const { status, stderr } = runCli(['bogus', '--help']);
    expect(status, 'exit code of `bogus --help`').toBe(1);
    expect(stderr, 'stderr of `bogus --help`').toContain('Error: Unknown command');
  });
});

describe('INV-HELP-07/08: check --help anti-drift fixture', () => {
  test('check --help first 12 lines are byte-identical to the pinned live fixture', () => {
    const { status, stdout } = runCli(['check', '--help']);
    expect(status, 'exit code of `check --help`').toBe(0);
    const first12 = stdout.split('\n').slice(0, 12).join('\n');
    expect(first12).toBe(CHECK_HELP_LIVE_FIRST_12);
  });
});

// Anti-drift fixtures for the WHOLE rendered body, not just check's 12 pinned lines.
// Review ses_f1f646577ffevGTg0ps1Et6PtA finding: help.ts's overview footer shipped
// without `--help` (spec §D:145 deviation) because no test asserted any non-check
// text. Every byte below was extracted programmatically from live output that was
// first diffed byte-for-byte against spec §D blocks (overview = §D:130-145,
// doctor = §D:176-194) — hand-editing a fixture here must fail the test.
// `console.log` appends exactly one trailing newline (src/cli.ts renderHelp), so
// the comparison includes it.
const OVERVIEW_HELP_EXACT = [
  'Usage: checkchange <command> [options]',
  '',
  'Commands:',
  '  check         Analyze changed functions for complexity, coverage, and CRAP score',
  '  doctor        Run environment health probes (git, base, providers, coverage)',
  '  explain       Show derivation for a rule result (threshold, providers, fallbacks)',
  '  trace         Run analysis with timing spans (correlation ID + stage durations)',
  '  delta         Compare two EvidenceOutput JSON files (gate transition summary)',
  '  prepare-repo  Detect stack, plan installs, approve, execute, verify',
  '',
  'Options:',
  '  --help     Show this help',
  '  --version  Print version and exit',
  '',
  'Run \'checkchange <command> --help\' for command-specific help.',
  'Tip: \'checkchange <command> --help --json\' for machine-readable help.',
].join('\n');

// Representative non-check command: the brief's LOW item (duplicate `description`
// literals) is only catchable if some full body is pinned byte-for-byte.
const DOCTOR_HELP_EXACT = [
  'Usage: checkchange doctor [--json] [--provider-config <path>] [--allow-external-config]',
  '',
  'Options:',
  '  --json                   Output JSON (default: false)',
  '  --provider-config <path> Path to checkchange.providers.json (overrides builtin defaults)',
  '  --allow-external-config  Authorize an external provider config path (default: false)',
  '',
  'Probes (always run):',
  '  gitExecutable       git on PATH',
  '  gitRepo             current directory is a git repo',
  '  defaultBase         origin/main or main auto-detected',
  '  providerAvailability  changed file extensions have registered providers',
  '  coverageArtifact    Istanbul coverage JSON present and parseable',
  '',
  'Examples:',
  '  checkchange doctor --json',
  '  checkchange doctor --provider-config ./custom.providers.json',
  '',
  'Tip: \'checkchange doctor --help --json\' for machine-readable help.',
].join('\n');

// A5 (plan 2026-09-27T16-00-57-ab-cleanup.md) — the four commands that had NO
// whole-body fixture. Every byte below was extracted PROGRAMMATICALLY from a
// freshly built `node dist/cli.js <cmd> --help` capture (fixtures generated by
// script, never hand-typed) and each capture was diffed byte-for-byte against
// its spec §D block (docs/superpowers/specs/2026-09-27-cli-help-design.md
// §D explain=:197, trace=:223, delta=:248, prepare-repo=:272) — all four
// IDENTICAL after stripping console.log's single trailing newline.
const EXPLAIN_HELP_EXACT = [
  'Usage: checkchange explain [options] [--base <ref>] [--crap-threshold <number>] [--coverage-file <path>] [ruleId]',
  '',
  'Options:',
  '  --json                   Output JSON (default: false)',
  '  --base <ref>             Git base reference (default: auto-detect)',
  '  --crap-threshold <number> CRAP threshold for derivation (default: 30)',
  '  --coverage-file <path>   Coverage artifact to use in derivation',
  '',
  'Arguments:',
  '  ruleId                   Filter to specific rule (default: changed-function-high-crap)',
  '',
  'Derivation includes:',
  '  threshold, base (raw + resolved), input counts, provider sources (complexity/coverage),',
  '  fallback reason, matching rule results',
  '',
  'Examples:',
  '  checkchange explain --json',
  '  checkchange explain --base HEAD~5 --crap-threshold 20',
  '  checkchange explain changed-function-high-crap --coverage-file ./cov.json',
  '',
  'Tip: \'checkchange explain --help --json\' for machine-readable help.',
].join('\n');

const TRACE_HELP_EXACT = [
  'Usage: checkchange trace [options] [--base <ref>] [--crap-threshold <number>] [--coverage-file <path>]',
  '',
  'Options:',
  '  --json                   Output JSON (default: false)',
  '  --base <ref>             Git base reference (default: auto-detect)',
  '  --crap-threshold <number> CRAP threshold (default: 30)',
  '  --coverage-file <path>   Coverage artifact path',
  '',
  'Output (text):',
  '  trace: <correlationId> — N span(s)',
  '  warning: [source] message',
  '',
  'Output (--json):',
  '  { command: \'trace\', correlationId, spans: [{stage, durationMs, status}], warnings }',
  '',
  'Examples:',
  '  checkchange trace --json',
  '  checkchange trace --base main --crap-threshold 25',
  '',
  'Tip: \'checkchange trace --help --json\' for machine-readable help.',
].join('\n');

const DELTA_HELP_EXACT = [
  'Usage: checkchange delta --baseline <path> --current <path> [--json]',
  '',
  'Options:',
  '  --json          Output JSON (default: false)',
  '  --baseline <path>  Path to baseline EvidenceOutput JSON (required)',
  '  --current <path>   Path to current EvidenceOutput JSON (required)',
  '',
  'Output (text):',
  '  delta: added N, removed M, changed K, unchanged L',
  '  gate: <transition | unchanged>',
  '',
  'Output (--json):',
  '  DeltaOutput schema (summary + added/removed/changed arrays + gateTransition)',
  '',
  'Examples:',
  '  checkchange delta --baseline before.json --current after.json --json',
  '  checkchange delta --baseline ./artifacts/base.json --current ./artifacts/head.json',
  '',
  'Tip: \'checkchange delta --help --json\' for machine-readable help.',
].join('\n');

const PREPARE_REPO_HELP_EXACT = [
  'Usage: checkchange prepare-repo [--dry-run] [--json] [--yes]',
  '',
  'Options:',
  '  --dry-run   Show install plan only (no execution, no TTY required)',
  '  --json      Output JSON (default: false)',
  '  --yes       Skip approval prompt (non-interactive execution)',
  '',
  'Phases:',
  '  1. Detect  — language stacks + registered providers',
  '  2. Plan    — install actions + config updates per language',
  '  3. Approve — TTY prompt (skipped by --dry-run or --yes)',
  '  4. Install — execute actions; on full success, flush config updates',
  '  5. Verify  — re-detect + run analyzers; report ok/unfixable',
  '',
  'Exit codes:',
  '  0  dry-run plan printed OR full success',
  '  1  partial/unfixable install or verify, approval denied, no-TTY refusal',
  '',
  'Examples:',
  '  checkchange prepare-repo --dry-run --json',
  '  checkchange prepare-repo --yes',
  '  checkchange prepare-repo --dry-run',
  '',
  'Tip: \'checkchange prepare-repo --help --json\' for machine-readable help.',
].join('\n');

describe('whole-body anti-drift fixtures (review ses_f1f646577ffevGTg0ps1Et6PtA)', () => {
  test('overview `--help` is byte-identical to the spec §D:130-145 fixture', () => {
    const { status, stdout } = runCli(['--help']);
    expect(status, 'exit code of `--help`').toBe(0);
    expect(stdout, 'stdout of `--help`').toBe(`${OVERVIEW_HELP_EXACT}\n`);
  });

  test('overview footer advertises `--help --json`, not bare `--json` (spec §D:145)', () => {
    const { stdout } = runCli(['--help']);
    expect(stdout, 'overview footer of `--help`').toContain(
      "Tip: 'checkchange <command> --help --json' for machine-readable help.",
    );
    expect(stdout, 'overview must not advertise the bare `--json` tip').not.toContain(
      "Tip: 'checkchange <command> --json'",
    );
  });

  test('doctor --help is byte-identical to the spec §D:176-194 fixture', () => {
    const { status, stdout } = runCli(['doctor', '--help']);
    expect(status, 'exit code of `doctor --help`').toBe(0);
    expect(stdout, 'stdout of `doctor --help`').toBe(`${DOCTOR_HELP_EXACT}\n`);
  });

  test('explain --help is byte-identical to the spec §D:197-221 fixture', () => {
    const { status, stdout } = runCli(['explain', '--help']);
    expect(status, 'exit code of `explain --help`').toBe(0);
    expect(stdout, 'stdout of `explain --help`').toBe(`${EXPLAIN_HELP_EXACT}\n`);
  });

  test('trace --help is byte-identical to the spec §D:223-246 fixture', () => {
    const { status, stdout } = runCli(['trace', '--help']);
    expect(status, 'exit code of `trace --help`').toBe(0);
    expect(stdout, 'stdout of `trace --help`').toBe(`${TRACE_HELP_EXACT}\n`);
  });

  test('delta --help is byte-identical to the spec §D:248-270 fixture', () => {
    const { status, stdout } = runCli(['delta', '--help']);
    expect(status, 'exit code of `delta --help`').toBe(0);
    expect(stdout, 'stdout of `delta --help`').toBe(`${DELTA_HELP_EXACT}\n`);
  });

  test('prepare-repo --help is byte-identical to the spec §D:272-299 fixture', () => {
    const { status, stdout } = runCli(['prepare-repo', '--help']);
    expect(status, 'exit code of `prepare-repo --help`').toBe(0);
    expect(stdout, 'stdout of `prepare-repo --help`').toBe(`${PREPARE_REPO_HELP_EXACT}\n`);
  });
});

// A5 — overview `--help --json` shape (spec §J:336: "overview omits `flags`
// array, includes `commands` array"). Order-sensitive: `commands` must equal
// src/help.ts:290 `Object.keys(HELP_REGISTRY)` == src/cli.ts:17 SUBCOMMANDS.
describe('A5: overview --help --json shape (spec §J:336)', () => {
  test('overview JSON has exactly command/description/usage/commands/examples and no flags', () => {
    const { status, stdout } = runCli(['--help', '--json']);
    expect(status, 'exit code of `--help --json`').toBe(0);
    const parsed: unknown = JSON.parse(stdout);
    expect(parsed, 'overview JSON keys').toEqual(
      expect.objectContaining({
        command: 'checkchange',
        usage: 'checkchange <command> [options]',
        commands: [...SUBCOMMANDS],
        examples: [],
      }),
    );
    const obj = parsed as Record<string, unknown>;
    expect(Object.keys(obj).sort(), 'exact key set of overview JSON').toEqual(
      ['command', 'commands', 'description', 'examples', 'usage'],
    );
    expect(obj, 'overview JSON must omit flags (spec §J:336)').not.toHaveProperty('flags');
    expect(Array.isArray(obj.commands), 'commands is an array').toBe(true);
  });
});

// A5 — the four subcommand `--version` rows that A1/A2 verified live but never
// pinned (A1-H8/A2-H8: "verified by live invocation only, no test"). INV-HELP-04
// above pins only the bare `--version`; these pin the subcommand forms.
describe('A5: subcommand --version rows (pinned from A1-H8/A2-H8 live runs)', () => {
  const pkg = JSON.parse(
    readFileSync(join(import.meta.dirname, '..', 'package.json'), 'utf8'),
  ) as { version: string };
  const banner = `checkchange ${pkg.version}`;

  for (const cmd of ['explain', 'trace', 'delta', 'prepare-repo']) {
    test(`${cmd} --version prints the banner and exits 0`, () => {
      const { status, stdout } = runCli([cmd, '--version']);
      expect(status, `exit code of \`${cmd} --version\``).toBe(0);
      expect(stdout.trim(), `stdout of \`${cmd} --version\``).toBe(banner);
    });
  }
});
