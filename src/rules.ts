import { ChangedFunction } from './evidence.js';

export interface RuleResult {
  ruleId: "changed-function-high-crap";
  result: "PASS" | "WARN" | "NOT_EVALUATED";
  file: string;
  method: string;
  crap: number | null;
  threshold: number;
  cc: number;
  coverage: number | null;
}

/**
 * Evaluate changed functions against the high-CRAP rule.
 * @param changed Array of changed functions
 * @param threshold CRAP threshold (default 30)
 * @returns Array of rule results
 */
export function evaluateHighCrap(changed: ChangedFunction[], threshold: number): RuleResult[] {
  return changed.map((cf) => {
    if (cf.crap === null) {
      return {
        ruleId: "changed-function-high-crap",
        result: "NOT_EVALUATED",
        file: cf.file,
        method: cf.method,
        crap: cf.crap,
        threshold,
        cc: cf.cc,
        coverage: cf.coverage,
      };
    } else if (cf.crap <= threshold) {
      return {
        ruleId: "changed-function-high-crap",
        result: "PASS",
        file: cf.file,
        method: cf.method,
        crap: cf.crap,
        threshold,
        cc: cf.cc,
        coverage: cf.coverage,
      };
    } else {
      return {
        ruleId: "changed-function-high-crap",
        result: "WARN",
        file: cf.file,
        method: cf.method,
        crap: cf.crap,
        threshold,
        cc: cf.cc,
        coverage: cf.coverage,
      };
    }
  });
}