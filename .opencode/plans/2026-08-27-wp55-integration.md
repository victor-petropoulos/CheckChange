---
task: "WP5.5 — End-to-end integration verification"
created: "2026-08-27T10:00:00Z"
approved: true
tasks:
  - id: "1"
    description: "Baseline verification — run full test suite, confirm 49 files / 125 tests PASS, document current pipeline composition joints (git.ts → evidence.ts → cli.ts → exit code). Record baseline as T1 baseline for regression comparison."
    agent: "tester"
    files: ["test/evidence.test.ts", "test/rules.test.ts", "test/wp4r2-coverage-file.test.ts", "experiments/wp5/wp5.2/regression-anchors.spec.ts", "experiments/wp5/wp5.2/defect-repro.spec.ts"]
    acceptance: "Run `npx vitest run` — output shows 'Test Files 49 passed, Tests 125 passed'. Duration ≤ 3s. No failures. Baseline recorded in task output."
    depends_on: []
  - id: "2"
    description: "End-to-end composed pipeline tests — write `experiments/wp5/wp5.5/wp55-pipeline.spec.ts` with 3 integration scenarios using `buildEvidenceOutput` directly (bypasses git layer, tests composition of complexity → coverage → attribution → CRAP → threshold → analyzerStatus → correlate → ruleResults → gate/completeness): (A) high CC + zero coverage → analyzerStatus 'passed', crap computed, gate PASS/WARN; (B) high CC + unavailable coverage (no coverage file) → analyzerStatus 'skipped', crap null, ruleResult NOT_EVALUATED, coverageArtifact 'absent'; (C) complexity provider failure → analysisStatus 'UNSUPPORTED', gate null, completeness 'NOT_APPLICABLE'. Verify INV-01 (ZERO≠NULL) and INV-04 (analyzerStatus truthful) survive composition."
    agent: "tester"
    files: ["experiments/wp5/wp5.5/wp55-pipeline.spec.ts", "experiments/wp5/wp5.2/fixtures/helpers.ts", "src/evidence.ts", "src/complexity.ts", "src/attribution.ts", "src/crapCalc.ts", "src/rules.ts"]
    acceptance: "Test file compiles (`npx tsc --noEmit`). All 3 scenarios pass: (A) crap !== null, analyzerStatus === 'passed'; (B) crap === null, analyzerStatus === 'skipped', coverageArtifact === 'absent'; (C) analysisStatus === 'UNSUPPORTED', gate === null. No scope creep — no threshold/CRAP formula changes."
    depends_on: ["1"]
  - id: "3"
    description: "Missing vs malformed vs absent distinction survives composition — write `experiments/wp5/wp5.5/wp55-coverage-distinction.spec.ts` with 3 scenarios using `buildEvidenceOutput` + `readCoverage` directly: (A) default missing coverage → coverageArtifact 'absent', analysisStatus 'SUCCESS', gate 'PASS', completeness 'COMPLETE', exit 0 via CLI; (B) explicit missing coverage (`--coverage-file /nonexistent`) → coverageArtifact 'failed', coverageErrorReason 'missing', analysisStatus 'FAILED', gate null, completeness 'INCOMPLETE', exit 1, stderr 'coverage artifact missing'; (C) malformed coverage file (write invalid JSON to coverage-final.json) → coverageArtifact 'failed', coverageErrorReason 'malformed', analysisStatus 'FAILED', gate null, completeness 'INCOMPLETE', exit 1, stderr 'coverage artifact malformed'. Verify INV-02 (MISSING≠MALFORMED) and INV-01 (ZERO≠NULL) survive composition through CLI layer."
    agent: "tester"
    files: ["experiments/wp5/wp5.5/wp55-coverage-distinction.spec.ts", "experiments/wp5/wp5.2/fixtures/helpers.ts", "src/coverage.ts", "src/evidence.ts", "src/cli.ts"]
    acceptance: "Test file compiles. All 3 scenarios pass: (A) coverageArtifact === 'absent', analysisStatus === 'SUCCESS', exit 0; (B) coverageErrorReason === 'missing', analysisStatus === 'FAILED', exit 1, stderr includes 'missing'; (C) coverageErrorReason === 'malformed', analysisStatus === 'FAILED', exit 1, stderr includes 'malformed'. Distinctions verified end-to-end."
    depends_on: ["1"]
  - id: "4"
    description: "Git ENOENT vs not-a-repo + unsupported/empty changes composition — write `experiments/wp5/wp5.5/wp55-git-unsupported.spec.ts` with 3 scenarios: (A) ENOENT — mock `execute` to return errorCode 'ENOENT', verify `validateGitRepo` throws 'Git executable not found', CLI exits 1 with stderr 'Git executable not found'; (B) not-a-repo — run CLI against temp dir without .git, verify stderr 'Not a git repository', exit 1; (C) unsupported (non-TS changes only) — pass intervals with only .js/.ts files, verify analysisStatus 'UNSUPPORTED', gate null, completeness 'NOT_APPLICABLE', changedFunctions [], exit 0. Verify INV-03 (GIT≠REPO) and unsupported path survive composition."
    agent: "tester"
    files: ["experiments/wp5/wp5.5/wp55-git-unsupported.spec.ts", "experiments/wp5/wp5.2/fixtures/helpers.ts", "src/git.ts", "src/execute.ts", "src/cli.ts", "src/evidence.ts"]
    acceptance: "Test file compiles. All 3 scenarios pass: (A) errorCode 'ENOENT' → throws 'Git executable not found'; (B) no .git dir → stderr 'Not a git repository', exit 1; (C) non-TS intervals only → analysisStatus 'UNSUPPORTED', gate null, completeness 'NOT_APPLICABLE', exit 0. Distinctions verified."
    depends_on: ["1"]
  - id: "5"
    description: "Determinism + status propagation matrix — write `experiments/wp5/wp5.5/wp55-determinism.spec.ts` with: (A) determinism — run `buildEvidenceOutput` 5× with identical inputs (same repo, same intervals, same coverage), assert JSON output identical across all 5 runs (compare serialized JSON strings); (B) status propagation matrix — trace all 8 diagnostic matrix rows from `experiments/wp5/wp5.4/diagnostic-matrix.md` via CLI integration (spawnSync): valid coverage PASS, valid coverage WARN, default missing, explicit missing, malformed, unsupported, ENOENT, not-a-repo. For each row assert exact exit code, stderr content, stdout content, and JSON fields (analysisStatus, gate, completeness, coverageArtifact). Verify INV-01 through INV-04 across all rows."
    agent: "tester"
    files: ["experiments/wp5/wp5.5/wp55-determinism.spec.ts", "experiments/wp5/wp5.4/diagnostic-matrix.md", "experiments/wp5/wp5.2/fixtures/helpers.ts", "src/cli.ts", "src/evidence.ts"]
    acceptance: "Test file compiles. Determinism: 5 runs produce identical JSON strings. Status propagation: all 8 rows match diagnostic-matrix.md exactly (exit code, stderr, stdout, JSON fields). No unexpected nondeterminism."
    depends_on: ["2", "3", "4"]
  - id: "6"
    description: "Regression + packet — run full test suite (`npx vitest run`) confirming all 49 files + new WP5.5 tests PASS. Produce `experiments/wp5/wp5.5/WP5_5_RESULTS.md` documenting: (A) all WP5.5 scenarios A-F from Roadmap with pass/fail status; (B) status propagation matrix results; (C) determinism results; (D) classification of any new findings per Roadmap taxonomy (A=regression, B=pre-existing, C=environment, D=methodology, E=new defect, F=test defect); (E) updated failure-semantics-contract.md if any semantics changed; (F) prior regression anchors (WP5.2 7/7, WP5.3 10/10) still green. Document new findings as A-F per Roadmap. Update OPENCODE_START_HERE.md with WP5.5 status."
    agent: "documenter"
    files: ["experiments/wp5/wp5.5/WP5_5_RESULTS.md", "experiments/wp5/wp5.5/wp55-pipeline.spec.ts", "experiments/wp5/wp5.5/wp55-coverage-distinction.spec.ts", "experiments/wp5/wp5.5/wp55-git-unsupported.spec.ts", "experiments/wp5/wp5.5/wp55-determinism.spec.ts", "experiments/wp5/wp5.4/failure-semantics-contract.md", "OPENCODE_START_HERE.md"]
    acceptance: "Full suite passes: `npx vitest run` shows all test files green including new WP5.5 tests. WP5_5_RESULTS.md produced with all required sections (A-F scenarios, propagation matrix, determinism, findings classification, anchor status). failure-semantics-contract.md updated only if semantics actually changed (likely no update needed). OPENCODE_START_HERE.md updated to reflect WP5.5 completion status."
    depends_on: ["5"]
---

# WP5.5 — End-to-end Integration Verification Plan

## Objective

WP5.4 proves individual semantic corrections (V01/D10/G06/G07). WP5.5 asks: **Do the corrected semantics remain correct when the complete pipeline is composed?**

Per Roadmap: "The key question is not merely: 'Does each component work?' It is: 'Does the meaning survive the transition between components?'"

## Invariants to Verify

| # | Invariant | Source |
|---|-----------|--------|
| INV-01 | ZERO ≠ NULL: `coverage: 0` → `analyzerStatus: 'passed'`; `coverage: null` → `analyzerStatus: 'skipped'` | evidence.ts:216 |
| INV-02 | MISSING ≠ MALFORMED: distinct reason + stderr + same FAILED status | coverage.ts:21,34; cli.ts:125-133 |
| INV-03 | GIT UNAVAILABLE ≠ NOT-A-REPO: distinct msgs, same exit 1 | git.ts:14-17,38-41 |
| INV-04 | ANALYZER STATUS TRUTHFUL: status from evaluation state, not hardcoded | evidence.ts:216 |

## Scope Constraints

- **No new features.** No threshold/CRAP/attribution/source-discovery/provider/language/LLM changes.
- **No speculative abstractions.** Tests use existing helpers (`createTempRepo`, `writeCoverageFile`, `callBuildEvidenceOutput`).
- **Deterministic only.** No randomness, no network calls, no timestamp-dependent assertions.
- **Prior anchors preserved.** WP5.2 regression anchors (7/7), WP5.3 fixtures (10/10) must remain green.

## Task Dependency Graph

```
T1 (baseline)
  ├── T2 (pipeline composition) ──┐
  ├── T3 (coverage distinction) ──┤── T5 (determinism + propagation matrix) ── T6 (regression + packet)
  └── T4 (git + unsupported) ─────┘
```

T2, T3, T4 are independent after T1 baseline — can run in parallel.

## Design Decisions

1. **Integration tests use `buildEvidenceOutput` directly** (bypasses git layer) for T2/T3 — faster, more deterministic, tests the composition joint that matters (complexity → coverage → attribution → CRAP → threshold → analyzerStatus → correlate → ruleResults).
2. **CLI integration tests via `spawnSync`** for T4 (git errors) — git errors throw before evidence is built, so only CLI layer can test them.
3. **Determinism test runs 5×** — statistically meaningful, not just 2×.
4. **Status propagation matrix covers all 8 diagnostic-matrix.md rows** — exhaustive per Roadmap requirement.
5. **New findings classified per Roadmap A-F taxonomy** — prevents WP5.5 from becoming uncontrolled bug backlog.
