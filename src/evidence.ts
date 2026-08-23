import { MethodEvidence } from './crap.js';

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
  source: {
    tool: string;
    version: string;
  };
}

export interface OutputJson {
  schemaVersion: '0.1';
  analysis: {
    base: string;
    target: string;
  };
  capabilities: {
    git: string;
    crapTypescript: string;
  };
  changedFunctions: ChangedFunction[];
}

/**
 * Correlates method evidence against git intervals via integer overlap.
 * @param methodEvidence Array of method evidence from crap-typescript
 * @param intervals Map from file path to array of {start, end} intervals (1-based, inclusive)
 * @returns Array of changed functions that overlap with git intervals
 */
export function correlate(methodEvidence: MethodEvidence[], intervals: Map<string, Array<{ start: number; end: number }>>): ChangedFunction[] {
  const changedFunctions: ChangedFunction[] = [];

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
        source: {
          tool: '@barney-media/crap-typescript',
          version: '0.5.0'
        }
      });
    }
  }

  return changedFunctions;
}

/**
 * Builds the final JSON output.
 * @param base The base reference used for comparison
 * @param changed Array of changed functions
 * @param capabilities Optional capabilities object
 * @returns OutputJson object
 */
export function buildOutput(base: string, changed: ChangedFunction[], capabilities: { git?: string; crapTypescript?: string } = {}): OutputJson {
  return {
    schemaVersion: '0.1',
    analysis: {
      base: base,
      target: 'current' // As per WP1 spec, target is current
    },
    capabilities: {
      git: capabilities.git ?? 'available',
      crapTypescript: capabilities.crapTypescript ?? 'available'
    },
    changedFunctions: changed
  };
}