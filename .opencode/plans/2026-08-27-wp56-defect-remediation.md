---
task: "WP5.6 Defect Remediation — F-03 path normalization, F-04 documentation, D-APOLLO re-verification"
created: "2026-08-27T16:00:00Z"
approved: true
tasks:
  - id: "1"
    description: "Baseline verification. Confirm: (1) current branch is main, (2) working tree clean (modulo WP5.6 untracked artifacts), (3) regression suite 143/143 pass, (4) WP5.6 freeze at engine commit 21daa57 is documented in freeze-checklist.md, (5) WP5_6_CLOSURE.md and known-defects-rootcause.md exist and are current. Read-only — no code changes."
    agent: "researcher"
    files: ["experiments/wp5/wp5.6/freeze-checklist.md", "experiments/wp5/wp5.6/WP5_6_CLOSURE.md", "experiments/wp5/wp5.6/known-defects-rootcause.md"]
    acceptance: "git branch shows main; npx vitest run reports 143/143 pass; freeze-checklist.md has all items checked; WP5_6_CLOSURE.md exists with engine commit 21daa57; known-defects-rootcause.md has 232 lines covering F-03, F-04, D-APOLLO"
    depends_on: []
  - id: "2"
    description: "F-03: Write failing unit test for coverage path normalization. Create experiments/wp5/wp5.6/wp56-f03-path-normalization.spec.ts. Test: (a) Create a coverage-final.json with absolute paths from a different cwd (e.g. /tmp/other-repo/h3/src/rules/normalize.ts), (b) Call readCoverage with a repo at a different cwd, (c) Assert that the returned coverageMap keys are repo-relative (not absolute), (d) Assert that attachCoverage can match the normalized keys against complexity info. Test must FAIL before the fix."
    agent: "tester"
    files: ["experiments/wp5/wp5.6/wp56-f03-path-normalization.spec.ts", "src/coverage.ts", "src/attribution.ts"]
    acceptance: "Test file exists; npx vitest run wp56-f03-path-normalization.spec.ts reports FAIL with 'path normalization not yet implemented' or similar; test does not modify any src/ files"
    depends_on: ["1"]
  - id: "3"
    description: "F-03: Implement path normalization in src/coverage.ts. Add a private function normalizeCoveragePaths(coverageMap: Map<string, any>, cwd: string): Map<string, any> that: (1) walks all keys in the coverage map, (2) for each absolute-path key, computes the repo-relative suffix (the portion that overlaps with cwd), (3) if the suffix matches a tracked project file, re-bases the key to be repo-relative, (4) returns a new Map with normalized keys. Call this function inside readCoverage() after parseCoverageReport() returns, before returning the CoverageResult. Do NOT change the function signature of readCoverage. Do NOT modify src/attribution.ts — the fix is in coverage.ts so the downstream layer sees normalized keys."
    agent: "implementer"
    files: ["src/coverage.ts"]
    acceptance: "TypeScript compiles (tsc --noEmit passes); new function normalizeCoveragePaths exists in src/coverage.ts; readCoverage() calls normalizeCoveragePaths after parseCoverageReport; no changes to src/attribution.ts or any other src/ file"
    depends_on: ["2"]
  - id: "4"
    description: "F-03: Verify F-03 tests pass and no regressions. Run: (1) npx vitest run wp56-f03-path-normalization.spec.ts — must PASS, (2) npx vitest run — all 143+ tests must PASS, (3) verify that existing coverage-distinction tests still pass (they use absolute paths in fixtures). If any existing test breaks, diagnose and fix without changing the test's expected behavior."
    agent: "tester"
    files: ["experiments/wp5/wp5.6/wp56-f03-path-normalization.spec.ts", "src/coverage.ts"]
    acceptance: "npx vitest run reports 143+ tests pass (including the new F-03 test); no new test failures introduced; F-03 test specifically passes"
    depends_on: ["3"]
  - id: "5"
    description: "F-04: Update documentation to record that changedFunctions may include test-file functions. Update: (1) experiments/wp5/wp5.4/failure-semantics-contract.md — add a note in the changedFunctions section: 'changedFunctions may include functions from *.test.ts files when those files are tracked by git (per WP5.3 C03 source-discovery expansion). Such functions report analyzerStatus=skipped because Istanbul artifacts exclude test-file coverage.' (2) experiments/wp5/wp5.6/limitations.md — add a row in the Attribution limitations section: 'Changed-function count includes test-file functions per WP5.3 C03. This is correct behavior; test-file changes are real changes. Coverage is unavailable for test files, so analyzerStatus=skipped is truthful per INV-04.' (3) experiments/wp5/wp5.6/known-defects-rootcause.md — update F-04 section status from 'Proposed corrective action' to 'Resolved: accepted and documented in contract and limitations.'"
    agent: "documenter"
    files: ["experiments/wp5/wp5.4/failure-semantics-contract.md", "experiments/wp5/wp5.6/limitations.md", "experiments/wp5/wp5.6/known-defects-rootcause.md"]
    acceptance: "All 3 docs updated with F-04 documentation; no code changes; git diff shows only doc edits; content accurately reflects that test-file fns are included and skipped is truthful"
    depends_on: ["1"]
  - id: "6"
    description: "D-APOLLO: Research — re-clone apollo-client at pinned SHAs and re-run coverage generation. Read experiments/wp4r-final/apollo-client/apollo-01/metadata.md, apollo-02/metadata.md, apollo-03/metadata.md to extract the pinned base/target SHAs and the original coverage commands. For apollo-01: (a) clone apollo-client at the pinned SHA, (b) install deps, (c) try running with Jest 26 (npm install jest@26) or apply a toBeCalled shim (patch node_modules/@apollo/client to alias toBeCalled → toHaveBeenCalled), (d) run coverage and check if coverage-final.json is produced. For apollo-02/03: (a) clone at pinned SHAs, (b) check jest.config.ts for collectCoverage/coveragePathIgnorePatterns settings, (c) try running with --coverage --coverageReporters=json and capture full stderr. Document results in experiments/wp5/wp5.6/d-apollo-reverification.md with: repo SHA, Jest version, test results, coverage artifact status, root cause if found."
    agent: "researcher"
    files: ["experiments/wp4r-final/apollo-client/apollo-01/metadata.md", "experiments/wp4r-final/apollo-client/apollo-02/metadata.md", "experiments/wp4r-final/apollo-client/apollo-03/metadata.md", "experiments/wp5/wp5.6/d-apollo-reverification.md"]
    acceptance: "d-apollo-reverification.md exists with: per-case repo SHA, Jest version used, test pass/fail counts, whether coverage-final.json was produced, root cause analysis for each case; at minimum apollo-01 is re-tested with a working Jest version"
    depends_on: ["1"]
  - id: "7"
    description: "Regression suite full check. Run npx vitest run and verify 143+ tests pass. Also run: (1) tsc --noEmit to verify TypeScript compiles cleanly, (2) npm run build to verify CLI builds. Record results in a short summary."
    agent: "tester"
    files: ["src/coverage.ts", "src/attribution.ts", "src/complexity.ts"]
    acceptance: "npx vitest run: 143+ tests pass; tsc --noEmit: zero errors; npm run build: exits 0"
    depends_on: ["4", "5"]
  - id: "8"
    description: "Docs reconciliation. Update: (1) experiments/wp5/wp5.6/WP5_6_CLOSURE.md — update the 'Known defects' section: F-03 resolved with path normalization, F-04 resolved with documentation, D-APOLLO status per re-verification results. (2) experiments/wp5/wp5.6/freeze-checklist.md — update deferred items: F-03 resolved, F-04 resolved, D-APOLLO status per re-verification. (3) experiments/wp5/wp5.6/limitations.md — update the Reproducibility limitations section to reflect F-03 fix (path normalization now handles cross-env artifacts)."
    agent: "documenter"
    files: ["experiments/wp5/wp5.6/WP5_6_CLOSURE.md", "experiments/wp5/wp5.6/freeze-checklist.md", "experiments/wp5/wp5.6/limitations.md"]
    acceptance: "All 3 docs updated; WP5_6_CLOSURE.md 'Known defects' section reflects remediation status; freeze-checklist.md F-03/F-04 items checked; limitations.md updated to reflect F-03 fix; no code changes in this task"
    depends_on: ["6", "7"]
---

# WP5.6 Defect Remediation Plan

> **For agentic workers:** Use subagent-driven-development to execute this plan task-by-task. Each task is independent enough to run in a fresh subagent session. Steps use checkbox syntax for tracking.

**Goal:** Remediate the three known defects from WP5.6 closure: F-03 (Istanbul path coupling), F-04 (C03 test-file expansion), D-APOLLO (Apollo coverage generation failure).

**Architecture:** Small additive fix for F-03 (path normalization in coverage.ts), documentation-only for F-04, research/re-verification for D-APOLLO. No contract changes, no threshold changes, no language expansion.

**Tech Stack:** TypeScript, vitest, crap-typescript-core v0.5.0, Istanbul coverage format.

## Global Constraints

- §NO SILENT METHODOLOGY CHANGES — all fixes are additive, reversible, and traceable.
- §REVERSIBILITY — prefer reversible decisions while evidence is weak.
- §MINIMALITY PRINCIPLE — smallest implementation that answers the question.
- §REGRESSION ANCHOR REGISTER — must not regress FM-V01, FM-D10, FM-G06, FM-G07, FM-A07, FM-A08, FM-C03, or any WP5 invariant.
- §DOCUMENTATION RECONCILIATION — code, tests, docs must agree.
- WP5.6 freeze at engine commit 21daa57 is NOT modified. This plan is the FIRST WP6+ work.

---

## Decision Records

### F-03: Istanbul coverage absolute-path coupling

**Selected fix: Option 1 — Path normalization in `src/coverage.ts` after `parseCoverageReport`.**

**Rationale:**
- The fix is a small additive function (~15-20 lines) that walks the coverage map keys and re-bases absolute paths to repo-relative.
- It is fully reversible: removing the function reverts to the pre-fix behavior.
- It does not change the function signature of `readCoverage()`, preserving the contract.
- It does not modify `src/attribution.ts`, so the suffix-collision detection (A08 fix) is preserved.
- It solves the cross-machine replay problem identified in WP5.6.

**Rejected alternatives:**
- Option 2 (CLI cwd contract documentation): Moves burden to caller, does not fix the reproducibility gap.
- Option 3 (Caller-side artifact post-processing): Outside prototype scope, does not improve the engine.

**Files affected:** `src/coverage.ts` (add function + call site).
**Tests needed:** Unit test that creates a coverage artifact with absolute paths from a different cwd and verifies the returned map has normalized keys.
**Risk to invariants:** LOW. The normalization only affects the key format; coverage values, status semantics, and attribution logic are unchanged. FM-V01 (coverage capability), FM-G06 (missing≠malformed) are not affected.

### F-04: WP5.3 C03 changed-function count expansion

**Selected fix: Option 1 — Accept and document (no code change).**

**Rationale:**
- The expansion is correct: a changed test function is a real changed function.
- The `analyzerStatus=skipped` for test-file fns is truthful per INV-04 (ANALYZER TRUTHFUL).
- Gate outcomes are stable (hono-03 still PASS, sup-a still WARN).
- Filtering test files out would re-introduce WP5.3 C03 (the blind spot that was deliberately fixed).
- Splitting into production/test categories would be a significant contract change, not minimal.

**Files affected:** `experiments/wp5/wp5.4/failure-semantics-contract.md`, `experiments/wp5/wp5.6/limitations.md`, `experiments/wp5/wp5.6/known-defects-rootcause.md`.
**Tests needed:** None (no code change).
**Risk to invariants:** NONE. No code changes.

### D-APOLLO: Apollo-client coverage generation failure

**Selected fix: Option 1 — Re-clone apollo-client at pinned SHAs and re-run coverage.**

**Rationale:**
- WP4R evidence is preserved but the root cause of apollo-02/03 coverage failure is unconfirmed (medium confidence).
- A live re-clone at pinned SHAs with a working Jest version would validate whether the prototype works end-to-end on apollo-client.
- If re-verification succeeds, apollo cases can be included in future usefulness evidence.
- If it fails, the cases remain documented as caller-side failures.

**Files affected:** `experiments/wp5/wp5.6/d-apollo-reverification.md` (new research document).
**Tests needed:** None (research task; results inform future decisions).
**Risk to invariants:** NONE. Research only, no code changes.

---

## Task Dependency Graph

```
1 (baseline) → 2 (F-03 test) → 3 (F-03 impl) → 4 (F-03 verify) → 7 (regression) → 8 (docs)
1 (baseline) → 5 (F-04 docs) ──────────────────────────────────────────────────────────┘
1 (baseline) → 6 (D-APOLLO research) ────────────────────────────────────────────────────┘
```

- Task 1 is the root: baseline verification for all downstream tasks.
- Tasks 2-4 form the F-03 TDD cycle: test → implement → verify. Sequential.
- Task 5 (F-04 docs) is independent of 2-4; can run in parallel with F-03 work.
- Task 6 (D-APOLLO research) is independent; can run in parallel with everything.
- Task 7 (regression) depends on 4 and 5 (all code changes done).
- Task 8 (docs reconciliation) depends on 6 and 7 (research results + regression pass).

## Risk Analysis Per Task

### Task 1: Baseline verification
- Risk: None (read-only).
- Invariants: Verifies 143/143 regression suite, freeze state.

### Task 2: F-03 failing test
- Risk: LOW. Test creates temp coverage artifact with absolute paths. No production code touched.
- Invariants: Tests path normalization without changing coverage semantics.
- New test: `wp56-f03-path-normalization.spec.ts` — tests that absolute-path coverage artifacts are normalized to repo-relative keys.

### Task 3: F-03 implementation
- Risk: MEDIUM. Any change to `src/coverage.ts` could affect existing attribution.
- Invariants to protect: FM-V01 (coverage capability), FM-G06 (missing≠malformed), INV-01 (ZERO≠NULL), INV-02 (MISSING≠MALFORMED), INV-04 (ANALYZER TRUTHFUL).
- Reversibility: High — the `normalizeCoveragePaths` function can be removed without affecting other code.
- Rollback: Revert the commit; the function is isolated in coverage.ts.

### Task 4: F-03 verification
- Risk: LOW (testing only).
- Invariants: Must confirm all 143+ tests pass, including existing coverage-distinction tests.

### Task 5: F-04 documentation
- Risk: NONE (docs only).
- Invariants: None affected. Documentation accurately reflects existing behavior.

### Task 6: D-APOLLO research
- Risk: LOW (research only). May fail to reproduce if apollo-client deps are incompatible.
- Invariants: None. Research results inform future WP6 decisions.

### Task 7: Regression suite
- Risk: LOW (testing only).
- Invariants: Must verify 143+ tests pass, tsc clean, build succeeds.

### Task 8: Docs reconciliation
- Risk: NONE (docs only).
- Invariants: Must accurately reflect the state of code and research results.

## Exit Gate

The plan is complete when ALL of the following are satisfied:

1. **F-03:** Path normalization implemented in `src/coverage.ts`, tested, and verified. A coverage artifact with absolute paths from a different cwd produces normalized keys that allow attribution to succeed.
2. **F-04:** Contract and limitations docs updated to reflect that changedFunctions may include test-file functions.
3. **D-APOLLO:** Re-verification document created with per-case results (SHA, Jest version, test results, coverage artifact status, root cause).
4. **Regression suite:** 143+ tests pass, tsc clean, build succeeds.
5. **Docs reconciled:** WP5_6_CLOSURE.md, freeze-checklist.md, limitations.md all updated to reflect remediation status.
6. **No silent methodology changes:** All changes are additive, documented, and reversible.

## Explicit Non-Goals

- **No threshold tuning.** Threshold 30 (default) and 15 (supplemental) remain unchanged.
- **No language expansion.** TypeScript/JavaScript only.
- **No coverage provider expansion.** Istanbul and v8 only.
- **No contract schema changes.** The output JSON schema (v0.2) is not modified.
- **No test orchestration.** The engine does not run tests.
- **No Engram/CI integration.** Per WP6 decision forks.
- **No monorepo support.** Out of scope for this remediation.
- **No silent re-execution of WP5.6 cases.** WP5.6 frozen results are preserved as baseline.
- **No changes to src/attribution.ts, src/complexity.ts, src/evidence.ts, src/cli.ts, src/crapCalc.ts, src/rules.ts.** The F-03 fix is isolated to src/coverage.ts. F-04 and D-APOLLO are docs/research only.

## Pre-Implementation Checklist

Before any task begins, verify:

- [ ] Current branch is `main`
- [ ] Working tree clean (modulo WP5.6 untracked artifacts: `.opencode/plans/2026-08-27-wp56-usefulness-robustness-freeze.md`, `experiments/wp5/wp5.6/`)
- [ ] Regression suite: 143/143 pass (`npx vitest run`)
- [ ] WP5.6 freeze at engine commit `21daa57` documented in `experiments/wp5/wp5.6/freeze-checklist.md`
- [ ] `experiments/wp5/wp5.6/WP5_6_CLOSURE.md` exists (176 lines)
- [ ] `experiments/wp5/wp5.6/known-defects-rootcause.md` exists (232 lines)
- [ ] `experiments/wp5/wp5.4/failure-semantics-contract.md` exists (116 lines)
- [ ] `experiments/wp5/wp5.4/diagnostic-matrix.md` exists (137 lines)
- [ ] `src/coverage.ts` exists (42 lines)
- [ ] `src/attribution.ts` exists (168 lines)
- [ ] `src/complexity.ts` exists (75 lines)
- [ ] `node_modules/@barney-media/crap-typescript-core/dist/istanbul.js` exists (344 lines)