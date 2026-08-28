# WP6 RESULTS

Status: WP6 — Strategic Direction and Minimal Proof — COMPLETE, awaiting human review per guardrail

Objective: What is smallest useful engineering capability justified by WP5 evidence?

WP5 evidence summary:
- Tests: 147/147 pass (54+ new)
- TypeScript compile: clean (npx tsc --noEmit no output)
- Build: ok
- 11-case corpus validating deterministic evidence model
- All invariants (INV-01 through INV-04) preserved
- F-03 (Istanbul path coupling) resolved in WP5.6 remediation
- Evidence contract schema 0.2 frozen

Strategic direction selected: Evidence API + Minimal CI gate
Justification: Smallest reversible step grounded in WP5 evidence (see strategy-evaluation.md); builds on proven deterministic evidence (High confidence) and frozen JSON schema 0.2 contract (High confidence); demonstrates real consumption pattern; defers usefulness classification to human review per WP5.6 guardrail.

Rejected alternatives table:
| Fork | Value | Evidence | Cost | Risk | Reversibility | Verdict | Rationale |
|------|-------|----------|------|------|---------------|---------|-----------|
| Reusable Evidence API | Deterministic service/library | High confidence in evidence model & JSON schema; WP5.6 frozen contract | Low (thin wrapper) | Low (preserves evidence/judgment boundary) | High (additive, removable) | Selected | Part of minimal proof; enables programmatic consumption without platform |
| Engram Integration | LLM auditor over factual evidence | No evidence of LLM usefulness; WP5.6 usefulness confidence Low/Medium | Medium (prompt design) | High (assumes usefulness without proof) | Medium (requires LLM code removal) | Rejected | Premature; need evidence consumer proof first |
| CI/CD Gate | Automated gating in CI | Deterministic engine works with real changes; gate evaluation functional | Low (shell script) | Low (focuses on mechanism not policy) | High (no persistent changes) | Selected | Part of minimal proof; demonstrates real evidence consumption |
| Historical Risk/Baseline | Contextual delta vs absolute | Changed-function count enables delta; deterministic supports baselines | Medium (storage/diff) | Medium (assumes historical value without proof) | Medium (would need removal) | Rejected | No evidence historical improves decisions; violates minimality |
| Additional Language Support | Language-independent model | Common model conceptualized; CRAP formula language-agnostic | High (language adapters) | Very High (builds framework before proof) | Low (language entanglement) | Rejected | Zero cross-language evidence; premature generalization |
| Freeze-Stop | Current evidence sufficient | Deterministic evidence model proven; contract frozen | Zero | None | N/A | Rejected | Contradicts WP6 objective; misses opportunity to demonstrate minimal useful capability |

Architecture chosen: caller → Git diff → complexity → coverage → attribution → CRAP → policy → JSON (schema 0.2) → CLI → CI gate consumer; evidence/judgment boundary preserved

Evidence contract preserved: schema 0.2 frozen, invariants INV-01..04 (see docs/contracts/evidence-contract.md)

Minimal integration proof: real caller → real evidence → deterministic engine → real structured output → real consumer
- Flow: ./run-proof.sh executes:
  1. Environment check (Node, npm, git, vitest)
  2. TypeScript build check (npx tsc --noEmit)
  3. Coverage artifact generation (npx vitest run --coverage → coverage-final.json)
  4. CLI check execution (node ./dist/cli.js check --base <BASE> --json --coverage-file <path>)
  5. JSON output saving and gate evaluation (parses sample-output.json for gate PASS)
- Output: sample-output.json shows gate PASS with real coverage attribution from actual test run (see experiments/wp6/minimal-ci-proof/sample-output.json)
- Reproducibility: run ./run-proof.sh in same directory; uses current HEAD and HEAD~1; env recorded in run-log.md

Production requirements / open risks / next-work-package recommendation:
- Production requirements: None for minimal proof; WP7 productionization if human decision CONTINUE
- Open risks: Usefulness classification still Low/Medium awaiting human review (per WP5.6 claims-evidence-matrix.md)
- Next-work-package: 
  - If CONTINUE: WP7 productionization (package, document, optimize)
  - If CONTINUE WITH CONSTRAINTS: WP7 with noted constraints (e.g., language scope, monorepo)
  - If STOP: Narrow research on usefulness or stop

Test results: 147/147 pass (54+ new), tsc clean, build ok

References:
- strategy-evaluation.md
- decision-matrix.md
- evidence-contract.md
- WP5_6_CLOSURE.md
- claims-evidence-matrix.md
- limitations.md
- run-proof.sh, sample-output.json, run-log.md
- src/index.ts, src/index.test.ts
- adr-wp6-strategic-direction.md
- Roadmap.txt (lines 1432-1449)

## Human-review gate
Possible outcomes: CONTINUE / CONTINUE WITH CONSTRAINTS / STOP
AWAITING HUMAN REVIEW
