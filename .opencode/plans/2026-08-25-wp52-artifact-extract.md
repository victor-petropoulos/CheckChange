# WP5.2 Artifact Extract — researcher output 2026-08-25

Source session: researcher subagent extraction over WP5.1 artifacts. Verified paths. Read-only.

## A) FIXTURE TABLE

Total fixtures: **23** (4 P0, 9 P1, 10 P2). Counts match `experiments/wp5/wp5.1/fixture-requirements.md` and `WP5_2_DETERMINISTIC_FIXTURE_SUITE_SPEC.md`. No ID/priority mismatches between specifications.

| ID | Priority | Behavior Summary | Linked FM ID | Source Section |
|---|---|---|---|---|
| **FR-A6** | P0 | Class method coverage attribution key alignment test | FM-A07, FM-A10 | `fixture-requirements.md` § Tier P0 |
| **FR-A7** | P0 | Suffix-collision path attribution uniqueness | FM-A08 | `fixture-requirements.md` § Tier P0 |
| **FR-V1** | P0 | Default missing coverage artifact capability truthfulness | FM-V01 | `fixture-requirements.md` § Tier P0 |
| **FR-G3** | P0 | CLI invocation exit semantics for non-TS changes | FM-G05, FM-D06 | `fixture-requirements.md` § Tier P0 |
| **FR-D2** | P1 | Unchanged/unmatched lines outside functions accounting | FM-D02 | `fixture-requirements.md` § Tier P1 |
| **FR-D4** | P1 | Deleted-file diff interval invisibility check | FM-D04 | `fixture-requirements.md` § Tier P1 |
| **FR-D6** | P1 | Mixed TS and non-TS change isolation | FM-D07 | `fixture-requirements.md` § Tier P1 |
| **FR-V4** | P1 | Non-Istanbul valid JSON coverage artifact handling | FM-V04, FM-V05 | `fixture-requirements.md` § Tier P1 |
| **FR-V6** | P1 | Source file present in project but absent from coverage map | FM-V06 | `fixture-requirements.md` § Tier P1 |
| **FR-A3** | P1 | `fnMap` ambiguity / duplicate span collision handling | FM-A03, FM-A04 | `fixture-requirements.md` § Tier P1 |
| **FR-A4** | P1 | Nested function statement ownership numerics | FM-A05 | `fixture-requirements.md` § Tier P1 |
| **FR-A5** | P1 | Overlapping non-nested method spans tie-break | FM-A06 | `fixture-requirements.md` § Tier P1 |
| **FR-V7** | P1 | Duplicate Istanbul entries normalizing to same path merge | FM-V07 | `fixture-requirements.md` § Tier P1 |
| **FR-D1** | P2 | Basic in-function change happy path regression anchor | FM-D01 | `fixture-requirements.md` § Tier P2 |
| **FR-D3** | P2 | Newly added TS file evaluation | FM-D03 | `fixture-requirements.md` § Tier P2 |
| **FR-D5** | P2 | Renamed file path attribution stability | FM-D05 | `fixture-requirements.md` § Tier P2 |
| **FR-C1** | P2 | Single file parse failure whole-run UNSUPPORTED blast radius | FM-C01 | `fixture-requirements.md` § Tier P2 |
| **FR-C2** | P2 | Zero functions / missing `src` root graceful empty SUCCESS | FM-C02 | `fixture-requirements.md` § Tier P2 |
| **FR-C3** | P2 | Changed TS file outside `src` root blind spot pinning | FM-C03 | `fixture-requirements.md` § Tier P2 |
| **FR-G1** | P2 | Threshold equality boundary (`crap === threshold` → PASS) | FM-G02 | `fixture-requirements.md` § Tier P2 |
| **FR-G2** | P2 | High CC + 100% coverage WARN regression anchor (SUP-A) | FM-G03 | `fixture-requirements.md` § Tier P2 |
| **FR-G4** | P2 | CLI threshold argument forms and validation | FM-G06 | `fixture-requirements.md` § Tier P2 |
| **FR-G5** | P2 | Output format and ordering determinism | FM-G10 | `fixture-requirements.md` § Tier P2 |

## B) DEFECT REPRO LIST

| ID | Claimed Defect Behavior | Documented Location | Reproduction Hints |
|---|---|---|---|
| **FM-A07** | Container-method attribution key mismatch (`containerName.functionName` vs raw `functionName`) causes class and object methods to lose coverage → null CRAP / NOT_EVALUATED. | `failure-mode-matrix.md` § ATT; `WP5_1_FINDINGS.md` § 3 | Test class with methods overlapping changed intervals with valid statement coverage; verify coverage returns `null`. |
| **FM-C03** | Source-root blind spot: `findAllTypeScriptFilesUnderSourceRoots` restricts scanning to paths containing a `src` segment — changed TS files outside `src` (e.g. `tools/`) invisible. | `failure-mode-matrix.md` § CPX; `WP5_1_FINDINGS.md` § 3 | Create changed TS file under `tools/` with intervals; verify absent from `changedFunctions`. |
| **FM-A08** | Suffix-collision path attribution: bidirectional `endsWith` matching with first-entry-wins can misattribute coverage between files sharing relative path suffixes. | `failure-mode-matrix.md` § ATT; `WP5_1_FINDINGS.md` § 3 | Two packages with identical relative paths (`pkg-a/src/x.ts`, `pkg-b/src/x.ts`); verify cross-attribution. |
| **FM-V01** | Coverage capability mislabel: default coverage absent sets `available: false` but capabilities envelope reports `coverageArtifact: 'available'`. | `failure-mode-matrix.md` § COV; `WP5_1_FINDINGS.md` § 3 | Invoke pipeline without coverage file; check `capabilities.coverageArtifact`. |
| **FM-D10 / FM-G06** | CLI message inaccuracies: missing binary ENOENT reports "Not a git repository"; missing explicit coverage says "coverage artifact malformed". | `failure-mode-matrix.md` § DET & COV; `WP5_1_FINDINGS.md` § 3 | Invoke CLI with missing explicit coverage path; verify stderr wording. |
| **FM-G07** | Composed-path `analyzerStatus` hardcoded `'passed'` regardless of whether function actually evaluated / received null coverage. | `failure-mode-matrix.md` § GEX; `WP5_1_FINDINGS.md` § 3 | Inspect function output envelope in composed path for un-evaluated or null-coverage functions. |

## C) OPEN QUESTIONS

| ID | Question Summary | Required Resolution Mode | Relevant Evidence Locations |
|---|---|---|---|
| **OQ-1** | Does core lib intend `functionName` to include container prefix? | Empirical evidence | `src/attribution.ts:97`, `src/complexity.ts:22-24` |
| **OQ-2** | What names does parser assign to anonymous arrows, IIFEs, default exports? | Empirical evidence | `src/evidence.ts`, parser library outputs |
| **OQ-3** | Should UNSUPPORTED (no TS changes or parse failure) exit 0 or non-zero? | Human policy decision | `src/evidence.ts:121-142`, `src/cli.ts:124-128` |
| **OQ-4** | Should unmatched intervals or ingestion skips produce per-function diagnostics? | Human policy decision | `failure-mode-matrix.md` (gaps D02, V04) |
| **OQ-5** | Reconcile historical Apollo run exit-1 anomaly against current CLI mapping. | Preserved evidence only | `experiments/wp4r-final/human-review-diagnostics.md:151` |
| **OQ-6** | Is `coverageArtifact: 'available'` when default missing intentional contract or mislabel? | Human policy decision | `src/coverage.ts:28-31`, `src/evidence.ts:145` |
| **OQ-7** | Does source root scanner respect tsconfig `include` or only hardcoded `src` heuristic? | Empirical evidence | `node_modules/.../fileSelection.js:106,146,185`, `test/wp4r2-coverage-file.test.ts:15` |

## D) REGRESSION ANCHORS

1. **Threshold Equality:** `crap <= threshold ? 'PASS' : 'WARN'` when `crap !== null`. — `src/rules.ts:33`, `test/rules.test.ts:40-47`
2. **Explicit vs Default Missing Coverage:** Explicit missing → `{available: true, error: true}` → FAILED, gate null, completeness INCOMPLETE, exit 1. Default missing → `{available: false, error: false}` → SUCCESS, gate PASS, INCOMPLETE. — `src/coverage.ts:11-41`, `src/evidence.ts:143-156`, `test/wp4r2-coverage-file.test.ts`
3. **UNSUPPORTED / No-Function:** Non-TS-only changes → `UNSUPPORTED`, gate null, NOT_APPLICABLE, exit 0. — `src/evidence.ts:121-142`, `test/wp4.2.test.ts:306`
4. **Schema Compatibility:** v0.2 envelope shape (capabilities, changedFunctions, policy, ruleResults, analysisStatus, gate, completeness); legacy v0.1 retained. — `src/evidence.ts:8-83, 261-280`
5. **Threshold 30 Default:** `--crap-threshold` default `30`. — `src/cli.ts:13`, `WP4R_CLOSURE.md:28`
6. **Deterministic Ordering:** file discovery sorted before processing. — `node_modules/.../fileSelection.js:26,41`, `failure-mode-matrix.md` § CPX
7. **Coverage Dedup:** duplicate Istanbul entries normalized/merged deterministically (max statement hits, merged branches). — `node_modules/.../istanbul.js:191-227`, `failure-mode-matrix.md` § COV

## E) PRODUCTION BASELINE

- Production: `src/` (git.ts, execute.ts, attribution.ts, complexity.ts, crapCalc.ts, crap.ts, rules.ts, coverage.ts, evidence.ts, cli.ts) + core lib `node_modules/@barney-media/crap-typescript-core/dist/*`.
- Runner: Vitest (`vitest run`) via package.json scripts.
- Frozen baseline: commit `a41d25f`; HEAD `d15c866` adds docs only. Working tree clean.

## F) CONTRADICTIONS

1. WP5.1 recommended `test.skip` on FR-A6/A7/V1/G3; WP5.2 amendment overrides — all 23 must EXECUTE as characterization tests asserting current behavior + recording desired behavior separately. **Governing authority: WP5.2 amendment. Not material to scope.**
2. Historical Apollo log exit-1-with-PASS anomaly vs current CLI exit mapping (exit 1 ⇔ FAILED). Low materiality — classified OQ-5, reconcile from preserved evidence only.

## G) OUTPUT LOCATIONS

Under `experiments/wp5/wp5.2/`: fixture corpus + tests, `fixture-manifest.md`, `coverage-matrix.md`, `open-question-results.md`, `defect-reproduction-results.md`, `WP5_2_RESULTS.md`. Updates: `experiments/wp5/planning/WP5_DECISION_LOG_WP5_1_UPDATE.md`, `experiments/wp5/planning/WP5_TRACEABILITY_MATRIX_WP5_2_UPDATE.md`.
