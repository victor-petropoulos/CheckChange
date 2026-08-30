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
- Engine: see latest git log (post-WP9 hardening round8)
- Tests: 178/178 pass (59 files)
- WP9 frozen contract: preserved (history/delta validated, coverage fallback)
- WP9.6 corpus: 2-point history (00203d4 vs e11ec0b) validated
- Build: ok
- Node 24, tsc 0

## Current question (resolved at WP5.6)

> Does changed-function CRAP provide useful real-world review signal?

WP5.6 recorded narrowly: deterministic evidence with truthful semantics (INV-01..04) survives full pipeline composition. Locked-focus functions reproduce for 5 re-executed cases. SUP-A (CRAP=36) and SUP-B (CRAP=28.94) demonstrate threshold-sensitivity. 8 WP4R human-classified samples accepted as `EXPECTED_PASS`. Usefulness classification is the human reviewer's call; the system produces evidence, not judgment.

## Next work package

**WP6 — Strategic Direction and Minimal Proof** (begin in new session).

Per Roadmap WP6: "WP6 should answer: What is the smallest useful engineering capability justified by WP5 evidence?"

See `OPENCODE_START_HERE.md` for full handoff + decision forks.

Production is frozen; WP6 may unfreeze specific layers for the selected proof, but the deterministic evidence contract (status taxonomy, threshold policy, frozen methodology) is preserved.
