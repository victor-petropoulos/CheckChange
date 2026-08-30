---
task: "WP9 Hardening Round 7 — monorepo boundary validation (tsdoc full Rush monorepo vs subset)"
created: "2026-08-30T03:06:43Z"
approved: true
tasks:
  - id: "1"
    description: "Generate full monorepo coverage artifact for microsoft/tsdoc at /tmp/tsdoc, using Rush/heft full-repo coverage (investigate rush test vs heft test at root vs pnpm), produce Istanbul JSON, run engine check --base cc1dbc6 --coverage-file <full-artifact> --json, compare subset vs full: artifact size, changed func count, coverage attribution correctness, gate. Write evidence JSON + repro doc (include rush/heft cmd, artifact size, package list, engine output). If full generation fails due to policy/node version, document failure and fallback to documenting limitation with evidence."
    agent: "implementer"
    files: ["experiments/wp9-hardening-round7/full-coverage-artifact.json", "experiments/wp9-hardening-round7/repro.md", "experiments/wp9-hardening-round7/evidence.json"]
    acceptance: "Evidence JSON contains: rush/heft command used, artifact size in KB, list of packages covered, engine output summary (total files, total functions, covered functions, threshold result). Repro.md includes step-by-step to reproduce. If generation fails, evidence.json documents failure reason and fallback limitation."
    depends_on: []
  - id: "2"
    description: "Threshold addendum round7 + report (no threshold change), verification (tsc 0, vitest 178 pass, build ok), operational delta table (subset vs full), limitations update, gate PROPOSAL CONTINUE WITH CONSTRAINTS, ending AWAITING HUMAN REVIEW."
    agent: "implementer"
    files: ["experiments/wp9-hardening-round7/threshold-addendum.md", "experiments/wp9-hardening-round7/operational-delta.md", "experiments/wp9-hardening-round7/limitations-update.md"]
    acceptance: "Threshold addendum confirms no change to threshold 30/15 or schema 0.2. Verification passes: tsc exits 0, vitest 178 tests pass, build succeeds. Operational delta table shows subset vs full: artifact size, function count, coverage delta. Limitations update documents monorepo boundary validation outcome. Gate proposal: PROPOSAL CONTINUE WITH CONSTRAINTS. All files under experiments/wp9-hardening-round7/. No source engine changes."
    depends_on: ["1"]
---