---
task: "WP9 Hardening Round 6 — microsoft/tsdoc genuine Jest/v8 provider n=3"
created: "2026-08-30T04:00:00Z"
approved: true
tasks:
  - id: "1"
    description: "Clone microsoft/tsdoc at /tmp/tsdoc, pick base commit with TS changes in tsdoc/src, run Jest v8 with json reporter to get coverage, run dist/cli.js check --base <base> --json --coverage-file <path>, validate schema 0.2, gate PASS, INV-01..04, write evidence JSON + repro doc. If first base no changed funcs or no coverage, try second base."
    agent: "implementer"
    files: [
      "experiments/wp9-hardening-round6/evidence/tsdoc-genuine.json",
      "experiments/wp9-hardening-round6/repro-tsdoc-genuine.md"
    ]
    acceptance: "Evidence JSON valid per schema 0.2 (has schemaVersion, analysisStatus, gate, completeness, capabilities, changedFunctions[], policy, ruleResults[], analysisStatus, gate, completeness, coverageErrorReason if any), gate PASS/SUCCESS, INV-01..04 preserved (ZERO≠NULL, MISSING≠MALFORMED, GIT≠REPO, ANALYZER TRUTHFUL), repro doc includes env Node v24.18.1, engine commit, artifact size, and verification steps."
    depends_on: []
  - id: "2"
    description: "Run verification: tsc --noEmit (0 errors), vitest --no-coverage (178 pass), npm run build (dist/cli.js exists), write threshold-addendum-round6.md (threshold 30/15 frozen, no src changes, reversible), wp9-hardening-round6-report.md with test matrix (n=2→n=3), contract verification (schema 0.2 frozen, INV-01..04), operational delta (provider diversity up), limitations (monorepo untested, sample small), gate PROPOSAL CONTINUE WITH CONSTRAINTS ending AWAITING HUMAN REVIEW."
    agent: "implementer"
    files: [
      "experiments/wp9-hardening-round6/threshold-addendum-round6.md",
      "experiments/wp9-hardening-round6/wp9-hardening-round6-report.md"
    ]
    acceptance: "tsc exit 0; vitest 178 pass; build ok; threshold addendum no change; report includes test matrix, contract verification, operational delta, limitations, ends with AWAITING HUMAN REVIEW."
    depends_on: ["1"]
---