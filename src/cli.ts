#!/usr/bin/env node
import { validateGitRepo, resolveBaseRef, getChangedIntervals, detectDefaultBase } from './git.js';
import { buildEvidenceOutput } from './evidence.js';
import { readCoverage } from './coverage.js';
import { autoCoverage } from './auto-coverage.js';
import { registerCachedProviders, getCacheWarnings, clearCacheWarnings } from './cache.js';
import { execute, TraceRun } from './execute.js';
import { FORMATS, format, type EvidenceOutputShape as FormatterOutputShape, type FormatType } from './formatters/index.js';
import { compareFromFiles } from './delta.js';
import * as path from 'node:path';

// Subcommand dispatcher (check|doctor|explain|trace|delta). Legacy check path
// output is byte-identical to the pre-dispatcher CLI; doctor/explain/trace/delta
// emit sidecar diagnostics only — never EvidenceOutput-shaped data.
const SUBCOMMANDS = ['check', 'doctor', 'explain', 'trace', 'delta'] as const;
type Subcommand = (typeof SUBCOMMANDS)[number];

// File extensions that map to a registered provider (evidence.ts registerProvider).
const SUPPORTED_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.py']);

export interface CheckArgs {
  base: string | null;
  json: boolean;
  cache?: boolean;
  autoCoverage?: boolean;
  crapThreshold: number;
  coverageFile: string | undefined;
  format?: FormatType;
  verbose: boolean;
}

/**
 * Parses command line arguments for the `check` subcommand.
 * Returns parsed args or prints error and exits.
 */
/** Require value from next argv slot (space form only). Exits on missing. */
function nextValue(argv: string[], i: number, name: string): [string, number] {
  if (i + 1 >= argv.length) {
    console.error(`Error: ${name} requires a value`);
    process.exit(1);
  }
  return [argv[i + 1]!, i + 1];
}

/** Require value from `--flag=value` or next argv slot. Exits on missing/empty-ish. */
function splitValue(argv: string[], i: number, name: string): [string, number] {
  const parts = argv[i]!.split('=');
  if (parts.length > 1) return [parts[1]!, i];
  return nextValue(argv, i, name);
}

function parseCrapThreshold(value: string): number {
  const parsed = parseFloat(value);
  if (!isFinite(parsed) || parsed < 0) {
    console.error('Error: --crap-threshold must be a finite non-negative number');
    process.exit(1);
  }
  return parsed;
}

function parseCoverageFile(value: string): string {
  if (value === '') {
    console.error('Error: --coverage-file requires a value');
    process.exit(1);
  }
  return value;
}

function parseFormat(value: string): FormatType {
  if (value === '') {
    console.error('Error: --format requires a value');
    process.exit(1);
  }
  if (!(FORMATS as readonly string[]).includes(value)) {
    console.error(`Error: Unknown --format value: ${value}`);
    process.exit(1);
  }
  return value as FormatType;
}

export function parseCliArgs(argv: string[] = process.argv.slice(2)): CheckArgs {
  let base: string | null = null;
  let json = false;
  let cache = false;
  let autoCoverage = false;
  let help = false;
  let verbose = false;
  let crapThreshold = 30; // default
  let coverageFile: string | undefined; // optional --coverage-file <path>
  let format: FormatType | undefined; // optional --format github|junit|sarif
  const positionals: string[] = [];
  let i = 0;
  while (i < argv.length) {
    const arg = argv[i]!;
    if (arg === '--cache') {
      cache = true;
    }
    else if (arg === '--auto-coverage') {
      autoCoverage = true;
    }
    else if (arg === '--base') {
      [base, i] = nextValue(argv, i, '--base');
    }
    else if (arg === '--json') {
      json = true;
    }
    else if (arg === '--help') {
      help = true;
    }
    else if (arg === '--verbose' || arg === '--debug') {
      verbose = true;
    }
    else if (arg.startsWith('--crap-threshold')) {
      const [v, next] = splitValue(argv, i, '--crap-threshold');
      crapThreshold = parseCrapThreshold(v);
      i = next;
    }
    else if (arg.startsWith('--coverage-file')) {
      const [v, next] = splitValue(argv, i, '--coverage-file');
      coverageFile = parseCoverageFile(v);
      i = next;
    }
    else if (arg.startsWith('--format')) {
      const [v, next] = splitValue(argv, i, '--format');
      format = parseFormat(v);
      i = next;
    }
    else if (arg.startsWith('-')) {
      console.error(`Error: Unknown option ${arg}`);
      process.exit(1);
    }
    else {
      positionals.push(arg);
    }
    i++;
  }
  if (help) {
    console.log('Usage: checkchange check [--base <ref>] [--json] [--cache] [--auto-coverage] [--crap-threshold <number>] [--coverage-file <path>] [--format github|junit|sarif] [--verbose]');
    console.log('Options:');
    console.log('  --base <ref>             Git base reference to compare against (optional, default: auto-detect)');
    console.log('  --json                   Output JSON (default: false)');
    console.log('  --cache                  Enable incremental caching (default: off; also CHECKCHANGE_CACHE=1 env)');
    console.log('  --crap-threshold <number> CRAP threshold for WARN (default: 30)');
    console.log('  --coverage-file <path>   Istanbul coverage JSON file path');
    console.log('  --auto-coverage          Detect test runner, generate coverage artifact, retry [experimental]');
    console.log('  --format <name>          Output format: github, junit, sarif (default: none)');
    console.log('  --verbose                Print diagnostic info to stderr');
    process.exit(0);
  }

  // Validate positional command must be exactly "check"
  if (positionals.length !== 1 || positionals[0] !== 'check') {
    console.error('Error: Command must be "check"');
    process.exit(1);
  }
  return { base, json, crapThreshold, coverageFile, verbose, ...(cache ? { cache: true } : {}), ...(autoCoverage ? { autoCoverage: true } : {}), ...(format === undefined ? {} : { format }) };
}

// Shape of buildEvidenceOutput as consumed by the CLI. EvidenceOutput has no
// single exported type, and nocheck inference yields a per-path union; the CLI
// reads a stable subset only (no schema fields invented).
interface EvidenceOutputShape {
  analysisStatus: string;
  gate: string | null;
  completeness: string;
  changedFunctions: Array<Record<string, unknown>>;
  ruleResults: Array<{ ruleId: string; result: string }>;
  capabilities: Record<string, string>;
  coverageErrorReason?: string;
  diagnostics?: { quality?: { complexity?: string; coverage?: string } };
}

/**
 * Auto-detect base reference. If base is non-null returns it directly,
 * otherwise tries detectDefaultBase. Exits on failure.
 */
export async function detectBase(base: string | null, verbose: boolean): Promise<string> {
  if (base === null) {
    const detectedBase = await detectDefaultBase(verbose);
    if (detectedBase === null) {
      console.error('Error: Cannot auto-detect base branch (tried origin/master, origin/main, master, main). Provide --base <ref> explicitly.');
      process.exit(1);
    }
    base = detectedBase;
  }
  return base;
}

/**
 * Emit check output: verbose diagnostics, formatter, JSON/summary, and
 * FAILED status handling + exit code. Preserves byte-identical output
 * from pre-dispatcher CLI.
 */
export function formatOutput(
  output: EvidenceOutputShape,
  opts: CheckArgs,
  resolvedBase: string,
  cacheEnabled: boolean
): void {
  if (opts.verbose) {
    console.error(`[verbose] analysisStatus=${output.analysisStatus} gate=${output.gate} completeness=${output.completeness} changedFunctions=${output.changedFunctions.length}`);
    // Cache-provider warnings (parse/conversion skips) buffer in cache.ts; the
    // CLI owns routing — emit under the existing --verbose path only.
    if (cacheEnabled) {
      for (const warning of getCacheWarnings()) {
        console.error(`[verbose] ${warning}`);
      }
      clearCacheWarnings();
    }
  }
  // Formatter sidecar: emitted as a separate console.log when --format present.
  // Cast: cli's EvidenceOutputShape (this file), a stable subset, is structurally
  // assignable to the formatter's clone modulo narrower field types — aliased
  // above to keep the runtime shape unchanged (no field invented).
  if (opts.format) {
    console.log(format(output as unknown as FormatterOutputShape, opts.format, { cwd: process.cwd() }));
  }
  // Output JSON if --json flag is set
  if (opts.json) {
    console.log(JSON.stringify(output, null, 2));
  }
  else {
    // For WP1, we primarily want JSON, but let's output a simple summary if not JSON
    console.log(`Analysis complete. Base: ${resolvedBase}, Changed functions: ${output.changedFunctions.length}`);
  }
  if (output.analysisStatus === 'FAILED') {
    if (output.coverageErrorReason === 'missing') {
      console.error('Error: coverage artifact missing');
    } else if (output.coverageErrorReason === 'malformed') {
      console.error('Error: coverage artifact malformed');
    } else {
      console.error('Error: coverage artifact malformed');
    }
    process.exit(1);
    return;
  }
  let exitCode = 0;
  if (output.analysisStatus === 'SUCCESS' && output.gate !== 'PASS') {
    exitCode = 1;
  }
  else if (output.analysisStatus === 'UNSUPPORTED') {
    if (!(output.gate === null && output.completeness === 'NOT_APPLICABLE')) {
      exitCode = 1;
    }
  }
  process.exit(exitCode);
}

/**
 * The `check` subcommand. Body (messages, exit codes, output) preserved
 * byte-identical from the pre-dispatcher CLI.
 */
async function runCheck(args: string[]): Promise<void> {
  const opts = parseCliArgs(args);
  // Auto-detect base if not provided
  const base = await detectBase(opts.base, opts.verbose);
  // Validate git repo
  await validateGitRepo();
  // Resolve base ref
  const resolvedBase = await resolveBaseRef(base);
  // Get changed intervals
  const { intervals } = await getChangedIntervals(resolvedBase);
  // Incremental caching opt-in (Experiment C, task C-4): --cache flag or
  // CHECKCHANGE_CACHE=1. Default OFF => evidence.ts provider defaults untouched.
  const cacheEnabled = opts.cache === true || process.env.CHECKCHANGE_CACHE === '1';
  if (cacheEnabled) {
    registerCachedProviders();
  }
  // Auto-coverage: detect runner, spawn coverage generation, use artifact path.
  // Explicit --coverage-file wins (skip auto). On fail: fall back to absent path (never forced FAILED).
  let coverageFile = opts.coverageFile;
  let autoGenerated = false; // ponytail: generation-truth, not flag-truth (fixes C1 regression)
  if (opts.autoCoverage === true && !coverageFile) {
    const cwd = process.cwd();
    const { generatedPath, hint } = autoCoverage(cwd);
    if (generatedPath) {
      coverageFile = generatedPath;
      autoGenerated = true;
    }
    if (hint) {
      console.error(`[auto-coverage] ${hint}`);
    }
  }
  // Build evidence output using composed providers
  const output = (await buildEvidenceOutput(resolvedBase, intervals, process.cwd(), opts.crapThreshold, coverageFile, undefined, autoGenerated)) as EvidenceOutputShape;
  formatOutput(output, opts, resolvedBase, cacheEnabled);
}

interface DoctorProbe {
  name: string;
  status: string;
  detail?: string;
}

function probe(name: string, status: string, detail?: string): DoctorProbe {
  return { name, status, ...(detail === undefined ? {} : { detail }) };
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * `doctor` subcommand: environment probes. Reuses existing validate/detect
 * helpers and covered read paths (readCoverage applies MAX_SIZE + path guards);
 * no analysis engine duplication.
 */
async function runDoctor(argv: string[]): Promise<void> {
  const json = argv.includes('--json');
  const cwd = process.cwd();
  const probes: DoctorProbe[] = [];

  // 1. git executable availability
  const gitVersion = await execute('git', ['--version'], { cwd });
  probes.push(probe('gitExecutable', gitVersion.exitCode === 0 ? 'ok' : 'missing'));

  // 2. repository detection (reuse validateGitRepo)
  try {
    await validateGitRepo(cwd);
    probes.push(probe('gitRepo', 'ok'));
  } catch (error) {
    probes.push(probe('gitRepo', 'error', errorMessage(error)));
  }

  // 3. default base detection (reuse detectDefaultBase)
  const base = await detectDefaultBase(false, cwd);
  probes.push(
    base === null
      ? probe('defaultBase', 'missing')
      : probe('defaultBase', 'ok', base)
  );

  // 4. provider availability: changed-file extensions map to a registered provider
  if (base !== null) {
    try {
      const { intervals } = await getChangedIntervals(base, cwd);
      const exts = [...intervals.keys()].map((f) => path.extname(f));
      const unsupported = exts.filter((e) => !SUPPORTED_EXTENSIONS.has(e));
      if (exts.length === 0) {
        probes.push(probe('providerAvailability', 'no-changed-files'));
      } else if (unsupported.length === 0) {
        probes.push(probe('providerAvailability', 'ok', [...new Set(exts)].join(',')));
      } else {
        probes.push(probe('providerAvailability', 'partial', `unsupported: ${[...new Set(unsupported)].join(',')}`));
      }
    } catch (error) {
      probes.push(probe('providerAvailability', 'error', errorMessage(error)));
    }
  } else {
    probes.push(probe('providerAvailability', 'skipped', 'no base resolved'));
  }

  // 5. coverage artifact presence (reuse readCoverage — LCOV guards inside)
  const coverage = await readCoverage(cwd);
  probes.push(
    coverage.error
      ? probe('coverageArtifact', 'malformed', coverage.reason ?? '')
      : coverage.available
        ? probe('coverageArtifact', 'present')
        : probe('coverageArtifact', 'missing')
  );

  if (json) {
    console.log(JSON.stringify({ command: 'doctor', probes }, null, 2));
  } else {
    for (const p of probes) {
      console.log(`${p.name}: ${p.status}${p.detail !== undefined ? ` (${p.detail})` : ''}`);
    }
  }
}

/**
 * Reads the value of a space-separated CLI flag, if present.
 * ponytail: shared by explain; check uses parseCliArgs (full validation).
 */
function flagValue(argv: string[], name: string): string | undefined {
  const index = argv.indexOf(name);
  if (index === -1) return undefined;
  const value = argv[index + 1];
  return value === undefined || value.startsWith('-') ? undefined : value;
}

/**
 * `explain` subcommand: prints provider/input/threshold/fallback derivation for
 * a real run. Reuses the analysis engine (buildEvidenceOutput) — no duplicated
 * derivation logic. Optional ruleId positional filters rule results.
 */
async function runExplain(argv: string[]): Promise<void> {
  const json = argv.includes('--json');
  const ruleId = argv.find((a) => !a.startsWith('-'));
  const rawThreshold = flagValue(argv, '--crap-threshold');
  const threshold = rawThreshold !== undefined ? parseFloat(rawThreshold) : 30;
  const baseArg = flagValue(argv, '--base');
  const coverageFile = flagValue(argv, '--coverage-file');

  const base = baseArg ?? (await detectDefaultBase(false));
  if (base === null) {
    throw new Error('Cannot auto-detect base branch. Provide --base <ref> explicitly.');
  }
  await validateGitRepo();
  const resolvedBase = await resolveBaseRef(base);
  const { intervals } = await getChangedIntervals(resolvedBase);
  const output = await buildEvidenceOutput(resolvedBase, intervals, process.cwd(), threshold, coverageFile);

  const complexity =
    output.diagnostics?.quality?.complexity ??
    (output.capabilities?.complexity === 'failed' ? 'UNAVAILABLE' : 'NATIVE');
  const coverageQuality =
    output.diagnostics?.quality?.coverage ??
    (output.capabilities?.coverageArtifact === 'available' ? 'DIRECT' : 'UNAVAILABLE');
  const fallback =
    output.analysisStatus === 'UNSUPPORTED'
      ? 'analysis skipped — unsupported source'
      : coverageQuality === 'DIRECT'
        ? 'none — coverage direct evidence used'
        : 'coverage direct evidence absent — score null (INV-01: null, not 0%)';

  const ruleResults =
    ruleId === undefined
      ? output.ruleResults
      : output.ruleResults.filter((r: { ruleId: string }) => r.ruleId === ruleId);

  const derivation = {
    command: 'explain',
    ruleId: ruleId ?? 'changed-function-high-crap',
    threshold,
    input: {
      base: resolvedBase,
      changedFiles: intervals.size,
      changedFunctionCount: output.changedFunctions.length,
      coverageFile: coverageFile ?? null,
    },
    provider: { complexity, coverage: coverageQuality },
    fallback,
    ruleResults,
  };

  if (json) {
    console.log(JSON.stringify(derivation, null, 2));
  } else {
    console.log(`explain ${derivation.ruleId}`);
    console.log(`  threshold: ${threshold}`);
    console.log(`  base: ${base} (resolved ${resolvedBase})`);
    console.log(`  input: ${derivation.input.changedFiles} changed file(s), ${derivation.input.changedFunctionCount} changed function(s)`);
    console.log(`  providers: complexity=${complexity} coverage=${coverageQuality}`);
    console.log(`  fallback: ${fallback}`);
    console.log(`  rule results: ${ruleResults.length}`);
  }
}

/**
 * `trace` subcommand: runs the real pipeline end-to-end under an in-memory
 * TraceRun and emits a span sidecar (stage/durationMs/status + correlation ID).
 * Timing lives only here — the deterministic EvidenceOutput
 * (evidence-contract.md:341) carries no timing, so `check --json` is unchanged.
 */
async function runTrace(argv: string[]): Promise<void> {
  const json = argv.includes('--json');
  const rawThreshold = flagValue(argv, '--crap-threshold');
  const threshold = rawThreshold !== undefined ? parseFloat(rawThreshold) : 30;
  const baseArg = flagValue(argv, '--base');
  const coverageFile = flagValue(argv, '--coverage-file');

  const base = baseArg ?? (await detectDefaultBase(false));
  if (base === null) {
    throw new Error('Cannot auto-detect base branch. Provide --base <ref> explicitly.');
  }

  const trace = new TraceRun();
  const { resolvedBase, intervals } = await traceGitStage(base, trace);
  await buildEvidenceOutput(resolvedBase, intervals, process.cwd(), threshold, coverageFile, trace);

  const status = { command: 'trace', correlationId: trace.correlationId, spans: trace.spans, warnings: trace.warnings };
  if (json) {
    console.log(JSON.stringify(status, null, 2));
  } else {
    console.log(`trace: ${trace.correlationId} — ${trace.spans.length} span(s)`);
    for (const warning of trace.warnings) {
      console.log(`warning: [${warning.source}] ${warning.message}`);
    }
  }
}

/**
 * Times the git pipeline stage (validate → resolve base → changed intervals)
 * into the trace run. Same call sequence as runCheck: no duplicated logic.
 */
async function traceGitStage(
  base: string,
  trace: TraceRun
): Promise<{ resolvedBase: string; intervals: Map<string, Array<{ start: number; end: number }>> }> {
  const gitStart = Date.now();
  try {
    await validateGitRepo();
    const resolvedBase = await resolveBaseRef(base, undefined, trace);
    const { intervals } = await getChangedIntervals(resolvedBase, undefined, trace);
    trace.recordStage('git', Date.now() - gitStart, 'ok');
    return { resolvedBase, intervals };
  } catch (error) {
    trace.recordStage('git', Date.now() - gitStart, 'error');
    throw error;
  }
}

/**
 * `delta` subcommand: compares two EvidenceOutput runs (file-pair mode) via
 * compareFromFiles. Emits the DeltaOutput sidecar only — never
 * EvidenceOutput-shaped data; gate semantics frozen (Q6, mem:44649).
 */
async function runDelta(argv: string[]): Promise<void> {
  let json = false;
  let baseline: string | undefined;
  let current: string | undefined;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    if (arg === '--json') {
      json = true;
    }
    else if (arg === '--baseline' || arg === '--current') {
      const value = argv[i + 1];
      if (value === undefined || value.startsWith('-')) {
        throw new Error(`${arg} requires a value`);
      }
      i++;
      if (arg === '--baseline') baseline = value;
      else current = value;
    }
    else {
      throw new Error(`Unknown option ${arg}`);
    }
  }
  if (baseline === undefined) {
    throw new Error('--baseline <path> is required');
  }
  if (current === undefined) {
    throw new Error('--current <path> is required');
  }
  const delta = await compareFromFiles(baseline, current);
  if (json) {
    console.log(JSON.stringify(delta, null, 2));
  }
  else {
    const s = delta.summary;
    console.log(`delta: added ${s.added}, removed ${s.removed}, changed ${s.changed}, unchanged ${s.unchanged}`);
    console.log(`gate: ${s.gateTransition ?? 'unchanged'}`);
  }
}

/**
 * Main CLI function: subcommand dispatcher. First argument selects the
 * subcommand; a non-subcommand first argument (e.g. legacy `--base HEAD check`)
 * defaults to `check`, preserving pre-dispatcher behavior.
 */
export async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const first = args[0];
  const subcommand: Subcommand =
    first !== undefined && (SUBCOMMANDS as readonly string[]).includes(first)
      ? (first as Subcommand)
      : 'check';
  try {
    switch (subcommand) {
      case 'check': await runCheck(args); break;
      case 'doctor': await runDoctor(args.slice(1)); break;
      case 'explain': await runExplain(args.slice(1)); break;
      case 'trace': await runTrace(args.slice(1)); break;
      case 'delta': await runDelta(args.slice(1)); break;
    }
  } catch (error) {
    // Handle command errors (invalid base, not a repo, etc.)
    console.error(`Error: ${errorMessage(error)}`);
    process.exit(1);
  }
}
if (process.argv[1] && !process.argv[1].includes('vitest')) {
  main();
}