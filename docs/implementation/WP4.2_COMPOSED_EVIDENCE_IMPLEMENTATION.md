# WP4.2 — Composed Evidence Implementation

## Objective

Implement the WP4.1 decision without expanding scope:

```text
Git changed intervals
+
@barney-media/crap-typescript-core@0.5.0 function ranges + CC
+
existing Istanbul coverage/coverage-final.json if present
+
tiny CRAP arithmetic
+
existing WP3 rule
+
analysisStatus/gate/completeness semantics
```

## Hard Boundary

> This project consumes analysis. It does not perform source-code analysis.

Allowed:
- direct use of `crap-typescript-core`;
- reading Istanbul JSON;
- interval attribution;
- CRAP arithmetic.

Forbidden:
- custom TS parser;
- custom complexity algorithm;
- coverage instrumentation;
- target test execution;
- test-runner/package-manager discovery.

## Evidence Flow

### Git

Retain the verified `git diff --unified=0` parsing and current-side interval correlation.

### Function ranges + CC

Use `@barney-media/crap-typescript-core@0.5.0` directly.

Required fields:

```text
file
method
lineStart
lineEnd
cc
```

Do not invoke the full `crap-typescript` CLI.

### Coverage

Read only:

```text
coverage/coverage-final.json
```

If absent:

```text
coverage = null
crap = null
ruleResult = NOT_EVALUATED
```

Absence is not provider failure.

If present but malformed/unreadable:

```text
analysisStatus = FAILED
gate = null
completeness = INCOMPLETE
```

### Attribution

Map Istanbul statement/branch spans to known function ranges deterministically.

Do not parse TypeScript source.

If reliable attribution is unavailable, preserve `null`.

### CRAP

Use:

```text
CRAP = CC^2 * (1 - coverageFraction)^3 + CC
```

where `coverageFraction = coveragePercent / 100`.

### Existing WP3 rule

Keep exactly:

```text
crap == null       -> NOT_EVALUATED
crap <= threshold  -> PASS
crap > threshold   -> WARN
```

Default threshold remains 30.

## Status Contract

```text
analysisStatus: SUCCESS | UNSUPPORTED | FAILED
gate: PASS | WARN | null
completeness: COMPLETE | INCOMPLETE | NOT_APPLICABLE
```

### Applicable + complete

```text
SUCCESS / PASS|WARN / COMPLETE
```

### Applicable + missing coverage

```text
SUCCESS / PASS|WARN / INCOMPLETE
```

with affected functions `NOT_EVALUATED`.

### No relevant current TS functions after successful applicable analysis

```text
SUCCESS / PASS / COMPLETE
```

### Unsupported source/change

```text
UNSUPPORTED / null / NOT_APPLICABLE
```

exit 0.

### Internal/provider failure

```text
FAILED / null / INCOMPLETE
```

non-zero exit.

## Schema

Increment output to:

```text
schemaVersion: "0.2"
```

because semantics and top-level status change.

Suggested capabilities:

```text
git
complexity
coverageArtifact
```

Do not keep the old monolithic `crapTypescript` capability label.

## Dependency Strategy

Pin:

```text
@barney-media/crap-typescript-core@0.5.0
```

as this project's dependency.

Do not require target repos to install it.

## Required Tests

At minimum:

1. core parser provides function range + CC
2. valid coverage-final.json loads
3. absent artifact -> null coverage/null CRAP/NOT_EVALUATED
4. malformed artifact -> FAILED/null/INCOMPLETE
5. deterministic coverage attribution
6. unknown attribution -> null
7. known CRAP arithmetic
8. zero coverage remains 0
9. zero CRAP remains 0 when valid
10. SUCCESS/PASS/COMPLETE
11. SUCCESS/PASS/INCOMPLETE
12. SUCCESS/WARN/COMPLETE
13. UNSUPPORTED/null/NOT_APPLICABLE
14. FAILED/null/INCOMPLETE
15. no relevant TS functions -> SUCCESS/PASS/COMPLETE
16. threshold override still works
17. existing Git-correlation regression tests pass

## Compatibility Checks

Before completion, verify against:

- WP0 fixture
- one real TS repo with pre-generated coverage artifact
- one real TS repo without coverage artifact

This is not the WP4 rerun.

## Explicitly Forbidden

No:
- test execution
- coverage generation
- Vitest/Jest discovery
- package-manager orchestration
- JS support
- baseline/delta
- new rules
- coverage/CC thresholds
- lint/typecheck/security
- plugin/provider framework
- SARIF
- CI
- LLM
- Engram
- telemetry/database

## Deliverables

Create:

```text
experiments/wp4.2/
docs/research/WP4.2_IMPLEMENTATION_RESULTS.md
```

Results must include LOC, dependencies, evidence flow, schema 0.2 example, all status examples, coverage-present/absent/malformed examples, tests, compatibility checks, deviations, and confirmation that no test execution/new analyzer was added.

End with exactly one:

```text
READY FOR WP4 RERUN
READY WITH CONSTRAINTS
STOP
```

Then stop for human review.
