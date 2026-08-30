---
task: "WP9 Hardening Round 8 — history/delta trend (2-point: 00203d4 vs e11ec0b on tsdoc eslint-plugin)"
created: "2026-08-30T15:41:21Z"
approved: true
tasks:
  - id: "1"
    description: "Create evidence directory for WP9 Hardening Round 8"
    agent: "implementer"
    files: ["experiments/wp9-hardening-round8/evidence/"]
    acceptance: "Directory experiments/wp9-hardening-round8/evidence exists"
    depends_on: []
  - id: "2"
    description: "Process commit 00203d4: checkout, run heft test for eslint-plugin, capture coverage, run engine check with base c908cc8 (parent of 00203d4)"
    agent: "implementer"
    files: ["experiments/wp9-hardening-round8/evidence/00203d4-coverage.json", "experiments/wp9-hardening-round8/evidence/00203d4-engine.json"]
    acceptance: "Coverage file 00203d4-coverage.json contains Istanbul coverage data for eslint-plugin subset. Engine output 00203d4-engine.json contains JSON with complexity and coverage data for getRootDirectoryFromContext and checkCommentBlocks functions."
    depends_on: ["1"]
  - id: "3"
    description: "Process commit e11ec0b: checkout, run heft test for eslint-plugin, capture coverage, run engine check with base cc1dbc6 (parent of e11ec0b)"
    agent: "implementer"
    files: ["experiments/wp9-hardening-round8/evidence/e11ec0b-coverage.json", "experiments/wp9-hardening-round8/evidence/e11ec0b-engine.json"]
    acceptance: "Coverage file e11ec0b-coverage.json contains Istanbul coverage data for eslint-plugin subset. Engine output e11ec0b-engine.json contains JSON with complexity and coverage data for getRootDirectoryFromContext and checkCommentBlocks functions (with base cc1dbc6)."
    depends_on: ["1"]
  - id: "4"
    description: "Write repro.md with step-by-step instructions for evidence generation"
    agent: "implementer"
    files: ["experiments/wp9-hardening-round8/repro.md"]
    acceptance: "repro.md includes: git checkout commands for 00203d4 and e11ec0b, heft test command with jest.custom.json, coverage copy commands, engine check commands with base c908cc8 for 00203d4 and base cc1dbc6 for e11ec0b, coverage files, expected outputs."
    depends_on: ["2", "3"]
  - id: "5"
    description: "Write threshold-addendum-round8.md confirming threshold 30/15 and schema 0.2 frozen"
    agent: "implementer"
    files: ["experiments/wp9-hardening-round8/threshold-addendum-round8.md"]
    acceptance: "threshold-addendum-round8.md states: threshold remains 30/15, schema remains 0.2, no changes from previous round."
    depends_on: ["1"]
  - id: "6"
    description: "Write report.md with delta table, verification, limitations, and gate PROPOSAL"
    agent: "implementer"
    files: ["experiments/wp9-hardening-round8/report.md"]
    acceptance: "report.md contains: delta table comparing cc/crap/coverage for getRootDirectoryFromContext and checkCommentBlocks at 00203d4 vs e11ec0b, gate comparison showing if API compat change altered CRAP, verification section (tsc 0 errors, vitest 178 tests pass, build succeeds), limitations section, gate PROPOSAL CONTINUE WITH CONSTRAINTS, ends with AWAITING HUMAN REVIEW block."
    depends_on: ["4", "5"]
---
<!-- NOTE: evidence-only, no src change, schema 0.2 frozen, threshold 30/15 frozen, INV-01..04 preserved, reversible -->