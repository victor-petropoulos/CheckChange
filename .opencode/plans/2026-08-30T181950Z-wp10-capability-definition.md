---
task: "WP10 Capability and Product Definition"
created: "2026-08-30T181950Z"
approved: true
context: "WP9 closure approved via CONTINUE 2026-08-30 (human gate passed per WP9_CLOSURE_RECORD a9b82e7, 178/178, schema 0.2 frozen). No src changes since R5."
designIntent: "Define product capability after WP9 hardening without violating frozen contract or building analyzer. Doc-only, minimal reversible step answering: what problem, for whom, smallest workflow, evidence in/out, refusals, claims, non-goals, metrics, shape A/B/C, research Qs, next branch per forks."
layer: docs
tasks:
  - id: "1"
    description: "documenter writes docs/10_WP10_CAPABILITY_DEFINITION.md with sections: problem statement, target user, smallest useful workflow, evidence consumed by engine, what engine refuses to infer"
    agent: "documenter"
    files: ["docs/10_WP10_CAPABILITY_DEFINITION.md"]
    acceptance: "File exists and contains clearly defined sections for problem, user, smallest workflow, evidence in (git diff, complexity, coverage), evidence out (deterministic CRAP, function-level evidence), and explicit refusals (no defect prediction, no autonomous judgment, no universal language claims)"
    depends_on: []
  - id: "2"
    description: "documenter appends to docs/10_WP10_CAPABILITY_DEFINITION.md: supported-claim matrix (narrowed from WP9 C1-C24 for product) and non-goals (what the product does not claim to do)"
    agent: "documenter"
    files: ["docs/10_WP10_CAPABILITY_DEFINITION.md"]
    acceptance: "File includes a table of supported claims (scoped to TS, Istanbul JSON, Node 24.18.1, schema 0.2, threshold 30/15) and a list of non-goals (universal language support, historical per-commit coverage, defect prediction, replacement of human review)"
    depends_on: ["1"]
  - id: "3"
    description: "documenter appends to docs/10_WP10_CAPABILITY_DEFINITION.md: success metrics (how to measure value) and product-shape decision (evaluation of standalone A, Engram B, both C with recommendation based on WP9 evidence)"
    agent: "documenter"
    files: ["docs/10_WP10_CAPABILITY_DEFINITION.md"]
    acceptance: "File includes success metrics (e.g., integration cost, review usefulness, false-positive burden) and a product-shape decision section comparing A/B/C with evidence: provider n=3, monorepo 55×, caller burden 4.96s, R8 partial historical/delta, and a recommendation for the most viable form"
    depends_on: ["2"]
  - id: "4"
    description: "documenter appends to docs/10_WP10_CAPABILITY_DEFINITION.md: prioritized research questions (from WP9 limitations and forks) and provisional next branch (WP11/12 integration vs WP13 language vs WP14 historical vs WP15 usefulness vs stop)"
    agent: "documenter"
    files: ["docs/10_WP10_CAPABILITY_DEFINITION.md"]
    acceptance: "File lists research questions addressing WP9 limitations (historical coverage, language breadth, monorepo, usefulness) and identifies the highest-priority next step based on evidence-driven forks (e.g., if integration is biggest gap -> WP11/12)"
    depends_on: ["3"]
  - id: "5"
    description: "tester verifies docs/10_WP10_CAPABILITY_DEFINITION.md exists with required sections + no src changes (git diff src/ --exit-code 0) and runs tsc, build, vitest to confirm 178/178 pass"
    agent: "tester"
    files: []
    acceptance: "docs/10_WP10_CAPABILITY_DEFINITION.md exists and contains sections: problem, user, workflow, evidence in/out, refusals, claim matrix, non-goals, metrics, shape A/B/C, research Qs, next branch; tsc 0 errors, build succeeds, vitest 178/178, git diff src/ shows no changes"
    depends_on: ["4"]
  - id: "6"
    description: "documenter updates PROJECT_STATUS.md and OPENCODE_START_HERE.md to reflect WP10 completion and next steps"
    agent: "documenter"
    files: ["PROJECT_STATUS.md", "OPENCODE_START_HERE.md"]
    acceptance: "PROJECT_STATUS.md shows WP10 complete and next work package, OPENCODE_START_HERE.md updated accordingly, and both files maintain existing format"
    depends_on: ["5"]
---