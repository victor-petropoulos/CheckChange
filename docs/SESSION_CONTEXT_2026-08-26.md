# Session Reload Summary — WP5.3 Closed, WP5.4 Planning Complete

**Date:** 2026-08-26
**State at end of session:** WP5.3 reconciled + closed. WP5.4 planning artifacts complete (5 files), but implementation has NOT been authorized or started. All WP5.4 artifacts are untracked on disk.
**Goal of this doc:** bring a fresh agent (or future session) up to the understanding this session ended with, in one read.

---

## 1. Project Identity

`code-risk-prototype-v0.3-opencode` — deliberately small, free, local-first TypeScript/Node CLI.

**Thesis (docs/01_REVISED_PROJECT_THESIS.md):**

> Existing tools produce useful facts independently. A small deterministic correlator may be able to combine those facts into useful change-risk findings without requiring another platform or an LLM.

**Hard guardrail (docs/02_SCOPE_AND_GUARDRAILS.md):** **Do not build an analysis engine.** If an established tool can produce a deterministic measurement, consume it. Forbidden: custom TS AST analysis, custom complexity, custom coverage instrumentation, custom lint/security, dep vuln scanning, duplication, generic SARIF, plugin arch, multi-language, DB/UI/cloud, IDE/MCP/LLM/Engram integration.

**Architecture-creep test:** Do not create an abstraction until two real implementations require it.

**Cost philosophy:** local-first, account-free, API-key-free, cloud-independent, telemetry-free.

**Bar for success:** would a developer voluntarily run this small free tool?

## 2. Tech Stack (docs/13_TECH_STACK.md)

- Node.js 24 LTS (use `nvm use`)
- TypeScript 6.x, ESM / NodeNext
- npm
- `util.parseArgs` for CLI, `child_process.execFile` for subprocesses
- Vitest for own tests, ESLint for own linting
- `@barney-media/crap-typescript` as external CRAP/complexity analyzer
- system Git CLI
- existing target-project test/coverage tooling
- existing `tsc` + ESLint where configured

No DB / Docker / cloud / LLM / MCP / Engram / plugin framework / custom source-analysis engine.

## 3. CLI Shape (docs/04)

```
tool check --base main
tool check --base main --json
tool check --base HEAD --coverage-file <path>   # WP4R.2: explicit coverage path
```

Six flat files originally (`cli.ts`, `git.ts`, `tools.ts`, `evidence.ts`, `rules.ts`, `report.ts`). Current `src/` has: attribution.ts, cli.ts, complexity.ts, coverage.ts, crap.ts, crapCalc.ts, evidence.ts, execute.ts, git.ts, rules.ts (plus *.test.ts files). Plus a small `tools/check.ts` outside src/.

## 4. Three Rules (docs/05_EVIDENCE_AND_RULES.md)

- **R1** — Tests failed → FAIL
- **R2** — Changed function + CRAP > threshold → WARN/FAIL
- **R3** — Changed high-risk function + coverage < threshold → FAIL

Default CRAP threshold = **30**. Missing evidence must NOT become a clean result; surface `UNAVAILABLE` / `NOT_EVALUATED` / `UNSUPPORTED` explicitly.

## 5. Work-Package Progression

| WP | Purpose | Status |
|----|---------|--------|
| WP0 | Evidence feasibility spike | DONE |
| WP1 | Git→changed-function correlation | DONE |
| WP1.1 | Mechanical verification of hunk→function correlation | DONE |
| WP2 | Minimal evidence envelope | DONE |
| WP2.1 | Envelope clarification (0 vs null) | DONE |
| WP3 | Three rules + advisory high-CRAP | DONE |
| WP4 | Usefulness validation, 3 real repos × 3 cases | DONE (inconclusive) |
| WP4.1 | Evidence acquisition investigation | DONE |
| WP4.2 / 4.2.1 | Composed evidence + corrective verification | DONE |
| WP4R | Real-repo usefulness rerun (apollo-client, h3, hono) | DONE / ACCEPTED |
| WP4R.1 / 4R.1a / 4R.2 / 4R.2-verif | Coverage artifact discovery → V8 reporter → explicit coverage path → real artifact verification | DONE |
| WP4R-final / WP4R-supplemental | Human review packet + final closure docs | DONE |
| **WP5.1** | Failure-mode inventory + spec | DONE / ACCEPTED |
| **WP5.2** | Deterministic fixture suite + defect repro evidence (23 fixtures, 36 tests) | DONE / ACCEPTED |
| **WP5.3** | Coverage attribution correctness (A08/A07/C03 fixes) | **JUST CLOSED** |
| WP5.4 | Failure semantics + diagnostics (V01/D10/G06/G07 + INV-06) | PLANNING COMPLETE, IMPLEMENTATION NOT STARTED |
| WP5 Final | Integrated verification + closure | SPEC WRITTEN, NOT STARTED |

WP5 spec: docs/research/WP5_ROBUSTNESS_VALIDATION_PLAN.md + experiments/wp5/planning/WP5_MASTER_PLAN.md.

Each WP stops for human review. Later WP docs drafted early, then **reconciled** against earlier findings before execution.

## 6. WP5.3 — What Just Happened

### What WP5.3 fixed (3 defects)

| FM | Symptom | Fix location |
|----|---------|--------------|
| **FM-A08** | Suffix-collision wrong-file attribution. Bidirectional `endsWith` in `src/attribution.ts` lines 55-70 caused `src/pkg-a/index.ts` to get `src/pkg-b/index.ts`'s coverage (or null) when both shared suffix `index.ts`. | Replace with: exact path match first → `endsWith` fallback only if no exact match → ambiguous → decline (`coveragePercent: null, coverageKind: null`) |
| **FM-A07** | Container-method attribution key mismatch. Attribution key was `${functionName}:${startLine}` (e.g. `"bar:6"`); complexity used `${containerName}.${functionName}` (e.g. `"Cls.bar:6"`). → `descriptorMap.get("bar:6")` returned `undefined` → all class/object methods got `null` coverage. | Change attribution key to `${containerName ? containerName + '.' : ''}${functionName}:${startLine}` |
| **FM-C03** | Silent source-root blind spot. `findAllTypeScriptFilesUnderSourceRoots` only scanned `src/`. Changed TS outside `src/` (e.g. `tools/check.ts`) was invisible → absent from `changedFunctions`. | Hybrid: union `findAllTypeScriptFilesUnderSourceRoots(cwd)` + `git ls-files | filter .ts | resolve(cwd)` via new `getGitTrackedTsFiles()` helper in `src/complexity.ts`. No interface change to `collectComplexity(cwd)`. Falls back to source-root scanner only if `git ls-files` fails. |

### Files changed in WP5.3 (production)

- `src/attribution.ts` — lines 55-70 (identity resolution), lines 97, 103 (descriptor key format)
- `src/complexity.ts` — added `getGitTrackedTsFiles()` helper + union logic

Total: ~30 lines added, ~15 lines modified. **No** changes to threshold, CRAP formula, CLI messages, capability/analyzerStatus, coverage formats, orchestration, language, or LLM logic.

### Tests in WP5.3

- **WP5.2 regression anchors:** `vitest run experiments/wp5/wp5.2/` → 25 files, 36 tests, **ALL PASS** (zero regressions on FM-V01, FM-D10, FM-G06, FM-G07)
- **WP5.3 adversarial:** `vitest run experiments/wp5/wp5.3/` → 10 files, 10 tests, **ALL PASS**
- **Total: 35 files, 46 tests, ALL PASS**

### Invariants (attribution-invariants.md, INV-01–INV-09)

- INV-01: Same-function identity (complexity + coverage match same logical fn)
- INV-02: Wrong-file prohibition (no coverage from wrong file due to shared suffix)
- INV-03: Ambiguity refusal (decline, don't pick)
- INV-04: Order independence (coverage-map order can't change attribution)
- INV-05: Deterministic container identity (`{containerName}.{functionName}:{startLine}`)
- INV-06: Explicit missing/unsupported (NOT_EVALUATED, not silent omission)
- INV-07: Source-file identity before function attribution
- INV-08: Known changed TS outside analyzed roots must NOT silently yield trustworthy COMPLETE/PASS
- INV-09: WP5.2 anchors + WP4R boundaries intact

### 4 FMs deferred to WP5.4 (authoritative WP5.2 meanings)

- **FM-V01** — Coverage capability mislabel: `capabilities.coverageArtifact` reports `'available'` when default coverage is missing. → Should reflect `available: false`.
- **FM-D10** — CLI reports `"Error: Not a git repository"` when **git binary missing** (ENOENT), not repo state. Evidence: experiments/wp5/wp5.2/cli-diagnostics/fm-d10-evidence.md.
- **FM-G06** — CLI reports `"Error: coverage artifact malformed"` when coverage file missing, requires TS change to activate coverage path. Evidence: experiments/wp5/wp5.2/cli-diagnostics/fm-g06-evidence.md.
- **FM-G07** — Composed-path `analyzerStatus` hardcoded `'passed'` regardless of null coverage.

### WP5.3 closure reconciliation (this session's work)

WP5.3 implementation passed; documentation closure was HELD because the WP5.4 routing section of `WP5_3_RESULTS.md` contained FM descriptions for V01/D10/G06/G07 that conflicted with authoritative WP5.2 taxonomy. Reconciliation corrected those descriptions by inheriting from WP5.2 authoritative sources:

- **Date fix:** `2025-08-26` → `2026-08-26` in `WP5_3_RESULTS.md` and `defect-fix-record.md` headers
- **FM taxonomy:** restored V01/D10/G06/G07 to WP5.2-authoritative meanings (verified against `defect-reproduction-results.md`, `WP5_2_RESULTS.md`, `cli-diagnostics/*.md`, `fr-*.spec.ts`, `defect-repro.spec.ts`)
- **C03 contract wording:** changed from "acceptable/user should git add" → "tracked-only expansion; new/untracked TS files may remain undiscovered; **unresolved product/analysis-contract question**; no fix authorized in this pass; do not prescribe `git add` as product requirement"
- **Decision log:** D016-D019 appended (reconciliation entry, closure held/released, taxonomy inheritance principle, untracked TS unresolved contract)
- **Traceability matrix:** correction row + authoritative deferred-FM chains

`WP5_3_DOCUMENTATION_RECONCILIATION.md` (7-row table) created as the single durable record.

**Status: RECONCILED, WP5.3 CLOSED.**

## 7. WP5.4 — Planning Complete, Implementation Not Authorized

`experiments/wp5/planning/WP5_4_FAILURE_SEMANTICS_DIAGNOSTICS_SPEC.md`:

**Objective:** ensure incomplete / unsupported / ambiguous / malformed conditions produce deterministic, truthful machine+human-readable semantics.

**Validate per FM:** per-function state, analysis status, completeness, gate, process exit, reason/diagnostic, JSON shape, CLI stdout/stderr, ordering.

**Resolve distinctions:**
- missing evidence vs measured 0% coverage
- NOT_EVALUATED vs hard failure
- INCOMPLETE vs analysis failure
- advisory WARN vs error exit
- attribution ambiguity vs source absence
- missing default coverage vs missing explicit coverage

**Deliverables:**
- `experiments/wp5/wp5.4/failure-semantics-contract.md`
- `diagnostic-matrix.md`
- `WP5_4_RESULTS.md`
- regression tests + approved minimal fixes

**Acceptance:** all approved IDs map to explicit semantics; exit/status/completeness/gate not conflated; missing evidence never masquerades as zero; ambiguity never masquerades as numeric confidence; diagnostics deterministic; boundaries preserved.

**STOP before WP5 Final.**

## 8. WP5 Final — Integrated Closure (spec written, not started)

`experiments/wp5/planning/WP5_FINAL_VERIFICATION_AND_CLOSURE_SPEC.md`:

Run approved WP5 fixture suite + attribution adversarial + failure-semantics + relevant regression + narrowly-necessary real-repo smoke checks.

Create `experiments/wp5/WP5_FINAL_RESULTS.md` + `WP5_CLOSURE.md` + `WP5_EVIDENCE_MANIFEST.md`.

**Closure criteria:**
- supported cases evaluate deterministically
- unsupported/ambiguous cases decline safely
- missing evidence never synthesized
- ambiguity cannot silently become numeric CRAP
- complexity/coverage identity trustworthy within supported scope
- failure/completeness/gate/exit semantics consistent + tested
- accepted defects have regression tests
- limitations explicit
- WP4R boundaries preserved unless explicitly approved otherwise

**Final status must be evidence-based:** `WP5: COMPLETE / ACCEPTED` | `COMPLETE WITH DOCUMENTED LIMITATIONS` | `NOT READY FOR CLOSURE`.

Cross-language expansion remains post-WP5.

## 9. Process / Workflow Notes

### Authority chain
- Implementation evidence = `vitest run experiments/wp5/wp5.X/` results in `WP5_X_RESULTS.md`
- Authoritative FM taxonomy = WP5.2 records (`defect-reproduction-results.md`, `WP5_2_RESULTS.md`, `cli-diagnostics/*.md`, `fr-*.spec.ts`, `defect-repro.spec.ts`)
- **Principle (D018):** FM meanings must be inherited from authoritative WP5.2 records, not inferred from later labels. Prevents accidental reuse/redefinition of FM IDs.
- Later WP docs (WP5.3, WP5.4, WP5 Final) drafted early, then reconciled against earlier findings.

### Frozen WP5 boundaries (carried from WP4R)
Caller/CI owns test execution + coverage generation. WP5 does NOT add:
- target-project test orchestration
- automatic coverage discovery
- coverage-provider abstraction
- LCOV ingestion
- target-project configuration mutation
- LLM judgment inside deterministic evidence/rule decisions

The prototype consumes evidence; it does not own evidence production.

### Engram review gate (AGENTS.md)
Every WP at unit boundary gets `review_delta`. Pre-commit: stage, diff, `review_changes`, evaluate findings (verify evidence, check confidence/severity), report via `report_review_action`. Critical/High must be resolved or explicitly rejected.

### Unresolved question (D019)
Untracked TS discovery: `git ls-files` only expands tracked TS files. **No product requirement to `git add` is prescribed.** Future policy decision required.

## 10. Navigation Map

| Need | Path |
|------|------|
| Project thesis + scope | `docs/01_REVISED_PROJECT_THESIS.md`, `docs/02_SCOPE_AND_GUARDRAILS.md` |
| Prototype design + rules | `docs/03_PROTOTYPE_HYPOTHESIS.md`, `docs/04_PROTOTYPE_DESIGN.md`, `docs/05_EVIDENCE_AND_RULES.md` |
| Work package list | `docs/06_WORK_PACKAGES.md`, `docs/00_PROJECT_INDEX.md` |
| Success/stop/expand criteria | `docs/07_SUCCESS_STOP_AND_EXPANSION_CRITERIA.md` |
| Tech stack | `docs/13_TECH_STACK.md` |
| WP5 master plan | `experiments/wp5/planning/WP5_MASTER_PLAN.md` |
| WP5 spec | `docs/research/WP5_ROBUSTNESS_VALIDATION_PLAN.md` |
| WP5.3 spec | `experiments/wp5/planning/WP5_3_ATTRIBUTION_CORRECTNESS_SPEC.md` |
| WP5.3 results | `experiments/wp5/wp5.3/WP5_3_RESULTS.md` |
| WP5.3 invariants | `experiments/wp5/wp5.3/attribution-invariants.md` |
| WP5.3 defects | `experiments/wp5/wp5.3/defect-fix-record.md` |
| WP5.3 source discovery decision | `experiments/wp5/wp5.3/source-discovery-decision.md` |
| WP5.3 adversarial matrix | `experiments/wp5/wp5.3/adversarial-case-matrix.md` |
| WP5.3 closure reconciliation | `experiments/wp5/wp5.3/WP5_3_DOCUMENTATION_RECONCILIATION.md` |
| WP5.2 results (authoritative FM taxonomy) | `experiments/wp5/wp5.2/WP5_2_RESULTS.md` |
| WP5.2 CLI defect evidence | `experiments/wp5/wp5.2/cli-diagnostics/fm-{d10,g06}-evidence.{md,json}` |
| WP5.2 regression anchors | `experiments/wp5/wp5.2/*.spec.ts`, `experiments/wp5/wp5.2/regression-anchors.spec.ts` |
| WP5.2 defect repro | `experiments/wp5/wp5.2/defect-repro.spec.ts` |
| WP5 decision log | `experiments/wp5/planning/WP5_DECISION_LOG_WP5_2_CORRECTION_UPDATE.md` |
| WP5 traceability matrix | `experiments/wp5/planning/WP5_TRACEABILITY_MATRIX_WP5_3_UPDATE.md` |
| WP5.4 spec | `experiments/wp5/planning/WP5_4_FAILURE_SEMANTICS_DIAGNOSTICS_SPEC.md` |
| WP5 Final spec | `experiments/wp5/planning/WP5_FINAL_VERIFICATION_AND_CLOSURE_SPEC.md` |
| Production code | `src/{attribution,cli,complexity,coverage,crap,crapCalc,evidence,execute,git,rules}.ts` |
| Own tests | `src/*.test.ts` |

## 11. Open Decisions (not yet made this session)

1. **Authorize WP5.4 implementation?** Planning complete (5 artifacts). Next step is approval, then characterization tests → fixes → regression.
2. **Update stale status docs?** `OPENCODE_START_HERE.md` + `PROJECT_STATUS.md` still say "WP4R current / production frozen" — contradict reality. Not in scope of any in-flight WP. Worth a small follow-up.
3. **Untracked TS policy** (D019): deferred; no action in WP5.3.
4. **Backup files cleanup:** `.bak.20260826T000000` files left from WP5.3 reconciliation. Safe to delete after confirmation. Plus many `.bak.20260825T*` in `experiments/wp4r-final/human-review-packet.md.bak.*` from earlier WP4R work.
5. **Commit WP5.4 planning artifacts?** 13 untracked files (5 in `experiments/wp5/wp5.4/`, 7 in `experiments/wp5/planning/`, 1 in `.opencode/plans/`). Either commit them as a planning batch, or leave untracked until WP5.4 implementation is authorized.

---

## 12. WP5.4 — Preparation Complete, Implementation Not Started

**Status:** PLANNING ONLY — NOT AUTHORIZED FOR EXECUTION
**Date:** 2026-08-26
**Plan source:** `.opencode/plans/2026-08-26-wp54-preparation.md`

### WP5.4 is planning-complete

All 5 planning artifacts exist on disk at `experiments/wp5/wp5.4/`:

| # | File | Description |
|---|------|-------------|
| 1 | `wp5_4_taxonomy_reconciliation.md` | FM ID reconciliation: all 4 FMs (V01/D10/G06/G07) CONFIRMED, sourced from authoritative WP5.2/WP5.3 records |
| 2 | `characterization-plan.md` | Per-finding: reproduction steps, expected vs observed behavior, exact evidence to capture, proposed regression fixtures, GT2 inspection summaries |
| 3 | `status-contract.md` | Reconciled status values from source/schema. Identified 4 contradictions: C1 (V01 available→absent), C2 (G07 passed→skipped), C3 (G06 same status for missing/malformed), C4 (coverageArtifact failed for missing) |
| 4 | `cli-contract.md` | Condition matrix: internal status → JSON → CLI stderr → exit code. 5 contradictions (D1-D5). Exit code summary. JSON schema consistency check. |
| 5 | `implementation-plan.md` | Per-finding: code location, tests required, regression risk, non-goals, acceptance criteria. Sequencing: V01→G07→D10→G06 (lowest→highest risk). Stop gate before WP5 Final. |

**None of these files are committed.** All 5 are untracked. `src/` is clean. No `experiments/wp5/wp5.4/fixtures/` directory exists. No WP5.4 tests written. No production code modified.

### 4 FMs reconciled for WP5.4

| FM ID | Authoritative Meaning (WP5.2) | Fix Direction |
|-------|-------------------------------|---------------|
| **FM-V01** | `coverageArtifact` reports `'available'` when default coverage absent (`available:false, error:false`). `coverageCapability = 'available'` at `evidence.ts:145` never updated. | Set `coverageCapability = 'absent'` when `coverageResult.available === false && coverageResult.error === false`. Gate stays PASS. Exit code stays 0. |
| **FM-D10** | CLI stderr `"Error: Not a git repository"` when git binary missing (ENOENT), not repo state. `execute` returns `exitCode: null` for ENOENT; `validateGitRepo` checks `null !== 0` → throws. | Check for ENOENT in `validateGitRepo`: `exitCode: null && error.code === 'ENOENT'` → throw `Error('Git executable not found')`. Exit code stays 1. |
| **FM-G06** | CLI stderr `"Error: coverage artifact malformed"` when explicit coverage file missing (not malformed). `readCoverage` returns `error: true` for missing → `coverageCapability = 'failed'` → CLI prints "malformed". | Distinguish file-not-found (ENOENT from `access()`) from parse-error in `readCoverage`. Return reason field. CLI prints "missing" not "malformed". Exit code stays 1. |
| **FM-G07** | `analyzerStatus` hardcoded `'passed'` at `evidence.ts:216` for ALL functions, regardless of null coverage. | Replace with: `coveragePercent !== null` → `'passed'`, `coveragePercent === null` → `'skipped'` (uses existing type union `'passed' | 'failed' | 'skipped'`). |

### Key status values (from status-contract.md)

- `analysisStatus`: SUCCESS | FAILED | UNSUPPORTED
- `gate`: PASS | WARN | null (FAILED/UNSUPPORTED)
- `completeness`: COMPLETE | INCOMPLETE | NOT_APPLICABLE
- `analyzerStatus`: passed | failed | skipped (only 'passed' used currently)
- `coverageArtifact`: available | failed (missing: 'absent' for V01 fix)
- `coverageKind`: stmt | branch | null
- `result`: PASS | WARN | NOT_EVALUATED

### 5 Contradictions identified (cli-contract.md)

- **D1:** `coverageArtifact: 'available'` when coverage absent → should be 'absent' (FM-V01)
- **D2:** Missing explicit coverage → stderr "malformed" → should be "missing" (FM-G06)
- **D3:** Git ENOENT → "Not a git repository" → should say git binary missing (FM-D10)
- **D4:** Missing + malformed → identical JSON/stderr → should be distinguishable (FM-G06)
- **D5:** `analyzerStatus: 'passed'` for all functions regardless of coverage → should be 'skipped' for null coverage (FM-G07)

### Implementation sequencing (from implementation-plan.md)

Recommended order (lowest→highest risk):
1. **V01** — `src/evidence.ts` lines 145-152: set `coverageCapability = 'absent'` when default missing
2. **G07** — `src/evidence.ts` line 216: replace hardcoded `'passed'` with coverage-based logic
3. **D10** — `src/git.ts` lines 13-17: check ENOENT before throwing, throw descriptive error
4. **G06** — `src/coverage.ts` lines 21-32: distinguish file-not-found from parse-error; `src/cli.ts` lines 124-127: print accurate message

### Proposed fixture files (not yet created)

| Fixture | FM | Validates |
|---------|-----|-----------|
| `experiments/wp5/wp5.4/fixtures/fr-v01-default-missing-capability.spec.ts` | FM-V01 | `coverageArtifact === 'absent'` when default missing |
| `experiments/wp5/wp5.4/fixtures/fr-d10-git-bmissing.spec.ts` | FM-D10 | Error message says "executable not found", not "not a repo" |
| `experiments/wp5/wp5.4/fixtures/fr-g06-missing-explicit-coverage.spec.ts` | FM-G06 | stderr says "missing" not "malformed"; JSON distinguishes |
| `experiments/wp5/wp5.4/fixtures/fr-g07-analyzer-status-semantics.spec.ts` | FM-G07 | `analyzerStatus === 'passed'` only for valid coverage; `'skipped'` for null |

### Hard constraints (unchanged from WP5.3)

- No threshold, CRAP formula, source attribution/discovery, provider, language, or LLM changes
- WP5.1–WP5.3 regression anchors (46/46) must remain green
- WP4R frozen behavior preserved
- Production changes minimal and traceable

### Outstanding contract questions

1. What `coverageArtifact` value for absent coverage? Recommendation: `'absent'`
2. Should `analyzerStatus` distinguish evaluated vs not-evaluated? Recommendation: `'skipped'` for null
3. Should missing vs malformed explicit coverage produce different statuses? Recommendation: yes — distinguish at both message and `coverageArtifact` level
4. Should exit code differ for ENOENT vs repo-state error? Recommendation: keep both exit 1, distinguish in message only
5. Intended `analyzerStatus` semantic contract? Recommendation: `'passed'` = evaluated with coverage, `'skipped'` = no coverage, `'failed'` = evaluation error

### Planning artifacts NOT yet committed to git

```
untracked:
  .opencode/plans/2026-08-26-wp54-preparation.md
  experiments/wp5/planning/OPENCODE_WP5_4_PREPARATION_PROMPT.md
  experiments/wp5/planning/README_WP5_4_PREPARATION.md
  experiments/wp5/planning/WP5_4_DECISION_LOG_PREPARATION.md
  experiments/wp5/planning/WP5_4_SPEC_PROVISIONAL.md
  experiments/wp5/planning/WP5_4_TAXONOMY_RECONCILIATION_TEMPLATE.md
  experiments/wp5/planning/WP5_4_TRACEABILITY_PREPARATION.md
  experiments/wp5/wp5.4/characterization-plan.md
  experiments/wp5/wp5.4/cli-contract.md
  experiments/wp5/wp5.4/implementation-plan.md
  experiments/wp5/wp5.4/status-contract.md
  experiments/wp5/wp5.4/wp5_4_taxonomy_reconciliation.md
```

### Open decision for next session

**WP5.4 authorization gate:** planning is done. Next step is to approve WP5.4 implementation, then execute per the implementation plan: write characterization tests → apply fixes → run regression → verify.
