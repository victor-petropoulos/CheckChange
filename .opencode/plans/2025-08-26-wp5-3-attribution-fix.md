---
task: "WP5.3 FM-A08/A07/C03 attribution fixes"
created: "2025-08-26T10:55:00Z"
approved: true
tasks:
  - id: "1"
    description: "Baseline characterization: re-run WP5.2 fixtures (fr-a7, fr-a6, fr-c3) and regression-anchors to preserve baseline defective behavior. Capture verbatim test output showing: fr-a7 coverage null for both alpha/beta, fr-a6 coverage null for class methods bar/baz, fr-c3 tools/check.ts absent from changedFunctions. Save baseline output to experiments/wp5/wp5.3/baseline-characterization.md."
    agent: "tester"
    files: ["experiments/wp5/wp5.2/fixtures/fr-a7.spec.ts", "experiments/wp5/wp5.2/fixtures/fr-a6.spec.ts", "experiments/wp5/wp5.2/fixtures/fr-c3.spec.ts", "experiments/wp5/wp5.2/regression-anchors.spec.ts"]
    acceptance: "vitest run experiments/wp5/wp5.2/ returns 36 passed tests (25 files). Baseline output captured in experiments/wp5/wp5.3/baseline-characterization.md showing null coverage for class methods, null coverage for suffix-collision pair, and absent tools/check.ts function."
    depends_on: []

  - id: "2"
    description: "Create experiments/wp5/wp5.3/attribution-invariants.md documenting 9 invariants from WP5_3_ATTRIBUTION_CORRECTNESS_SPEC.md: (1) same-function identity, (2) wrong-file prohibition, (3) ambiguity refusal, (4) order independence, (5) deterministic container identity, (6) explicit missing/unsupported discovery, (7) source-file identity resolved before function attribution, (8) changed TS outside analyzed roots must not yield trustworthy COMPLETE/PASS, (9) WP5.2 regression anchors intact. Each invariant includes testable criteria."
    agent: "documenter"
    files: ["experiments/wp5/wp5.3/attribution-invariants.md"]
    acceptance: "File exists at experiments/wp5/wp5.3/attribution-invariants.md with all 9 invariants from spec. Each invariant has a testable criterion (e.g., 'Given two files sharing suffix, attribution must not swap coverage'). No production code changes."
    depends_on: []

  - id: "3"
    description: "FM-A08 fix in src/attribution.ts: Replace bidirectional endsWith suffix matching (line 65) with deterministic source-file identity resolution. Strategy: (a) try exact path match first (coverageMap key === complexityByFile key after normalization), (b) if no exact match, try resolving via relative path computation from coverageMap absolute key, (c) if ambiguous (multiple matches), decline attribution (coveragePercent: null, coverageKind: null) rather than first-entry-wins. Do NOT change descriptor-key logic (that is FM-A07). Files changed: src/attribution.ts lines 55-70 (source-file identity resolution)."
    agent: "implementer"
    files: ["src/attribution.ts"]
    acceptance: "TypeScript compiles (tsc). New test: two files with identical suffix (src/pkg-a/index.ts, src/pkg-b/index.ts) — alpha gets coverage 1, beta gets coverage 0 (not swapped). Reversed coverage-map order produces same result. Exact-path control: direct key match works. Ambiguous case: coverage is null (not wrong file). All WP5.2 regression anchors still pass."
    depends_on: ["1", "2"]

  - id: "4"
    description: "FM-A07 fix: Align attribution key with complexity method naming. Two changes: (a) In src/complexity.ts lines 21-24: keep containerName.functionName naming (already correct for complexity), (b) In src/attribution.ts line 97: change descriptor key from `${descriptor.functionName}:${descriptor.startLine}` to `${descriptor.containerName ? descriptor.containerName + '.' : ''}${descriptor.functionName}:${descriptor.startLine}` to match complexity.ts method naming. Also update line 103 key construction for complexity info to match. This ensures class methods (Foo.bar) and object methods find their descriptors."
    agent: "implementer"
    files: ["src/complexity.ts", "src/attribution.ts"]
    acceptance: "TypeScript compiles (tsc). New test: class method 'Foo.bar' gets numeric coverage (not null) when coverage data exists. Object method gets numeric coverage. Same raw method name in different containers stays distinct (different lineStart). Top-level function (no container) still works. All WP5.2 regression anchors still pass."
    depends_on: ["1", "2"]

  - id: "5"
    description: "FM-C03: Create experiments/wp5/wp5.3/source-discovery-decision.md comparing three approaches: (A) expand source discovery — scan all TS files in repo regardless of src/, (B) detect/surface — use git diff to identify changed TS files and parse them even if outside src/, (C) hybrid — use git diff for changed files + source-root scanner for baseline. Select narrowest safe contract. Document decision with pros/cons for each approach, then implement the chosen approach in src/complexity.ts (modify or wrap findAllTypeScriptFilesUnderSourceRoots). Create deterministic fixture for TS file outside src/ (tools/check.ts) that gets enumerated and attributed."
    agent: "implementer"
    files: ["experiments/wp5/wp5.3/source-discovery-decision.md", "src/complexity.ts"]
    acceptance: "source-discovery-decision.md exists with comparison of all 3 approaches and documented selection rationale. Implementation: tools/check.ts (outside src/) is now enumerated by complexity and appears in changedFunctions with correct coverage. All WP5.2 regression anchors still pass. TypeScript compiles."
    depends_on: ["1", "2", "3", "4"]

  - id: "6"
    description: "Create adversarial test fixtures in experiments/wp5/wp5.3/fixtures/ covering: (a) exact-path control, (b) suffix collision (3+ files), (c) reversed coverage-map order, (d) class method, (e) object method, (f) same-name methods in different containers, (g) top-level function, (h) ambiguous candidate, (i) TS under src/, (j) changed TS outside src/, (k) multi-package case. Each test asserts desired behavior (not current defective behavior). Save to experiments/wp5/wp5.3/adversarial-case-matrix.md mapping each test to the invariant it validates."
    agent: "tester"
    files: ["experiments/wp5/wp5.3/adversarial-case-matrix.md", "experiments/wp5/wp5.3/fixtures/"]
    acceptance: "All adversarial tests in experiments/wp5/wp5.3/fixtures/ pass after fixes from tasks 3-5. adversarial-case-matrix.md maps each test to its invariant. vitest run experiments/wp5/wp5.3/ returns all tests green."
    depends_on: ["3", "4", "5"]

  - id: "7"
    description: "Regression suite: run (a) all WP5.2 fixtures (25 files, 36 tests), (b) all new WP5.3 adversarial tests, (c) relevant existing regressions from experiments/wp5/wp5.2/regression-anchors.spec.ts. Capture before/after evidence for FM-A08, FM-A07 fixes. Create experiments/wp5/wp5.3/defect-fix-record.md documenting: baseline behavior, fix applied, after-fix behavior, test evidence. Create experiments/wp5/wp5.3/WP5_3_RESULTS.md with: FM-A08 before/after, FM-A07 before/after, chosen C03 contract, code/files changed, regression counts, unresolved limitations, confirmation WP5.4-only issues untouched, recommended WP5.4 scope."
    agent: "tester"
    files: ["experiments/wp5/wp5.3/defect-fix-record.md", "experiments/wp5/wp5.3/WP5_3_RESULTS.md"]
    acceptance: "vitest run experiments/wp5/wp5.2/ returns 36 passed tests (all WP5.2 anchors green). vitest run experiments/wp5/wp5.3/ returns all adversarial tests green. defect-fix-record.md and WP5_3_RESULTS.md exist with complete before/after evidence. No FM-V01/FM-D10/FM-G06/FM-G07 behavior changed (confirmed untouched). WP5.4-only issues explicitly confirmed as untouched."
    depends_on: ["6"]

  - id: "8"
    description: "Update planning artifacts: append WP5.3 entries to experiments/wp5/planning/WP5_DECISION_LOG_WP5_2_CORRECTION_UPDATE.md (new decisions for A08/A07/C03 fixes). Append WP5.3 disposition rows to experiments/wp5/planning/WP5_TRACEABILITY_MATRIX_WP5_3_UPDATE.md (baseline fixture, invariant, code change, new regression test, before/after result, final disposition for each FM). Ensure traceability from FM → fixture → invariant → code change → test → result."
    agent: "documenter"
    files: ["experiments/wp5/planning/WP5_DECISION_LOG_WP5_2_CORRECTION_UPDATE.md", "experiments/wp5/planning/WP5_TRACEABILITY_MATRIX_WP5_3_UPDATE.md"]
    acceptance: "Decision log has WP5.3 entries (IDs WP5-D013+) documenting fix decisions. Traceability matrix has resolved rows for FM-A08, FM-A07, FM-C03 with baseline fixture, invariant, code change, new regression test, before/after result, and disposition. FM-V01/FM-D10/FM-G06/FM-G07 explicitly marked as WP5.4 with no change."
    depends_on: ["7"]
---

## Execution Notes

### Hard Constraints (do not modify)
- FM-V01, FM-D10, FM-G06, FM-G07: no changes
- No threshold, CRAP formula, provider, orchestration, language, or LLM changes
- Production code `src/` modifications restricted to FM-A08, FM-A07, FM-C03 fixes only

### Node Version
All bash commands must use Node 24: `export PATH="/Users/victorpetropoulos/.nvm/versions/node/v24.18.1/bin:$PATH"`

### Test Command
`npx vitest run <test-path>` — WP5.2 fixtures in `experiments/wp5/wp5.2/fixtures/`, WP5.3 in `experiments/wp5/wp5.3/`

### Key File Locations
- Defective code: `src/attribution.ts` (lines 55-70: source identity, line 97: descriptor key), `src/complexity.ts` (line 14: source discovery)
- Pipeline: `src/evidence.ts` (buildEvidenceOutput orchestrates collectComplexity → readCoverage → attachCoverage → correlate)
- WP5.2 fixtures: `experiments/wp5/wp5.2/fixtures/fr-a7.spec.ts`, `fr-a6.spec.ts`, `fr-c3.spec.ts`
- WP5.3 deliverables: `experiments/wp5/wp5.3/` (currently empty)
- Planning: `experiments/wp5/planning/WP5_3_ATTRIBUTION_CORRECTNESS_SPEC.md`

### Dependency Rationale
- Task 1 (baseline): Must run first to capture defective behavior before any edits
- Task 2 (invariants): Independent of code changes; can start early but finalizes after baseline
- Task 3 (FM-A08): Depends on baseline + invariants; highest priority fix
- Task 4 (FM-A07): Depends on baseline + invariants; independent of A08 fix but sequential for clean staging
- Task 5 (FM-C03): Depends on all prior — needs decision document before implementation
- Task 6 (adversarial tests): Depends on fixes 3-5; tests the fixes
- Task 7 (regression): Depends on all fixes and tests; validates everything
- Task 8 (planning artifacts): Depends on regression results; documents final state
