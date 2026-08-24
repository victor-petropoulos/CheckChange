# WP4.1 Failure Semantics Questions

These questions must be answered from the WP4 failures before another usefulness validation is attempted.

## Cases

### Case A — Successful Analysis, No Relevant Changed Functions

Example: a valid TypeScript analysis succeeds, but the Git change touches no analyzable current functions.

Should likely remain a successful analysis.

Question: should gate be PASS, or should gate be N/A because no rule was evaluated?

### Case B — Unsupported Source Type

Example: implementation change is JavaScript while the prototype supports TypeScript only.

This must not masquerade as a TypeScript analysis success.

Questions:

- `analysisStatus = UNSUPPORTED`?
- `gate = null`?
- non-zero exit code?
- capability detail?

### Case C — Evidence Provider Fails

Example: crap-typescript coverage command exits unsuccessfully.

This must not produce a clean PASS/COMPLETE result.

Questions:

- `analysisStatus = FAILED`?
- `gate = null`?
- `completeness = INCOMPLETE`?
- process exit code?
- preserve provider stderr?

### Case D — Function Exists but CRAP Is Unavailable

This is the WP3 case already modeled as:

```text
rule result: NOT_EVALUATED
completeness: INCOMPLETE
```

Question: does the overall analysis still count as successful? Likely yes if the provider itself succeeded and explicitly reported unavailable evidence.

### Case E — Partial Provider Output

Some changed functions have complete evidence and others do not.

The gate may still contain PASS/WARN findings, but completeness must be INCOMPLETE.

## Separation to Preserve

WP4.1 should evaluate a three-axis model:

```text
analysisStatus
gate
completeness
```

These answer different questions:

```text
analysisStatus -> did evidence acquisition execute meaningfully?
gate           -> what did evaluated policy rules conclude?
completeness   -> how much required evidence was available?
```

Do not collapse these into one status.
