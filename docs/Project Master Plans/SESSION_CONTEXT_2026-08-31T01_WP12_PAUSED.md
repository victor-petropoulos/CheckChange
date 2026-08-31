# WP12 Session Context — PAUSED at Approval Gate

**Date:** 2026-08-31T01:01:40Z
**Status:** WP11 COMPLETE, WP12 PLANNED, PAUSED AT APPROVAL GATE

---

## Plan Reference

`.opencode/plans/2026-08-31T01:01:40Z-wp12-ci-integration-validation.md` — 5 tasks, `approved: false`

---

## Grill Answer (Fork Selection)

**Grill Q1:** "Which fork for WP12?"
**Answer:** **Fork A** — Both pipelines in this repo on GitHub Actions
- P1 (default): `vitest run --coverage` → `node dist/cli.js check --base origin/main --json` (default `coverage/coverage-final.json`)
- P2 (explicit): Same + `--coverage-file <path>` + `--crap-threshold <override>`

---

## Research Summary (pre-implementation)

| Domain | Key Findings |
|--------|--------------|
| **CLI Contract** | `--base` required (rev-parse), `--json` emits EvidenceOutput, `--crap-threshold` default 30 (float, finite≥0), `--coverage-file` optional (resolves relative cwd), `--verbose` stderr, exit 0: SUCCESS+PASS or UNSUPPORTED+NOT_APPLICABLE; exit 1: FAILED or WARN |
| **Schema 0.2 (frozen)** | Top-level: analysis, capabilities, changedFunctions[], policy, ruleResults[], analysisStatus, gate, completeness, coverageErrorReason? |
| **INV-01..04** | ZERO≠NULL, MISSING≠MALFORMED, GIT≠REPO, ANALYZER TRUTHFUL — all in evidence.ts/coverage.ts |
| **F-03 normalizeCoveragePaths** | `coverage.ts:38-75` rebases absolute Istanbul keys onto cwd; validated at 1.62M LOC, 64 entries |
| **Coverage Burden** | Caller-owned: `vitest run --coverage` → 4.96s wall-clock (`experiments/wp8/dx-operational.md`) |
| **Current CI State** | No `.github/` dir, no workflows — zero GitHub Actions config |
| **Verified Baseline** | Node 24.18.1, `dist/cli.js` bin, 191/191 tests pass (61 files), `src/` diff clean |

---

## Plan Tasks (sequential deps)

| # | Task | Agent | Files | Acceptance |
|---|------|-------|-------|------------|
| 1 | Scaffold `.github/workflows/` — P1 `ci-evidence-default.yml` + P2 `ci-evidence-explicit.yml` | implementer | `.github/workflows/ci-evidence-{default,explicit}.yml` | Valid YAML, triggers PR/push main, Node 24, base-fetch resilience, frozen contract refs, `src/` clean |
| 2 | Local dry-run harness | documenter | `docs/experiments/wp12/LOCAL_DRYRUN.md` | Step-by-step `HEAD~1` commands for P1/P2, expected schema 0.2 JSON + exit matrix, F-03 note, failure recovery |
| 3 | Measurement spec — Roadmap §7 rubric | documenter | `docs/experiments/wp12/WP12_MEASUREMENT_SPEC.md` | Table for all 9 metrics linked to INV-01..04/F-03 |
| 4 | Run pipelines + collect evidence | tester | `docs/closure/WP12_HUMAN_REVIEW_PACKET.md`, `experiments/wp12/WP12_RESULTS.md` | Packet with results, gate/completeness, timings, JSON samples, ends `AWAITING HUMAN REVIEW`; diagnosis if fragile |
| 5 | Regression guard | tester | packet appendix | `tsc --noEmit` 0, `vitest run` 191/191, `src/` clean, `wp11.contract.spec.ts` 10/10 |

---

## Verification Commands (live 2026-08-31)

```bash
npx tsc --noEmit                    # → 0 errors
npm run build                       # → ok, dist/cli.js 6K
npx vitest run --no-coverage        # → 191/191 pass (61 files)
git --no-pager diff -- src/         # → clean
npx vitest run test/contract/wp11.contract.spec.ts --no-coverage  # → 10 pass
```

---

## Resume Instructions

1. Human replies **`APPROVED`** (explicit, per EXECUTION GUIDANCE stop-at-gate)
2. Orchestrator flips `approved: false → true` in plan file (edit only)
3. Dispatch implementer for Task 1, then documenter for 2-3, then tester for 4-5
4. No `src/` changes; only `.github/workflows/` + docs/evidence
5. If integration fragile → diagnose caller-side vs contract vs provider before engine change

---

**Gate:** Plan remains `approved: false` until explicit human `APPROVED`.