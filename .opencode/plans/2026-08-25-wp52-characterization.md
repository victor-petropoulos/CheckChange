---
task: "WP5.2 characterization pass: 23-fixture corpus, defect reproduction, OQ evidence, regression anchors, rollup docs — against frozen WP5.1 baseline"
created: 2026-08-25T00:00:00-04:00
approved: true
approval_note: "User's OPENCODE_WP5_2_PROMPT.md = explicit approved scope (revised after WP5.1 approval). Phase-1 revalidation passed: no material contradiction."
tasks:
  - id: "1"
    description: "Build 23-fixture characterization corpus under experiments/wp5/wp5.2/ — all FR IDs/priorities preserved, FM traceability, minimal deterministic synthetic TS/Istanbul evidence, no external target suites. Every fixture EXECUTES as characterization test asserting CURRENT behavior; desired behavior recorded separately in comments/manifest, never asserted."
    agent: "implementer"
    files:
      - "experiments/wp5/wp5.2/fixtures/**"
      - "experiments/wp5/wp5.2/*.spec.ts"
      - "experiments/wp5/wp5.2/fixture-manifest.md"
    acceptance: "All 23 FR IDs present (FR-A6,A7,V1,G3 P0 execute — zero test.skip); vitest run over wp5.2 specs green; fixture-manifest.md maps FR→priority→FM→file→current-vs-desired"
    depends_on: []
  - id: "2"
    description: "Defect reproduction: executable evidence for FM-A07, FM-C03, FM-A08, FM-V01, FM-D10/FM-G06, FM-G07. Classify each CONFIRMED / REFUTED / UNRESOLVED with run output. No fixes."
    agent: "implementer"
    files:
      - "experiments/wp5/wp5.2/defect-reproduction-results.md"
      - "experiments/wp5/wp5.2/defect-repro.spec.ts"
    acceptance: "6 clusters each have runnable evidence + classification + verbatim output quote; zero production edits"
    depends_on: ["1"]
  - id: "3"
    description: "Open questions: OQ-1/OQ-2/OQ-7 resolved with deterministic evidence; OQ-3/OQ-4/OQ-6 documented as human decisions with evidence packets; OQ-5 reconciled from preserved evidence only (experiments/wp4r-final/human-review-diagnostics.md) — no reruns."
    agent: "implementer"
    files:
      - "experiments/wp5/wp5.2/open-question-results.md"
    acceptance: "All 7 OQs have status+evidence citations; OQ-5 cites preserved artifacts only; human-decision OQs carry recommendation-free evidence packets"
    depends_on: ["1"]
  - id: "4"
    description: "Regression anchors pinning confirmed contracts: threshold equality (crap<=threshold→PASS), explicit vs default missing coverage, UNSUPPORTED/no-function exit semantics, v0.2 schema compatibility, threshold-30 default, deterministic ordering, coverage dedup. Write coverage-matrix.md mapping FR↔FM↔anchor-test."
    agent: "implementer"
    files:
      - "experiments/wp5/wp5.2/regression-anchors.spec.ts"
      - "experiments/wp5/wp5.2/coverage-matrix.md"
    acceptance: "7 anchors each covered by executing assertion; matrix covers all 23 FRs × FMs with status column"
    depends_on: ["1"]
  - id: "5"
    description: "Rollup: WP5_2_RESULTS.md (fixture counts/status, P0 status, defect classifications, OQ results, contract contradictions, files changed, production-untouched confirmation, WP5.3/WP5.4 authorization recommendation). Update decision log + traceability matrix in planning/."
    agent: "implementer"
    files:
      - "experiments/wp5/wp5.2/WP5_2_RESULTS.md"
      - "experiments/wp5/planning/WP5_DECISION_LOG_WP5_1_UPDATE.md"
      - "experiments/wp5/planning/WP5_TRACEABILITY_MATRIX_WP5_2_UPDATE.md"
    acceptance: "RESULTS contains every Stop-clause item from prompt; planning docs append-only style updates consistent with T1-T4 outputs"
    depends_on: ["2", "3", "4"]
---

# Global Constraints (binding, verbatim-critical)

1. **Production untouched.** Mutable paths: `experiments/wp5/wp5.2/**` + `experiments/wp5/planning/WP5_DECISION_LOG_WP5_1_UPDATE.md` + `experiments/wp5/planning/WP5_TRACEABILITY_MATRIX_WP5_2_UPDATE.md` ONLY. `src/`, `prototype/`, `compat.*`, `dist/`, `test/`, `package.json`, configs: read-only.
2. All 23 fixtures EXECUTE. No `test.skip` on any fixture, especially P0 FR-A6/A7/V1/G3.
3. Characterization asserts CURRENT behavior; DESIRED behavior recorded separately, never asserted.
4. No threshold changes (default 30 intact), no cross-language work, no orchestration/provider abstraction, no new coverage formats, no LLM judgment, no WP4R reopening, no WP5.3/WP5.4 work.
5. Do not invoke external target suites to manufacture evidence.
6. Node 24 active (`nvm use` before any node command).
7. Test runner: `npx vitest run <paths>`.

# Reference

Artifact extract (fixture table, defect list, OQ modes, anchors, contradictions): `.opencode/plans/2026-08-25-wp52-artifact-extract.md`
Source specs subagents must read: `experiments/wp5/planning/WP5_2_DETERMINISTIC_FIXTURE_SUITE_SPEC.md`, `experiments/wp5/wp5.1/fixture-requirements.md`
