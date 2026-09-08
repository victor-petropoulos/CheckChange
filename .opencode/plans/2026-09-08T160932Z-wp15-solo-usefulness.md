---
task: "WP15 solo human-usefulness review packet — WP14 pair + 3 WP5.6 cases, no autonomous classification"
created: "2026-09-08T160932Z"
approved: true
tasks:
  - id: "1"
    description: "Create packet skeleton experiments/wp15-human/PACKET.md + per-case sheets reusing WP14 delta table + WP5.6 case rows; fields: noticeRank, testsToAdd, timeSpentMin, confidenceDelta, fpBurden; no verdict columns"
    agent: "documenter"
    files:
      - "experiments/wp15-human/PACKET.md"
    acceptance: "PACKET.md exists with WP14 delta table (commit-A/B), 3 WP5.6 case rows (sup-a, hono-03, hono-01), per-case fields present, footer AWAITING HUMAN REVIEW"
    depends_on: []
  - id: "2"
    description: "Assemble case bundle in experiments/wp15-human/cases/ — copy/link WP14 commit-A.json, commit-B.json, WP14_RESULTS.md + selected WP5.6 pipeline-run JSONs (sup-a-threshold-15.json, sup-a-threshold-30.json, hono-03-threshold-15.json, hono-03-threshold-30.json, hono-01-threshold-15.json, hono-01-threshold-30.json); add provenance table with engine commit, thresholds 30/15, schema 0.4"
    agent: "implementer"
    files:
      - "experiments/wp15-human/cases/commit-A.json"
      - "experiments/wp15-human/cases/commit-B.json"
      - "experiments/wp15-human/cases/WP14_RESULTS.md"
      - "experiments/wp15-human/cases/sup-a-threshold-15.json"
      - "experiments/wp15-human/cases/sup-a-threshold-30.json"
      - "experiments/wp15-human/cases/hono-03-threshold-15.json"
      - "experiments/wp15-human/cases/hono-03-threshold-30.json"
      - "experiments/wp15-human/cases/hono-01-threshold-15.json"
      - "experiments/wp15-human/cases/hono-01-threshold-30.json"
      - "experiments/wp15-human/cases/PROVENANCE.md"
    acceptance: "All 10 case files copied, PROVENANCE.md exists with engine commit hash, thresholds 30/15, schemaVersion 0.4, no src/ changes"
    depends_on: []
  - id: "3"
    description: "Create reviewer instrument checklist sheet + timing log template in test files only; no src/ changes"
    agent: "tester"
    files:
      - "experiments/wp15-human/reviewer-checklist.md"
      - "experiments/wp15-human/timing-log-template.md"
    acceptance: "Both files exist, checklist covers per-case review steps (notice, ranking, time, confidence, FP), timing log has fields for start/end/pause/resume, no production code modified"
    depends_on: []
  - id: "4"
    description: "Verification gate — run tsc (0 errors), vitest (record pass counts), confirm thresholds 30/15 frozen in source, INV-01..04 preserved, packet footer reads AWAITING HUMAN REVIEW"
    agent: "implementer"
    files: []
    acceptance: "tsc exit 0; vitest run outputs pass count; grep confirms thresholds 30/15 in crapCalc.ts and config; INV-01..04 comments present in source; PACKET.md footer AWAITING HUMAN REVIEW"
    depends_on: ["1", "2", "3"]
---