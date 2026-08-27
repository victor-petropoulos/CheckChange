---
task: "WP5.3 Documentation Correction & Reconciliation (doc-only)"
created: 2026-08-27T00:00:00Z
approved: true
tasks:
  - id: "1"
    description: "Build reconciliation table: compare current WP5.3 FM meanings vs authoritative WP5.2 meanings from defect-reproduction-results.md, WP5_2_RESULTS.md, defect-repro.spec.ts, cli-diagnostics"
    agent: "researcher"
    files: ["experiments/wp5/wp5.3/WP5_3_RESULTS.md", "experiments/wp5/wp5.2/defect-reproduction-results.md"]
    acceptance: "Table with FM-V01,FM-D10,FM-G06,FM-G07 current vs authoritative, action column, citing artifact per FM"
    depends_on: []
  - id: "2"
    description: "Correct WP5_3_RESULTS.md: date 2025->2026, restore FM-V01/D10/G06/G07 authoritative taxonomy, rewrite WP5.4 routing, replace C03 acceptable->unresolved contract question (tracked vs untracked TS)"
    agent: "documenter"
    files: ["experiments/wp5/wp5.3/WP5_3_RESULTS.md"]
    acceptance: "Date 2026-08-26, taxonomy matches authoritative, routing uses correct IDs, C03 unresolved wording, evidence preserved"
    depends_on: ["1"]
  - id: "3"
    description: "Update defect-fix-record.md, source-discovery-decision.md, adversarial-case-matrix.md, attribution-invariants.md to authoritative taxonomy, C03 unresolved language"
    agent: "documenter"
    files: ["experiments/wp5/wp5.3/defect-fix-record.md","experiments/wp5/wp5.3/source-discovery-decision.md","experiments/wp5/wp5.3/adversarial-case-matrix.md","experiments/wp5/wp5.3/attribution-invariants.md"]
    acceptance: "All docs use authoritative FM meanings, C03 contract wording consistent, no taxonomy invention"
    depends_on: ["2"]
  - id: "4"
    description: "Update active WP5 decision log and traceability matrix + create WP5_3_DOCUMENTATION_RECONCILIATION.md with artifact per FM"
    agent: "documenter"
    files: ["experiments/wp5/planning/WP5_DECISION_LOG_WP5_2_CORRECTION_UPDATE.md","experiments/wp5/planning/WP5_TRACEABILITY_MATRIX_WP5_3_UPDATE.md","experiments/wp5/wp5.3/WP5_3_DOCUMENTATION_RECONCILIATION.md"]
    acceptance: "Reconciliation file created with artifact citations per FM, logs updated"
    depends_on: ["3"]
---
