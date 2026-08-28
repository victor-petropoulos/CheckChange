# Project Status

Version: v2.0 WP5 complete + WP5.6 remediation accepted

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

## Current state (2026-08-27)

- Branch: `main`
- Engine: see latest git log (post-WP5.6-remediation)
- Tests: 145/145 pass (54 files)
- WP5 frozen contract: preserved (no silent methodology changes, status taxonomy intact, threshold policy intact)
- WP5.6 corpus: 11 cases (5 re-executed: hono-01/02/03, sup-a, sup-b; 6 replay-only: h3-01/02/03, apollo-01/02/03)
- F-03 fix: `normalizeCoveragePaths()` in src/coverage.ts; cross-environment artifact replay now works without symlink workarounds
- F-04 documentation: §Test-File Function Discovery in failure-semantics-contract.md
- D-APOLLO: apollo-client re-clone + re-test report at `experiments/wp5/wp5.6/d-apollo-reverification.md`

## Current question (resolved at WP5.6)

> Does changed-function CRAP provide useful real-world review signal?

WP5.6 recorded narrowly: deterministic evidence with truthful semantics (INV-01..04) survives full pipeline composition. Locked-focus functions reproduce for 5 re-executed cases. SUP-A (CRAP=36) and SUP-B (CRAP=28.94) demonstrate threshold-sensitivity. 8 WP4R human-classified samples accepted as `EXPECTED_PASS`. Usefulness classification is the human reviewer's call; the system produces evidence, not judgment.

## Next work package

**WP6 — Strategic Direction and Minimal Proof** (begin in new session).

Per Roadmap WP6: "WP6 should answer: What is the smallest useful engineering capability justified by WP5 evidence?"

See `OPENCODE_START_HERE.md` for full handoff + decision forks.

Production is frozen; WP6 may unfreeze specific layers for the selected proof, but the deterministic evidence contract (status taxonomy, threshold policy, frozen methodology) is preserved.
