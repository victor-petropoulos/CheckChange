# WP6 Decision Matrix

| Fork | Value | Evidence | Cost | Risk | Reversibility | Verdict | Rationale |
|------|-------|----------|------|------|---------------|---------|-----------|
| Reusable Evidence API | Deterministic service/library | High confidence in evidence model & JSON schema; WP5.6 frozen contract | Low (thin wrapper) | Low (preserves evidence/judgment boundary) | High (additive, removable) | Selected | Part of minimal proof; enables programmatic consumption without platform |
| Engram Integration | LLM auditor over factual evidence | No evidence of LLM usefulness; WP5.6 usefulness confidence Low/Medium | Medium (prompt design) | High (assumes usefulness without proof) | Medium (requires LLM code removal) | Rejected | Premature; need evidence consumer proof first |
| CI/CD Gate | Automated gating in CI | Deterministic engine works with real changes; gate evaluation functional | Low (shell script) | Low (focuses on mechanism not policy) | High (no persistent changes) | Selected | Part of minimal proof; demonstrates real evidence consumption |
| Historical Risk/Baseline | Contextual delta vs absolute | Changed-function count enables delta; deterministic supports baselines | Medium (storage/diff) | Medium (assumes historical value without proof) | Medium (would need removal) | Rejected | No evidence historical improves decisions; violates minimality |
| Additional Language Support | Language-independent model | Common model conceptualized; CRAP formula language-agnostic | High (language adapters) | Very High (builds framework before proof) | Low (language entanglement) | Rejected | Zero cross-language evidence; premature generalization |
| Freeze-Stop | Current evidence sufficient | Deterministic evidence model proven; contract frozen | Zero | None | N/A | Rejected | Contradicts WP6 objective; misses opportunity to demonstrate minimal useful capability |

## Decision Summary
**Selected**: Evidence API + Minimal CI Gate (combined)

**Justification**: 
- Smallest reversible step grounded in WP5 evidence
- Preserves evidence/judgment boundary and minimality principles
- Demonstrates real caller → real evidence → deterministic engine → real structured output → gate evaluation
- Does not autonomously classify usefulness (defers to human review per WP5.6 guardrail)
- Fully reversible via `git revert` or artifact deletion

**Rejected Alternatives**: All other forks rejected due to lack of evidence, premature generalization, or violation of minimality principle.
