import { findAllTypeScriptFilesUnderSourceRoots, parseFileMethods } from '@barney-media/crap-typescript-core';
import { relative, resolve } from 'node:path';
import { execSync } from 'node:child_process';
import type { TraceRun } from './execute.js';

// Provenance for the complexity lineage stage: native analyzer from the core package.
// RETAINED as a plain const, not folded into the factory below: cache.ts:366 reads
// `.version` off it and test/lineage.test.ts:43 asserts it in a wholesale list.
export const complexityProvenance = { tool: '@barney-media/crap-typescript-core', version: '0.5.0' } as const;

/**
 * Which analyzer measured one function, and whether it was a real analyzer for
 * that language (`NATIVE`) or an approximation of one (`FALLBACK` — the ADR-0001
 * term reserved at docs/decisions/terminology-reconciliation.md:68,:112).
 *
 * It rides ON the measurement instead of being re-derived at the consumer, so
 * evidence.ts never learns a provider's tool name or its health from a literal
 * (D5). A measurement that omits `provenance` entirely was produced by the
 * default native analyzer above — that absence IS the TypeScript case.
 */
export interface MeasurementProvenance {
  tool: string;
  version: string;
  mode: 'NATIVE' | 'FALLBACK';
  /**
   * Provider-owned machine reason code for a FALLBACK measurement, e.g.
   * `csharp-analysis-failed`. Optional and NOT part of `source`: evidence reports
   * only `{ tool, version }` per function (the published Source shape), while this
   * rides the complexity LINEAGE entry — one key per run, so a consumer can tell
   * "approximated" from "approximated because the analyzer was missing".
   */
  degradation?: string;
}

export interface ComplexityInfo {
  file: string;
  method: string;
  lineStart: number;
  lineEnd: number;
  cc: number;
  /** Absent => measured by the default native analyzer (`complexityProvenance`). */
  provenance?: MeasurementProvenance;
}

/**
 * The `{ tool, version }` evidence reports for one measurement. A FACTORY, not a
 * second const, because the answer depends on the measurement; the default it
 * returns is `complexityProvenance` itself, so the TypeScript path is unchanged.
 */
export function measurementProvenance(info: ComplexityInfo | undefined): { tool: string; version: string } {
  const p = info?.provenance ?? complexityProvenance;
  // PROJECT, never pass the reference through. A full MeasurementProvenance also
  // carries `mode` and `degradation`, which are STAGE-level facts; returning it as-is
  // would widen the published per-function `source` shape from { tool, version } to
  // five keys and stamp a provider reason code onto every single function.
  return { tool: p.tool, version: p.version };
}

/**
 * ADR-0001 quality for a set of measurements: `FALLBACK` when ANY of them came
 * from an approximation. One approximate file makes the whole stage non-native —
 * reporting `NATIVE` over a mixed set is the false-provenance claim GAP 8 exists
 * to remove. Absent provenance => `NATIVE`.
 */
export function measurementQuality(infos: ReadonlyArray<{ provenance?: MeasurementProvenance }>): 'NATIVE' | 'FALLBACK' {
  return infos.some((info) => info.provenance?.mode === 'FALLBACK') ? 'FALLBACK' : 'NATIVE';
}

/**
 * The distinct provider reason codes behind a FALLBACK stage, in first-seen order.
 * Empty for a native or failed stage, so callers can spread the key in only when
 * it carries something — a `.ts` run's lineage entry stays byte-identical.
 */
export function measurementDegradations(
  infos: ReadonlyArray<{ provenance?: MeasurementProvenance }>,
): string[] {
  const codes: string[] = [];
  for (const info of infos) {
    const code = info.provenance?.degradation;
    if (code !== undefined && !codes.includes(code)) codes.push(code);
  }
  return codes;
}

export function getGitTrackedCodeFiles(cwd: string): string[] {
  try {
    // Get list of tracked files, one per line
    const output = execSync('git ls-files --cached --others --exclude-standard', { cwd, encoding: 'utf8' });
    const lines = output.trim().split('\n');
    const codeFiles: string[] = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (/\.(ts|tsx|js|jsx|mjs|cjs)$/.test(trimmed)) {
        // Convert to absolute path
        codeFiles.push(resolve(cwd, trimmed));
      }
    }
    return codeFiles;
  } catch {
    // If git fails (not a repo, or any error), return empty array
    return [];
  }
}

export async function collectComplexity(
  cwd: string,
  trace?: TraceRun,
  changedFiles?: ReadonlySet<string>,
): Promise<ComplexityInfo[]> {
  // Find all TypeScript files under the source roots
  const sourceRootFiles = await findAllTypeScriptFilesUnderSourceRoots(cwd);
  // Get all tracked code files in the repo (respects .gitignore)
  const gitTrackedCode = getGitTrackedCodeFiles(cwd);
   
  // Union of both lists, deduplicated
  const fileSet = new Set<string>();
  for (const f of sourceRootFiles) {
    fileSet.add(f);
  }
  for (const f of gitTrackedCode) {
    fileSet.add(f);
  }
  const filePaths = Array.from(fileSet);
   
  const complexityInfo: ComplexityInfo[] = [];
 
  for (const filePath of filePaths) {
    const rel = relative(cwd, filePath).replace(/\\/g, '/');
    if (changedFiles && !changedFiles.has(rel)) continue;
    try {
      const methodDescriptors = await parseFileMethods(filePath);
      for (const descriptor of methodDescriptors) {
        // Build method name: if containerName exists, use "containerName.functionName", else just functionName
        const methodName = descriptor.containerName
          ? `${descriptor.containerName}.${descriptor.functionName}`
          : descriptor.functionName;
        complexityInfo.push({
          file: rel,
          method: methodName,
          lineStart: descriptor.startLine,
          lineEnd: descriptor.endLine,
          cc: descriptor.complexity,
        });
      }
    } catch (error) {
      // If parsing fails for a single file (e.g., stray temp malformed JS), skip file rather than failing entire collection.
      // With a TraceRun the warning buffers there; without one the CLI console behavior is preserved.
      const message = `Warning: failed to parse ${filePath}, skipping: ${error instanceof Error ? error.message : String(error)}`;
      if (trace) {
        trace.recordWarning('complexity', message);
      } else {
        console.error(message);
      }
      continue;
    }
  }
 
  return complexityInfo;
}