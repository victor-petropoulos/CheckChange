---
task: "Hardening B completion — zustand coverage, perf/sec, contract doc (addendum to hardening B)"
created: "2026-09-02T183000Z"
approved: true
tasks:
  - id: "6"
    description: "P0-2 zustand coverage: clone pmndrs/zustand, pnpm install, generate coverage/coverage-final.json via vitest/c8, verify language javascript framework react via buildEvidenceOutput/CLI"
    agent: "implementer"
    files:
      - "experiments/wp15-js/WP15_RESULTS.md"
      - "experiments/wp15-js/human-review-packet.md"
    acceptance: "For zustand: coverage/coverage-final.json exists (Istanbul JSON), npx tsx src/cli.ts check --base HEAD~1 --coverage-file <path/to/zustand/coverage/coverage-final.json> --json yields language javascript and framework react, CRAP numeric deterministic, tsc --noEmit 0, vitest 223+ pass"
    depends_on: ["1"]
  - id: "7"
    description: "P1-5 perf/sec: measure wall-clock time, memory RSS, coverage artifact size for p-queue, zustand, next-sample; note on handling malformed/missing/path-traversal coverage JSON"
    agent: "implementer"
    files:
      - "experiments/wp15-js/human-review-packet.md"
      - "docs/superpowers/plans/hardening-b-perf.md"
    acceptance: "Performance measurements documented (wall-clock time, memory RSS, coverage artifact size) for p-queue, zustand, next-sample; notes on handling malformed/missing/path-traversal coverage JSON; tsc --noEmit 0; vitest 223+ pass"
    depends_on: ["6"]
  - id: "8"
    description: "Contract doc update: update docs/contracts/evidence-contract.md with P0-1, P0-3, P1-4 bench, plus 4 provisional limitations as resolved/documented sections"
    agent: "documenter"
    files:
      - "docs/contracts/evidence-contract.md"
    acceptance: "Contract document includes sections for P0-1 (patch persistence), P0-3 (registry), P1-4 (CC benchmark correlation 0.626 documented, no correction factor), and the 4 limitations (real-repo coverage format mismatch, temp malformed file robustness, framework detection, parser persistence) with resolution/status; tsc --noEmit 0; vitest 223+ pass"
    depends_on: ["6", "7"]
---