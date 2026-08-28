# ADR WP6 Strategic Direction

## Title
WP6 Strategic Direction and Minimal Proof

## Date
2026-08-28

## Status
Accepted

## Deciders
WP6 Strategic Direction Team (planner, implementer, documenter)

## Context
WP5 frozen at commit 21daa57 with F-03 remediation applied. The WP5.6 baseline shows:
- 145/145 tests passing
- 11-case corpus validating deterministic evidence model
- All invariants (INV-01 through INV-04) preserved
- Evidence contract schema 0.2 frozen
- CLAIM: Need to establish smallest useful engineering capability justified by WP5 evidence, not speculation.

## Decision
Selected **Reusable Evidence API (thin barrel) + Minimal CI gate proof via CLI** as combined minimal proof. Evidence contract schema 0.2 frozen.

This decision combines two complementary proofs:
1. Thin programmatic interface (src/index.ts) re-exporting buildEvidenceOutput for library consumption
2. Minimal CI gate proof (experiments/wp6/minimal-ci-proof/run-proof.sh) demonstrating real change → coverage artifact → structured output → gate evaluation

## Alternatives Considered & Rejected

### Engram Integration
- **Rejected**: Requires LLM interpretation validation not yet proven; adds coupling; evidence/judgment boundary needs stable contract first per Roadmap
- **Rationale**: Even if Engram is strongest potential consumer, usefulness classification is still AWAITING HUMAN REVIEW (Low/Medium confidence). Premidal to integrate before proving evidence usefulness.

### Historical Baseline
- **Rejected**: Risk delta hypothesis unvalidated; needs baseline DB before value proven
- **Rationale**: No evidence that historical delta improves decisions over absolute values in tested cases. Adds complexity (storage, comparison) without demonstrated need.

### Additional Language Support
- **Rejected Ricotta**: TypeScript signal shows Low/Medium confidence for cross-language applicability; second language adds maintenance without demand evidence
- **Rationale**: Zero evidence of cross-language applicability in WP5 corpus. Would require rebuilding core components per language. Violates minimality principle.

### Full Platform/Service
- **Rejected**: Violates minimality; optimization-before-baseline
- **Rationale**: Building dashboards, services, or multi-language frameworks before proving single-language useful capability is premature generalization.

### Freeze/Stop
- **Rejected**: Signal works deterministically for tested conditions; CLI proof demonstrates viable consumer
- **Rationale**: Contradicts WP6 objective to find smallest useful engineering capability. WP5.6 handoff explicitly expects WP6 decision and proof. Freeze justified only if evidence shows no useful signal; WP5 shows deterministic signal works under tested conditions.

## Consequences
- **Evidence layer stable**: Contract schema 0.2 frozen, enabling reliable factual input for future consumers
- **CI consumer usable today**: Proof demonstrates CLI can be used in CI for automated gating without platform changes
- **Programmatic barrel enables evolution**: Thin wrapper in src/index.ts allows future Engram/history integration without breaking contract
- **Preserves boundaries**: Maintains evidence/judgment separation; engine produces facts, gate/consumer applies policy

## Reversibility
**HIGH** - All changes are additive or standalone:
- src/index.ts: Pure re-export (deleting file reverts to WP5.6 state)
- docs/contracts/evidence-contract.md: Documentation only, additive
- experiments/wp6/minimal-ci-proof/: Standalone script and artifacts (deleting directory reverts)
- docs/adr/adr-wp6-strategic-direction.md: Documentation only
- Reversion command: `git revert HEAD` or `rm -rf experiments/wp6 docs/contracts docs/adr/adr-wp6* src/index.ts` returns to WP5.6 frozen state
- Contract changes are additive only (schema 0.2), no breaking changes

## Evidence
- Claims-evidence-matrix.md: 
  - CHANGED_FUNCTIONS identifiable: Medium/High confidence
  - CRAP deterministic: High confidence  
  - Usefulness classification: Low/Medium confidence (awaiting human review)
- minimal-ci-proof/sample-output.json: Shows gate PASS with real coverage attribution from actual test run
- Test suite: 147/147 tests pass (including new barrel tests), confirming no regressions

## References
- WP5.6 closure: experiments/wp5/wp5.6/WP5_6_CLOSURE.md
- WP5.6 remediation: experiments/wp5/wp5.6/WP5_6_REMEDIATION_CLOSURE.md
- Roadmap WP6 forks: experiments/wp6/strategy-evaluation.md (Section 42-177)

## Next Steps
- WP7: Productionization after human CONTINUE decision on usefulness classification
- WP8: Real-world validation in downstream consumer projects