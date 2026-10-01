import { formatGitHub } from './github.js';
import { formatJUnit } from './junit.js';
import { formatSARIF } from './sarif.js';

/**
 * Formatters are pure sidecars: (EvidenceOutputShape, opts) => string.
 * They never call engine code and never emit absolute paths — file paths are
 * taken verbatim (forward-slash relative) from ruleResults[].file.
 *
 * NOTE: ruleResults carry no line info (RuleResult: rules.ts:6-15 has no
 * lineStart/lineEnd), so formatters pair each entry with the index-aligned
 * changedFunctions[i] entry for region lines. Alignment is guaranteed by
 * construction: evaluateHighCrap is changed.map() (rules.ts:23) and
 * buildEvidenceOutput's changedFunctionsWithLanguage is also a 1:1 .map()
 * (evidence.ts:603).
 */
export interface ChangedFunctionShape {
  file: string;
  method: string;
  lineStart: number;
  lineEnd: number;
  cc: number;
  crap: number | null;
  coverage: number | null;
}

export interface RuleResultShape {
  ruleId: string;
  result: 'PASS' | 'WARN' | 'NOT_EVALUATED';
  file: string;
  method: string;
  crap: number | null;
  threshold: number;
  cc: number;
  coverage: number | null;
}

/** Stable EvidenceOutputShape subset consumed by formatters (structural clone
 * of the CLI-private interface at cli.ts:126 — that one is not exported, so
 * formatters define their own and CLI passes its cast output in Task 2). */
export interface EvidenceOutputShape {
  analysisStatus: string;
  gate: string | null;
  completeness: string;
  schemaVersion: string;
  changedFunctions: ChangedFunctionShape[];
  ruleResults: RuleResultShape[];
}

export const FORMATS = ['github', 'junit', 'sarif'] as const;
export type FormatType = (typeof FORMATS)[number];

export function format(out: EvidenceOutputShape, fmt: FormatType, opts: { cwd: string }): string {
  switch (fmt) {
    case 'github':
      return formatGitHub(out, opts);
    case 'junit':
      return formatJUnit(out, opts);
    case 'sarif':
      return formatSARIF(out, opts);
  }
}