---
task: "WP4.2.1 — Corrective Verification"
created: 2026-08-24T06:00:00.000Z
approved: true
tasks:
  - id: "1"
    description: "Reproduce WP4.2 failures: run vitest and record 5 failing tests + messages"
    agent: "implementer"
    files: ["experiments/wp4.2.1/reproduce.md"]
    acceptance: "Recorded exact failing tests and messages before fix"
    depends_on: []
  - id: "2"
    description: "Fix coverage attribution to return number|null not object"
    agent: "implementer"
    files: ["src/attribution.ts", "test/wp4.2.test.ts"]
    acceptance: "deterministic coverage attribution test passes with number 0 and 100"
    depends_on: ["1"]
  - id: "3"
    description: "Fix status tests: SUCCESS/PASS/COMPLETE, SUCCESS/WARN/COMPLETE, UNSUPPORTED, FAILED with real Git intervals"
    agent: "implementer"
    files: ["src/evidence.ts", "test/wp4.2.test.ts"]
    acceptance: "All 5 status tests pass with real Git intervals and correct analysisStatus/gate/completeness"
    depends_on: ["2"]
  - id: "4"
    description: "Build real changed-function fixtures for PASS, WARN, NOT_EVALUATED end-to-end"
    agent: "implementer"
    files: ["experiments/wp4.2.1/fixtures/*"]
    acceptance: "Fixtures produce PASS (crap <=30), WARN (crap>30), NOT_EVALUATED (no coverage) with at least one changedFunctions item each"
    depends_on: ["3"]
  - id: "5"
    description: "Run full regression suite 0 failing, capture 5 end-to-end outputs (PASS, WARN, NOT_EVALUATED, UNSUPPORTED, FAILED)"
    agent: "implementer"
    files: ["experiments/wp4.2.1/outputs/*"]
    acceptance: "0 failing tests, 5 JSON outputs captured with required statuses"
    depends_on: ["4"]
  - id: "6"
    description: "Create docs/research/WP4.2.1_CORRECTIVE_VERIFICATION_RESULTS.md ending VERIFIED — READY FOR WP4 RERUN etc."
    agent: "implementer"
    files: ["docs/research/WP4.2.1_CORRECTIVE_VERIFICATION_RESULTS.md"]
    acceptance: "Results doc contains all required sections, ends with exactly one decision"
    depends_on: ["5"]
---

# WP4.2.1 — Corrective Verification — Plan

## Objective
Fix WP4.2 defects and prove chain: changed TS function -> CC -> coverage -> numeric CRAP -> PASS/WARN with zero failing tests.

## Defects to fix (5):
1. coverage attribution returning object not number
2. SUCCESS/PASS/COMPLETE
3. SUCCESS/WARN/COMPLETE
4. UNSUPPORTED/null/NOT_APPLICABLE
5. FAILED/null/INCOMPLETE
6. compatibility checks with zero changed functions

## Tasks per playbook:
- Phase 1 reproduce
- Phase 2 correct attribution
- Phase 3 correct status tests with real Git intervals
- Phase 4 build real fixtures
- Phase 5 full tests 0 failing
- Phase 6 end-to-end verification (PASS, WARN, NOT_EVALUATED, UNSUPPORTED, FAILED)
- Phase 7 report

## Deliverable
docs/research/WP4.2.1_CORRECTIVE_VERIFICATION_RESULTS.md ending VERIFIED — READY FOR WP4 RERUN / VERIFIED WITH CONSTRAINTS / STOP
