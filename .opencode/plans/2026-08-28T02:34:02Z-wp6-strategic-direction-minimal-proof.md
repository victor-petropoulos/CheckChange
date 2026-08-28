---
task: "WP6 — Strategic Direction and Minimal Proof"
created: "2026-08-28T02:34:02Z"
approved: true
tasks:
  - id: "1"
    description: "State reconstruction verification (read frozen docs, run baseline vitest, confirm 145/145)"
    agent: "researcher"
    files: []
    acceptance: "Tests pass: 145/145; Read WP5_6_CLOSURE.md and REMEDIATION_CLOSURE.md to confirm WP5 completion"
    depends_on: []
  - id: "2"
    description: "Strategic direction evaluation — analyze 6 forks against WP5 evidence matrix, produce decision doc with rejected alternatives"
    agent: "planner"
    files: ["experiments/wp6/strategy-evaluation.md", "experiments/wp6/decision-matrix.md"]
    acceptance: "Document comparing Evidence API, Engram, CI gate, Historical baseline, Additional language, Freeze/Stop forks with evidence from WP5.6 claims-evidence-matrix.md and limitations.md; Records rejected alternatives with rationale"
    depends_on: ["1"]
  - id: "3"
    description: "Evidence contract stabilization — freeze schema 0.2 contract doc, versioning, compatibility notes"
    agent: "implementer"
    files: ["docs/contracts/evidence-contract.md"]
    acceptance: "Create evidence contract document defining schema 0.2 fields, invariants (INV-01..04), versioning approach, and compatibility guarantees based on evidence.ts and WP5_6_CLOSURE.md"
    depends_on: ["2"]
  - id: "4"
    description: "Minimal CI proof — demonstrate engine as CLI in CI-like invocation (GitHub Actions local act or shell script): real repo change → coverage artifact → check --base --json → structured output → gate evaluation. Prove CI consumption without building platform."
    agent: "implementer"
    files: ["experiments/wp6/minimal-ci-proof/run-proof.sh", "experiments/wp6/minimal-ci-proof/sample-output.json", "experiments/wp6/minimal-ci-proof/run-log.md"]
    acceptance: "Shell script that runs the code-risk CLI against a real change, consumes JSON output, and evaluates gate decision; Must use real evidence (coverage artifact from a real test run) and demonstrate deterministic engine consumption"
    depends_on: ["3"]
  - id: "5"
    description: "Reusable Evidence API proof (thin adapter) — if CI proof shows need for stable programmatic interface, expose minimal library function wrapping buildEvidenceOutput that CI consumes; keep CLI as primary. Reversibility: thin wrapper, no new platform."
    agent: "implementer"
    files: ["src/index.ts", "src/index.test.ts"]
    acceptance: "If minimal CI proof indicates programmatic interface is useful, create thin wrapper around buildEvidenceOutput in src/index.ts with corresponding test; Otherwise document why direct CLI consumption is sufficient"
    depends_on: ["4"]
  - id: "6"
    description: "Reversibility & architecture decision record — ADR for WP6 choices, reversibility analysis."
    agent: "documenter"
    files: ["docs/adr/adr-wp6-strategic-direction.md"]
    acceptance: "Architecture Decision Record documenting WP6 strategic direction decision, rejected alternatives, reversibility analysis, and evidence supporting selection"
    depends_on: ["5"]
  - id: "7"
    description: "Human-review packet for WP6 — collate strategy, contract, proof results, next-gate recommendation, end with AWAITING HUMAN REVIEW."
    agent: "documenter"
    files: ["experiments/wp6/WP6_RESULTS.md", "experiments/wp6/human-review-packet.md"]
    acceptance: "Packet containing strategy evaluation, contract stabilization, minimal CI proof results, reversibility analysis, and explicit statement ending with 'AWAITING HUMAN REVIEW' for usefulness classification"
    depends_on: ["6"]
  - id: "8"
    description: "Review gates — reviewer + security-auditor on delta, tester verification."
    agent: "tester"
    files: ["test/unit/*"]
    acceptance: "Run vitest to confirm no regressions (145/145 pass); Review plan and implementation via Engram review_delta"
    depends_on: ["7"]
---