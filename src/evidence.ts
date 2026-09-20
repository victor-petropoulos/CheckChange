import { evaluateHighCrap, type RuleResult } from './rules.js';
import { collectComplexity } from './complexity.js';
import { readCoverage, type CoverageResult } from './coverage.js';
import { attachCoverage, type AttributedComplexity } from './attribution.js';
import { calculateCrap } from './crapCalc.js';
import { pythonASTComplexityProvider } from './complexity-providers/pythonASTComplexityProvider.js';
import { gitProvenance } from './git.js';
import { complexityProvenance, type ComplexityInfo } from './complexity.js';
import { coverageProvenance } from './coverage.js';
import { attributionProvenance } from './attribution.js';
import { crapCalcProvenance } from './crapCalc.js';
import { rulesProvenance } from './rules.js';
import { type TraceRun } from './execute.js';
import { type MethodEvidence } from './crap.js';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import * as fs from 'fs';
import * as path from 'path';
import { loadProviderConfig, deriveRegistry, builtinConfig, type ResolvedProvider, type ProviderConfig, createGenericCommandProvider } from './providers/index.js';

// ---- Local type definitions (kept in evidence.ts to avoid cross-file type coupling) ----

/** Capabilities passed to buildOutput / buildEvidenceOutput. */
export interface Capabilities {
  git: string;
  crapTypescript?: string;
  complexity?: string;
  coverageArtifact?: string;
  [key: string]: string | undefined;
}

/** Source provenance for a method evidence entry. */
export interface Source {
  tool: string;
  version: string;
}

/** MethodEvidence extended with source (source is untyped in crap.ts). */
export interface MethodEvidenceWithSource extends MethodEvidence {
  source?: Source;
}

// ---- Diagnostics lineage (Experiment A task 3: optional diagnostics.lineage[]) ----
export type LineageStage =
  | 'git' | 'complexity' | 'coverage' | 'attribution' | 'crapCalc' | 'rules' | 'evidence';

export interface DiagnosticLineageEntry {
  stage: LineageStage;
  tool: string;
  version: string;
  inputs: Record<string, unknown>;
}

// Self provenance; version mirrors package.json (existing codebase style hard-codes '0.5.0').
export const evidenceProvenance = { tool: 'checkchange', version: '0.4.0' } as const;

function sha256Hex(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

// Engine identity for the evidence lineage stage: HEAD commit of the repo this
// code runs FROM (walk up from this module to its own .git — NOT cwd, which is
// the analyzed target repo). Deterministic; never throws.
function engineIdentity(): string {
  const fallback = (): string => {
    try {
      // moduleDir is src/ or dist/; own package.json sits one level up
      const moduleDir = path.dirname(fileURLToPath(import.meta.url));
      const pkg = JSON.parse(fs.readFileSync(path.join(moduleDir, '..', 'package.json'), 'utf8'));
      return `${pkg.version}/${process.version}`;
    } catch {
      return `${evidenceProvenance.version}/${process.version}`;
    }
  };
  try {
    let dir = path.dirname(fileURLToPath(import.meta.url));
    for (;;) {
      if (fs.existsSync(path.join(dir, '.git'))) {
        const sha = execFileSync('git', ['rev-parse', 'HEAD'], {
          cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore']
        }).trim();
        return sha || fallback();
      }
      const parent = path.dirname(dir);
      if (parent === dir) return fallback();
      dir = parent;
    }
  } catch {
    return fallback();
  }
}

// ---- EvidenceOutput: explicit return type for buildEvidenceOutput ----
// ponytail: concrete interface prevents TS from widening the inferred return
// union when early-return helpers use Record<string, unknown>.

export interface EvidenceOutput {
  schemaVersion: string;
  analysis: { base: string; target: string };
  capabilities: { git: string; complexity: string; coverageArtifact: string };
  changedFunctions: ChangedFunction[];
  policy: { crapThreshold: number };
  ruleResults: RuleResult[];
  analysisStatus: string;
  gate: string | null;
  completeness: string;
  coverageErrorReason?: string;
  diagnostics?: {
    lineage: DiagnosticLineageEntry[];
    quality: DiagnosticQuality;
    fingerprints?: Record<string, string> | undefined;
  };
}

// ---- Diagnostics quality (Experiment A task 4: optional diagnostics.quality) ----
export type QualityStage = 'git' | 'complexity' | 'coverage' | 'attribution' | 'rules';

export interface UncoveredFunction {
  file: string;
  method: string;
  lineStart: number;
  lineEnd: number;
}

export interface DiagnosticQuality {
  // Canonical quality vocabulary (ADR-0001 terminology-reconciliation.md):
  // coverage DIRECT = measured from coverage artifact; UNAVAILABLE otherwise.
  coverage: 'DIRECT' | 'UNAVAILABLE';
  // complexity NATIVE = native analyzer; UNAVAILABLE if the provider failed.
  complexity: 'NATIVE' | 'UNAVAILABLE';
  /**
   * Deterministic evidence score 0-100, closed-form arithmetic over evidence
   * values only (no model judgment). Formula:
   *   completeness   = Σ weights of completed stages
   *                    (git 10 | complexity 20 | coverage 40 | attribution 20 | rules 10; total 100)
   *   coverageRatio  = (# changed functions with coverage > 0) / (# changed functions); 1 when none
   *   score          = round(0.7 * completeness + 0.3 * 100 * coverageRatio)
   *   score is null when coverage-backed analysis did not reach rule evaluation
   *   (no usable coverage evidence AT ALL). INV-01 ZERO≠NULL: a measured 0% is
   *   a number (lowers score), never null — null only when nothing was measured.
   */
  score: number | null;
  // Per-stage completeness: whether the stage produced usable evidence this run.
  stageComplete: Record<QualityStage, boolean>;
  // Changed functions with measured coverage === 0. Present when coverage evidence usable.
  uncoveredFunctions?: UncoveredFunction[];
}

/**
 * Builds diagnostics.quality from the per-run evidence state. Deterministic:
 * every input is a values of the current run (capabilities, coverage usability,
 * analyzed functions) — no timing, paths, or model judgment.
 */
function buildQuality(params: {
  complexityCapability: string;
  coverageUsable: boolean;
  attributionComplete?: boolean;
  rulesComplete?: boolean;
  changedFunctions?: ChangedFunction[];
}): DiagnosticQuality {
  const stageComplete: Record<QualityStage, boolean> = {
    git: true, // base resolved + intervals present; git failure handled upstream in cli.ts
    complexity: params.complexityCapability !== 'failed',
    coverage: params.coverageUsable,
    attribution: params.attributionComplete === true,
    rules: params.rulesComplete === true,
  };
  const weights: Record<QualityStage, number> = { git: 10, complexity: 20, coverage: 40, attribution: 20, rules: 10 };
  const completeness = (Object.keys(stageComplete) as QualityStage[])
    .reduce((sum, s) => sum + (stageComplete[s] ? weights[s] : 0), 0);
  const fns = params.changedFunctions ?? [];
  const covered = fns.filter((f) => f.coverage !== null && f.coverage > 0).length;
  const coverageRatio = fns.length === 0 ? 1 : covered / fns.length;
  const score =
    stageComplete.coverage && stageComplete.attribution && stageComplete.rules
      ? Math.round(0.7 * completeness + 0.3 * 100 * coverageRatio)
      : null;
  const quality: DiagnosticQuality = {
    coverage: params.coverageUsable ? 'DIRECT' : 'UNAVAILABLE',
    complexity: stageComplete.complexity ? 'NATIVE' : 'UNAVAILABLE',
    score,
    stageComplete,
  };
  if (params.coverageUsable) {
    quality.uncoveredFunctions = fns
      .filter((f) => f.coverage === 0)
      .map((f) => ({ file: f.file, method: f.method, lineStart: f.lineStart, lineEnd: f.lineEnd }));
  }
  return quality;
}

// ---- Diagnostics fingerprints (Experiment A task 5: optional diagnostics.fingerprints{}) ----

/**
 * Deterministic function fingerprint: SHA-256 hex digest (64 lowercase chars)
 * over the normalized function identity (relative file path + method +
 * lineStart + lineEnd + cc). Inputs are analyzed run values only — no timing,
 * no PIDs, no absolute paths — so identical runs produce identical hashes
 * (evidence-contract.md:341). Normalization: repo-relative path with forward
 * slashes (`\` → `/`), CRLF → LF line endings. Algorithm documented in
 * docs/decisions/diagnostics-schema-design.md.
 */
function fingerprintFor(f: ChangedFunction): string {
  const file = f.file.split('\\').join('/');
  const input = [file, f.method, f.lineStart, f.lineEnd, f.cc].join('\n').replace(/\r\n/g, '\n');
  return sha256Hex(input);
}

/**
 * Builds diagnostics.fingerprints, keyed by `file:method:lineStart` per
 * diagnostics-schema-design.md. Covers changed functions only.
 */
function buildFingerprints(changedFunctions: ChangedFunction[]): Record<string, string> {
  const fingerprints: Record<string, string> = {};
  for (const f of changedFunctions) {
    fingerprints[`${f.file}:${f.method}:${f.lineStart}`] = fingerprintFor(f);
  }
  return fingerprints;
}

/**
 * Attaches optional diagnostics.{lineage,quality,fingerprints} to the output. When no
 * lineage was collected, returns the output unchanged (byte-identical legacy
 * behavior). fingerprints emitted only when non-empty. All values deterministic
 * per evidence-contract.md:341.
 */
function withDiagnostics<T extends Record<string, unknown>>(
  output: T,
  lineage: DiagnosticLineageEntry[],
  quality: DiagnosticQuality,
  fingerprints?: Record<string, string>
): T & { diagnostics?: { lineage: DiagnosticLineageEntry[]; quality: DiagnosticQuality; fingerprints?: Record<string, string> | undefined } } {
  const fpEntries = fingerprints ? Object.keys(fingerprints).length : 0;
  if (lineage.length === 0) return output;
  return {
    ...output,
    diagnostics: { lineage, quality, ...(fpEntries > 0 ? { fingerprints } : {}) },
  };
}

export interface ProviderFactory {
  collectComplexity: (cwd:string, trace?:any)=>Promise<any[]>;
  readCoverage: (cwd:string, file?:string, trace?:any, autoGenerated?:boolean)=>Promise<any>
}
const providers = new Map<string, ProviderFactory>()
export function registerProvider(ext:string, factory:ProviderFactory){providers.set(ext,factory)}
export function getProvider(ext: string): ProviderFactory | undefined { return providers.get(ext); }

// ---- Config-driven provider registry ----
let _providerConfig: ProviderConfig | null = null;
let _providerRegistry: Map<string, ResolvedProvider> | null = null;
let _extensionPriority: string[] = [];
let _supportedExtensions: Set<string> | null = null;

  // ponytail: derived from builtinConfig() so defaults stay in sync with config
  const _builtinDefaults = builtinConfig();
  const DEFAULT_EXTENSION_PRIORITY: string[] = (() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const entry of [..._builtinDefaults.providers].reverse()) {
      for (const ext of entry.extensions) {
        if (!seen.has(ext)) { seen.add(ext); out.push(ext); }
      }
    }
    return out;
  })();
  const DEFAULT_SUPPORTED_EXTENSIONS = new Set(_builtinDefaults.providers.flatMap((p) => p.extensions));
  const DEFAULT_LANGUAGE_MAP: Record<string, string> = (() => {
    const map: Record<string, string> = {};
    for (const entry of _builtinDefaults.providers) {
      for (const ext of entry.extensions) {
        if (!map[ext]) map[ext] = entry.language;
      }
    }
    return map;
  })();

/** Load provider config and populate providers Map. Call once at startup. */
export function initProviderConfig(explicitPath?: string): { config: ProviderConfig; registry: Map<string, ResolvedProvider>; source: 'explicit' | 'repo-root' | 'builtin' } {
  const cwd = process.cwd();
  const { config, source } = loadProviderConfig(cwd, explicitPath);
  const registry = deriveRegistry(config, source);
  _providerConfig = config;
  _providerRegistry = registry;
  // Derive extension priority from registry: reverse provider order so later providers
  // (e.g. python) get higher priority than earlier ones (e.g. javascript).
  // DEFAULT_EXTENSION_PRIORITY: .py > .ts > .tsx > .js > .jsx > .mjs > .cjs > .ts
  const seen = new Set<string>();
  _extensionPriority = [];
  for (const entry of [...config.providers].reverse()) {
    for (const ext of entry.extensions) {
      if (!seen.has(ext)) {
        seen.add(ext);
        _extensionPriority.push(ext);
      }
    }
  }
  // Populate providers Map from registry
  providers.clear();
  for (const [ext, resolved] of registry) {
    const generic = createGenericCommandProvider(resolved, cwd);
    if (generic) {
      registerProvider(ext, {
        collectComplexity: (cwd: string) => generic.collectComplexity(cwd),
        readCoverage: (...args: Parameters<typeof readCoverage>) => readCoverage(...args),
      });
    } else if (resolved.language === 'typescript') {
      // Builtin TS provider: delegation preserves vi.spyOn mocks
      registerProvider(ext, {
        collectComplexity: (...args: Parameters<typeof collectComplexity>) => collectComplexity(...args),
        readCoverage: (...args: Parameters<typeof readCoverage>) => readCoverage(...args),
      });
    } else if (resolved.language === 'python') {
      registerProvider(ext, {
        collectComplexity: (...args: Parameters<typeof pythonASTComplexityProvider.collectComplexity>) =>
          pythonASTComplexityProvider.collectComplexity(...args),
        readCoverage: (...args: Parameters<typeof readCoverage>) => readCoverage(...args),
      });
    }
  }
  _supportedExtensions = new Set(registry.keys());
  rebuildLanguageMap();
  return { config, registry, source };
}

/** Extension priority list (derived from config). Lazily falls back to hardcoded defaults. */
export function extensionPriority(): readonly string[] {
  if (_extensionPriority.length > 0) return _extensionPriority;
  // ponytail: lazy init with hardcoded priority when initProviderConfig() not called
  _extensionPriority = [...DEFAULT_EXTENSION_PRIORITY];
  return _extensionPriority;
}

/** Supported extensions set (derived from config). Lazily falls back to hardcoded defaults. */
export function supportedExtensions(): Set<string> {
  if (_supportedExtensions) return _supportedExtensions;
  // ponytail: lazy init with hardcoded set when initProviderConfig() not called
  _supportedExtensions = new Set(DEFAULT_SUPPORTED_EXTENSIONS);
  return _supportedExtensions;
}

/** Loaded provider config (or null if not initialized). */
export function providerConfig(): ProviderConfig | null { return _providerConfig; }

/** Loaded provider registry (or null if not initialized). */
export function providerRegistry(): Map<string, ResolvedProvider> | null { return _providerRegistry; }

/** Get the language for a file from the loaded registry. Falls back to hardcoded defaults. */
export function getLanguageForFile(filePath: string): string | undefined {
  const map = Object.keys(LANGUAGE_MAP).length > 0 ? LANGUAGE_MAP : DEFAULT_LANGUAGE_MAP;
  const ext = Object.keys(map).find((key) => filePath.endsWith(key));
  return ext ? map[ext] : undefined;
}

// Derive LANGUAGE_MAP from loaded config (or fallback to builtin defaults)
let LANGUAGE_MAP: Record<string, string> = {};
function rebuildLanguageMap(): void {
  LANGUAGE_MAP = {};
  const registry = _providerRegistry;
  if (!registry) return;
  for (const [ext, resolved] of registry) {
    if (!LANGUAGE_MAP[ext]) LANGUAGE_MAP[ext] = resolved.language;
  }
}

/**
 * Checks whether intervals contain only non-supported file types.
 * Returns true only when intervals is non-empty AND every file has an unsupported extension.
 * ponytail: extracted from buildEvidenceOutput to reduce cyclomatic complexity.
 */
export function isUnsupportedIntervals(intervals: Map<string, {start: number; end: number}[]>): boolean {
    if (intervals.size === 0) {
        return false; // empty intervals -> not unsupported (could be no changes)
    }
    const supported = supportedExtensions();
    for (const [filePath] of intervals) {
        const ext = filePath.slice(filePath.lastIndexOf('.'));
        if (supported.has(ext)) return false;
    }
    return true; // all files are non-supported and intervals non-empty
}

/**
 * Builds the coverage lineage inputs object (deterministic, no timing).
 * Handles absolute path → relative conversion, absent coverage hash sentinel,
 * and coverage quality vocabulary (DIRECT / UNAVAILABLE).
 */
export function buildCoverageLineageInputs(
    coverageFile: string | undefined,
    cwd: string,
    coverageResult: CoverageResult,
    errorReason: string | undefined,
): Record<string, unknown> {
    return {
        // Input identity: relative coverage path only (security: no absolute paths in diagnostics)
        ...(coverageFile !== undefined && coverageFile !== '' ? {
            coverageFile: path.isAbsolute(coverageFile) ? path.relative(cwd, coverageFile) : coverageFile
        } : {}),
        available: coverageResult.available,
        error: coverageResult.error,
        ...(errorReason !== undefined ? { reason: errorReason } : {}),
        // Input identity: sha256 of artifact bytes when read succeeded; sentinel otherwise
        coverageHash: coverageResult.contentSha256
            ?? (coverageResult.error ? `malformed:${errorReason ?? 'malformed'}` : 'absent'),
        // Canonical vocabulary (ADR-0001): measured from artifact => DIRECT, else UNAVAILABLE
        quality: coverageResult.error || !coverageResult.available ? 'UNAVAILABLE' : 'DIRECT'
    };
}

export interface ChangedFunction {
  file: string;
  method: string;
  lineStart: number;
  lineEnd: number;
  cc: number;
  crap: number | null;
  coverage: number | null;
  coverageKind: string;
  analyzerStatus: 'passed' | 'failed' | 'skipped';
  source: Source;
  language?: string;
  framework?: string;
}

// ---- Extracted helper: extension detection ----
// ponytail: extracted from buildEvidenceOutput to reduce cyclomatic complexity;
// priority order derived from config (default: .py > .tsx > .jsx > .js).
export function detectExtension(intervals: Map<string, { start: number; end: number }[]>): string {
  const priority = extensionPriority();
  const supported = supportedExtensions();
  // Collect which extensions are present
  const present = new Set<string>();
  for (const [filePath] of intervals) {
    let ext = filePath.slice(filePath.lastIndexOf('.'));
    // ponytail: normalize .mjs/.cjs → .js for detection
    if (ext === '.mjs' || ext === '.cjs') ext = '.js';
    if (supported.has(ext)) present.add(ext);
  }
  // Return first extension in priority order that's present
  for (const ext of priority) {
    if (present.has(ext)) return ext;
  }
  // Fallback: default to '.ts' when no supported extension found
  return '.ts';
}

// ---- Extracted helper: gate + completeness from rule results ----
export function computeGateAndCompleteness(ruleResults: RuleResult[]): { gate: string; completeness: string } {
  const hasWarn = ruleResults.some((r) => r.result === 'WARN');
  const hasNotEvaluated = ruleResults.some((r) => r.result === 'NOT_EVALUATED');
  return {
    gate: hasWarn ? 'WARN' : 'PASS',
    completeness: hasNotEvaluated ? 'INCOMPLETE' : 'COMPLETE',
  };
}

// ---- Extracted helper: language + framework enrichment ----
// LANGUAGE_MAP and getLanguageForFile are config-driven (see initProviderConfig above)

function detectNextFramework(cwd: string, filePath: string): string | undefined {
  // 1. package.json next dep
  try {
    const pkg = JSON.parse(fs.readFileSync(path.resolve(cwd, 'package.json'), 'utf8'));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies, ...pkg.peerDependencies };
    if (deps.next) return 'next';
  } catch { /* no package.json or parse error */ }
  // 2. next.config.* at root
  const configNames = ['next.config.js', 'next.config.mjs', 'next.config.ts'];
  for (const name of configNames) {
    if (fs.existsSync(path.resolve(cwd, name))) return 'next';
  }
  // 3. App Router markers
  const appMarkers = ['app/page.tsx', 'app/layout.tsx'];
  for (const marker of appMarkers) {
    if (fs.existsSync(path.resolve(cwd, marker))) return 'next';
  }
  // 4. Bounded scan for app/**/route.ts
  const appDir = path.resolve(cwd, 'app');
  if (fs.existsSync(appDir)) {
    const routeFiles = walkDirBounded(appDir, 0)
      .filter((f: string) => f.endsWith('route.ts') || f.endsWith('route.tsx'));
    if (routeFiles.length > 0) return 'next';
  }
  // 5. Pages Router markers
  const pagesDir = path.resolve(cwd, 'pages');
  if (fs.existsSync(pagesDir)) {
    const pageFiles = walkDirBounded(pagesDir, 0)
      .filter((f: string) => f.endsWith('.tsx') || f.endsWith('.ts'));
    if (pageFiles.length > 0) return 'next';
  }
  // 6. React fallback
  try {
    const pkg = JSON.parse(fs.readFileSync(path.resolve(cwd, 'package.json'), 'utf8'));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies, ...pkg.peerDependencies };
    if (deps.react) return 'react';
  } catch { /* no package.json or parse error */ }
  if (filePath.endsWith('.jsx')) return 'react';
  return undefined;
}

// ponytail: extracted walkDir into standalone fn to avoid nested function inside detectNextFramework
function walkDirBounded(dir: string, depth: number): string[] {
  if (depth > 3) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(walkDirBounded(fullPath, depth + 1));
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

export function enrichWithLanguageAndFramework(changedFunctions: ChangedFunction[], cwd: string): ChangedFunction[] {
  return changedFunctions.map((fn) => {
    const lang = getLanguageForFile(fn.file);
    const fw = detectNextFramework(cwd, fn.file);
    return {
      ...fn,
      ...(lang !== undefined ? { language: lang } : {}),
      ...(fw ? { framework: fw } : {}),
    };
  });
}

// ---- Extracted helper: coverage read with provider dispatch ----
// ponytail: extracted from buildEvidenceOutput to reduce cyclomatic complexity;
// the original inline try/catch had 3 branches (error → failed, absent, catch → malformed).
export async function readCoverageWithProvider(
  detectedExtension: string,
  cwd: string,
  coverageFile: string | undefined,
  trace: TraceRun | undefined,
  autoGenerated: boolean | undefined,
): Promise<{ result: CoverageResult; capability: string; errorReason: string | undefined; elapsed: number }> {
  const t0 = Date.now();
  let result: CoverageResult;
  let capability = 'available';
  let errorReason: string | undefined;
  try {
    const provider = providers.get(detectedExtension);
    if (provider) {
      result = await provider.readCoverage(cwd, coverageFile, trace, autoGenerated);
    } else {
      result = await readCoverage(cwd, coverageFile, trace, autoGenerated);
    }
    if (result.error) {
      capability = 'failed';
      errorReason = result.reason;
    }
    if (!result.available && !result.error) {
      capability = 'absent';
    }
  } catch {
    capability = 'failed';
    errorReason = 'malformed';
    result = { available: false, coverageMap: null, error: true, reason: 'malformed' };
  }
  return { result, capability, errorReason, elapsed: Date.now() - t0 };
}

// ponytail: extracted from buildEvidenceOutput to reduce cyclomatic complexity.
// Handles the empty-intervals early return (vacuous-PASS ban §5).
// Reads coverage so coverageErrorReason survives — INV-02/INV-03 MISSING≠MALFORMED.
async function emptyIntervalsReturn(
  base: string, threshold: number, detectedExtension: string, cwd: string,
  coverageFile: string | undefined, trace: TraceRun | undefined, autoGenerated: boolean | undefined,
  gitCapability: string, lineage: DiagnosticLineageEntry[],
): Promise<EvidenceOutput> {
    const t0CovEarly = Date.now();
    const covEarly = await readCoverageWithProvider(detectedExtension, cwd, coverageFile, trace, autoGenerated);
    if (trace) trace.recordStage('coverage', Date.now() - t0CovEarly, covEarly.result.error ? 'error' : covEarly.result.available ? 'ok' : 'skipped');
    lineage.push({
        stage: 'coverage',
        ...coverageProvenance,
        inputs: buildCoverageLineageInputs(coverageFile, cwd, covEarly.result, covEarly.errorReason),
    });
    // Empty intervals → UNSUPPORTED always. coverageErrorReason recorded
    // for diagnostics but does NOT change analysisStatus (vacuous-PASS ban).
    return withDiagnostics({
        schemaVersion: '0.5',
        analysis: { base, target: 'current' },
        capabilities: {
            git: gitCapability,
            complexity: 'unavailable',
            coverageArtifact: covEarly.capability === 'failed' ? 'failed' : 'unavailable'
        },
        changedFunctions: [],
        ruleResults: [],
        policy: { crapThreshold: threshold },
        analysisStatus: 'UNSUPPORTED',
        gate: 'NOT_EVALUATED',
        completeness: 'INCOMPLETE',
        ...(covEarly.errorReason !== undefined ? { coverageErrorReason: covEarly.errorReason } : {})
    }, lineage, buildQuality({ complexityCapability: 'unavailable', coverageUsable: false }));
}

// ponytail: extracted from buildEvidenceOutput to reduce cyclomatic complexity.
// §5 vacuous-PASS ban: coverage absent + needs coverage → NOT_EVALUATED gate.
// preserve ZERO!=NULL MISSING!=MALFORMED: absent ≠ failed, not conflated.
function applyAbsentCoverageGate(currentGate: string, coverageCapability: string, changedFunctionsCount: number): string {
    if (coverageCapability === 'absent' && changedFunctionsCount > 0) {
        return 'NOT_EVALUATED';
    }
    return currentGate;
}

// ---- Extracted helper: map attributed complexity → MethodEvidence array ----
// ponytail: extracted from buildEvidenceOutput; pure transformation, no side effects.
export function mapToMethodEvidence(attributedComplexity: AttributedComplexity[]): MethodEvidenceWithSource[] {
  return attributedComplexity.map((ac) => ({
    file: ac.info.file,
    method: ac.info.method,
    lineStart: ac.info.lineStart,
    lineEnd: ac.info.lineEnd,
    cc: ac.info.cc,
    crap: calculateCrap(ac.info.cc, ac.coveragePercent),
    coverage: ac.coveragePercent,
    coverageKind: ac.coverageKind ?? 'N/A',
    analyzerStatus: (ac.coveragePercent !== null && ac.coveragePercent !== undefined ? 'passed' : 'skipped') as 'passed' | 'failed' | 'skipped',
    source: { tool: '@barney-media/crap-typescript-core', version: '0.5.0' },
  }));
}

export function correlate(methodEvidence: MethodEvidenceWithSource[], intervals: Map<string, {start: number; end: number}[]>) {
    const changedFunctions = [];
    for (const evidence of methodEvidence) {
        const fileIntervals = intervals.get(evidence.file);
        if (!fileIntervals) {
            // No changes in this file, skip
            continue;
        }
        // Check for overlap with any interval in this file
        let isChanged = false;
        for (const interval of fileIntervals) {
            // Integer overlap logic: methodStart <= intervalEnd AND intervalStart <= methodEnd
            if (evidence.lineStart <= interval.end && interval.start <= evidence.lineEnd) {
                isChanged = true;
                break;
            }
        }
        if (isChanged) {
            changedFunctions.push({
                file: evidence.file,
                method: evidence.method,
                lineStart: evidence.lineStart,
                lineEnd: evidence.lineEnd,
                cc: evidence.cc,
                crap: evidence.crap,
                coverage: evidence.coverage,
                coverageKind: evidence.coverageKind,
                analyzerStatus: evidence.analyzerStatus,
                source: evidence.source
                    ? { tool: evidence.source.tool, version: evidence.source.version }
                    : { tool: '@barney-media/crap-typescript', version: '0.5.0' },
            });
        }
    }
    return changedFunctions;
}
/**
 * Legacy buildOutput for WP3 tests (schema 0.1, sync). Kept for backward compatibility.
 */
export function buildOutput(base: string, changed: ChangedFunction[], threshold: number = 30, capabilities: Capabilities = { git: 'available' } satisfies Capabilities) {
    const ruleResults = evaluateHighCrap(changed, threshold);
    const gate = ruleResults.some((r: RuleResult) => r.result === 'WARN') ? 'WARN' : 'PASS';
    const completeness = ruleResults.some((r: RuleResult) => r.result === 'NOT_EVALUATED') ? 'INCOMPLETE' : 'COMPLETE';
    const caps: Record<string, string> = {
        git: capabilities.git ?? 'available',
        crapTypescript: capabilities.crapTypescript ?? 'available',
    };
    // For backward compat, only return old capability keys unless new ones explicitly passed
    if (capabilities.complexity)
        caps.complexity = capabilities.complexity;
    if (capabilities.coverageArtifact)
        caps.coverageArtifact = capabilities.coverageArtifact;
    return {
        schemaVersion: '0.1',
        analysis: { base, target: 'current' },
        capabilities: caps,
        changedFunctions: changed,
        policy: { crapThreshold: threshold },
        ruleResults,
        gate,
        completeness,
    };
}

/**
 * Handles coverage-failure resolution. Mutates state in place; returns early-return
 * output when analysis should stop, or null to continue.
 * ponytail: extracted from buildEvidenceOutput to reduce cyclomatic complexity.
 */
function resolveCoverageFailure(
  coverageCapability: string,
  coverageErrorReason: string | undefined,
  autoGenerated: boolean | undefined,
  base: string, gitCapability: string, complexityCapability: string, threshold: number,
  lineage: DiagnosticLineageEntry[], complexityCapabilityForQuality: string,
): { earlyReturn: EvidenceOutput | null; coverageCapability: string; coverageErrorReason: string | undefined; analysisStatus: string; gate: null; completeness: string } {
  let analysisStatus = 'SUCCESS';
  let gate = null;
  let completeness = 'COMPLETE';
  if (coverageCapability === 'failed') {
    if (autoGenerated) {
      return { earlyReturn: null, coverageCapability: 'absent', coverageErrorReason: undefined, analysisStatus, gate, completeness };
    } else {
      analysisStatus = 'FAILED';
      completeness = 'INCOMPLETE';
      return {
        earlyReturn: withDiagnostics(buildFailedOutput(base, gitCapability, complexityCapability, 'failed', threshold, coverageErrorReason), lineage, buildQuality({ complexityCapability: complexityCapabilityForQuality, coverageUsable: false })),
        coverageCapability: 'failed', coverageErrorReason, analysisStatus, gate, completeness
      };
    }
  }
  return { earlyReturn: null, coverageCapability, coverageErrorReason, analysisStatus, gate, completeness };
}

/**
 * Wraps attribution attachment with timing and error handling.
 * Returns either the attributed complexity or an early-return output on failure.
 * ponytail: extracted from buildEvidenceOutput to reduce cyclomatic complexity.
 */
async function attachCoverageWithTracking(
  complexityInfo: ComplexityInfo[],
  coverageResult: CoverageResult,
  trace: TraceRun | undefined,
  lineage: DiagnosticLineageEntry[],
  base: string, gitCapability: string, complexityCapability: string, coverageCapability: string, threshold: number, coverageErrorReason: string | undefined,
): Promise<{ attributedComplexity: AttributedComplexity[]; earlyReturn?: EvidenceOutput }> {
  const t0 = Date.now();
  try {
    const attributedComplexity = await attachCoverage(complexityInfo, coverageResult);
    if (trace) trace.recordStage('attribution', Date.now() - t0, 'ok');
    lineage.push({
      stage: 'attribution',
      ...attributionProvenance,
      inputs: {
        methods: attributedComplexity.length,
        quality: coverageResult.available && !coverageResult.error ? 'ATTRIBUTED' : 'UNAVAILABLE'
      }
    });
    return { attributedComplexity };
  } catch {
    if (trace) trace.recordStage('attribution', Date.now() - t0, 'error');
    return {
      attributedComplexity: [],
      earlyReturn: withDiagnostics(
        buildFailedOutput(base, gitCapability, complexityCapability, coverageCapability, threshold, coverageErrorReason),
        lineage,
        buildQuality({ complexityCapability, coverageUsable: !coverageResult.error && coverageResult.available === true })
      )
    };
  }
}

/**
 * Builds the final JSON output using composed evidence.
 * @param base The base reference used for comparison
 * @param intervals Map from file path to array of changed intervals (from git)
 * @param cwd Current working directory
 * @param threshold CRAP threshold for evaluating changed functions
 * @returns Promise<OutputJson>
 */
export async function buildEvidenceOutput(base: string, intervals: Map<string, {start: number; end: number}[]>, cwd: string, threshold = 30, coverageFile?: string, trace?: TraceRun, autoGenerated?: boolean): Promise<EvidenceOutput> {
    // We'll assume that the git repo is valid and the base is resolved (done by cli.ts)
    // We'll set the git capability to 'available' (if we got here, git is working)
    const gitCapability = 'available';
    // Diagnostics lineage collection (deterministic; inputs record identity, never timing)
    const lineage: DiagnosticLineageEntry[] = [];
    lineage.push({
        stage: 'git',
        ...gitProvenance,
        inputs: {
            base,
            diff: 'git diff --unified=0 <resolvedBase>',
            fileCount: intervals.size,
            // Input identity hash over the parsed diff intervals (node:crypto, no new deps)
            intervalsSha256: sha256Hex(JSON.stringify(Array.from(intervals.entries())))
        }
    });
    // Step 1: Collect complexity
    const detectedExtension = detectExtension(intervals);
    const t0Complexity = Date.now();
    let complexityInfo = [];
    let complexityCapability = 'available';
    try {
        if (_providerRegistry === null) { initProviderConfig(); }
        const provider = getProvider(detectedExtension);
        if (provider) {
            complexityInfo = await provider.collectComplexity(cwd, trace);
        } else {
            complexityInfo = await collectComplexity(cwd, trace);
        }
    }
    catch (error) {
        complexityCapability = 'failed';
        // We'll still continue to try to get coverage? But if complexity fails, we set analysisStatus to UNSUPPORTED.
        // We'll set complexityInfo to empty and continue.
        complexityInfo = [];
    }
    if (trace) trace.recordStage('complexity', Date.now() - t0Complexity, complexityCapability === 'failed' ? 'error' : 'ok');
    lineage.push({
        stage: 'complexity',
        ...complexityProvenance,
        inputs: {
            extension: detectedExtension,
            functions: complexityInfo.length,
            // Canonical vocabulary (ADR-0001): native analyzer present => NATIVE, failed => UNAVAILABLE
            quality: complexityCapability === 'failed' ? 'UNAVAILABLE' : 'NATIVE'
        }
    });
    // Vacuous-PASS ban (§5): no files in diff + no supported extensions →
    // INCOMPLETE/NOT_EVALUATED, never PASS. ponytail: intervals.size===0 is
    // the degenerate case where isUnsupportedIntervals returns false (by
    // design), but the output must still be NOT_EVALUATED because there is
    // nothing to analyze.
    if (intervals.size === 0) {
        return emptyIntervalsReturn(base, threshold, detectedExtension, cwd, coverageFile, trace, autoGenerated, gitCapability, lineage);
    }
    // Helper to check if intervals contain only non-supported files
    // If intervals indicate unsupported source (non-code files only), return UNSUPPORTED
    if (isUnsupportedIntervals(intervals)) {
        return withDiagnostics({
            schemaVersion: '0.5',
            analysis: {
                base: base,
                target: 'current'
            },
            capabilities: {
                git: gitCapability,
                complexity: complexityCapability,
                coverageArtifact: 'available'
            },
            changedFunctions: [],
            ruleResults: [],
            policy: {
                crapThreshold: threshold
            },
            analysisStatus: 'UNSUPPORTED',
            gate: null,
            completeness: 'INCOMPLETE'
        }, lineage, buildQuality({ complexityCapability, coverageUsable: false }));
    }
// Step 2: Read coverage
    const t0Coverage = Date.now();
    const { result: coverageResult, capability: _covCapability, errorReason: _covErrorReason, elapsed: _coverageElapsed } = await readCoverageWithProvider(detectedExtension, cwd, coverageFile, trace, autoGenerated);
    let coverageCapability = _covCapability;
    let coverageErrorReason = _covErrorReason;
    if (trace) trace.recordStage('coverage', Date.now() - t0Coverage, coverageResult.error ? 'error' : coverageResult.available ? 'ok' : 'skipped');
    lineage.push({
        stage: 'coverage',
        ...coverageProvenance,
        inputs: buildCoverageLineageInputs(coverageFile, cwd, coverageResult, coverageErrorReason),
    });
    // Determine analysisStatus, gate, and completeness based on provider failures
    // If complexity provider failed -> unsupported source
    if (complexityCapability === 'failed') {
        const earlyReturn = withDiagnostics({
            schemaVersion: '0.5',
            analysis: {
                base: base,
                target: 'current'
            },
            capabilities: {
                git: gitCapability,
                complexity: complexityCapability,
                coverageArtifact: coverageCapability
            },
            changedFunctions: [],
            policy: {
                crapThreshold: threshold
            },
            ruleResults: [],
            analysisStatus: 'UNSUPPORTED',
            gate: null,
            completeness: 'NOT_APPLICABLE'
        }, lineage, buildQuality({ complexityCapability, coverageUsable: false }));
        return earlyReturn;
    }
// If coverage provider failed (malformed)
    const covRes = resolveCoverageFailure(coverageCapability, coverageErrorReason, autoGenerated, base, gitCapability, complexityCapability, threshold, lineage, complexityCapability);
    if (covRes.earlyReturn) return covRes.earlyReturn;
    coverageCapability = covRes.coverageCapability;
    coverageErrorReason = covRes.coverageErrorReason;
    const analysisStatus = covRes.analysisStatus;
    const gate = covRes.gate;
    const completeness = covRes.completeness;
    // Step 3: Attach coverage to complexity info
    const attrResult = await attachCoverageWithTracking(complexityInfo, coverageResult, trace, lineage, base, gitCapability, complexityCapability, coverageCapability, threshold, coverageErrorReason);
    if (attrResult.earlyReturn) return attrResult.earlyReturn;
    const attributedComplexity = attrResult.attributedComplexity;
    // Step 4+5: Map attributed complexity → MethodEvidence (merged Steps 4+5 via mapToMethodEvidence)
    const t0CrapCalc = Date.now();
    const methodEvidence = mapToMethodEvidence(attributedComplexity);
    lineage.push({ stage: 'crapCalc', ...crapCalcProvenance, inputs: { functions: methodEvidence.length } });
    if (trace) trace.recordStage('crapCalc', Date.now() - t0CrapCalc, 'ok');
    // Step 6: Correlate with git intervals
    const changedFunctions = correlate(methodEvidence, intervals);
    // Step 7: Evaluate rule results (using the existing evaluateHighCrap from rules.js)
    const t0Rules = Date.now();
    const ruleResults = evaluateHighCrap(changedFunctions, threshold);
    lineage.push({ stage: 'rules', ...rulesProvenance, inputs: { threshold, functions: changedFunctions.length } });
    if (trace) trace.recordStage('rules', Date.now() - t0Rules, 'ok');
    // Step 8: Compute overall gate and completeness
    let { gate: gateValue, completeness: completenessValue } = computeGateAndCompleteness(ruleResults);
    // §5 vacuous-PASS ban: coverage absent + needs coverage → NOT_EVALUATED gate.
    gateValue = applyAbsentCoverageGate(gateValue, coverageCapability, changedFunctions.length);
    // Step 9: Determine analysisStatus
    // If we have no relevant TS functions after successful analysis -> SUCCESS
    // We'll check if we have any complexityInfo (from the provider) and if we have any changedFunctions?
    // The spec says: If no relevant current TS functions after successful applicable analysis -> SUCCESS / PASS / COMPLETE
    // We'll consider that if complexityInfo is empty (no TS functions found) then we are in this case.
    // But note: we might have complexityInfo but no changedFunctions (if no changes in any function). That is still SUCCESS if we have functions.
    // We'll set analysisStatus to SUCCESS if we have not already set it to FAILED.
    if (analysisStatus === 'SUCCESS') {
        // We'll keep it as SUCCESS unless we have a reason to set to UNSUPPORTED?
        // The spec says: Unsupported source/change -> UNSUPPORTED / null / NOT_APPLICABLE
        // We don't have a way to detect unsupported source yet. We'll assume it's supported.
        // We'll leave analysisStatus as SUCCESS.
    }
// Step 10: Enrich with language/framework and return
      const t0Evidence = Date.now();
      const changedFunctionsWithLanguage = enrichWithLanguageAndFramework(changedFunctions, cwd);
      lineage.push({
        stage: 'evidence',
        ...evidenceProvenance,
        inputs: {
          base,
          threshold,
          changedFunctions: changedFunctionsWithLanguage.length,
          ruleResults: ruleResults.length,
          // Engine identity: HEAD commit of the repo running the analysis (cache key input)
          engine: engineIdentity()
        }
      });
      // Tracing seam: stage spans recorded only into the in-memory trace run —
      // never into the deterministic EvidenceOutput returned below.
      if (trace) trace.recordStage('evidence', Date.now() - t0Evidence, 'ok');
      return withDiagnostics({
          schemaVersion: '0.5',
         analysis: {
             base: base,
             target: 'current'
         },
         capabilities: {
             git: gitCapability,
             complexity: complexityCapability,
             coverageArtifact: coverageCapability
         },
         changedFunctions: changedFunctionsWithLanguage,
         policy: {
             crapThreshold: threshold
         },
         ruleResults: ruleResults,
         analysisStatus: analysisStatus,
         gate: gateValue,
         completeness: completenessValue
     }, lineage, buildQuality({
         complexityCapability,
         coverageUsable: coverageResult.available === true && coverageResult.error === false,
         attributionComplete: true,
         rulesComplete: true,
         changedFunctions: changedFunctionsWithLanguage
     }), buildFingerprints(changedFunctionsWithLanguage));
}
// Helper function to build output when there is a provider failure
function buildFailedOutput(base: string, gitCapability: string, complexityCapability: string, coverageCapability: string, threshold: number, coverageErrorReason: string | undefined) {
     return {
         schemaVersion: '0.5',
         analysis: {
             base: base,
             target: 'current'
         },
         capabilities: {
             git: gitCapability,
             complexity: complexityCapability,
             coverageArtifact: coverageCapability
         },
        changedFunctions: [],
        policy: {
            crapThreshold: threshold
        },
        ruleResults: [],
        analysisStatus: 'FAILED',
        gate: null,
        completeness: 'INCOMPLETE',
        ...(coverageErrorReason !== undefined ? { coverageErrorReason } : {}),
    };
}