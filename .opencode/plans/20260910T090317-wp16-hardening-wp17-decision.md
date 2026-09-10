---
task: "WP16 hardening (narrow) + WP17 product decision"
created: "2026-09-10T09:03:17Z"
approved: true
tasks:
  - id: "1"
    description: "Re-verify build/test/packaging (narrow WP16 hardening) — no re-bench, no new audit"
    agent: "tester"
    files:
      - "experiments/wp16-hardening/REVERIFY.md"
    acceptance: "Log with verbatim exit codes for: npx tsc --noEmit (exit 0), npx vitest run (pass), npm run build (ok), npm link/pack smoke (ok). Zero src change (git diff --stat src/ empty) OR packaging fix flagged explicitly."
    depends_on: []
  - id: "2"
    description: "Sync docs/wp7-release-checklist.md from schema 0.2 → 0.4"
    agent: "documenter"
    files:
      - "docs/wp7-release-checklist.md"
    acceptance: "Schema 0.4, thresholds 30/15, INV-01..04 preserved, Hardening B refs added. No threshold/schema change. Additive only."
    depends_on: ["1"]
  - id: "3"
    description: "Write WP17_DECISION.md — A/B/C/D recommendation with constraints"
    agent: "documenter"
    files:
      - "experiments/wp17/WP17_DECISION.md"
    acceptance: "Explicit decision among: (A) Productize standalone, (B) Integrate Engram, (C) Keep research-tooling, (D) Stop. Constraints (a-d from WP16 ASSESSMENT.md:130 + Q1 thin + Q7 CLOSED) cited. Evidence refs to WP17_RESULTS.md file:line. No autonomous usefulness reclassification."
    depends_on: ["1"]
  - id: "4"
    description: "Verification gate — checkchange check --json + tsc/vitest evidence"
    agent: "tester"
    files: []
    acceptance: "Gate output pasted (checkchange check --json), changedFunctions count shown, tsc/vitest pass evidence. Missing output = INCOMPLETE."
    depends_on: ["1", "2", "3"]
---