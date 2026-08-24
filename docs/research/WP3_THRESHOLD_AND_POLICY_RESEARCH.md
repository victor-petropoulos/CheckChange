# WP3 Threshold and Policy Research

## Decision Summary

The research supports a deliberately conservative WP3:

- Historical/default CRAP reference threshold: **30**
- Threshold is a heuristic, not a scientific boundary
- Threshold must be configurable
- Initial behavior is advisory, not blocking
- No independent universal coverage threshold in WP3
- No test-failure rule in WP3
- Preserve CC and coverage beside CRAP so the result remains explainable
- Future research should evaluate **baseline/delta/ratcheting**, because modern CRAP tools increasingly support regression detection

## Historical Basis

Alberto Savoia's 2007 crap4j write-up states that he and Bob Evans examined many examples, open-source projects, and developer opinions before initially choosing CRAP 30 as the threshold. The same write-up explicitly warns that CRAP and its numerical interpretation were experimental and should be refined with experience.

The important intent was to highlight truly risky methods rather than every method that could be improved.

The original relationship at threshold 30 was approximately:

| Cyclomatic complexity | Coverage needed to remain below 30 |
|---:|---:|
| 0–5 | 0% |
| 10 | 42% |
| 15 | 57% |
| 20 | 71% |
| 25 | 80% |
| 30 | 100% |
| 31+ | impossible |

This demonstrates why an additional blanket coverage threshold is conceptually questionable: coverage is already part of CRAP.

## Current Practice Survey

Current CRAP implementations do not converge on one universal threshold.

Examples found during research:

- `cargo-crap`: default 30; configurable; supports absolute gates and baseline regression gates.
- `poly-crap`: default 30; configurable; supports baseline comparison and regression failure.
- `crap4dotnet`: default 30; configurable; supports report comparison.
- `go-crap`: examples use 30 and support both absolute and regression gates.
- `crap4py`: default 30.
- `crap4ts`: documents 1–5 low, 5–30 moderate, 30+ high and also allows separate coverage/complexity gates.
- `crap-typescript`, our evidence source, currently uses a substantially stricter policy. Its policy is not automatically our policy.

The useful pattern is therefore not "everyone uses exactly the same threshold." The pattern is:

1. 30 remains the historical/common reference.
2. thresholds are configurable;
3. modern tools increasingly support baseline/regression comparison;
4. policy is kept separate from measurement.

## Why No Independent Coverage Gate Yet

CRAP is:

```text
CRAP(m) = CC(m)^2 × (1 - coverage(m))^3 + CC(m)
```

Coverage is already part of the score.

Adding:

```text
CRAP > 30 AND coverage < 80
```

would apply a second coverage policy on top of the coverage-sensitive metric.

A project may legitimately have its own coverage policy, but this prototype has not established one. Therefore WP3 does not invent one.

## Why Changed Code Matters

This project already evaluates current functions touched by a Git change. That is a useful first boundary: legacy functions outside the change are not surfaced merely because they are historically risky.

However, absolute changed-function CRAP still has a limitation:

```text
before 94 -> after 71
```

remains above 30 even though the developer improved it.

Conversely:

```text
before 12 -> after 27
```

remains below 30 despite a substantial regression.

Several current CRAP tools address this with baselines and regression detection.

## Future Ratcheting Hypothesis

A future experiment should compare baseline and current function evidence:

```text
absolute risk + risk delta
```

Possible future classifications:

```text
HIGH_RISK       current CRAP > threshold
IMPROVED        current CRAP < baseline CRAP
REGRESSED       current CRAP > baseline CRAP
UNCHANGED       difference within tolerance
```

A future gate such as "do not make measured risk worse" may be more defensible than blocking all existing high-risk functions.

This is **not part of WP3 implementation**.

## WP3 Policy

WP3 implements one advisory rule:

```text
CHANGED_FUNCTION_HIGH_CRAP
```

Semantics:

```text
CRAP unavailable -> NOT_EVALUATED
CRAP <= threshold -> PASS
CRAP > threshold  -> WARN
```

Default threshold:

```text
30
```

The threshold is configurable and visible in output.

No FAIL result is produced by this rule in WP3.

## Risk Labels

Do not introduce multiple policy categories unless they change behavior.

The human report may describe a function exceeding 30 as "high risk," but the machine rule result remains:

```text
PASS | WARN | NOT_EVALUATED
```

Avoid presenting 5 or any other lower number as an authoritative industry boundary.

## Research Sources

- Alberto Savoia, *The Code C.R.A.P. Metric Hits the Fan — Introducing the crap4j Plug-in* (Artima, 2007).
- `cargo-crap` documentation and baseline/regression workflow.
- `poly-crap` documentation and baseline checks.
- `crap4dotnet` threshold/report comparison documentation.
- `go-crap` CI threshold and regression options.
- `crap4py` threshold documentation.
- `crap4ts` threshold/risk documentation.
- `crap-typescript`, used by this prototype as the deterministic TypeScript evidence source.

Research date: 2026-08-23.
