---
task: "WP9 Hardening Round 2 — main() integration + coverage signal densification (CONTINUE WITH CONSTRAINTS)"
created: "2026-08-29T19:30:00Z"
approved: true
tasks:
  - id: "1"
    description: "Add main() integration tests exercising src/cli.ts main() via direct import (not child process) with mocks for validateGitRepo, resolveBaseRef, getChangedIntervals, buildEvidenceOutput, and process.exit. Cover: success PASS with json false/true, verbose flag, gate WARN exit 1, analysisStatus FAILED with coverageErrorReason missing/malformed exit 1, git error catch path. Must mock git.js and evidence.js via vi.mock. Must assert process.exit codes and console.log/error calls. Must not test actual git history (mocked). Acceptance: main() coverage >0% (not null), vitest run test/cli.integration.spec.ts passes, no src change except test file (src/cli.ts already exported)."
    agent: "tester"
    files: ["test/cli.integration.spec.ts"]
    acceptance: "main() coverage entry exists in vitest coverage report (not null), test/cli.integration.spec.ts passes, no modifications to src/cli.ts"
    depends_on: []
  - id: "2"
    description: "Addendum updating threshold-addendum.md round1 with main() before/after (was 0% crap:null skipped, now measured with mocks, provide CRAP estimate CC12 coverage 0 vs measured 75% if mocked 100%? Actually main mocked → coverage still measured via v8? Note main now exercised → coverage entry exists). Document INV-01 preserved, threshold unchanged, gate logic. Acceptance: addendum with before/after table for main(), threshold 30/15 unchanged."
    agent: "documenter"
    files: ["experiments/wp9-hardening-round2/threshold-addendum-round2.md"]
    acceptance: "File exists with before/after CRAP table for main() showing transition from null to measured value, threshold 30/15 unchanged from evidence-contract.md"
    depends_on: ["1"]
  - id: "3"
    description: "Verification + round2 report mirroring round1 but scoped to main integration, run tsc, vitest, build, verify INV-01..04, compile report ending AWAITING HUMAN REVIEW. Acceptance: tsc clean, 170+ tests pass (166+new), build ok, report ends with PROPOSAL, confidence Low/Medium."
    agent: "documenter/tester"
    files: ["experiments/wp9-hardening-round2/wp9-hardening-round2-report.md"]
    acceptance: "tsc exits with code 0, vitest run passes 170+ tests, npm run build succeeds, report contains AWAITING HUMAN REVIEW and PROPOSAL, INV-01..04 verified in report"
    depends_on: ["1", "2"]
---