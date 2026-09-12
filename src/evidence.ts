// @ts-nocheck
import { evaluateHighCrap } from './rules.js';
import { collectComplexity } from './complexity.js';
import { readCoverage } from './coverage.js';
import { attachCoverage } from './attribution.js';
import { calculateCrap } from './crapCalc.js';
import { pythonASTComplexityProvider } from './complexity-providers/pythonASTComplexityProvider.js';
import { gitProvenance } from './git.js';
import { complexityProvenance } from './complexity.js';
import { coverageProvenance } from './coverage.js';
import { attributionProvenance } from './attribution.js';
import { crapCalcProvenance } from './crapCalc.js';
import { rulesProvenance } from './rules.js';
import { createHash } from 'node:crypto';
import * as fs from 'fs';
import * as path from 'path';

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
): T & { diagnostics?: { lineage: DiagnosticLineageEntry[]; quality: DiagnosticQuality; fingerprints?: Record<string, string> } } {
  const fpEntries = fingerprints ? Object.keys(fingerprints).length : 0;
  if (lineage.length === 0) return output;
  return {
    ...output,
    diagnostics: { lineage, quality, ...(fpEntries > 0 ? { fingerprints } : {}) },
  };
}

export interface ProviderFactory { 
   collectComplexity: (cwd:string)=>Promise<any[]>; 
   readCoverage: (cwd:string, file?:string)=>Promise<any> 
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
  source: { tool: string; version: string; };
  language?: string;
  framework?: string;
}

export function correlate(methodEvidence, intervals) {
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
export function buildOutput(base, changed, threshold = 30, capabilities = {}) {
    const ruleResults = evaluateHighCrap(changed, threshold);
    const gate = ruleResults.some((r) => r.result === 'WARN') ? 'WARN' : 'PASS';
    const completeness = ruleResults.some((r) => r.result === 'NOT_EVALUATED') ? 'INCOMPLETE' : 'COMPLETE';
    const caps = {
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
export async function buildEvidenceOutput(base, intervals, cwd, threshold = 30, coverageFile?: string) {
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
    // Extension detection: prioritize .py > .tsx > .ts > .jsx > .js/.mjs/.cjs
    let detectedExtension = '.ts';
    let hasPy = false, hasTsx = false, hasJsx = false, hasJs = false;
    for (const [filePath] of intervals) {
      if (filePath.endsWith('.py')) {
        hasPy = true;
        break;
      }
      if (filePath.endsWith('.tsx')) {
        hasTsx = true;
      }
      if (filePath.endsWith('.jsx')) {
        hasJsx = true;
      }
      if (filePath.endsWith('.js') || filePath.endsWith('.mjs') || filePath.endsWith('.cjs')) {
        hasJs = true;
      }
    }
    if (hasPy) detectedExtension = '.py';
    else if (hasTsx) detectedExtension = '.tsx';
    else if (hasJsx) detectedExtension = '.jsx';
    else if (hasJs) detectedExtension = '.js';
    let complexityInfo = [];
    let complexityCapability = 'available';
    try {
        const provider = providers.get(detectedExtension);
        if (provider) {
            complexityInfo = await provider.collectComplexity(cwd);
        } else {
            complexityInfo = await collectComplexity(cwd);
        }
    }
    catch (error) {
        complexityCapability = 'failed';
        // We'll still continue to try to get coverage? But if complexity fails, we set analysisStatus to UNSUPPORTED.
        // We'll set complexityInfo to empty and continue.
        complexityInfo = [];
    }
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
    const isUnsupportedIntervals = (intervals) => {
        if (intervals.size === 0) {
            return false; // empty intervals -> not unsupported (could be no changes)
        }
        for (const [filePath] of intervals) {
            if (filePath.endsWith('.ts') || filePath.endsWith('.tsx') || filePath.endsWith('.js') || filePath.endsWith('.jsx') || filePath.endsWith('.mjs') || filePath.endsWith('.cjs') || filePath.endsWith('.py')) {
                return false; // at least one supported file -> supported
            }
        }
        return true; // all files are non-supported and intervals non-empty
    };
    // If intervals indicate unsupported source (non-code files only), return UNSUPPORTED
    if (isUnsupportedIntervals(intervals)) {
        return withDiagnostics({
            schemaVersion: '0.4',
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
    let coverageResult;
    let coverageCapability = 'available';
    let coverageErrorReason;
    try {
        const provider = providers.get(detectedExtension);
        if (provider) {
            coverageResult = await provider.readCoverage(cwd, coverageFile);
        } else {
        coverageResult = await readCoverage(cwd, coverageFile);
        }
        if (coverageResult.error) {
        coverageCapability = 'failed';
    coverageErrorReason = coverageResult.reason;
        }
        if (!coverageResult.available && !coverageResult.error) {
        coverageCapability = 'absent';
    }
} catch (error) {
coverageCapability = 'failed';
coverageErrorReason = 'malformed';
coverageResult = { available: false, coverageMap: null, error: true, reason: 'malformed' };
}
    lineage.push({
        stage: 'coverage',
        ...coverageProvenance,
        inputs: {
            // Input identity: relative coverage path only (security: no absolute paths in diagnostics)
            ...(coverageFile !== undefined && coverageFile !== '' ? {
                coverageFile: path.isAbsolute(coverageFile) ? path.relative(cwd, coverageFile) : coverageFile
            } : {}),
            available: coverageResult.available,
            error: coverageResult.error,
            ...(coverageErrorReason !== undefined ? { reason: coverageErrorReason } : {}),
            // Canonical vocabulary (ADR-0001): measured from artifact => DIRECT, else UNAVAILABLE
            quality: coverageResult.error || !coverageResult.available ? 'UNAVAILABLE' : 'DIRECT'
        }
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
            schemaVersion: '0.4',
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
analysisStatus = 'FAILED';
          gate = null;
completeness = 'INCOMPLETE';
           return withDiagnostics(buildFailedOutput(base, gitCapability, complexityCapability, coverageCapability, threshold, coverageErrorReason), lineage, buildQuality({ complexityCapability, coverageUsable: false }));
     }
    // Step 3: Attach coverage to complexity info
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
       return withDiagnostics(buildFailedOutput(base, gitCapability, complexityCapability, coverageCapability, threshold, coverageErrorReason), lineage, buildQuality({ complexityCapability, coverageUsable: !coverageResult.error && coverageResult.available === true }));
    }
    lineage.push({
        stage: 'attribution',
        ...attributionProvenance,
        inputs: {
            methods: attributedComplexity.length,
            // Canonical vocabulary (ADR-0001): derived via attribution => ATTRIBUTED, else UNAVAILABLE
            quality: coverageResult.available && !coverageResult.error ? 'ATTRIBUTED' : 'UNAVAILABLE'
        }
    });
    // Step 4: Compute CRAP for each attributed complexity
    const crappedComplexity = attributedComplexity.map(ac => ({
        ...ac.info,
        crap: calculateCrap(ac.info.cc, ac.coveragePercent),
        coverage: ac.coveragePercent,
        coverageKind: ac.coverageKind ?? 'N/A',
        analyzerStatus: ac.coveragePercent !== null && ac.coveragePercent !== undefined ? 'passed' : 'skipped',
        source: {
            tool: '@barney-media/crap-typescript-core',
            version: '0.5.0'
        }
    }));
    lineage.push({ stage: 'crapCalc', ...crapCalcProvenance, inputs: { functions: crappedComplexity.length } });
    // Step 5: Build MethodEvidence array for correlation (using the ChangedFunction interface, which is the same as MethodEvidence for the fields we need)
    const methodEvidence = [];
    for (const c of crappedComplexity) {
        methodEvidence.push({
            file: c.file,
            method: c.method,
            lineStart: c.lineStart,
            lineEnd: c.lineEnd,
            cc: c.cc,
            crap: c.crap,
            coverage: c.coverage,
            coverageKind: c.coverageKind,
            analyzerStatus: c.analyzerStatus,
            source: c.source
        });
    }
    // Step 6: Correlate with git intervals
    const changedFunctions = correlate(methodEvidence, intervals);
    // Step 7: Evaluate rule results (using the existing evaluateHighCrap from rules.js)
    const ruleResults = evaluateHighCrap(changedFunctions, threshold);
    lineage.push({ stage: 'rules', ...rulesProvenance, inputs: { threshold, functions: changedFunctions.length } });
    // Step 8: Compute overall gate and completeness
    // Gate: any WARN -> WARN else PASS
    const gateValue = ruleResults.some((r) => r.result === "WARN") ? "WARN" : "PASS";
    // Completeness: any NOT_EVALUATED -> INCOMPLETE else COMPLETE
    const completenessValue = ruleResults.some((r) => r.result === "NOT_EVALUATED") ? "INCOMPLETE" : "COMPLETE";
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
// Step 10: Build and return the OutputJson
      // Map language to changedFunctions based on file extension
      const languageMap = {
        '.py': 'python',
        '.ts': 'typescript',
        '.tsx': 'typescript',
        '.js': 'javascript',
        '.jsx': 'javascript',
        '.mjs': 'javascript',
        '.cjs': 'javascript'
      };
      const getLanguageForFile = (filePath) => {
        const ext = Object.keys(languageMap).find(key => filePath.endsWith(key));
        return ext ? languageMap[ext] : undefined;
      };
const detectNextFramework = (cwd, filePath) => {
         // 1. package.json next dep
         try {
           const pkg = JSON.parse(fs.readFileSync(path.resolve(cwd, 'package.json'), 'utf8'));
           const deps = { ...pkg.dependencies, ...pkg.devDependencies, ...pkg.peerDependencies };
           if (deps.next) return 'next';
         } catch {}
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
         // Helper for depth-limited directory walk (max depth 3)
         const walkDir = (dir, depth) => {
           if (depth > 3) return [];
           const entries = fs.readdirSync(dir, { withFileTypes: true });
           let files = [];
           for (const entry of entries) {
             const fullPath = path.join(dir, entry.name);
             if (entry.isDirectory()) {
               files = files.concat(walkDir(fullPath, depth + 1));
             } else {
               files.push(fullPath);
             }
           }
           return files;
         };
         // Check app/**/route.ts (any depth) — bounded scan
         const appDir = path.resolve(cwd, 'app');
         if (fs.existsSync(appDir)) {
           const routeFiles = walkDir(appDir, 0)
             .filter(f => f.endsWith('route.ts') || f.endsWith('route.tsx'));
           if (routeFiles.length > 0) return 'next';
         }
         // 4. Pages Router markers
         const pagesDir = path.resolve(cwd, 'pages');
         if (fs.existsSync(pagesDir)) {
           const pageFiles = walkDir(pagesDir, 0)
             .filter(f => f.endsWith('.tsx') || f.endsWith('.ts'));
           if (pageFiles.length > 0) return 'next';
         }
         // 5. React fallback
         try {
           const pkg = JSON.parse(fs.readFileSync(path.resolve(cwd, 'package.json'), 'utf8'));
           const deps = { ...pkg.dependencies, ...pkg.devDependencies, ...pkg.peerDependencies };
           if (deps.react) return 'react';
         } catch {}
         if (filePath.endsWith('.jsx')) return 'react';
         return undefined;
       };
      const changedFunctionsWithLanguage = changedFunctions.map(fn => {
        const lang = getLanguageForFile(fn.file);
        const fw = detectNextFramework(cwd, fn.file);
        return {
          ...fn,
          language: lang,
          ...(fw ? { framework: fw } : {})
        };
      });
      lineage.push({
        stage: 'evidence',
        ...evidenceProvenance,
        inputs: {
          base,
          threshold,
          changedFunctions: changedFunctionsWithLanguage.length,
          ruleResults: ruleResults.length
        }
      });
      return withDiagnostics({
          schemaVersion: '0.4',
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
function buildFailedOutput(base, gitCapability, complexityCapability, coverageCapability, threshold, coverageErrorReason) {
     return {
         schemaVersion: '0.4',
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