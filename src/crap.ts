import { execute } from './execute.js';

export interface MethodEvidence {
  file: string;
  method: string;
  lineStart: number;
  lineEnd: number;
  cc: number;
  crap: number | null;
  coverage: number | null;
  coverageKind: string;
  analyzerStatus: 'passed' | 'failed' | 'skipped';
}

export interface CrapResult {
  methodEvidence: MethodEvidence[];
  rawJson: string;
  exitCode: number | null;
  stderr: string;
  durationMs: number;
}

/**
 * Runs crap-typescript and returns the parsed result.
 * @param cwd The current working directory (defaults to process.cwd())
 * @returns Promise<CrapResult>
 */
export async function runCrap(cwd: string = process.cwd()): Promise<CrapResult> {
  const start = Date.now();
  const result = await execute('npx', ['--no-install', 'crap-typescript', '--format', 'json'], { cwd });
  const end = Date.now();
  const durationMs = end - start;

  let exitCode: number | null = result.exitCode;

  // We'll keep exitCode as is (number | null)

  let methodEvidence: MethodEvidence[] = [];
  let rawJson = result.stdout;

  // Try to parse the JSON
  let parsed: any = null;
  try {
    parsed = JSON.parse(result.stdout);
  } catch (e) {
    // If JSON parsing fails, we return empty methodEvidence and the exitCode as is
    return {
      methodEvidence: [],
      rawJson: result.stdout,
      exitCode,
      stderr: result.stderr,
      durationMs
    };
  }

  // Check if we have a methods array
  if (parsed && Array.isArray(parsed.methods)) {
    methodEvidence = parsed.methods.map((method: any) => ({
      file: method.src,
      method: method.method,
      lineStart: method.lineStart,
      lineEnd: method.lineEnd,
      cc: method.cc,
      crap: method.crap !== undefined && method.crap !== null ? method.crap : null,
      coverage: method.cov !== undefined && method.cov !== null ? method.cov : null,
      coverageKind: 
        method.covKind === 'stmt' ? 'stmt' :
        method.covKind === 'N/A' ? 'N/A' :
        method.covKind,
      analyzerStatus: method.status
    }));
  }

  return {
    methodEvidence,
    rawJson: result.stdout,
    exitCode,
    stderr: result.stderr,
    durationMs
  };
}

/**
 * Parses a crap-typescript JSON string into method evidence.
 * Used for unit tests.
 * @param jsonStr The JSON string output from crap-typescript
 * @returns MethodEvidence[]
 */
export function parseCrapJson(jsonStr: string): MethodEvidence[] {
  try {
    const parsed = JSON.parse(jsonStr);
    if (parsed && Array.isArray(parsed.methods)) {
      return parsed.methods.map((method: any) => ({
file: method.src,
      method: method.method,
      lineStart: method.lineStart,
      lineEnd: method.lineEnd,
      cc: method.cc,
      crap: method.crap !== undefined && method.crap !== null ? method.crap : null,
      coverage: method.cov !== undefined && method.cov !== null ? method.cov : null,
      coverageKind: 
        method.covKind === 'stmt' ? 'stmt' :
        method.covKind === 'N/A' ? 'N/A' :
        method.covKind,
      analyzerStatus: method.status
      }));
    }
  } catch (e) {
    // Return empty array on error
    return [];
  }
  return [];
}