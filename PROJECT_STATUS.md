# Project: CheckChange

Version: v2.4 N1/N3/N4 remediation complete (doc-only, no src change, schema 0.2 frozen, 191/191 pass)

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

- **WP10: Capability and Product Definition — DONE 2026-08-30 (doc-only, 269 lines, no src change, schema 0.2 frozen)**
- **WP11: Production Evidence Contract — DONE 2026-08-30 (doc-only, no src change, schema 0.2 frozen, threshold 30/15 frozen, INV-01..04 preserved)**
- **WP12: CI Integration Validation — DONE 2026-08-31 CONTINUE WITH CONSTRAINTS (doc-only, no src change, schema 0.2 frozen, 191/191 pass)**
- **WP12 Fix 8885796 — DONE 2026-08-31 Attribution case-insensitive predicate (test/attribution.case.spec.ts +3 tests)**
- **WP12 Hardening e354048 — DONE 2026-08-31 Vitest config guard + case-insensitive regression anchor + contract addendum**

- **N1 2026-09-01: High-CC WARN + capital-file live validation — DONE (synthetic/n1-highcc-verify, cc8 cov0 crap72 WARN at thresholds 30/15, /tmp/N1_P1.json, capital-C fix exercised)**
- **N3 2026-09-01: Malformed coverage UNSUPPORTED vs FAILED addendum — DONE (docs-only, evidence-contract.md + WP12_RESULTS.md, no engine fix, isUnsupportedIntervals precedence)**
- **N4 2026-09-01: README drift sync — DONE (191/191, schema 0.2, INV-01..04, packet link)**
- **Human Review 2026-09-01: CONTINUE WITH CONSTRAINTS** — N1/N3/N4 remediation approved, WP12 packet approved, awaiting constrained fork selection

## Current state (2026-09-01 WP12 COMPLETE + FIX + HARDENING + N1/N3/N4 REMEDIATION)

- Branch: `main`
- Commit: `539d3fd` (N1/N3/N4 remediation) + `6eac65b` (reviewer grounding) + `e354048` (hardening) + `8885796` (fix attribution case-insensitive) + `7087228` (predicate test)
- Engine: WP9 Hardening Rounds 1–8 complete, WP12 hardening applied, no source changes since Round 5
- Tests: 191/191 pass (61 files, +11 from WP11)
- Typecheck: `npx tsc --noEmit` → 0 errors
- Build: `npm run build` → ok, `dist/cli.js` 6K
- WP9/WP11 contract: schema 0.2 frozen, threshold 30/15 frozen, INV-01..04 preserved
- WP12 deliverables:
  - `test/attribution.case.spec.ts` 32 lines, 3 tests (case-insensitive attribution predicate)
  - `docs/contracts/evidence-contract.md` appended § Attribution Case Handling (WP12 Fix 8885796)
  - `experiments/wp12/WP12_SUCCESS_VALIDATION.md` updated with N1 high-CC WARN evidence
  - `docs/closure/WP12_HUMAN_REVIEW_PACKET.md` updated with APPROVED footer and limitation LIFTED
  - `README.md` synced to reflect 191/191, schema 0.2, INV-01..04, packet link (N4)
  - `experiments/wp12/WP12_RESULTS.md` + `docs/contracts/evidence-contract.md` UNSUPPORTED/FAILED addendum (N3)

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

## Current question (resolved at WP5.6)

> Does changed-function CRAP provide useful real-world review signal?

WP5.6 recorded narrowly: deterministic evidence with truthful semantics (INV-01..04) survives full pipeline composition. Locked-focus functions reproduce for 5 re-executed cases. SUP-A (CRAP=36) and SUP-B (CRAP=28.94) demonstrate threshold-sensitivity. 8 WP4R human-classified samples accepted as `EXPECTED_PASS`. Usefulness classification is the human reviewer's call; the system produces evidence, not judgment.

## Next work package

**NEXT WIP: Awaiting human selection of constrained WP13 language OR WP14 historical (Node 20.9 fresh per-commit coverage) OR WP15 usefulness OR STOP/NARROW** — no schema bump without proven gap, no claim without basis, experiments/.worktrees excluded per vitest.config.ts.

Per `docs/10_WP10_CAPABILITY_DEFINITION.md` §9: WP11/12 complete — stable input/output contract defined (WP11) → validated in 2 real CI pipelines (WP12) → measured setup complexity, failure modes, evidence completeness, developer comprehension, CI cost, reproducibility. Integration proved reliable. Proceed toward real-world validation (WP15) or alternative forks per human direction. Alternative forks: WP13 language expansion, WP14 historical/delta (Node 20.9 fresh per-commit coverage), WP15 human review study, or narrow/stop per Fork E.