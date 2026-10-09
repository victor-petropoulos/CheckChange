/**
 * C# `MethodDescriptor` provider — BOTH modes, ONE shape.
 *
 * Dispatches on a single `dotnet --version` probe: SDK present → rich path
 * (Roslyn vehicle), SDK absent → the pure-TS fallback parser
 * (./csharpFallbackParser.ts). Both modes return the SAME `MethodDescriptor`
 * type — it is re-exported from the fallback parser rather than redeclared, so
 * "identical shape" (plan Task 3 acceptance item 7) is guaranteed by the module
 * graph, not merely asserted by a test.
 *
 * WHY THE PROBE LIVES HERE AND NOT IN csharpComplexityProvider.ts: the plan's
 * Task 3 seam REJECTED putting the probe inside collectComplexity, because the
 * probe result is needed by BOTH this descriptor provider and the diagnostic
 * surface. Placing it in the leaf that consumes it keeps the dependency
 * one-directional — csharpComplexityProvider → this module — with no cycle.
 *
 * SECURITY POSTURE: every spawn is argv-only. There is no `sh -c`, no shell
 * string, no interpolation of caller data into a command line. Mirrors
 * commandProbeAvailable() at src/providers/runner-detection.ts:95-108.
 *
 * RICH PATH IS NOT A HARD REQUIREMENT. The vehicle is resolved at runtime and
 * its availability is NOT assumed: it is still probed per file, and any failure
 * — absent binary, no coverage artifact, unparseable payload, no span join —
 * degrades to the fallback parser with a `csharp-analysis-failed` diagnostic.
 * That is a documented, accepted outcome, not a silent one: the run still
 * returns real CC values, and the degradation is reported through `diagnostic`
 * and through `csharpComplexityProvider.describe()`. Cycle 1 REJECTED the
 * vehicle on this machine only because the spawn form was dotnet-as-mux, which
 * is measured to never work; the form and payload are now validated against a
 * real Crap4DotNet 0.1.1 run (see RICH_VEHICLE below and
 * .opencode/validation/csharp-rich-vehicle-decision.md).
 */
import { spawnSync } from 'node:child_process';
import { existsSync, realpathSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { parseCsharpFileMethods } from './csharpFallbackParser.js';
import { scanCoberturaUnderTestResults } from '../coverage.js';
import type { MeasurementProvenance } from '../complexity.ts';

// ONE definition, TWO modes. Do NOT redeclare this interface in this file.
export type { MethodDescriptor } from './csharpFallbackParser.js';
import type { MethodDescriptor } from './csharpFallbackParser.js';

// SD-4 / GAP 10: ONE knob for every provider subprocess. Reusing the existing
// env var (providers/genericCommand.ts:56) rather than adding a
// CHECKCHANGE_CSHARP_* twin — a second var for the same knob is duplication.
const PROBE_VERSION_TIMEOUT_MS = Number(process.env.CHECKCHANGE_PROVIDER_TIMEOUT_MS) || 10_000;

// Roslyn vehicle. NOT A DEPENDENCY and NOT A HARD REQUIREMENT: it is resolved at
// runtime and any failure degrades to the fallback parser with a diagnostic.
//
// SD-4: the command is `dotnet-crap` but the NuGet PACKAGE id is `Crap4DotNet`
// 0.1.1 — `dotnet tool install` takes the package id. Cycle 1 conflated the two,
// so the fix text told a human to install a package that does not exist. The
// version pin is `--version 0.1.1`: the `@0.1.1` shorthand is measured to fail
// with "not found in NuGet feeds" on this SDK.
//
// MEASURED, not assumed (.opencode/validation/csharp-rich-vehicle-decision.md, a
// real installed Crap4DotNet 0.1.1). Five facts this adapter is built on:
//
//  1. SPAWN FORM: the direct executable with the `analyze` subcommand is the ONLY
//     form that works. `dotnet dotnet-crap …` exits 1 ("dotnet-dotnet-crap does
//     not exist") and `dotnet crap4dotnet …` exits 1. The old argv here was
//     dotnet-as-mux — a form measured NEVER to work.
//  2. BINARY RESOLUTION (C-1): `dotnet tool install -g` puts the shim in
//     `~/.dotnet/tools`, which is NOT on PATH here (the shell PATH holds a
//     literal, unexpanded `~` entry), so a bare-name spawn ENOENTs on a machine
//     where the tool is installed and working. Resolve the shim by absolute
//     path, fall back to the bare name for a PATH-installed copy. No shell
//     profile is touched.
//  3. COVERAGE IS MANDATORY (C-2): without `--coverage` (or `--run-tests`) the
//     tool exits 2 with `{error:{code:"COVERAGE_FILE_NOT_FOUND"}}` and emits no
//     methods at all, so the rich path can never fire. The artifact is located
//     with the SAME Coverlet locator coverage.ts already owns rather than a
//     second, differently-behaving scan.
//  4. PAYLOAD IS AN OBJECT (C-5): the real JSON is
//     `{schemaVersion,project,timestamp,threshold,stats,methods,histogram,hierarchy,
//     warnings}` — the descriptors live at `payload.methods`. The old
//     `Array.isArray(payload)` guard therefore rejected EVERY valid payload.
//  5. EXIT 0 IS NOT SUCCESS (C-7): an unrecognised flag or a missing subcommand
//     exits 0 printing help text. Success is decided by the payload SHAPE, never
//     by the exit status.
//
// C-4: `filePath` is ABSOLUTE for a single-file target and ROOT-RELATIVE
// (`./Calculator.cs`) for a directory target, so it is resolved against the
// analysed file's directory before the join — otherwise a directory-target run
// silently misses every method.
const RICH_VEHICLE = 'dotnet-crap';
const RICH_VEHICLE_PACKAGE = 'Crap4DotNet';

// spawnSync's overload widens stdout/stderr to `string | Buffer` even under
// encoding:'utf8'. This adapter only ever reads text.
function text(value: unknown): string {
  return typeof value === 'string' ? value : value == null ? '' : String(value);
}

// spawnSync reports a missing binary on `result.error` (ENOENT); it does NOT
// throw for that. It can only throw on an invalid argument list, which cannot
// happen here — every argv is a non-empty literal plus a file path. So neither
// call site needs a try/catch, and neither can throw at all.
function errorCode(value: unknown): string {
  const e = value as { code?: string; message?: string } | undefined;
  return e?.code ?? e?.message ?? 'unknown error';
}

// The vehicle's own method record, MEASURED verbatim (decision record §4):
// `{namespace,className,methodName,signature,fullName,filePath,lineNumber,crap,
// complexity,coverage,crapLoad,isCrappy,severity}` — note NO span fields, which is
// why spans come from the fallback parser (C-6).
interface VehicleMethod {
  methodName: string;
  className: string;
  fullName: string;
  filePath: string;
  lineNumber: number;
  complexity: number;
}

// ponytail: structural check of exactly the fields the adapter READS, not a full
// deserialiser. `crap`/`coverage`/`crapLoad`/`severity` are intentionally unread —
// their numeric semantics are UNVERIFIED (decision record §6), so no arithmetic
// depends on them.
function isVehicleMethod(value: unknown): value is VehicleMethod {
  if (!value || typeof value !== 'object') return false;
  const m = value as Partial<VehicleMethod>;
  return (
    typeof m.methodName === 'string' &&
    typeof m.className === 'string' &&
    typeof m.fullName === 'string' &&
    typeof m.filePath === 'string' &&
    typeof m.lineNumber === 'number' &&
    typeof m.complexity === 'number'
  );
}

/**
 * The vehicle shim, by absolute path when `dotnet tool install -g` put it where
 * this repo knows it lands (C-1), else the bare name for a PATH-installed copy.
 * Never modifies PATH or any shell profile.
 */
export function vehicleCommand(): string {
  const shim = join(homedir(), '.dotnet', 'tools', RICH_VEHICLE);
  return existsSync(shim) ? shim : RICH_VEHICLE;
}

/**
 * Locate the Cobertura artifact the vehicle needs (C-2). Reuses
 * coverage.ts's `scanCoberturaUnderTestResults` — the same locator the coverage
 * stage uses — plus the two conventional in-tree names, so a repo that commits
 * its artifact is not forced to mint a `TestResults/<GUID>/` tree. Returns null
 * when there is none, which the caller turns into a `csharp-analysis-failed`
 * diagnostic naming the reason (never a silent empty result).
 */
function findCobertura(root: string): string | null {
  for (const name of ['coverage.cobertura.xml', 'coverage.xml']) {
    const candidate = join(root, name);
    if (existsSync(candidate)) return candidate;
  }
  return scanCoberturaUnderTestResults(root);
}

/**
 * Canonical form of a path for the join comparison. `resolve()` normalises
 * `..` and relative segments but does NOT resolve symlinks, and the two sides
 * of the join come from different producers: the caller passes the path it was
 * given, the vehicle echoes the realpath it walked. On macOS
 * `/tmp/x/Calculator.cs` and `/private/tmp/x/Calculator.cs` are the same file,
 * so the raw compare never matches and every method drops — measured, not
 * hypothetical. Best-effort by design: a path that no longer exists (raced
 * delete) falls back to its resolved form rather than throwing, so a missing
 * file still fails the compare instead of crashing the run.
 */
function canonical(p: string): string {
  const resolved = resolve(p);
  try {
    return realpathSync(resolved);
  } catch {
    return resolved;
  }
}

export interface CSharpDiagnostic {
  /** Stable machine-readable reason. Never a bare failure. */
  code: 'csharp-sdk-missing' | 'csharp-analysis-failed';
  /** What is degraded, in plain words. */
  message: string;
  /** A concrete action a human can take. `csharp-sdk-missing` always names `dotnet`. */
  fix: string;
  /** The exact probe command and its observed result. */
  detail: string;
}

export interface DotnetProbe {
  available: boolean;
  version: string | null;
  diagnostic: CSharpDiagnostic | null;
}

export interface CSharpAnalysis {
  descriptors: MethodDescriptor[];
  mode: 'rich' | 'fallback';
  diagnostic: CSharpDiagnostic | null;
}

// ponytail: cached FOR the process lifetime, deliberately — there is no
// `resetDotnetProbe()`. That matches the one-shot `command --version` probe at
// src/providers/runner-detection.ts:95-108. A CLI check run is short-lived, and
// a long-lived host that must re-detect an SDK installed mid-process would
// export a reset; nothing in this repo does, so exporting one is dead weight.
let cachedProbe: DotnetProbe | null = null;

// The VEHICLE outcome, plumbed rather than re-probed: `degrade()` below records
// every rejection and the rich path clears it. `csharpComplexityProvider`
// destructures only `{ descriptors }` — ProviderFactory (src/evidence.ts:252-255)
// has no diagnostic channel — so without this slot a REJECTED vehicle would leave
// `describe()` claiming a healthy SDK while every file measured with the fallback.
let lastVehicleRejection: CSharpDiagnostic | null = null;

/**
 * The most recent vehicle rejection observed in this process, else null. NEVER a
 * probe result: SDK-missing lives on `probeDotnetSdk().diagnostic`.
 */
export function vehicleRejection(): CSharpDiagnostic | null {
  return lastVehicleRejection;
}

// The fallback parser is checkchange's OWN code (./csharpFallbackParser.ts), so
// its tool is checkchange and its version is the package version — same 0.4.2
// the other self-provenance consts hard-code (src/crapCalc.ts:3, src/rules.ts:4).
const FALLBACK_TOOL = 'checkchange';
const FALLBACK_TOOL_VERSION = '0.4.2';

// The vehicle's INSTALLED version is never probed: the rich path is
// documented-unreachable (see SPAWN FORM above), so `dotnet-crap --version` is
// never spawned to learn it, and no version is fabricated here. `unknown` is the
// honest report and satisfies the non-empty-version invariant every lineage
// provenance must meet (test/lineage.test.ts:43).
const VEHICLE_VERSION = 'unknown';

/**
 * Which tool measured a file, per the mode `analyzeCsharpFile` returned. The
 * two modes are the WHOLE point (GAP 8): a CC value approximated by the fallback
 * parser is not a Roslyn measurement, and reporting the vehicle's name for it
 * would be a false provenance claim.
 *
 * Lives here, next to `RICH_VEHICLE`, so the vehicle id stays this module's
 * secret — the consumer (src/evidence.ts) learns the NAME from a returned value
 * and never from a literal.
 */
export function provenanceForMode(mode: 'rich' | 'fallback'): MeasurementProvenance {
  return mode === 'rich'
    ? { tool: RICH_VEHICLE, version: VEHICLE_VERSION, mode: 'NATIVE' }
    : { tool: FALLBACK_TOOL, version: FALLBACK_TOOL_VERSION, mode: 'FALLBACK' };
}

/**
 * Probe the .NET SDK once, at first use, and memoise. Mirrors the boolean
 * `command --version` probe at src/providers/runner-detection.ts:95-108, but
 * keeps the version string and the failure reason because the C# provider must
 * REPORT degradation rather than just return false.
 *
 * `spawnSync('dotnet', ['--version'])` — argv only, never `sh -c`.
 * Three failure shapes, all degrading (never throwing): spawn error (ENOENT =
 * binary absent), non-zero exit (SDK present but unusable), timeout.
 */
export function probeDotnetSdk(): DotnetProbe {
  if (cachedProbe) return cachedProbe;

  const argv = ['--version'];
  const command = `dotnet ${argv.join(' ')}`;
  const res = spawnSync('dotnet', argv, { encoding: 'utf8', timeout: PROBE_VERSION_TIMEOUT_MS });

  if (res.error) {
    cachedProbe = {
      available: false,
      version: null,
      diagnostic: {
        code: 'csharp-sdk-missing',
        message:
          'The .NET SDK is not usable, so C# complexity is measured with the pure-TypeScript fallback parser: ' +
          'approximated cyclomatic complexity over comment/string-stripped source, not a Roslyn AST. ' +
          'Generic, expression-bodied and local-function members are missed (see csharpFallbackParser.ts).',
        fix: 'Install the .NET SDK so the `dotnet` CLI is on PATH: https://dotnet.microsoft.com/download',
        detail: `${command}: spawn failed (${errorCode(res.error)})`,
      },
    };
    return cachedProbe;
  }

  if (res.status !== 0) {
    const stderr = text(res.stderr).trim().slice(0, 200);
    cachedProbe = {
      available: false,
      version: null,
      diagnostic: {
        code: 'csharp-sdk-missing',
        message:
          '`dotnet --version` exited non-zero, so the .NET SDK cannot be used and C# complexity falls back to ' +
          'the pure-TypeScript approximation rather than a Roslyn AST.',
        fix: 'Repair or reinstall the .NET SDK so `dotnet --version` exits 0: https://dotnet.microsoft.com/download',
        detail: `${command}: exit code ${res.status}${stderr ? `, stderr ${JSON.stringify(stderr)}` : ''}`,
      },
    };
    return cachedProbe;
  }

  cachedProbe = { available: true, version: text(res.stdout).trim(), diagnostic: null };
  return cachedProbe;
}

/**
 * Invoke the rich (Roslyn) vehicle for one file.
 *
 * REJECTED-probe contract (plan Task 3 acceptance item 8): when the vehicle is
 * missing, crashes, emits no coverage, or emits output this adapter cannot read,
 * this DELEGATES to the fallback parser and returns a `csharp-analysis-failed`
 * diagnostic. It never returns an empty descriptor list for that reason (that
 * would be a zero-scored phantom PASS) and never throws.
 *
 * HYBRID JOIN (C-6): the vehicle reports CC per method but carries NO spans, so
 * `startLine`/`endLine`/`bodySpan` are taken from the fallback parser for the
 * SAME file and matched on `functionName` + `lineNumber`. A method with no join
 * partner is DROPPED, never given invented spans — an unattributed descriptor
 * would attach coverage to the wrong lines, which is worse than absence. The
 * vehicle's `complexity` is kept on every joined descriptor: that is the value
 * this path exists to provide.
 */
export async function runRichSdkAnalysis(filePath: string): Promise<CSharpAnalysis> {
  const command = vehicleCommand();
  const root = dirname(resolve(filePath));
  const argv = ['analyze', filePath];
  const shown = `${command} ${argv.join(' ')}`;
  const degrade = async (detail: string): Promise<CSharpAnalysis> => {
    const diagnostic: CSharpDiagnostic = {
      code: 'csharp-analysis-failed',
      message:
        'The .NET SDK is present but the Roslyn complexity vehicle could not be used, so this file was measured ' +
        'with the pure-TypeScript fallback parser instead. CC values are real but approximate.',
      fix:
        `Install the package — \`dotnet tool install -g ${RICH_VEHICLE_PACKAGE}\` (that is the NuGet package id; the ` +
        `command it installs is \`${RICH_VEHICLE}\`, which normally lands in ~/.dotnet/tools and may NOT be on PATH). ` +
        `It is invoked as \`${RICH_VEHICLE} analyze <file> --coverage <cobertura.xml>\` and REQUIRES a Cobertura ` +
        'artifact: without one it exits 2 with COVERAGE_FILE_NOT_FOUND and reports no methods. If it still fails, ' +
        'the documented pure-TypeScript approximation is the expected outcome, not a regression.',
      detail,
    };
    lastVehicleRejection = diagnostic;
    return { descriptors: await parseCsharpFileMethods(filePath), diagnostic, mode: 'fallback' };
  };

  // C-2: coverage is mandatory. The vehicle exits 2 with no methods at all
  // without it, so check FIRST and name the missing artifact in the diagnostic
  // rather than surfacing the tool's generic exit code.
  const coverage = findCobertura(root);
  if (coverage === null) {
    return degrade(`${shown}: no Cobertura coverage artifact found under ${root} — the vehicle requires one ` +
      '(looked for coverage.cobertura.xml, coverage.xml, and TestResults/<run>/coverage.cobertura.xml)');
  }

  const res = spawnSync(command, [...argv, '--coverage', coverage], {
    encoding: 'utf8',
    timeout: PROBE_VERSION_TIMEOUT_MS,
  });
  if (res.error) return degrade(`${shown} --coverage ${coverage}: spawn failed (${errorCode(res.error)})`);

  // C-7: the exit status is NOT the success signal — a bad flag or a missing
  // subcommand exits 0 with help text on stdout. Parse first, judge by shape.
  let payload: unknown;
  try {
    payload = JSON.parse(text(res.stdout));
  } catch {
    return degrade(`${shown} --coverage ${coverage}: exit code ${res.status} but stdout is not JSON — output unparseable`);
  }
  // C-5: the real payload is an OBJECT with descriptors at `methods`, not an
  // array. Both the error object and the valid document are objects, so the
  // `methods` array is the discriminator.
  const methods = (payload as { methods?: unknown } | null)?.methods;
  if (!Array.isArray(methods)) {
    const code = (payload as { error?: { code?: string } } | null)?.error?.code;
    return degrade(`${shown} --coverage ${coverage}: exit code ${res.status} but stdout carries no ` +
      `\`methods\` array${code ? ` — the vehicle reported ${code}` : ''}`);
  }
  // Elements are validated too, not just the array: a `[null]` entry would
  // otherwise be cast, then throw inside the join — a silently SKIPPED file,
  // the exact silent-empty outcome this diagnostic exists to prevent.
  if (!methods.every(isVehicleMethod)) {
    return degrade(`${shown} --coverage ${coverage}: exit code ${res.status} but the methods array holds malformed records`);
  }

  // ponytail: ONE fallback parse for the whole file, indexed for the join. Spans
  // are the fallback parser's real output, not derived from `lineNumber`.
  const spans = new Map<string, MethodDescriptor>();
  for (const d of await parseCsharpFileMethods(filePath)) spans.set(`${d.functionName}:${d.startLine}`, d);

  const descriptors: MethodDescriptor[] = [];
  let unmatched = 0;
  for (const m of methods as VehicleMethod[]) {
    // C-4: the payload's filePath is absolute for a single-file target and
    // root-relative for a directory target; resolve both against the analysed
    // file so a directory-target run still joins. `canonical` also collapses
    // symlinks, so a caller-supplied /tmp/... joins a vehicle-reported
    // /private/tmp/... instead of dropping every method.
    if (canonical(resolve(root, m.filePath)) !== canonical(filePath)) {
      unmatched++;
      continue;
    }
    const span = spans.get(`${m.methodName}:${m.lineNumber}`);
    if (span === undefined) {
      unmatched++;
      continue;
    }
    descriptors.push({
      ...span,
      // The vehicle's `fullName` carries the signature (`Ns.Type.Name(int)`),
      // which is not the descriptor `displayName` convention
      // (`Container.Name`) that attribution keys on at src/attribution.ts:155.
      // Keep the fallback's displayName and take only the vehicle's CC.
      complexity: m.complexity,
    });
  }

  if (descriptors.length === 0) {
    return degrade(`${shown} --coverage ${coverage}: exit code ${res.status} and ${methods.length} method(s) reported, ` +
      'but none joined to a fallback span (file+line+name) — no descriptor was invented from `lineNumber` alone');
  }
  if (unmatched > 0) {
    // Not a degradation: the joined methods are real measurements. The count is
    // carried in the diagnostic so a shrinking join is visible, never silent.
    lastVehicleRejection = {
      code: 'csharp-analysis-failed',
      message:
        `The Roslyn vehicle reported ${methods.length} method(s) but only ${descriptors.length} joined to a ` +
        'fallback line span; the rest were dropped rather than given invented spans, so this file is measured ' +
        'partially. Spans come from the pure-TypeScript fallback parser; CC comes from the vehicle.',
      fix:
        'Check that the vehicle and this adapter agree on declaration lines. The join is `functionName` + ' +
        '`lineNumber` against the fallback parser; a Roslyn-only construct (expression-bodied, generic, or a ' +
        'local function) has no fallback partner and is dropped by design.',
      detail: `${shown} --coverage ${coverage}: ${unmatched} of ${methods.length} method(s) unmatched`,
    };
  } else {
    lastVehicleRejection = null;
  }
  return { descriptors, mode: 'rich', diagnostic: lastVehicleRejection };
}

/**
 * Both modes, one entry point. SDK present → rich path; SDK absent → fallback
 * plus a `csharp-sdk-missing` diagnostic that is returned, never swallowed.
 */
export async function analyzeCsharpFile(filePath: string): Promise<CSharpAnalysis> {
  const probe = probeDotnetSdk();
  if (!probe.available) {
    return { descriptors: await parseCsharpFileMethods(filePath), mode: 'fallback', diagnostic: probe.diagnostic };
  }
  return runRichSdkAnalysis(filePath);
}

/**
 * The `MethodDescriptor[]` surface attribution consumes, in BOTH modes. Same
 * type, same fields, same order — only `complexity` richness may differ.
 */
export async function parseCsharpDescriptors(filePath: string): Promise<MethodDescriptor[]> {
  return (await analyzeCsharpFile(filePath)).descriptors;
}