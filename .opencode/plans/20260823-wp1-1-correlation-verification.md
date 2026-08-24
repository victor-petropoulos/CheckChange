---
task: "WP1.1 — Correlation Verification"
created: 2026-08-23T15:00:00.000Z
approved: true
tasks:
  - id: "1"
    description: "Mechanically verify Git hunk parsing + interval intersection using WP1 code against fixture 4 cases"
    agent: "implementer"
    files: ["experiments/wp1.1/correlation-verification.json", "experiments/wp1.1/verify.ts"]
    acceptance: "JSON generated from code (same parser as WP1), contains exact hunks, parsed intervals, method ranges, intersections, changed flag per case; deleted case reports Git deletion true / evidence absent / historical unavailable"
    depends_on: []
  - id: "2"
    description: "Fix defects if verification exposes them + add regression tests"
    agent: "implementer"
    files: ["src/git.ts", "src/evidence.ts", "test/evidence.test.ts"]
    acceptance: "If defect found, fix parser/correlation, update tests, tsc+vitest green; if no defect, confirm no changes needed"
    depends_on: ["1"]
  - id: "3"
    description: "Create docs/research/WP1.1_CORRELATION_VERIFICATION_RESULTS.md with hunks, intervals, ranges, intersections, case results, defects, code changes, tests, ending VERIFIED/DEFECT FOUND AND FIXED/STOP"
    agent: "implementer"
    files: ["docs/research/WP1.1_CORRELATION_VERIFICATION_RESULTS.md"]
    acceptance: "Results doc contains all required sections per WP1.1 spec, ends with exactly one decision line"
    depends_on: ["2"]
---

# WP1.1 — Correlation Verification — Plan

## Overview
Generate mechanical verification of WP1 Git-hunk-to-function-range correlation using existing fixture, same parser code, no new features.

## Required Cases
- modified add
- added function (multiply/times)
- rename multiply → times
- deleted halve (Git deletion true, evidence absent)

## Artifact
`experiments/wp1.1/correlation-verification.json` suggested shape:
```json
{
  "cases": [{
    "case": "modified-add",
    "file": "src/math.ts",
    "gitIntervals": [{"start":2,"end":17}],
    "method": {"name":"add","start":1,"end":17},
    "intersections":[{"start":2,"end":17}],
    "changed": true
  }]
}
```
Must be generated from code, not copied. Use same Git parser and interval-intersection as WP1. Preserve exact diff inputs.

## Steps
1. In fixture repo, capture exact diffs for each case (already in experiments/wp1/*.txt but re-verify with -U0)
2. Capture analyzer JSON for current and historical if needed (already in experiments/wp1/crap-full.json and wp0/raw)
3. Run verification script using src/git.ts parseChangedIntervals and src/evidence.ts correlate logic to compute intersections per case
4. For deletion: check diff shows deletion hunk, method absent in current JSON, report unavailable
5. Write JSON artifact
6. If defect exposed, fix and add regression tests
7. Write results doc

## Forbidden
No AST, no symbol resolution, no rules, no new analyzers, no generalized architecture.

## Verification
- npx tsc --noEmit
- npx vitest run 38 green
- cat experiments/wp1.1/correlation-verification.json shows 4 cases with computed intersections
- Results doc ends with VERIFIED or DEFECT FOUND AND FIXED or STOP
