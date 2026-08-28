# WP6 Human-Review Packet

## 1. What strategic direction chosen?
Evidence API + Minimal CI gate (combined minimal proof). See strategy-evaluation.md and decision-matrix.md.

## 2. Why justified by WP5 evidence?
Builds on proven deterministic evidence (High confidence in changed functions identifiable, CRAP deterministic, output explainable) and frozen JSON schema 0.2 contract (High confidence); demonstrates real consumption pattern; smallest reversible step; preserves evidence/judgment boundary. See claims-evidence-matrix.md and limitations.md.

## 3. What alternatives rejected and why?
See decision-matrix.md for full table. Summary:
- Engram Integration: Premature; no evidence of LLM usefulness (Low/Medium confidence).
- Historical Risk/Baseline: No evidence historical improves decisions; violates minimality.
- Additional Language Support: Zero cross-language evidence; premature generalization.
- Freeze-Stop: Contradicts WP6 objective; misses opportunity to demonstrate minimal useful capability.

## 4. What architecture?
Caller → Git diff → complexity → coverage → attribution → CRAP → policy → JSON (schema 0.2) → CLI → CI gate consumer; evidence/judgment boundary preserved. See ADR WP6 Strategic Direction (docs/adr/adr-wp6-strategic-direction.md).

## 5. What contract preserved?
Evidence contract schema 0.2 frozen; invariants INV-01..04 preserved. See docs/contracts/evidence-contract.md.

## 6. What minimal proof demonstrates?
Real caller (run-proof.sh) → real evidence (vitest coverage artifact) → deterministic engine (code-risk CLI) → real structured output (sample-output.json gate PASS) → real consumer (script gate evaluation). See experiments/wp6/minimal-ci-proof/run-proof.sh, sample-output.json, run-log.md.

## 7. What reversibility?
HIGH. All changes additive or standalone:
- src/index.ts: Pure re-export (deleting reverts to WP5.6 state)
- docs/contracts/evidence-contract.md: Documentation only
- experiments/wp6/minimal-ci-proof/: Standalone script/artifacts (deleting directory reverts)
- docs/adr/adr-wp6-strategic-direction.md: Documentation only
Reversion: `git revert HEAD` or delete proof artifacts and src/index.ts. See ADR reversibility section.

## 8. What limitations remain?
- Usefulness classification still Low/Medium awaiting human review (11-case sample insufficient for universal claim)
- TypeScript/JavaScript focus only; no monorepo, LCOV, or other language coverage
- Caller owns coverage generation; engine does not run tests
- Deterministic engine does not orchestrates no external processes (CI proof uses shell script but engine unchanged)
- See limitations.md for detailed scope/methodological limitations.

## 9. Would you CONTINUE / CONTINUE WITH CONSTRAINTS / STOP?
AWAITING HUMAN REVIEW

## WP6 Claims / Evidence Matrix
| Claim | Evidence | Confidence | Limitation |
|-------|----------|------------|------------|
| Changed functions identifiable from Git diff + complexity analysis | 11 cases: 5 re-executed, 6 replay-only; 4/5 re-executed produced expected locked-focus functions | Medium/High | TypeScript/JavaScript only; monorepos untested; apollo scope mismatch |
| CRAP deterministic | 5 re-executed cases × 2 thresholds reproduce WP4R frozen baseline exactly | High | Tested environments only; documented path-coupling caveat (F-03 RESOLVED in WP5.6) |
| Evidence contract stable (schema 0.2) | All 11 cases produce schemaVersion: 0.2 JSON with required fields; invariants INV-01..04 verified | High | JSON only; no terminal/human-friendly output |
| CI proof demonstrates consumption | Real change → coverage artifact → structured output → gate PASS in sample-output.json; reproducible via ./run-proof.sh | High | Proof demonstrates mechanism, not policy; usefulness still awaiting human review |
| Usefulness classification | 8 WP4R PASS samples + SUP-A EXPECTED_WARN + SUP-B EXPECTED_PASS/USEFUL_WARN | Low/Medium | 11-case sample; single repo (h3) for WARN cases; human classifications recorded, not autonomously assigned |
AWAITING HUMAN REVIEW
