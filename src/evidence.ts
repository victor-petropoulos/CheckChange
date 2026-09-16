import { evaluateHighCrap, type RuleResult } from './rules.js';
import { collectComplexity } from './complexity.js';
import { readCoverage, type CoverageResult } from './coverage.js';
import { attachCoverage, type AttributedComplexity } from './attribution.js';
import { calculateCrap } from './crapCalc.js';
import { pythonASTComplexityProvider } from './complexity-providers/pythonASTComplexityProvider.js';
import { gitProvenance } from './git.js';
import { complexityProvenance } from './complexity.js';
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

// Register TypeScript provider for JS/TS extensions (delegation preserves vi.spyOn mocks)
const typescriptProvider: ProviderFactory = {
  collectComplexity: (...args: Parameters<typeof collectComplexity>) => collectComplexity(...args),
  readCoverage: (...args: Parameters<typeof readCoverage>) => readCoverage(...args),
};
for (const ext of ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'] as const) {
  registerProvider(ext, typescriptProvider);
}

// Register Python provider for .py extension
registerProvider('.py', pythonASTComplexityProvider);

/**
 * Checks whether intervals contain only non-supported file types.
 * Returns true only when intervals is non-empty AND every file has an unsupported extension.
 * ponytail: extracted from buildEvidenceOutput to reduce cyclomatic complexity.
 */
export function isUnsupportedIntervals(intervals: Map<string, {start: number; end: number}[]>): boolean {
    if (intervals.size === 0) {
        return false; // empty intervals -> not unsupported (could be no changes)
    }
    for (const [filePath] of intervals) {
        if (filePath.endsWith('.ts') || filePath.endsWith('.tsx') || filePath.endsWith('.js') || filePath.endsWith('.jsx') || filePath.endsWith('.mjs') || filePath.endsWith('.cjs') || filePath.endsWith('.py')) {
            return false; // at least one supported file -> supported
        }
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
// priority order .py > .tsx > .jsx > .js mirrors original inline logic.
const EXTENSION_PRIORITY: [string, ...string[]] = ['.py', '.tsx', '.jsx', '.js'];
const JS_EXTENSIONS = new Set(['.js', '.mjs', '.cjs']);

export function detectExtension(intervals: Map<string, { start: number; end: number }[]>): string {
  let hasPy = false, hasTsx = false, hasJsx = false, hasJs = false;
  for (const [filePath] of intervals) {
    if (filePath.endsWith('.py')) hasPy = true;
    else if (filePath.endsWith('.tsx')) hasTsx = true;
    else if (filePath.endsWith('.jsx')) hasJsx = true;
    else if (JS_EXTENSIONS.has(filePath.slice(filePath.lastIndexOf('.')))) hasJs = true;
  }
  if (hasPy) return '.py';
  if (hasTsx) return '.tsx';
  if (hasJsx) return '.jsx';
  if (hasJs) return '.js';
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
const LANGUAGE_MAP: Record<string, string> = {
  '.py': 'python',
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.js': 'javascript',
  '.jsx': 'javascript',
  '.mjs': 'javascript',
  '.cjs': 'javascript',
};

function getLanguageForFile(filePath: string): string | undefined {
  const ext = Object.keys(LANGUAGE_MAP).find((key) => filePath.endsWith(key));
  return ext ? LANGUAGE_MAP[ext] : undefined;
}

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
 * Builds the final JSON output using composed evidence.
 * @param base The base reference used for comparison
 * @param intervals Map from file path to array of changed intervals (from git)
 * @param cwd Current working directory
 * @param threshold CRAP threshold for evaluating changed functions
 * @returns Promise<OutputJson>
 */
export async function buildEvidenceOutput(base: string, intervals: Map<string, {start: number; end: number}[]>, cwd: string, threshold = 30, coverageFile?: string, trace?: TraceRun, autoGenerated?: boolean) {
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
        const provider = providers.get(detectedExtension);
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
            completeness: 'NOT_APPLICABLE'
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
    let analysisStatus = 'SUCCESS';
    let gate = null;
    let completeness = 'COMPLETE';
    // If git failed (should have been caught by cli.ts, but we check)
    // We don't have git status here, so we assume it's available.
    // If complexity provider failed -> unsupported source
    if (complexityCapability === 'failed') {
        analysisStatus = 'UNSUPPORTED';
        gate = null;
        completeness = 'NOT_APPLICABLE';
        // We'll return early with empty changedFunctions.
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
            changedFunctions: [],
            policy: {
                crapThreshold: threshold
            },
            ruleResults: [],
            analysisStatus: analysisStatus,
            gate: gate,
            completeness: completeness
        }, lineage, buildQuality({ complexityCapability, coverageUsable: false }));
    }
// If coverage provider failed (malformed)
    if (coverageCapability === 'failed') {
        if (autoGenerated) {
            // Auto-generated artifact malformed — downgrade to absent (never forced FAILED for auto)
            analysisStatus = 'SUCCESS';
            coverageCapability = 'absent';
            coverageErrorReason = undefined;
        } else {
            analysisStatus = 'FAILED';
            gate = null;
            completeness = 'INCOMPLETE';
            return withDiagnostics(buildFailedOutput(base, gitCapability, complexityCapability, coverageCapability, threshold, coverageErrorReason), lineage, buildQuality({ complexityCapability, coverageUsable: false }));
        }
    }
    // Step 3: Attach coverage to complexity info
    const t0Attribution = Date.now();
    let attributedComplexity = [];
    try {
        attributedComplexity = await attachCoverage(complexityInfo, coverageResult);
    }
    catch (error) {
// If attachment fails, treat as coverage failure? But we already checked coverageResult.
// We'll set analysisStatus to FAILED.
     analysisStatus = 'FAILED';
     gate = null;
completeness = 'INCOMPLETE';
       if (trace) trace.recordStage('attribution', Date.now() - t0Attribution, 'error');
       return withDiagnostics(buildFailedOutput(base, gitCapability, complexityCapability, coverageCapability, threshold, coverageErrorReason), lineage, buildQuality({ complexityCapability, coverageUsable: !coverageResult.error && coverageResult.available === true }));
    }
    if (trace) trace.recordStage('attribution', Date.now() - t0Attribution, 'ok');
    lineage.push({
        stage: 'attribution',
        ...attributionProvenance,
        inputs: {
            methods: attributedComplexity.length,
            // Canonical vocabulary (ADR-0001): derived via attribution => ATTRIBUTED, else UNAVAILABLE
            quality: coverageResult.available && !coverageResult.error ? 'ATTRIBUTED' : 'UNAVAILABLE'
        }
    });
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
    const { gate: gateValue, completeness: completenessValue } = computeGateAndCompleteness(ruleResults);
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