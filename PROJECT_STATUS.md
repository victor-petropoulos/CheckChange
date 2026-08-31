# Project Status

Version: v2.3 WP11 Production Evidence Contract complete (doc-only, no src change, schema 0.2 frozen, 188/188 pass)

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

## Current state (2026-08-30 WP11)

- Branch: `main`
- Commit: `2972e5e` + staged docs (WP9 R8) + `docs/10_WP10_CAPABILITY_DEFINITION.md` + `docs/11_WP11_CONTRACT_INVENTORY.md` + `docs/contracts/evidence-contract.md` appended + `test/contract/wp11.contract.spec.ts` (no src change)
- Engine: WP9 Hardening Rounds 1–8 complete, no source changes since Round 5
- Tests: 188/188 pass (60 files, +11 from WP11)
- Typecheck: `npx tsc --noEmit` → 0 errors
- Build: `npm run build` → ok, `dist/cli.js` 6K
- WP9/WP11 contract: schema 0.2 frozen, threshold 30/15 frozen, INV-01..04 preserved
- WP11 deliverables:
  - `docs/11_WP11_CONTRACT_INVENTORY.md` 92 lines, 7 sections (input, output, error vocabulary, CLI, determinism, provenance, refs)
  - `docs/contracts/evidence-contract.md` 230 lines total (appended §§ Versioning & Compatibility, Input Contract & Validation, Error Semantics Exhaustive, Determinism & Provenance)
  - `test/contract/wp11.contract.spec.ts` 318 lines, 10 contract verification tests (Group A schema/threshold, Group B INV-01..04, Group C determinism, Group D provenance)

## Current question (resolved at WP5.6)

> Does changed-function CRAP provide useful real-world review signal?

WP5.6 recorded narrowly: deterministic evidence with truthful semantics (INV-01..04) survives full pipeline composition. Locked-focus functions reproduce for 5 re-executed cases. SUP-A (CRAP=36) and SUP-B (CRAP=28.94) demonstrate threshold-sensitivity. 8 WP4R human-classified samples accepted as `EXPECTED_PASS`. Usefulness classification is the human reviewer's call; the system produces evidence, not judgment.

## Next work package

**WP11 COMPLETE — Next: WP12 CI INTEGRATION VALIDATION (per Roadmap §7) — 2 real CI pipelines, measure integration cost — OR alternative per WP10 forks (WP13 language, WP14 historical Node20.9, WP15 usefulness) per human direction. No implementation beyond WP11 without explicit gate.**

Per `docs/10_WP10_CAPABILITY_DEFINITION.md` §9: Highest-priority next is WP11/12 — define stable input/output contract (WP11) → validate in 2 real CI pipelines (WP12) → measure setup complexity, failure modes, evidence completeness, developer comprehension, CI cost, reproducibility. If integration proves reliable → proceed toward real-world validation (WP15). If fragile → diagnose caller-side vs engine contract vs provider format before any engine change. Alternative forks: WP13 language expansion, WP14 historical/delta (Node 20.9 fresh per-commit coverage), WP15 human review study, or narrow/stop per Fork E.