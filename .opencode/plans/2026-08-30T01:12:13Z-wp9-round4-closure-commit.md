---
task: "WP9 Hardening Round 4 closure — commit artifacts + verification gate"
created: "2026-08-30T01:12:13Z"
approved: true
tasks:
  - id: "1"
    description: "Run final verification: tsc --noEmit (0 errors), vitest --no-coverage (174/174 pass), npm run build (dist/cli.js exists), validate evidence JSON contract 0.2 (schemaVersion, gate PASS, Istanbul coverage), confirm INV-01..04 preserved per report"
    agent: "tester"
    files: ["experiments/wp9-hardening-round4/evidence/external-pilot-jest-genuine.json", "experiments/wp9-hardening-round4/wp9-hardening-round4-report.md"]
    acceptance: "tsc exit 0; vitest 174/174 pass; build ok; evidence JSON valid per contract 0.2 with gate PASS and Istanbul coverage; INV-01..04 confirmed preserved in report"
    depends_on: []
  - id: "2"
    description: "Stage and commit WP9 round4 artifacts: add experiments/wp9-hardening-round4/ (evidence, repro, addendum, report), update OPENCODE_START_HERE.md to reflect completion and await human review"
    agent: "implementer"
    files: ["OPENCODE_START_HERE.md", "experiments/wp9-hardening-round4/evidence/external-pilot-jest-genuine.json", "experiments/wp9-hardening-round4/repro-jest-genuine.md", "experiments/wp9-hardening-round4/threshold-addendum-round4.md", "experiments/wp9-hardening-round4/wp9-hardening-round4-report.md"]
    acceptance: "git status shows staged changes; commit includes all round4 artifacts + OPENCODE_START_HERE.md update; commit message describes WP9 round4 completion"
    depends_on: ["1"]
  - id: "3"
    description: "Finalize human-review packet: ensure report ends with explicit AWAITING HUMAN REVIEW and gate recommendation (CONTINUE WITH CONSTRAINTS) is evidence-backed per verification; prepare summary for human review"
    agent: "documenter"
    files: ["experiments/wp9-hardening-round4/wp9-hardening-round4-report.md"]
    acceptance: "Report contains AWAITING HUMAN REVIEW line; gate recommendation CONTINUE WITH CONSTRAINTS is supported by evidence (n=2 providers, contract frozen, threshold unchanged, INV preserved, verification clean)"
    depends_on: ["2"]
---