---
task: "WP3 — Advisory High-CRAP Rule"
created: 2026-08-24T02:00:00.000Z
approved: true
tasks:
  - id: "1"
    description: "Implement src/rules.ts — CHANGED_FUNCTION_HIGH_CRAP rule (crap null -> NOT_EVALUATED, <=threshold PASS, >threshold WARN), default 30, finite non-negative validation"
    agent: "implementer"
    files: ["src/rules.ts"]
    acceptance: "Rule function takes ChangedFunction[] + threshold -> RuleResult[] with ruleId, result, file, method, crap, threshold, cc, coverage; 0 preserved as PASS, null as NOT_EVALUATED"
    depends_on: []
  - id: "2"
    description: "Implement gate/completeness + extend OutputJson with policy, ruleResults, gate, completeness"
    agent: "implementer"
    files: ["src/evidence.ts"]
    acceptance: "buildOutput extended minimally to include policy {crapThreshold}, ruleResults, gate (any WARN -> WARN else PASS), completeness (any NOT_EVALUATED -> INCOMPLETE else COMPLETE); target still current, schemaVersion 0.1 preserved"
    depends_on: ["1"]
  - id: "3"
    description: "Extend CLI with --crap-threshold <number>, default 30, reject invalid/negative/NaN/Infinity"
    agent: "implementer"
    files: ["src/cli.ts"]
    acceptance: "tool check --base main --crap-threshold 30 --json works; invalid threshold exits 1 with clear message; threshold visible in JSON output policy"
    depends_on: ["2"]
  - id: "4"
    description: "Tests for 10 required cases (below, exact, above, null, zero, custom threshold, invalid, multi-function gate, incomplete, no changed)"
    agent: "implementer"
    files: ["test/rules.test.ts"]
    acceptance: "vitest run 48+ tests green covering all 10 cases"
    depends_on: ["3"]
  - id: "5"
    description: "Create docs/research/WP3_IMPLEMENTATION_RESULTS.md with LOC, tests, CLI examples, sample JSON/warning, threshold override, null example, deviations, no new analyzer confirmation, ending GO/CONSTRAINTS/STOP"
    agent: "implementer"
    files: ["docs/research/WP3_IMPLEMENTATION_RESULTS.md"]
    acceptance: "Results doc contains all required sections per WP3 spec, ends with exactly one decision"
    depends_on: ["4"]
---

# WP3 — Advisory High-CRAP Rule — Plan

## Objective
Add one advisory deterministic policy to verified pipeline: changed function + CRAP > threshold (default 30) -> WARN. No coverage gate, no FAIL, no baseline.

## Required Behavior
```
crap == null      -> NOT_EVALUATED
crap <= threshold -> PASS
crap > threshold  -> WARN
```
Gate: any WARN -> WARN else PASS
Completeness: any NOT_EVALUATED -> INCOMPLETE else COMPLETE

## CLI
--crap-threshold <number> default 30, finite, >=0, reject invalid/negative/NaN/Infinity

## Output extensions (minimal, preserve v0.1)
```
{
  "policy": {"crapThreshold":30},
  "ruleResults": [{"ruleId":"changed-function-high-crap","result":"WARN","file":...,"method":...,"crap":37.4,"threshold":30,"cc":10,"coverage":38}],
  "gate":"PASS|WARN",
  "completeness":"COMPLETE|INCOMPLETE"
}
```
For NOT_EVALUATED preserve crap:null.

## Human output (if exists) keep factual, no subjective prose.

## Required Tests (10)
1. below -> PASS
2. exact threshold -> PASS
3. above -> WARN
4. null -> NOT_EVALUATED
5. zero -> PASS
6. custom threshold changes result
7. invalid threshold rejected
8. multiple functions one WARN -> gate WARN
9. NOT_EVALUATED -> completeness INCOMPLETE
10. no changed -> PASS/COMPLETE

## Guardrails
No coverage rule, test rule, CC gate, baseline/delta, source parsing, LLM/Engram/MCP, provider architecture, multi-lang, SARIF, CI.

## Verification
- npx tsc --noEmit
- npx vitest run
- node dist/cli.js check --base HEAD --crap-threshold 30 --json shows policy, ruleResults, gate, completeness
