# Project: CheckChange

Version: v0.4.1 — WP18 CLOSED 12/12 ACCEPTED 2026-09-09 (HEAD 6d6c940+, no src change since 0c6ea37)

## Post-close polish

- 0c6ea37 auto-detect base
- bbbcc63 using-checkchange skill
- 3d0e761 docs
- 991ed4c start_here 5→2 reads
- 27cb67d track plans


**WP5 = COMPLETE / ACCEPTED.** WP5.6 usefulness/robustness/freeze accepted 2026-08-27. WP5.6 defect remediation (F-03/F-04/D-APOLLO) accepted 2026-08-27.

## WP progression

- WP0: Evidence feasibility spike — DONE
- WP1: Git→changed-function correlation — DONE
- WP1.1: Mechanical verification of hunk→function correlation — DONE
- WP2: Minimal evidence envelope — DONE
- WP2.1: Envelope clarification (0 vs null) — DONE
- WP3: Three rules + advisory high-CRAP — DONE
- WP4: Usefulness validation, 3 real repos × 3 cases — DONE (inconclusive)
- WP4.1: Evidence acquisition investigation — DONE
- WP4.2 / 4.2.1: Composed evidence + corrective verification — DONE
- WP4R: Real-repo usefulness rerun (apollo-client, h3, hono) — DONE / ACCEPTED
- WP4R.1 / 4R.1a / 4R.2 / 4R.2-verif: Coverage artifact discovery — DONE
- WP4R-final / WP4R-supplemental: Human review packet + closure docs — DONE
- WP5.1: Failure-mode inventory + spec — DONE / ACCEPTED
- WP5.2: Deterministic fixture suite + defect repro evidence — DONE / ACCEPTED
- WP5.3: Coverage attribution correctness (A08/A07/C03) — DONE / CLOSED
- WP5.4: Failure semantics + diagnostics (V01/D10/G06/G07) — DONE
- WP5.5: End-to-end integration verification — DONE / CLOSED
- **WP5.6: Usefulness, robustness, freeze — DONE / ACCEPTED 2026-08-27**
- **WP5.6 Remediation: F-03 fixed, F-04 documented, D-APOLLO resolved — DONE / ACCEPTED 2026-08-27**

- WP9.1: parseCliArgs — DONE
- WP9.2: main — DONE
- WP9.3: defu variant2 — DONE
- WP9.4: ts-jest — DONE
- WP9.5: real-git — DONE
- WP9.6: tsdoc — DONE
- WP9.7: monorepo full union — DONE
- WP9.8: history/delta — DONE
- **WP9-R8: LCOV provider + Python coverage.py — DONE 2026-09-03 (experiments/wp9-r8, schema 0.4)**

- **WP10: Capability and Product Definition — DONE 2026-08-30 (doc-only, 269 lines, no src change, schema 0.2 frozen)**
- **WP11: Production Evidence Contract — DONE 2026-08-30 (doc-only, no src change, schema 0.2 frozen, threshold 30/15 frozen, INV-01..04 preserved)**
- **WP12: CI Integration Validation — DONE 2026-08-31 CONTINUE WITH CONSTRAINTS (doc-only, no src change, schema 0.2 frozen, 191/191 pass)**
- **WP12 Fix 8885796 — DONE 2026-08-31 Attribution case-insensitive predicate (test/attribution.case.spec.ts +3 tests)**
- **WP12 Hardening e354048 — DONE 2026-08-31 Vitest config guard + case-insensitive regression anchor + contract addendum**
- **WP13: Python language expansion (lizard + coverage.py) — COMPLETE 2026-09-01 synthetic fixture n=3, PASS@30 WARN@15, schema 0.2 frozen**
- **WP13-LANG-REGISTRY: Language registry + complexity-providers.ts — DONE 2026-09-01 (src/complexity-providers.ts, registry pattern, language field in EvidenceOutput)**
- **WP13-CC-EQUIVALENCE: CC equivalence documentation + hypothesis table — DONE 2026-09-01 (docs-only, schema 0.3 language field)**
- **Hygiene A+B: shell:true fix + gitignore — DONE 2026-09-01 (experiments/wp13/adapter/pythonComplexity.ts shell injection fix, .gitignore updated, 0 shell:true remaining)**

- **N1 2026-09-01: High-CC WARN + capital-file live validation — DONE (synthetic/n1-highcc-verify, cc8 cov0 crap72 WARN at thresholds 30/15, /tmp/N1_P1.json, capital-C fix exercised)**
- **N3 2026-09-01: Malformed coverage UNSUPPORTED vs FAILED addendum — DONE (docs-only, evidence-contract.md + WP12_RESULTS.md, no engine fix, isUnsupportedIntervals precedence)**
- **N4 2026-09-01: README drift sync — DONE (191/191, schema 0.2, INV-01..04, packet link)**
- **Human Review 2026-09-01: CONTINUE WITH CONSTRAINTS** — N1/N3/N4 remediation approved, WP12 packet approved, awaiting constrained fork selection
- **Human Review 2026-09-01: CONTINUE WITH CONSTRAINTS** — WP13 approved, synthetic n=1 limitation acknowledged, next fork WP14/WP15/STOP pending
- **WP13 Remaining 3 + WP10/11/12 + Schema Bump + Hygiene — COMPLETE 2026-09-01 (commits be2bca4+60d5dab+9cc6b30, tag v0.3.0-compatible, 201/201 tests, schema 0.3)**

- **WP9-R8 Historical Coverage (LCOV) — DONE 2026-09-02 (experiments/wp9-r8/, LCOV E2E 0.78s/255 MB SUCCESS PASS, synthetic Istanbul 0.81s/260 MB SUCCESS PASS, schema 0.4)**
- **WP15-JS/React: JS+React monorepo + LCOV + corpus 17 — DONE 2026-09-02 (experiments/wp15-js/, dispatcher, framework detection, schema 0.4 language:javascript + framework:react)**
- **Hardening B P1-5 — DONE 2026-09-02 (pnpm patch parser persistence, registry dispatch, CC bench correlation 0.626 TS/JS, 1.0 Python, security hardening)**
- **WP15 Hardening B Security Addendum — DONE 2026-09-03 (5 High/Medium fixes: SHA regex, LCOV 10MB limit, Python prune, readdir depth 3, coverage-file SF validation — CLOSED)**
- **WP13 #2: Python coverage.py E2E + adapter fixes — DONE 2026-09-03 (experiments/wp13/adapter/ cc-bench lizard guard, CI lizard install)**

## Current state (2026-09-09 main @6d6c940 WP18 CLOSED)

- Branch: `main`
- Commit: `6d6c940` (WP18 12-case validation CLOSED)
- Tree: clean
- Tests: 233/233 pass (72 files)
- Typecheck: `npx tsc --noEmit` → 0 errors
- Tests: 233/233 pass (72 files)
- Typecheck: `npx tsc --noEmit` → 0 errors
- Build: `npm run build` → ok
- WP15 deliverables:
  - `experiments/wp15-js/` JS/React dispatcher, framework detection, nextDispatcher (5/5 tests)
  - `experiments/wp9-r8/` LCOV provider + historical coverage fixtures (p-queue, zustand, next-sample)
  - `src/complexity-providers.ts` language registry + ComplexityProvider/CoverageProvider interfaces
  - `docs/contracts/evidence-contract.md` (schema 0.4, Security Addendum 2026-09-03 CLOSED, Python + JS/React provenance)
  - `docs/superpowers/plans/hardening-b-perf.md` (E2E validation: LCOV 0.78s/255MB, Istanbul 0.81s/260MB)
  - Engram review: rev-1788397101053-2 approved
- Security:
  - `git.ts`: SHA regex `^[a-f0-9]{40}$` strict validation
  - `lcov-provider.ts`: 10 MB max size limit (DoS prevention)
  - `detectPythonFramework`: skip `site-packages`, `venv`, `dist`, `build`
  - `detectNextFramework` (`src/evidence.ts`): `readdir` depth limited to 3
  - `--coverage-file`: allowed outside cwd with symlink-follow validation
  - All fixes verified: `npx tsc --noEmit` exit 0, `npm test` 233 pass. No schema changes required.
- Global install: `npm link` → `checkchange` + `code-risk` binaries on PATH (6f26f95)
- Auto-detect base: `--base` optional, fallback chain `origin/HEAD` → `origin/master`/`main` → `master`/`main` (0c6ea37)
- Engram coverage config: vitest.config.ts uses `@vitest/coverage-v8`, artifact at `coverage/coverage-final.json`, gate WARN/PASS active
- Skill: `using-checkchange` wired to `reviewer`, `tester`, `orchestrator` agents (bbbcc63)
- WP9/WP11/WP13/WP15 contract: schema 0.4 (WP14 per-commit outputs historically schema 0.3), threshold 30/15 frozen, INV-01..04 preserved
- WP14: fresh per-commit coverage (Node 20.10.0, schema 0.3, additive experiments/wp14 only)
  - A: 24KB WARN 54.67
  - B: 29KB WARN 116.98
- WP15: solo reviewer packet (5 reuse cases: WP14 pair + sup-a WARN + hono-03 PASS INCOMPLETE + hono-01 PASS zero-fn)
  - additive experiments/wp15-human
  - packet fields, no autonomous classification

## WP12 CI Integration Validation — COMPLETE 2026-08-31

- Plan: .opencode/plans/2026-08-31T01:01:40Z-wp12-ci-integration-validation.md (Tasks 1-5, approved:true)
- Scope: Fork A — 2 GHA pipelines in this repo (P1/P2), measure Roadmap §7 integration boundary, no src/ change
- Status: All tasks completed, human reviewed APPROVED, orchestrator flipped approved:true, delegated per plan
- Results: 191/191 tests pass, 61 files, fix 8885796 + hardening e354048 applied
- Next command: Continue with constraints per WP12 decision

## N1/N3/N4 Remediation Verification (2026-09-01)

- Task 6 verification: **PASS**
  - `npx tsc --noEmit`: 0 errors ✓
  - `npx vitest run --no-coverage`: 191/191 pass (61 files) ✓
  - `git diff --stat src/`: empty (docs-only) ✓
  - Graphify: 3482 nodes rebuilt ✓

## WP14

- Status: approved 2026-09-08 CONTINUE
- Details: fresh per-commit coverage (Node 20.10.0, schema 0.3)
- Coverage: A 24KB WARN 54.67 / B 29KB WARN 116.98
- Scope: additive experiments/wp14 only

## WP15

- Status: solo reviewer packet ACCEPTED 2026-09-08 CONTINUE
- Reuse cases: 5 (WP14 pair + sup-a WARN + hono-03 PASS INCOMPLETE + hono-01 PASS zero-fn)
- Scope: additive experiments/wp15-human
- Packet fields present, no autonomous classification

## WP16

- Status: CONTINUE WITH CONSTRAINTS 2026-09-08 (commit 4fbae48)
- Assessment: hardening pass, 4 constraints identified

## WP17

- Status: FINAL CONTINUE WITH CONSTRAINTS 2026-09-08 (commit 8ad6db7)
- 8-case validation, 4 constraints: (a) Q1 single-repo only, (b) Q7 CLOSED 2026-09-09, (c) high-CRAP uncovered, (d) manual sampling only
- Q7 CLOSED 2026-09-09 — 8/8 ACCEPTED (commit 3f9b9f8)
- **WP18 expansion 2026-09-09: 009..012 (WARN31/PASS18/PASS3/PASS0), 12/12 ACCEPTED**

## WP18

- Status: CLOSED 2026-09-09 (commit 6d6c940)
- 4 cases (009-012), remaining (a) thin

## Current question (resolved at WP5.6)

> Does changed-function CRAP provide useful real-world review signal?

WP5.6 recorded narrowly: deterministic evidence with truthful semantics (INV-01..04) survives full pipeline composition. Locked-focus functions reproduce for 5 re-executed cases. SUP-A (CRAP=36) and SUP-B (CRAP=28.94) demonstrate threshold-sensitivity. 8 WP4R human-classified samples accepted as `EXPECTED_PASS`. Usefulness classification is the human reviewer's call; the system produces evidence, not judgment.

## Next work package

- NEXT: STOP or TBD — WP18 closed
- Angular deferred: plan saved .opencode/plans/2026-09-08T193000Z-angular-phase1.md approved:false