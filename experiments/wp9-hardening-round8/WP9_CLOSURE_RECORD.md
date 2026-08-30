# WP9 Closure Record — Evidence-Driven Hardening / Evolution

**Date:** 2026-08-30
**Status:** WP9 READY FOR HUMAN CLOSURE APPROVAL
**Engine:** commit efe2fd7 + staged docs, Node v24.18.1, 178/178 pass (59 files), tsc 0, build ok
**Frozen contract:** schema 0.2, threshold 30/15, INV-01..04
**Assessment:** `wp9-cumulative-closure-assessment-through-round8.md` (500 lines)

---

## WP9 Objective

Why WP9 existed: Per `experiments/wp9/prioritization.md` and Roadmap, WP9 answers "Given WP8's empirical findings (reliability strong, external diversity limited, FN blind spots, operational friction 4.96s), what specific evidence-backed evolution should be pursued without violating CONTINUE WITH CONSTRAINTS?" — i.e., prioritize and validate narrow hardening items, not a predetermined backlog, and remain reversible with frozen contract.

---

## Rounds 1–8 (question / experiment / result / learning)

| Round | Question | Experiment | Result | Learning |
|-------|----------|------------|--------|----------|
| **WP9 Baseline** ca7af83 | What evolutions are justified? | Prioritization matrix 7 candidates, threshold-guidance.md, repro.md (nanoid bnt/clsx uvu deferred → local fallback 157K) | fallback validates adapter mismatch, not broad usefulness; CLI parseCliArgs CC23 / main CC12 null gaps identified | External validation needs per-repo coverage setup; CLI gap not code bug but measurement gap per INV-01 |
| **Hardening R1** bef0ace | Can parseCliArgs be measured? Any external vitest repo works? | 17 unit tests parseCliArgs → 61.2% stmt CRAP54, defu v8 12K (isPlainObject cc8, _defu cc14, createDefu cc1 PASS) | 166/166 pass, main still null, defu PASS gate PASS | Signal density up, per-repo validation works for vitest v8 |
| **R2** cb254da | Can main() be covered without flaky child processes? | 8 integration tests mocked git/evidence → 87.8% stmt, 174/174 | Both CLI funcs now measured, exit codes 0/1 truthful | Deterministic mock strategy beats child-process coverage loss |
| **R3** 16cf1c0 | Does second provider (Jest) raise diversity to n=2? | Search type-fest/guideline → fallback defu variant2 base 869a053 9 funcs 12K PASS | 174 preserved, no new provider | Jest TS scarcity — search cost is evidence for per-repo hypothesis |
| **R4** b50f977 | Genuine Jest/Istanbul provider? | ts-jest Jest babel 277K (TsCompiler cc4/7, Importer cc5 PASS) | n=2 (v8 + babel/Istanbul) both PASS same threshold/schema | Provider diversity validated, engine agnostic to Istanbul variant but not blindly |
| **R5** 914219e | Real-git without mocks (FM-D10)? | 4 real-git tests: valid repo PASS, not-a-repo, invalid base, ENOENT distinct per INV-03 | 178/178 pass, ENOENT≠not-a-repo proven | Truthful Git capability, schema contract verified with real binary |
| **R6** efe2fd7 | Third provider via Rush/Heft (tsdoc)? | tsdoc eslint-plugin subset Jest v8 heft 29K 2 funcs getRoot cc12 crap116 WARN + plugin cc6 crap18 PASS | n=3 (2 v8 + 1 babel), gate WARN | Rush needs jest.custom.json json override (rig default cobertura/html only) |
| **R7** efe2fd7 | Monorepo boundary at scale? | Full Rush union: tsdoc 1.2M 59 + tsdoc-config 90K 2 + eslint-plugin 29K 3 + api-demo {} → 1.62M 64 entries python union | Same 2 funcs same CRAP/gate WARN, 55× scale, attribution among 64 without ambiguous | F-03 normalize rebases 64 keys, engine not single-package-only; cheap boundary proof |
| **R8** staged | Historical/delta 2-point trend? | tsdoc 00203d4 base c908cc8 (11 funcs plugin cc5 crap15 PASS INCOMPLETE) vs e11ec0b base cc1dbc6 (2 funcs getRoot cc12 crap116 WARN + plugin cc6 crap18 PASS COMPLETE), Node 24.18.1 blocked Rush (requires 16/18/20), fallback full-union 1.62M reused for both | Complexity delta real (plugin 5→6, +new WARN), gate PASS→WARN, coverage NOT per-commit | **PARTIAL HISTORICAL/DELTA VALIDATION — REAL COMPLEXITY DELTA, REUSED COVERAGE**; env limitation not engine defect |

---

## Cumulative Findings (what WP9 established)

- Deterministic changed-function detection, Git historical diff, CC via crap-typescript, caller-owned Istanbul JSON ingestion, deterministic CRAP, threshold 30/15 PASS/WARN, INCOMPLETE/COMPLETE, truthful statuses, schema 0.2, Evidence API `check --json --coverage-file`, CI gate exit codes — **DEMONSTRATED**.
- Coverage attribution at scale (F-03 + FM-A08 endsWith) validated to 1.62M 64 entries — **DEMONSTRATED under tested Rush scenario**.
- Provider diversity n=3 fresh (defu v8, ts-jest babel, tsdoc Jest v8 subset+full union), 2 frameworks vitest/Jest — **bounded but widened**.
- Monorepo boundary 55× validated — **partial/bounded**.
- Historical complexity + gate PASS→WARN trend — **demonstrated conditional on coverage**.

---

## Defects Found and Resolved (only actual defects)

- **F-03** `normalizeCoveragePaths()` in `src/coverage.ts` — cross-environment absolute keys rebased onto cwd; validated 3→64 entries.
- **F-04** documented in `docs/contracts/evidence-contract.md` §Test-File Function Discovery — test-file helpers skipped/null per INV-01, not defect.
- **D-APOLLO** apollo-client re-clone + re-test reported at `experiments/wp5/wp5.6/d-apollo-reverification.md`.
- **CLI gaps** parseCliArgs CC23 + main CC12 null before R1/R2 — not defects per INV-01, but signal density gaps closed by 17+8 tests → 87.8% measured, now WARN 54/18.

No CRAP formula, threshold, or schema change — frozen since WP5.6.

---

## Known Limitations (must include R8 historical coverage)

1. **Historical per-commit coverage not validated** — R8 reused R7 full-union 1.62M 64 entries for both commits due to Node 24.18.1 vs rush.json 16.13/18.15/20.9 mismatch; heft blocked, coverage delta not real history. Complexity delta real. Env limitation not engine defect. See `repro-history-delta.md` and report Limitations.
2. Single monorepo (microsoft/tsdoc Rush, Jest v8 heft-web-rig, 1.62M 64 entries, 1 diff 1 file/2 funcs) — not universal; suffix collision not tested.
3. Provider diversity n=3 Istanbul-family only (2 v8 variants + 1 babel) — not universal.
4. Language TS-only — additional languages deferred to WP10/productization per `prioritization.md` Candidate 7.
5. Caller-owned coverage burden ~4.96s — unchanged, documented burden.
6. Sample small (n=3 external repos) — statistical power limited but deterministic behavior strong, zero FP.
7. Performance upper bound not probed beyond 1.62M 64 entries.

---

## Frozen Contract

- **Schema:** 0.2.0 (`docs/contracts/evidence-contract.md` FROZEN at 21daa57, F-03 additive compatible) — all engine JSON `schemaVersion: "0.2"`.
- **Thresholds:** 30 (CRAP) / 15 (CC) — `evidence-contract.md:38`, `src/rules.ts` default 30, all threshold-addenda R1–R8 unchanged.
- **Invariants:** INV-01 ZERO≠NULL, INV-02 MISSING≠MALFORMED, INV-03 GIT≠REPOSITORY, INV-04 ANALYZER STATUS IS TRUTHFUL — preserved across 178 tests including real-git.
- **Also frozen:** deterministic attribution (`src/attribution.ts` exact→suffix→ambiguous), F-03 path normalization, CRAP `CC²×(1-cov)³+CC` (`src/crapCalc.ts`), PASS/WARN (threshold 30), INCOMPLETE semantics, CLI/JSON consistency, provenance (commit/SHA/size/repro/plan).

---

## Validation Boundary

- **Repos:** defu (unjs/defu), ts-jest (kulshekhar/ts-jest), tsdoc (microsoft/tsdoc subset + full union), plus this repo CLI — 3 external + 1 local.
- **Languages:** TypeScript only.
- **Providers:** Istanbul JSON family: @vitest/coverage-v8 (defu 12K), Jest babel provider (ts-jest 277K), Jest v8 via heft-web-rig (tsdoc 29K + full union 1.62M). Requires caller to emit json (Rush rig default cobertura/html only → needs `jest.custom.json`).
- **Monorepo:** microsoft/tsdoc Rush, Jest v8 heft, 1.62M 64 entries, single diff — cheap proof not universal.
- **Historical:** 2 commits 00203d4 (c908cc8) and e11ec0b (cc1dbc6) — historical complexity + gate trend demonstrated; per-commit historical coverage **not** demonstrated (reuse).

---

## Supported Claims (evidence-based, scoped)

- "Deterministic evidence under tested conditions (TS, Istanbul JSON caller-owned, Node v24.18.1, schema 0.2, threshold 30/15)."
- "Validated across tested repos/envs (defu v8 12K, ts-jest babel 277K, tsdoc Jest v8 subset 29K + full union 1.62M 64)."
- "Monorepo-aware analysis produced consistent results under evaluated Rush scenario (55× scale, same CRAP/gate)."
- "Historical complexity analysis and PASS→WARN differentiation demonstrated for 2 historical commits (complexity delta real)."
- "Deterministic CRAP/threshold, truthful statuses, schema 0.2, provenance — preserved across R1–R8."

---

## Unsupported Claims (must not make)

- Universal language / coverage-provider / monorepo support.
- Historical per-commit coverage validated (R8 reused coverage — coverage delta not historical).
- CRAP predicts defects or causal defect relationship.
- Autonomous risk judgment or replacement of human review.
- Human reviewers found signal useful (no independent human-usefulness evidence beyond WP4R 8 samples EXPECTED_PASS).
- All risks eliminated.

---

## Future Work (deferred, not WP9 closure blockers)

- Fresh historical per-commit coverage rerun in compatible env (Node 20.9, §14 of closure assessment) — smallest sufficient if historical coverage claim later required.
- Additional language support (JS/Python/Go), additional provider format, second monorepo with collision test, larger historical sample (4+ commits multi-file), coverage caching/incremental, security/blast-radius (Candidate 7), CI matrix for gate.

---

## Closure Decision

**WP9 READY FOR CLOSURE — subject to human approval gate.**

Engineering/evidence complete through Round 8, assessment `AWAITING HUMAN REVIEW`. If human review requires historical coverage claim: **ONE EXPERIMENT — Fresh Historical Per-Commit Coverage Rerun (Node 20.9) per `wp9-cumulative-closure-assessment-through-round8.md` §14**.

Do not start WP10 without explicit CONTINUE.

```text
AWAITING HUMAN REVIEW
```
