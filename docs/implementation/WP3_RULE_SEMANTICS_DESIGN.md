# WP3 — Deterministic Rule Semantics Design

**DESIGN ONLY. DO NOT IMPLEMENT UNTIL WP2.1 IS REVIEWED.**

## Purpose

Define exactly what the prototype may conclude from deterministic evidence before encoding those conclusions in code.

## Principles

1. Rules use only machine-measurable evidence.
2. Every result is explainable from values and thresholds.
3. Missing evidence never becomes a favorable measurement.
4. Missing evidence never silently becomes zero.
5. Rules produce deterministic facts, not subjective review prose.
6. No LLM participates.
7. Analyzer defaults are not automatically product policy.

## Proposed Rule Result Vocabulary

```text
PASS
WARN
FAIL
NOT_EVALUATED
```

`NOT_EVALUATED` means required evidence was unavailable. It does not mean PASS.

## Proposed Overall Gate

```text
any FAIL -> FAIL
else any WARN -> WARN
else PASS
```

Incomplete evaluation must remain visible separately from the gate. A preferred direction to evaluate is:

```text
gate: PASS
completeness: INCOMPLETE
```

Tool/runtime failure must not silently become PASS.

## R1 — Tests Failed

Proposed semantics:

```text
tests passed          -> PASS
tests failed          -> FAIL
tests unavailable     -> NOT_EVALUATED
test execution error  -> NOT_EVALUATED + execution detail
```

R1 introduces a new evidence source. Before implementing it, decide how a test command is supplied without building test-framework/package-manager discovery machinery.

A deliberately small option is to require explicit configuration.

## R2 — Changed Function High CRAP

```text
crap == null       -> NOT_EVALUATED
crap <= threshold  -> PASS
crap > threshold   -> WARN or FAIL according to explicit policy
```

Do not silently inherit `crap-typescript`'s default threshold. Choose one:

A. require explicit configuration;
B. provide a clearly documented prototype default;
C. consume an explicitly supplied analyzer threshold.

The threshold must be shown with the measurement.

## R3 — Changed High-Risk Function With Inadequate Coverage

```text
crap == null OR coverage == null
    -> NOT_EVALUATED

crap > crapThreshold
AND coverage < coverageThreshold
    -> FAIL

otherwise
    -> PASS
```

Do not assume 70%, 80%, or another coverage threshold is inherently correct. Threshold policy must be explicit and visible.

## Scope Decision Required

R2 and R3 operate entirely on the already-proven WP2 envelope.

R1 requires a new evidence source.

Choose:

### Option A — R2/R3 first
Test whether change + CRAP + coverage is useful before expanding collection.

### Option B — all three
Only after defining a deliberately small test-command contract.

**Recommended: Option A.**

## Required Design Deliverable

Create `docs/research/WP3_RULE_SEMANTICS_DECISION.md` recording:

- final rule-result vocabulary
- gate semantics
- incomplete/unavailable behavior
- CRAP threshold policy
- coverage threshold policy
- whether R1 is included or deferred
- exact R2 truth table
- exact R3 truth table
- example deterministic output
- explicit non-goals

End with:

```text
READY TO IMPLEMENT
NEEDS REVISION
STOP
```

Do not implement rules during this design task.
