---
task: "WP14 historical — fresh per-commit coverage under Node 20.9"
created: "2026-09-01T19:30:00Z"
approved: true
tasks:
  - id: "1"
    description: "Pin reproducible env — create .nvmrc (Node 20.10.0), verify nvm use 20.10.0 works, document heft test command under Node 20.9, prove node --version after nvm use, ensure heft test runs without rush.json Node version error"
    agent: "implementer"
    files: [".nvmrc", "scripts/wp14/repro.sh"]
    acceptance: "nvm use 20.10.0 → node --version shows v20.10.0; ./scripts/wp14/repro.sh runs heft test in TSDoc/Rush repo without 'Node version not supported' error"
    depends_on: []
  - id: "2"
    description: "Reproduce commit A (00203d4) with fresh coverage — git worktree/checkout commit 00203d4, run heft test under Node 20.9, capture coverage-final.json and engine output (schema 0.3), record provenance (commit, engine commit be2bca4, Node version, coverage command)"
    agent: "implementer"
    files: ["experiments/wp14/commit-A.json", "experiments/wp14/coverage-A.json"]
    acceptance: "coverage-A.json distinct from Round7 reused artifact; changedFunctions detected in commit-A.json; schemaVersion '0.3' present; language field populated; provenance metadata complete"
    depends_on: ["1"]
  - id: "3"
    description: "Reproduce commit B (e11ec0b) with fresh coverage — git worktree/checkout commit e11ec0b, run heft test under Node 20.9, capture coverage-final.json and engine output (schema 0.3), record provenance"
    agent: "implementer"
    files: ["experiments/wp14/commit-B.json", "experiments/wp14/coverage-B.json"]
    acceptance: "coverage-B.json distinct from coverage-A.json; deterministic CRAP per revision; changedFunctions for commit B detected; schema 0.3 PASS; provenance metadata complete"
    depends_on: ["1"]
  - id: "4"
    description: "Compare risk A vs B — delta table (complexity, coverage, CRAP, gate), assess meaningful comparison, document whether CRAP trend now coverage-aware vs complexity-only, verify all roadmap §9 success criteria"
    agent: "documenter"
    files: ["experiments/wp14/WP14_RESULTS.md"]
    acceptance: "WP14_RESULTS.md with claims/evidence matrix, repro steps, limitations, gate PASS/FAIL per roadmap §9: reproducible checkout, fresh coverage each commit, correct detection, deterministic CRAP, meaningful delta; explicit comparison table A vs B"
    depends_on: ["2", "3"]
  - id: "5"
    description: "Verify no regression — run tsc 0 errors, vitest 201/201, update OPENCODE_START_HERE.md current/next step, produce HUMAN_REVIEW_STUB increment for WP14"
    agent: "implementer"
    files: ["OPENCODE_START_HERE.md", "experiments/wp14/HUMAN_REVIEW_STUB.md"]
    acceptance: "npx tsc --noEmit → 0 errors; npx vitest run --no-coverage → 201/201 pass; OPENCODE_START_HERE.md reflects WP14 complete; HUMAN_REVIEW_STUB.md updated with WP14 scope, AWAITING HUMAN REVIEW footer"
    depends_on: ["4"]

# Ordering Rationale
# 1. Env pin (Task 1) must complete first — all subsequent tasks require Node 20.9 reproducibility.
# 2. Commit A (Task 2) and Commit B (Task 3) are independent after env ready — can run in parallel via separate worktrees.
# 3. Delta comparison (Task 4) requires both commit outputs — depends on 2 and 3.
# 4. Final gate (Task 5) runs after delta documented — ensures no regressions from experimental runs.
---