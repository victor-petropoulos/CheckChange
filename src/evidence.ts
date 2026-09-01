// @ts-nocheck
import { evaluateHighCrap } from './rules.js';
import { collectComplexity } from './complexity.js';
import { readCoverage } from './coverage.js';
import { attachCoverage } from './attribution.js';
import { calculateCrap } from './crapCalc.js';

export interface ProviderFactory { 
  collectComplexity: (cwd:string)=>Promise<any[]>; 
  readCoverage: (cwd:string, file?:string)=>Promise<any> 
}
const providers = new Map<string, ProviderFactory>()
export function registerProvider(ext:string, factory:ProviderFactory){providers.set(ext,factory)}

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
    // Step 1: Collect complexity
    // Extension detection: prioritize .py > .tsx > .ts
    let detectedExtension = '.ts';
    let hasPy = false, hasTsx = false;
    for (const [filePath] of intervals) {
      if (filePath.endsWith('.py')) {
        hasPy = true;
        break;
      }
      if (filePath.endsWith('.tsx')) {
        hasTsx = true;
      }
    }
    if (hasPy) detectedExtension = '.py';
    else if (hasTsx) detectedExtension = '.tsx';
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
    // Helper to check if intervals contain only non-TS files
    const isUnsupportedIntervals = (intervals) => {
        if (intervals.size === 0) {
            return false; // empty intervals -> not unsupported (could be no changes)
        }
        for (const [filePath] of intervals) {
            if (filePath.endsWith('.ts') || filePath.endsWith('.tsx') || filePath.endsWith('.py')) {
                return false; // at least one supported file -> supported
            }
        }
        return true; // all files are non-TS and intervals non-empty
    };
    // If intervals indicate unsupported source (non-TS files only), return UNSUPPORTED
    if (isUnsupportedIntervals(intervals)) {
        return {
            schemaVersion: '0.3',
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
        };
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
        return {
            schemaVersion: '0.3',
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
        };
    }
// If coverage provider failed (malformed)
     if (coverageCapability === 'failed') {
analysisStatus = 'FAILED';
          gate = null;
          completeness = 'INCOMPLETE';
          return buildFailedOutput(base, gitCapability, complexityCapability, coverageCapability, threshold, coverageErrorReason);
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
      return buildFailedOutput(base, gitCapability, complexityCapability, coverageCapability, threshold, coverageErrorReason);
    }
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
       '.tsx': 'typescript'
     };
     const getLanguageForFile = (filePath) => {
       const ext = Object.keys(languageMap).find(key => filePath.endsWith(key));
       return ext ? languageMap[ext] : undefined;
     };
     const changedFunctionsWithLanguage = changedFunctions.map(fn => ({
       ...fn,
       language: getLanguageForFile(fn.file)
     }));
     return {
         schemaVersion: '0.3',
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
     };
}
// Helper function to build output when there is a provider failure
function buildFailedOutput(base, gitCapability, complexityCapability, coverageCapability, threshold, coverageErrorReason) {
     return {
         schemaVersion: '0.3',
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