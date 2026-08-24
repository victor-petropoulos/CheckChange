# WP3 Rule Semantics Decision

## Status

**READY TO IMPLEMENT**

## Rule Set for WP3

WP3 contains exactly one substantive rule:

```text
CHANGED_FUNCTION_HIGH_CRAP
```

The input set is already present in the verified v0.1 evidence envelope.

## Rule Result Vocabulary

```text
PASS
WARN
NOT_EVALUATED
```

WP3 has no rule-level FAIL.

## Truth Table

| Changed function | CRAP available | CRAP > threshold | Result |
|---|---|---|---|
| yes | yes | no | PASS |
| yes | yes | yes | WARN |
| yes | no | n/a | NOT_EVALUATED |

Only `changedFunctions` are evaluated, so an additional changed=false branch is unnecessary.

## Threshold Policy

Default:

```text
crapThreshold = 30
```

Requirements:

- configurable from CLI;
- finite numeric value;
- non-negative;
- included in output;
- historical provenance documented;
- never described as scientifically proven.

Suggested CLI:

```bash
tool check --base main --crap-threshold 30 --json
```

## Gate Semantics

WP3 is advisory.

Overall result:

```text
any WARN -> WARN
otherwise -> PASS
```

Incomplete evaluation is reported separately:

```text
completeness: COMPLETE | INCOMPLETE
```

Any `NOT_EVALUATED` function makes completeness `INCOMPLETE`.

A tool/runtime failure remains an execution error, not PASS/WARN.

## Finding Shape

A warning must be factual:

```json
{
  "ruleId": "changed-function-high-crap",
  "result": "WARN",
  "file": "src/example.ts",
  "method": "calculateFinalPrice",
  "crap": 37.4,
  "threshold": 30,
  "cc": 10,
  "coverage": 38
}
```

Do not generate subjective prose about code quality.

## No Separate Coverage Rule

Coverage remains visible evidence but is not independently gated.

Reason: coverage already participates in CRAP, and this project has no evidence-backed universal coverage policy.

## Test Failure Deferred

R1/test failure is deferred.

It would require a new evidence source and test-command contract. WP3 first tests whether the already-proven change + CRAP + coverage evidence is useful.

## Future Work Explicitly Deferred

Baseline/delta/ratcheting is the leading future experiment, but is not part of WP3.

Do not implement:

- baseline analyzer runs;
- historical CRAP reconstruction;
- regression gates;
- separate coverage thresholds;
- CC thresholds;
- test execution;
- FAIL gates.

## Implementation Authorization

WP3 implementation may proceed under these exact semantics.

READY TO IMPLEMENT
