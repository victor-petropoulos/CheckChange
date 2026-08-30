---
task: "WP9 Hardening Round 4 — genuine Jest/Istanbul second provider (CONTINUE WITH CONSTRAINTS)"
created: "2026-08-29T22:39:38Z"
approved: true
tasks:
  - id: "1"
    description: "Clone ONE small TS repo using Jest/Istanbul under /tmp (candidates: https://github.com/microsoft/tsdoc, https://github.com/kulshekhar/ts-jest, or https://github.com/typestack/class-validator — all Jest + TS), find base/head SHAs with TS file changes (git log --oneline -- diff --name-only filter), generate Istanbul JSON via npx jest --coverage --coverageProvider=istanbul --coverageReporters=json or npm test -- --coverage, ensure coverage/coverage-final.json exists with Istanbul statementMap, run engine node dist/cli.js check --base <sha> --json --coverage-file <path>, capture output JSON valid per contract 0.2, record repro log with repo URL, commit SHAs, coverage cmd, artifact size wc -c, analysis cmd, threshold 30, changed funcs, gate, exit code, INV-01..04 preserved. Must be genuine Jest/Istanbul, not vitest fallback; if all 3 candidates fail, document why and fallback not allowed this round (must try at least 3 candidates before reporting BLOCKED)."
    agent: "implementer"
    files: ["experiments/wp9-hardening-round4/evidence/external-pilot-jest-genuine.json", "experiments/wp9-hardening-round4/repro-jest-genuine.md"]
    acceptance: "Evidence JSON exists and passes contract 0.2 validation with coverageKind from Istanbul (statementMap); repro log contains required fields; INV-01..04 verified; provider is Jest/Istanbul (not v8 fallback)."
    depends_on: []
  - id: "2"
    description: "Threshold addendum round4 noting provider diversity now v8 vs Istanbul genuine, artifact sizes, gates, per-repo validation hypothesis result (holds vs agnostic), threshold 30/15 unchanged, CRAP frozen."
    agent: "documenter"
    files: ["experiments/wp9-hardening-round4/threshold-addendum-round4.md"]
    acceptance: "Addendum file exists with provider comparison table v8 vs Istanbul genuine, threshold unchanged, no src modifications."
    depends_on: ["1"]
  - id: "3"
    description: "Verification report mirroring round3 but scoped to genuine provider, run tsc, vitest (174 pass should remain, no src change), build, verify INV-01..04, compile report ending AWAITING HUMAN REVIEW PROPOSAL, confidence Medium (if genuine success) or Low if BLOCKED, no autonomous classification."
    agent: "documenter"
    files: ["experiments/wp9-hardening-round4/wp9-hardening-round4-report.md"]
    acceptance: "Report exists; tsc 0 errors; vitest 174 pass; INV-01..04 verified; ends with AWAITING HUMAN REVIEW; confidence set accordingly."
    depends_on: ["2"]
---

Constraints: contract 0.2 frozen, no CRAP/threshold change, INV-01..04 preserved, no new languages/DB/service, reversible via git revert.