---
task: "WP4 — Usefulness Validation"
created: 2026-08-24T03:00:00.000Z
approved: true
tasks:
  - id: "1"
    description: "Select 3 public TS repos before testing, pin commits, document rationale in experiments/wp4/repository-selection.md"
    agent: "implementer"
    files: ["experiments/wp4/repository-selection.md"]
    acceptance: "3 repos selected with URL, license, why selected, diversity, not cherry-picked for high CRAP; exact commits pinned before any tool runs"
    depends_on: []
  - id: "2"
    description: "Clone repos, pin base/target SHAs for 3 cases per repo (~9 cases), install deps, record metadata"
    agent: "implementer"
    files: ["experiments/wp4/*/case-*/metadata.md"]
    acceptance: "Each case has base and target SHAs, changed TS files listed, install steps recorded, raw checkout preserved"
    depends_on: ["1"]
  - id: "3"
    description: "Run WP3 tool at thresholds 30 and 15 per case, preserve raw JSON, collect measurements"
    agent: "implementer"
    files: ["experiments/wp4/*/case-*/output-threshold-30.json", "experiments/wp4/*/case-*/output-threshold-15.json"]
    acceptance: "Raw outputs preserved, per-case counts PASS/WARN/NOT_EVALUATED, gate, completeness, max CRAP/CC, runtime, errors recorded"
    depends_on: ["2"]
  - id: "4"
    description: "Human usefulness review of WARN findings (classification requires human, do not auto-decide)"
    agent: "implementer"
    files: ["experiments/wp4/*/case-*/review.md"]
    acceptance: "Each WARN has human classification USEFUL/PLAUSIBLE/NOISY/UNDETERMINED with 1-2 sentence reason and 6 review questions answered"
    depends_on: ["3"]
  - id: "5"
    description: "Aggregate results and create docs/research/WP4_USEFULNESS_VALIDATION_RESULTS.md ending CONTINUE/CONSTRAINTS/STOP"
    agent: "implementer"
    files: ["experiments/wp4/aggregate-results.json", "docs/research/WP4_USEFULNESS_VALIDATION_RESULTS.md"]
    acceptance: "Report includes selection, pinned revisions, methodology, success/failure table, aggregate counts, evaluation rates, usefulness classifications, threshold 15 vs 30 comparison, friction, limitations, recommendation, ends with exactly one decision"
    depends_on: ["4"]
---

# WP4 — Usefulness Validation — Plan

## Purpose
Determine if changed-function CRAP advisory rule tells developer something useful enough to continue. Experiment, not product dev. Do not change production behavior.

## Core Question
Does changed-function CRAP evidence via advisory rule produce useful signal?

## Critical Constraint
Do not change production behavior during WP4. Record limitations, do not engineer around them.

## Repository Selection (3 before testing)
- Public, primarily TS, npm-compatible, tests + coverage-capable, enough non-trivial functions, accessible Git history, small/medium.
- Diversity: small library, medium app/tool, structurally different.
- Not selected for high CRAP.
- Record URL, commit, license, install command, rationale in experiments/wp4/repository-selection.md

## Change Selection (3 per repo ~9 total)
- Small, moderate, non-trivial logic changes
- Pin base and target SHAs, changed TS files
- Prefer real historical commits/PR-sized

## Required Runs
- tool check --base <base> --json (threshold 30 default)
- also --crap-threshold 15 and 30 comparison (15 experimental only)
- Preserve raw JSON, do not use analyzer pass/fail as policy

## Data Per Case
repository, base, target, changed TS files, changed functions, PASS/WARN/NOT_EVALUATED, gate, completeness, max CRAP/CC, coverage availability, runtime, setup steps, errors

Per WARN: file, method, CRAP, CC, coverage, threshold

## Human Usefulness Review
For each WARN classify:
USEFUL | PLAUSIBLE | NOISY | UNDETERMINED (human owns judgment, LLM must not decide)
Plus 6 review questions per warning.

## Completeness
evaluated = PASS+WARN, total = PASS+WARN+NOT_EVALUATED, evaluationRate = evaluated/total

## Required Artifacts
experiments/wp4/repository-selection.md
experiments/wp4/<repo>/case-*/metadata.md, output-threshold-*.json, review.md
experiments/wp4/aggregate-results.json
docs/research/WP4_USEFULNESS_VALIDATION_RESULTS.md

## Exit
CONTINUE / CONTINUE WITH CONSTRAINTS / STOP
