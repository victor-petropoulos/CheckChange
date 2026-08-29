---
task: "WP9 Hardening Round 3 — external matrix second provider (Jest/Istanbul) (CONTINUE WITH CONSTRAINTS)"
created: "2026-08-29T21:50:32Z"
approved: true
tasks:
  - id: "1"
    description: "Clone ONE small TS repo using Jest/Istanbul (e.g., tiny TS lib with jest coverage, not vitest) under /tmp, generate coverage via `npm test -- --coverage` or `npx jest --coverage --coverageProvider=istanbul --coverageReporters=json`, ensure output is Istanbul JSON (coverage/coverage-final.json or coverage/coverage.json), run engine `node dist/cli.js check --base <sha> --json --coverage-file <path>`, capture output JSON valid per contract 0.2, record repro log with repo URL, commit SHA, coverage cmd, artifact size (wc -c), analysis cmd, threshold 30, changed funcs, gate, exit code, INV-01..04 preserved. If network blocked or repo tooling mismatch, document fallback justification and use defu as second case variant (e.g., different base SHA)."
    agent: "implementer"
    files: ["experiments/wp9-hardening-round3/evidence/external-pilot-jest.json", "experiments/wp9-hardening-round3/repro-jest.md"]
    acceptance: "Evidence JSON file exists and passes contract 0.2 validation; repro log contains required fields; INV-01..04 verified; fallback documented if applicable."
    depends_on: []
  - id: "2"
    description: "If second pilot succeeds with different provider, add short addendum noting provider diversity (v8 vs Istanbul), artifact size, gate, and that per-repo validation hypothesis holds vs agnostic. If fallback, note. Threshold 30/15 unchanged."
    agent: "documenter"
    files: ["experiments/wp9-hardening-round3/threshold-addendum-round3.md"]
    acceptance: "Addendum file exists and contains required notes; threshold unchanged; no src modifications."
    depends_on: ["1"]
  - id: "3"
    description: "Verification report mirroring round2 but scoped to external matrix, run tsc, vitest (174 pass should remain, no src change), build, verify INV-01..04, compile report ending AWAITING HUMAN REVIEW PROPOSAL, confidence Low/Medium, no autonomous classification."
    agent: "documenter"
    files: ["experiments/wp9-hardening-round3/wp9-hardening-round3-report.md"]
    acceptance: "Report file exists; tsc passes with no new errors; vitest passes 174 tests; INV-01..04 verified; report ends with specified phrase; confidence set to Low/Medium."
    depends_on: ["1", "2"]
---

# WP9 Hardening Round 3 — external matrix second provider

Source: WP9 hardening rounds 1-2 completed (cli.ts 87.8% main integration, defu v8 pilot PASS). Next smallest constrained slice is second provider diversity (Jest/Istanbul) per WP9 prioritization external pilot selected high value, cost Low, risk Low, validated via engine check.

Constraints: contract 0.2 frozen, no CRAP/threshold change, INV-01..04 preserved, no new languages/DB/service, reversible via git revert, Low/Medium confidence, evidence per Roadmap fork.
