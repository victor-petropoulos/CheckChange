---
task: "WP8 — Real-World Validation"
created: "2026-08-28T16:46:26Z"
approved: true
tasks:
  - id: "1"
    description: "Select 2-3 repositories differing in size, architecture, test strategy, monorepo structure, coverage tooling, development style, and supported languages. Document explicit selection criteria and final choices."
    agent: "researcher"
    files: ["experiments/wp8/repo-selection.md"]
    acceptance: "Criteria documented and repos selected; at least one non-trivial TS repo outside WP5 corpus (different size/architecture/coverage tooling); one optional monorepo stretch if time allows — do not require language expansion."
    depends_on: []
  - id: "2"
    description: "For each selected repo, identify historical commits representing small (1 function), moderate (2-3 functions), and cross-repo (if monorepo) changes. Document change scope, engineering significance, and how to reproduce coverage."
    agent: "researcher"
    files: ["experiments/wp8/changes.md"]
    acceptance: "At least 4 changes total across selected repos (small/moderate changes, e.g., 2 small and 2 moderate) with clear reproduction steps."
    depends_on: ["1"]
  - id: "3"
    description: "Execute the code-risk engine for each change: generate coverage (caller-owned), run node dist/cli.js check --base <sha> --json --coverage-file <path> (base = parent commit, target implicit HEAD), and collect evidence outputs. Preserve all artifacts for review. Log command and artifact size in experiments/wp8/repro.md for reproducibility."
    agent: "implementer"
    files: ["experiments/wp8/evidence/", "experiments/wp8/repro.md"]
    acceptance: "Evidence JSON produced for each change; coverage artifact and command logged; exit codes checked per contract; INV-01..04 preserved, contract 0.2 frozen, no new languages/DB/service."
    depends_on: ["2"]
  - id: "4"
    description: "Reviewer interprets evidence per change: compares CRAP/gate with actual engineering risk, flags potential false positives/negatives, and notes missing context."
    agent: "reviewer"
    files: ["experiments/wp8/reviewer-notes.md"]
    acceptance: "Reviewer notes per change: CRAP/gate vs engineering significance, FP/FN flag with one-line why."
    depends_on: ["3"]
  - id: "5"
    description: "Analyze flagged false positives/negatives: investigate root causes (e.g., complexity by design, coverage gaps, generated code, threshold effects, missing dimensions like security or dependency blast radius)."
    agent: "researcher"
    files: ["experiments/wp8/fp-fn-analysis.md"]
    acceptance: "Root cause documented for each FP/FN; distinguishes known limitations from new issues."
    depends_on: ["4"]
  - id: "6"
    description: "Evaluate developer experience and operational aspects: trust, comprehension, noise, friction, review focus, willingness to use, actionability, runtime, memory, and ease of use."
    agent: "documenter"
    files: ["experiments/wp8/dx-operational.md"]
    acceptance: "DX and operational findings documented; includes performance baselines and usability observations."
    depends_on: ["3"]
  - id: "7"
    description: "Compile WP8 validation report: evidence summary, FP/Fn analysis, DX/operational findings, limitations, and evidence-backed gate recommendation (CONTINUE/CONTINUE WITH CONSTRAINTS/STOP)."
    agent: "documenter"
    files: ["experiments/wp8/wp8-report.md", "experiments/wp8/repro.md"]
    acceptance: "Report complete and gate recommendation justified by evidence; no silent methodology changes; INV-01..04 preserved, contract 0.2 frozen, no new languages/DB/service."
    depends_on: ["5", "6"]
---