# Project Status

Version: v2.1 WP9 Hardening Round 8 complete (history/delta)

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

## Current state (2026-08-30)

- Branch: `main`
- Commit: `2972e5e` + staged OPENCODE_START_HERE docs
- Engine: WP9 Hardening Rounds 1–8 complete, no source changes since Round 5
- Tests: 178/178 pass (59 files)
- Typecheck: `npx tsc --noEmit` → 0 errors
- Build: `npm run build` → ok, `dist/cli.js` 6K
- WP9 contract: schema 0.2 frozen, threshold 30/15 frozen, INV-01..04 preserved
- WP9 Round 8: 2-point historical/delta on tsdoc (00203d4 base c908cc8, e11ec0b base cc1dbc6) — complexity delta real (plugin 5→6, +getRoot cc12), gate PASS→WARN demonstrated, coverage fallback (Round 7 full-union 1,621,110 bytes 64 entries reused for both commits), Node/Rush blocker (env Node 24.18.1 vs rush.json 16/18/20) documented as external limitation, not engine defect
- Provider diversity: n=3 fresh (defu vitest v8 12K, ts-jest babel 277K, tsdoc Jest v8 29K + full union 1.62M merged), 2 frameworks (vitest/Jest)
- Monorepo: validated at 55× scale (29K 3 entries → 1.62M 64 entries), endsWith + normalizeCoveragePaths rebases 64 keys, single Rush repo
- Language: TS-only (deferred per roadmap)
- Limitations: partial historical coverage (reuse), single monorepo, n=3 providers, TS-only — all acceptable per documented scope
- Human gate: **AWAITING HUMAN REVIEW** — CONTINUE / CONTINUE WITH CONSTRAINTS / STOP

## Current question (resolved at WP5.6)

> Does changed-function CRAP provide useful real-world review signal?

WP5.6 recorded narrowly: deterministic evidence with truthful semantics (INV-01..04) survives full pipeline composition. Locked-focus functions reproduce for 5 re-executed cases. SUP-A (CRAP=36) and SUP-B (CRAP=28.94) demonstrate threshold-sensitivity. 8 WP4R human-classified samples accepted as `EXPECTED_PASS`. Usefulness classification is the human reviewer's call; the system produces evidence, not judgment.

## Next work package

**WP9 CLOSURE PENDING HUMAN APPROVAL**

Per `experiments/wp9-hardening-round8/wp9-cumulative-closure-assessment-through-round8.md` §15 recommendation: **OPTION A — CLOSE WP9** under scoped claims. Historical coverage partial is not WP9 blocker per documented scope (Candidate 6 deferred). If human review requires historical coverage claim, then **OPTION B — ONE EXPERIMENT: Fresh Historical Per-Commit Coverage Rerun (Node 20.9)** per §14.

See `OPENCODE_START_HERE.md` for full handoff + decision forks.

Production is frozen; WP9 closure decision will determine next step.
