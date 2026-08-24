# OpenCode Start Here

## Current Status

WP0: COMPLETE — GO WITH CONSTRAINTS  
WP1: COMPLETE — GO  
WP1.1: COMPLETE — VERIFIED  
WP2: COMPLETE — VERIFIED  
WP2.1: COMPLETE — VERIFIED  
WP3 research/design: COMPLETE — READY TO IMPLEMENT  
WP3 implementation: **CURRENT**

## Read First

1. `docs/research/WP2.1_ENVELOPE_CLARIFICATION_RESULTS.md`
2. `docs/research/WP3_THRESHOLD_AND_POLICY_RESEARCH.md`
3. `docs/research/WP3_RULE_SEMANTICS_DECISION.md`
4. `docs/implementation/WP3_ADVISORY_HIGH_CRAP_RULE.md`

## Current Assignment

Execute WP3 implementation only.

Implement one advisory rule:

```text
changed function + CRAP > configurable threshold (default 30) -> WARN
```

No separate coverage gate. No test rule. No FAIL gate. No baseline/delta work.

Create `docs/research/WP3_IMPLEMENTATION_RESULTS.md`, end with `GO`, `GO WITH CONSTRAINTS`, or `STOP`, then stop.

> This project consumes analysis. It does not perform analysis.
