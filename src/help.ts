// Help registry + renderers. Owns every user-facing help string so the six
// subcommands share one formatter instead of six inline console.log blocks
// (spec §C). Pure data + pure functions: no process/exit, no side effects.
// Composition (interception, exit codes) lives in src/cli.ts main().

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export type HelpFlagType = 'string' | 'boolean' | 'number';

/** One flag as advertised in the machine-readable help. */
export interface HelpFlag {
  name: string;
  type: HelpFlagType;
  /** Literal default; null when the flag is optional and has no default. */
  default: string | number | boolean | null;
  description: string;
}

export interface HelpEntry {
  command: string;
  description: string;
  /** One-line invocation, without the leading "Usage: ". */
  usage: string;
  /**
   * Help body up to (not including) the Examples block: usage line, then
   * options and any command-specific sections. Kept as literal lines so the
   * rendered text stays byte-exact — option columns are hand-aligned, and
   * `check` is pinned to the pre-existing output by test/cli-help.spec.ts.
   */
  head: string;
  flags: HelpFlag[];
  examples: string[];
}

export type CommandName = 'check' | 'doctor' | 'explain' | 'trace' | 'delta' | 'prepare-repo';

const CHECK_USAGE = 'checkchange check [--base <ref>] [--json] [--cache] [--auto-coverage] [--crap-threshold <number>] [--coverage-file <path>] [--format github|junit|sarif] [--provider-config <path>] [--allow-external-config] [--verbose]';

// ponytail: head is literal, not generated from flags — the hand-aligned option
// columns and the long "(default: ...)" suffixes are not recoverable from the
// short JSON descriptions in spec §J.
const CHECK_HEAD = `Usage: ${CHECK_USAGE}
Options:
  --base <ref>             Git base reference to compare against (optional, default: auto-detect)
  --json                   Output JSON (default: false)
  --cache                  Enable incremental caching (default: off; also CHECKCHANGE_CACHE=1 env)
  --crap-threshold <number> CRAP threshold for WARN (default: 30)
  --coverage-file <path>   Coverage file: Istanbul JSON, Cobertura XML, or LCOV
  --auto-coverage          Detect test runner, generate coverage artifact, retry [experimental]
  --format <name>          Output format: github, junit, sarif (default: none)
  --provider-config <path> Path to checkchange.providers.json (overrides builtin defaults)
  --allow-external-config  Authorize an external provider config path (default: false)
  --verbose                Print diagnostic info to stderr`;

const CHECK: HelpEntry = {
  command: 'check',
  description: 'Analyze changed functions for complexity, coverage, and CRAP score',
  usage: CHECK_USAGE,
  head: CHECK_HEAD,
  flags: [
    { name: '--base', type: 'string', default: 'auto-detect', description: 'Git base reference to compare against' },
    { name: '--json', type: 'boolean', default: false, description: 'Output JSON' },
    { name: '--cache', type: 'boolean', default: false, description: 'Enable incremental caching (CHECKCHANGE_CACHE=1)' },
    { name: '--crap-threshold', type: 'number', default: 30, description: 'CRAP threshold for WARN' },
    { name: '--coverage-file', type: 'string', default: null, description: 'Coverage file: Istanbul JSON, Cobertura XML, or LCOV' },
    { name: '--auto-coverage', type: 'boolean', default: false, description: 'Auto-generate coverage artifact [experimental]' },
    { name: '--format', type: 'string', default: null, description: 'Output format: github, junit, sarif' },
    { name: '--provider-config', type: 'string', default: null, description: 'Path to checkchange.providers.json' },
    { name: '--allow-external-config', type: 'boolean', default: false, description: 'Authorize external provider config' },
    { name: '--verbose', type: 'boolean', default: false, description: 'Print diagnostic info to stderr' },
  ],
  examples: [
    'checkchange check --base main --json',
    'checkchange check --crap-threshold 25 --format github',
    'checkchange check --auto-coverage --verbose',
  ],
};

const DOCTOR: HelpEntry = {
  command: 'doctor',
  description: 'Run environment health probes (git, base, providers, coverage)',
  usage: 'checkchange doctor [--json] [--provider-config <path>] [--allow-external-config]',
  head: `Usage: checkchange doctor [--json] [--provider-config <path>] [--allow-external-config]

Options:
  --json                   Output JSON (default: false)
  --provider-config <path> Path to checkchange.providers.json (overrides builtin defaults)
  --allow-external-config  Authorize an external provider config path (default: false)

Probes (always run):
  gitExecutable       git on PATH
  gitRepo             current directory is a git repo
  defaultBase         origin/main or main auto-detected
  providerAvailability  changed file extensions have registered providers
  coverageArtifact    Istanbul JSON, Cobertura XML, or LCOV artifact present and parseable
  csharpSdk           dotnet --version exits 0 (C# complexity is SDK-based)`,
  flags: [
    { name: '--json', type: 'boolean', default: false, description: 'Output JSON' },
    { name: '--provider-config', type: 'string', default: null, description: 'Path to checkchange.providers.json' },
    { name: '--allow-external-config', type: 'boolean', default: false, description: 'Authorize external provider config' },
  ],
  examples: [
    'checkchange doctor --json',
    'checkchange doctor --provider-config ./custom.providers.json',
  ],
};

const EXPLAIN: HelpEntry = {
  command: 'explain',
  description: 'Show derivation for a rule result (threshold, providers, fallbacks)',
  usage: 'checkchange explain [options] [--base <ref>] [--crap-threshold <number>] [--coverage-file <path>] [ruleId]',
  head: `Usage: checkchange explain [options] [--base <ref>] [--crap-threshold <number>] [--coverage-file <path>] [ruleId]

Options:
  --json                   Output JSON (default: false)
  --base <ref>             Git base reference (default: auto-detect)
  --crap-threshold <number> CRAP threshold for derivation (default: 30)
  --coverage-file <path>   Coverage artifact to use in derivation

Arguments:
  ruleId                   Filter to specific rule (default: changed-function-high-crap)

Derivation includes:
  threshold, base (raw + resolved), input counts, provider sources (complexity/coverage),
  fallback reason, matching rule results`,
  flags: [
    { name: '--json', type: 'boolean', default: false, description: 'Output JSON' },
    { name: '--base', type: 'string', default: 'auto-detect', description: 'Git base reference' },
    { name: '--crap-threshold', type: 'number', default: 30, description: 'CRAP threshold for derivation' },
    { name: '--coverage-file', type: 'string', default: null, description: 'Coverage artifact to use in derivation' },
  ],
  examples: [
    'checkchange explain --json',
    'checkchange explain --base HEAD~5 --crap-threshold 20',
    'checkchange explain changed-function-high-crap --coverage-file ./cov.json',
  ],
};

const TRACE: HelpEntry = {
  command: 'trace',
  description: 'Run analysis with timing spans (correlation ID + stage durations)',
  usage: 'checkchange trace [options] [--base <ref>] [--crap-threshold <number>] [--coverage-file <path>]',
  head: `Usage: checkchange trace [options] [--base <ref>] [--crap-threshold <number>] [--coverage-file <path>]

Options:
  --json                   Output JSON (default: false)
  --base <ref>             Git base reference (default: auto-detect)
  --crap-threshold <number> CRAP threshold (default: 30)
  --coverage-file <path>   Coverage artifact path

Output (text):
  trace: <correlationId> — N span(s)
  warning: [source] message

Output (--json):
  { command: 'trace', correlationId, spans: [{stage, durationMs, status}], warnings }`,
  flags: [
    { name: '--json', type: 'boolean', default: false, description: 'Output JSON' },
    { name: '--base', type: 'string', default: 'auto-detect', description: 'Git base reference' },
    { name: '--crap-threshold', type: 'number', default: 30, description: 'CRAP threshold' },
    { name: '--coverage-file', type: 'string', default: null, description: 'Coverage artifact path' },
  ],
  examples: [
    'checkchange trace --json',
    'checkchange trace --base main --crap-threshold 25',
  ],
};

const DELTA: HelpEntry = {
  command: 'delta',
  description: 'Compare two EvidenceOutput JSON files (gate transition summary)',
  usage: 'checkchange delta --baseline <path> --current <path> [--json]',
  head: `Usage: checkchange delta --baseline <path> --current <path> [--json]

Options:
  --json          Output JSON (default: false)
  --baseline <path>  Path to baseline EvidenceOutput JSON (required)
  --current <path>   Path to current EvidenceOutput JSON (required)

Output (text):
  delta: added N, removed M, changed K, unchanged L
  gate: <transition | unchanged>

Output (--json):
  DeltaOutput schema (summary + added/removed/changed arrays + gateTransition)`,
  flags: [
    { name: '--json', type: 'boolean', default: false, description: 'Output JSON' },
    { name: '--baseline', type: 'string', default: null, description: 'Path to baseline EvidenceOutput JSON (required)' },
    { name: '--current', type: 'string', default: null, description: 'Path to current EvidenceOutput JSON (required)' },
  ],
  examples: [
    'checkchange delta --baseline before.json --current after.json --json',
    'checkchange delta --baseline ./artifacts/base.json --current ./artifacts/head.json',
  ],
};

const PREPARE_REPO: HelpEntry = {
  command: 'prepare-repo',
  description: 'Detect stack, plan installs, approve, execute, verify',
  usage: 'checkchange prepare-repo [--dry-run] [--json] [--yes]',
  head: `Usage: checkchange prepare-repo [--dry-run] [--json] [--yes]

Options:
  --dry-run   Show install plan only (no execution, no TTY required)
  --json      Output JSON (default: false)
  --yes       Skip approval prompt (non-interactive execution)

Phases:
  1. Detect  — language stacks + registered providers
  2. Plan    — install actions + config updates per language
  3. Approve — TTY prompt (skipped by --dry-run or --yes)
  4. Install — execute actions; on full success, flush config updates
  5. Verify  — re-detect + run analyzers; report ok/unfixable

Exit codes:
  0  dry-run plan printed OR full success
  1  partial/unfixable install or verify, approval denied, no-TTY refusal`,
  flags: [
    { name: '--dry-run', type: 'boolean', default: false, description: 'Show install plan only (no execution, no TTY required)' },
    { name: '--json', type: 'boolean', default: false, description: 'Output JSON' },
    { name: '--yes', type: 'boolean', default: false, description: 'Skip approval prompt (non-interactive execution)' },
  ],
  examples: [
    'checkchange prepare-repo --dry-run --json',
    'checkchange prepare-repo --yes',
    'checkchange prepare-repo --dry-run',
  ],
};

export const HELP_REGISTRY: Record<CommandName, HelpEntry> = {
  check: CHECK,
  doctor: DOCTOR,
  explain: EXPLAIN,
  trace: TRACE,
  delta: DELTA,
  'prepare-repo': PREPARE_REPO,
};

const OVERVIEW_DESCRIPTION = "Run 'checkchange <command> --help' for command-specific help.";

// ponytail: the Commands block is generated, not hand-maintained — an edited
// registry description can no longer leave the overview stale. padEnd(14) is the
// width of the literal it replaces; `--help` output stays byte-identical.
// The rest of the overview has no Examples block, so it stays literal.
const OVERVIEW_COMMANDS = Object.values(HELP_REGISTRY)
  .map((entry) => `  ${entry.command.padEnd(14)}${entry.description}`)
  .join('\n');

const OVERVIEW_TEXT = `Usage: checkchange <command> [options]

Commands:
${OVERVIEW_COMMANDS}

Options:
  --help     Show this help
  --version  Print version and exit

Run 'checkchange <command> --help' for command-specific help.
Tip: 'checkchange <command> --help --json' for machine-readable help.`;

function jsonTip(command: string): string {
  return `Tip: 'checkchange ${command} --help --json' for machine-readable help.`;
}

/**
 * Render help for one subcommand, or the overview when `command` is undefined
 * (bare `checkchange --help`). No trailing newline — the caller prints it.
 */
export function formatHelpText(command: CommandName | undefined): string {
  if (command === undefined) return OVERVIEW_TEXT;
  const entry = HELP_REGISTRY[command];
  return [
    entry.head,
    '',
    'Examples:',
    ...entry.examples.map((example) => `  ${example}`),
    '',
    jsonTip(entry.command),
  ].join('\n');
}

/** Machine-readable help: same shape for every command (spec §J). */
export function formatHelpJson(command: CommandName | undefined): unknown {
  if (command === undefined) {
    return {
      command: 'checkchange',
      description: OVERVIEW_DESCRIPTION,
      usage: 'checkchange <command> [options]',
      commands: Object.keys(HELP_REGISTRY),
      examples: [],
    };
  }
  const entry = HELP_REGISTRY[command];
  return {
    command: entry.command,
    description: entry.description,
    usage: entry.usage,
    flags: entry.flags,
    examples: entry.examples,
  };
}

/**
 * `checkchange <version>`, read from this package's package.json at runtime
 * (never hardcoded — src/rules.ts:4 is the reason that matters). moduleDir is
 * src/ or dist/, so the manifest sits one level up; same idiom as
 * src/evidence.ts:74. Never throws: an unreadable manifest yields 'unknown'.
 */
export function formatVersion(): string {
  try {
    const moduleDir = path.dirname(fileURLToPath(import.meta.url));
    const manifest = JSON.parse(
      fs.readFileSync(path.join(moduleDir, '..', 'package.json'), 'utf8'),
    ) as { version?: string };
    return `checkchange ${manifest.version ?? 'unknown'}`;
  } catch {
    return 'checkchange unknown';
  }
}
