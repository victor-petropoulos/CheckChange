# WP4.2.1 — Corrective Verification

## Status

**CURRENT**

This is a defect-correction and verification work package.

It is not a feature milestone.

## Objective

Correct the WP4.2 defects and prove that the composed-evidence pipeline works
end-to-end on changed TypeScript functions.

The required chain is:

```text
changed TS function
        ↓
function range + CC
        ↓
coverage attribution
        ↓
numeric CRAP
        ↓
existing WP3 rule
        ↓
PASS or WARN
```

WP4R remains blocked until this chain is demonstrated with zero failing required
tests.

## Source of This Work

WP4.2 reported failing or unresolved behavior in:

1. coverage attribution returning an object instead of a numeric value;
2. SUCCESS / PASS / COMPLETE;
3. SUCCESS / WARN / COMPLETE;
4. UNSUPPORTED / null / NOT_APPLICABLE;
5. FAILED / null / INCOMPLETE;
6. compatibility checks that exercised zero changed functions.

WP4.2.1 must address these exact items.

## Governing Constraint

> Fix defects. Do not broaden scope.

Do not add new evidence sources, rules, analyzers, languages, orchestration, or
policy.

## Task 1 — Fix Coverage Attribution Type/Shape

The coverage-attribution path must return the exact data shape required by the
evidence pipeline.

If the evidence model expects:

```ts
coverage: number | null
```

then attribution must not return an object where a number is expected.

Required outcomes:

```text
measured coverage -> number
measured 0%       -> 0
unavailable       -> null
```

Do not use implicit coercion.

Add focused regression tests for the defect found in WP4.2.

## Task 2 — Make Changed-Function Test Fixtures Real

The required PASS/WARN tests must exercise real Git-change intervals rather than
empty/no-change fixtures.

The test must mechanically produce or simulate:

```text
Git changed interval
intersects
current method interval
```

using the same production parser/correlation code.

Do not bypass `git.ts` / correlation logic merely to force a rule result.

## Task 3 — Prove PASS End-to-End

Create a deterministic fixture where:

- TypeScript function is changed;
- CC is available;
- valid Istanbul coverage is attributed;
- numeric CRAP is <= threshold 30;
- rule result is PASS.

Required overall:

```text
analysisStatus: SUCCESS
gate: PASS
completeness: COMPLETE
```

Capture actual JSON.

## Task 4 — Prove WARN End-to-End

Create a deterministic fixture where:

- TypeScript function is changed;
- CC is available;
- valid coverage is attributed;
- numeric CRAP is > 30;
- existing rule returns WARN.

Required overall:

```text
analysisStatus: SUCCESS
gate: WARN
completeness: COMPLETE
```

Do not lower the threshold merely to make this test easier unless the test is
specifically testing threshold override.

The default-threshold WARN fixture should exceed 30 naturally.

## Task 5 — Prove Missing Coverage Semantics

Create a changed-TypeScript-function case with no coverage artifact.

Required per function:

```text
coverage: null
crap: null
ruleResult: NOT_EVALUATED
```

Required overall:

```text
analysisStatus: SUCCESS
gate: PASS
completeness: INCOMPLETE
```

This must not become FAILED.

## Task 6 — Prove Unsupported Semantics

Use a source/change that is genuinely outside the TypeScript implementation
scope.

Required:

```text
analysisStatus: UNSUPPORTED
gate: null
completeness: NOT_APPLICABLE
```

Process exit must be 0.

The run must not masquerade as SUCCESS/PASS/COMPLETE.

## Task 7 — Prove Provider/Artifact Failure Semantics

Use a malformed existing `coverage/coverage-final.json`.

Required:

```text
analysisStatus: FAILED
gate: null
completeness: INCOMPLETE
```

Process exit must be non-zero.

Preserve a useful error message.

## Task 8 — Run Full Regression Suite

Required condition:

```text
0 failing tests
```

The results report must include the exact command and final pass/fail count.

Do not claim readiness while any required test remains failing.

## Required Test Matrix

At minimum these must all pass:

| Case | Required Result |
|---|---|
| function range + CC | deterministic values |
| valid coverage artifact | loads successfully |
| numeric attribution | number |
| zero coverage | `0` |
| missing coverage | `null` |
| CRAP known-value arithmetic | exact/tolerance match |
| changed-function PASS | SUCCESS/PASS/COMPLETE |
| changed-function WARN | SUCCESS/WARN/COMPLETE |
| missing coverage | SUCCESS/PASS/INCOMPLETE |
| unsupported input | UNSUPPORTED/null/NOT_APPLICABLE |
| malformed artifact | FAILED/null/INCOMPLETE |
| threshold override | behavior changes appropriately |
| Git correlation regression | still passes |

## Compatibility Verification

After unit/integration tests pass, run three controlled end-to-end checks:

### A — Complete PASS case

Changed TS function + valid coverage + CRAP <= 30.

### B — Complete WARN case

Changed TS function + valid coverage + CRAP > 30.

### C — Incomplete case

Changed TS function + no coverage artifact.

These checks must produce at least one actual `changedFunctions` entry each.

Zero-function compatibility checks do not satisfy WP4.2.1 acceptance criteria.

## Explicitly Forbidden

Do not:

- run target-project tests;
- generate coverage;
- add Vitest/Jest discovery;
- add package-manager orchestration;
- add JavaScript support;
- add baseline/delta;
- add new rules;
- change default threshold;
- add coverage or CC thresholds;
- add lint/typecheck/security;
- add provider/plugin abstractions;
- add SARIF;
- add CI;
- add LLM;
- add Engram;
- add telemetry;
- add database.

## Required Deliverables

Create:

```text
experiments/wp4.2.1/
docs/research/WP4.2.1_CORRECTIVE_VERIFICATION_RESULTS.md
```

The results document must include:

- defects found;
- exact production changes;
- exact test changes;
- before/after behavior;
- test command;
- total tests passed;
- total tests failed;
- complete PASS example;
- complete WARN example;
- missing-coverage example;
- unsupported example;
- malformed-artifact example;
- compatibility-check results;
- confirmation that no new product capability was added.

## Exit Decision

End the report with exactly one:

```text
VERIFIED — READY FOR WP4 RERUN
VERIFIED WITH CONSTRAINTS
STOP
```

### VERIFIED — READY FOR WP4 RERUN

All required tests pass, the full changed-function pipeline is demonstrated, and
no unresolved defect blocks real-repository validation.

### VERIFIED WITH CONSTRAINTS

All correctness tests pass, but a documented operational limitation must shape
WP4R.

### STOP

The composed evidence path cannot be made trustworthy without violating project
scope.

Then stop for human review.

Do not begin WP4R automatically.
