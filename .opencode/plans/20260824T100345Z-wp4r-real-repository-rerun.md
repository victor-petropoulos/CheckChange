---
task: "WP4R Real-Repository Usefulness Validation Rerun"
created: "2026-08-24T10:03:45Z"
approved: true
tasks:
  - id: "1"
    description: "Freeze marker — record HEAD df0f468 + uncommitted WP4.2.1 diff as frozen baseline. Run npx vitest run, npx tsc --noEmit, npm run build. Create experiments/wp4r/freeze.json with commit sha, test count, tsc status, build status."
    agent: "implementer"
    files: ["experiments/wp4r/freeze.json"]
    acceptance: "freeze.json exists with sha=3df0f468, tests=66, tsc=0 errors, build=success. All three verification commands pass before writing file."
    depends_on: []

  - id: "2"
    description: "Repository selection — fill experiments/wp4r/repository-selection.md with 3 repos (A=small TS lib, B=medium TS project, C=structurally different). Verify each has .ts/.tsx source (not .d.ts only), git history, license, non-trivial functions, buildable. Document selection rationale. Confirm 'YES' for pre-output selection."
    agent: "implementer"
    files: ["experiments/wp4r/repository-selection.md"]
    acceptance: "File contains 3 repos with URL/license/rationale + 'YES' confirmation. Each repo has verified .ts source density and non-trivial function count."
    depends_on: ["1"]

  - id: "3"
    description: "Historical change selection — for each of 3 repos pick 3 real SHAs (small/moderate/non-trivial) with base/target, changed TS files, rationale. Pin exact SHAs. Write metadata.md per repo under experiments/wp4r/<repo>/. Total 9 cases pinned before execution."
    agent: "implementer"
    files: ["experiments/wp4r/repo-a/metadata.md", "experiments/wp4r/repo-b/metadata.md", "experiments/wp4r/repo-c/metadata.md"]
    acceptance: "9 cases pinned with exact SHAs, base/target refs, changed TS file lists, and rationale. No cases chosen based on expected CRAP output."
    depends_on: ["2"]

  - id: "4"
    description: "Coverage preparation — for each case document coverage-present vs absent state. At least 1 present + 1 absent per repo overall. For present cases: record the repo's own coverage generation command (e.g., npx vitest run --coverage). For absent cases: note artifact absence. Write coverage-command.txt per case dir. Prototype never generates coverage."
    agent: "implementer"
    files: ["experiments/wp4r/<repo>/case-*/coverage-command.txt"]
    acceptance: "All 9 cases have coverage-command.txt documenting state (present with command, or absent). Per-repo mix includes ≥1 present and ≥1 absent."
    depends_on: ["3"]

  - id: "5"
    description: "Execution harness — for each of 9 cases run 2 thresholds (30 and 15) via `node dist/cli.js check --base <base> --json --crap-threshold <t>` from target repo cwd. Preserve raw JSON to output-threshold-30.json and output-threshold-15.json. Record runtime (ms), exit code, stdout, stderr, setup friction notes."
    agent: "implementer"
    files: ["experiments/wp4r/<repo>/case-*/output-threshold-30.json", "experiments/wp4r/<repo>/case-*/output-threshold-15.json"]
    acceptance: "18 output JSON files exist (9 cases × 2 thresholds). Each contains raw CLI output. Runtime and exit code recorded per run."
    depends_on: ["4"]

  - id: "6"
    description: "Aggregation — create experiments/wp4r/aggregate-results.json with per-run fields: repository, case, base, target, changed TS files, analysisStatus, gate, completeness, changedFunctions count, PASS/WARN/NOT_EVALUATED counts, max CRAP/CC, coverage present/attributable, runtime, exit code, errors, friction notes. Compute evaluationRate and coverageAvailabilityRate."
    agent: "implementer"
    files: ["experiments/wp4r/aggregate-results.json"]
    acceptance: "aggregate-results.json contains 9 case entries with all required fields. Counts include SUCCESS/UNSUPPORTED/FAILED distribution. evaluationRate and coverageAvailabilityRate computed. Threshold comparison (30 vs 15) included."
    depends_on: ["5"]

  - id: "7"
    description: "Human review scaffolding — create per-WARN review.md stubs using WP4R_HUMAN_REVIEW_TEMPLATE.md structure. Include PASS sample stubs (≥3 per repo) and NOT_EVALUATED cause stubs. Leave all usefulness classification fields (USEFUL/PLAUSIBLE/NOISY/UNDETERMINED) empty for human to fill. No LLM autonomous classification."
    agent: "implementer"
    files: ["experiments/wp4r/<repo>/case-*/review.md"]
    acceptance: "review.md stubs exist for every WARN across all cases. Each stub has 8 questions, classification placeholders, PASS sample section, NOT_EVALUATED section. No USEFUL/PLAUSIBLE/NOISY values pre-filled by LLM."
    depends_on: ["6"]

  - id: "8"
    description: "Final report — create docs/research/WP4R_USEFULNESS_VALIDATION_RESULTS.md covering: selection rationale, pinned SHAs, coverage prep summary, success table, counts, rates, status distribution, threshold comparison (30 vs 15), operational friction findings, limitations, unexpected findings. End with exactly one of: CONTINUE / CONTINUE WITH CONSTRAINTS / STOP."
    agent: "documenter"
    files: ["docs/research/WP4R_USEFULNESS_VALIDATION_RESULTS.md"]
    acceptance: "Report exists with all required sections. Ends with exactly one decision word (CONTINUE, CONTINUE WITH CONSTRAINTS, or STOP). No speculative conclusions — all findings backed by aggregate data."
    depends_on: ["7"]
---

# WP4R Real-Repository Usefulness Validation Rerun — Implementation Plan

## Global Constraints

- **Frozen production code**: `src/` is immutable. No edits to thresholds, rule semantics, evidence acquisition, or output semantics.
- **Preserve raw outputs**: All 18 CLI outputs preserved verbatim in JSON files.
- **No LLM usefulness classification**: Human reviews every WARN. Classification (USEFUL/PLAUSIBLE/NOISY/UNDETERMINED) left empty for human.
- **Verification-before-completion**: Each task verifies its outputs before marking complete.

## Task Dependency Graph

```
1 → 2 → 3 → 4 → 5 → 6 → 7 → 8
```

Sequential chain — each phase gates on the previous.

## Phase Details

### Phase 1: Freeze Marker

Record the verified baseline. HEAD is `df0f468` (docs/wp4.1: evidence acquisition and failure semantics research). Uncommitted WP4.2.1 diff present on `src/cli.ts`, `src/evidence.ts`, and new files.

Verification commands (already confirmed green):
- `npx vitest run` → 66 tests passed
- `npx tsc --noEmit` → clean
- `npm run build` → clean

### Phase 2: Repository Selection

Select 3 repos before observing tool output. Criteria from WP4R spec:
- TS source density >50% (.ts/.tsx vs .d.ts)
- Git history depth sufficient for SHA pinning
- Buildable locally
- Public license permitting inspection
- Non-trivial function count (not thin JS wrappers)
- Diversity: small lib, medium project, structurally different

Avoid: JS-only repos (p-limit lesson), pnpm workspace repos (Zod lesson).

### Phase 3: Historical Change Selection

3 changes per repo = 9 cases total. Each case has:
- Base SHA (older commit)
- Target SHA (newer commit)
- Changed TS file list
- Rationale (small/moderate/non-trivial change)

Pin exact SHAs. No cherry-picking based on expected CRAP.

### Phase 4: Coverage Preparation

Per repo: ≥1 coverage-present case + ≥1 coverage-absent case.
- Present: generate coverage-final.json via repo's own mechanism (record command)
- Absent: ensure coverage-final.json does not exist
- Prototype never generates coverage

### Phase 5: Execution

For each case, run at both thresholds:
```bash
node dist/cli.js check --base <base> --json --crap-threshold 30
node dist/cli.js check --base <base> --json --crap-threshold 15
```

Capture: raw JSON, runtime (ms), exit code, stdout, stderr, friction notes.

### Phase 6: Aggregation

aggregate-results.json per-run fields:
- repository, case, base, target
- changed TS files
- analysisStatus, gate, completeness
- changedFunctions count, PASS/WARN/NOT_EVALUATED breakdown
- max CRAP, max CC
- coverage present/attributable
- runtime, exit code, errors, friction
- evaluationRate, coverageAvailabilityRate

### Phase 7: Human Review Scaffolding

Per WARN: review.md stub with 8 questions from WP4R_HUMAN_REVIEW_TEMPLATE.md.
Per repo: ≥3 PASS sample stubs.
NOT_EVALUATED cause documentation.
All classification fields left empty for human.

### Phase 8: Final Report

docs/research/WP4R_USEFULNESS_VALIDATION_RESULTS.md covering:
- Selection rationale and SHAs
- Coverage prep summary
- Success table with counts and rates
- Threshold comparison (30 vs 15)
- Operational friction findings
- Limitations and unexpected findings
- **Ending: exactly one of CONTINUE / CONTINUE WITH CONSTRAINTS / STOP**
