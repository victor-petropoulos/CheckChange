---
task: "WP5.4 — diagnostic and result-truthfulness correctness (V01/D10/G06/G07)"
created: 2026-08-27T16:02:00Z
approved: true
tasks:
  - id: "1"
    description: "FM-V01 fix — coverageArtifact absent vs available when default coverage missing"
    agent: "implementer"
    files: ["src/evidence.ts"]
    acceptance: "capabilities.coverageArtifact === 'absent' when default missing, 'available' when present, 'failed' when error:true; gate stays PASS; no CRAP/threshold change; WP5.2 Anchor2 still passes after update"
    depends_on: []
  - id: "2"
    description: "FM-G07 fix — analyzerStatus truthful (passed vs skipped)"
    agent: "implementer"
    files: ["src/evidence.ts"]
    acceptance: "analyzerStatus === 'passed' when coveragePercent !== null, 'skipped' when null; top-level analysisStatus/gate/completeness unchanged; WP5.2/3 anchors green"
    depends_on: ["1"]
  - id: "3"
    description: "FM-D10 fix — git ENOENT diagnostic distinct from not-a-repo"
    agent: "implementer"
    files: ["src/git.ts", "src/execute.ts"]
    acceptance: "ENOENT yields 'Git executable not found' (not 'Not a git repository'); non-repo still yields 'Not a git repository'; exit 1 both; no new flags"
    depends_on: ["2"]
  - id: "4"
    description: "FM-G06 fix — missing explicit coverage vs malformed artifact"
    agent: "implementer"
    files: ["src/coverage.ts", "src/cli.ts", "src/evidence.ts"]
    acceptance: "missing explicit file != malformed; stderr says 'missing' vs 'malformed'; FAILED/INCOMPLETE preserved; exit 1; deterministic"
    depends_on: ["3"]
  - id: "5"
    description: "WP5.4 verification + human-review packet"
    agent: "tester"
    files: ["experiments/wp5/wp5.4/WP5_4_RESULTS.md", "experiments/wp5/wp5.4/failure-semantics-contract.md"]
    acceptance: "full suite green; per-FM invariants tested; zero vs null, missing vs malformed, git-unavailable vs not-repo distinctions demonstrated; docs updated; AWAITING HUMAN REVIEW if no review supplied"
    depends_on: ["4"]
---

# WP5.4 — Correction Plan (executable)

Source of truth hierarchy per EXECUTION GUIDANCE: repo behavior > tests > closure docs > roadmap.
Reconciled FM taxonomy from experiments/wp5/wp5.4/wp5_4_taxonomy_reconciliation.md (all CONFIRMED).

Hard constraints: no threshold/CRAP/attribution/source-discovery/provider/language/LLM changes; preserve WP4R+WP5.1-5.3 anchors; deterministic.

Sequence phases: Orient (done) → Baseline (49/125 pass) → Inspect (src/*) → Implement minimal → Unit verify → Regression verify → Document+Gate.
