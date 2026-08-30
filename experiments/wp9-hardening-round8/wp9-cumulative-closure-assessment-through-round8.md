# WP9 Cumulative Closure Assessment — Through Round 8

**Date:** 2026-08-30
**Scope:** WP9 Evidence-Driven Hardening / Evolution, Rounds 1–8 cumulative
**Status:** ASSESSMENT — AWAITING HUMAN REVIEW (stop at approval gate, no implementation)
**Engine:** commit 2972e5e + staged OPENCODE_START_HERE docs, Node v24.18.1, tests 178/178 (59 files), tsc 0 errors, build ok, schema 0.2 frozen, threshold 30/15 frozen, INV-01..04 preserved
**Author:** Orchestrator (reconstructed from repository + docs + evidence artifacts)

---

## 1. Current Project State

WP9 Hardening Round 8 complete 2026-08-30, staged for commit, awaiting human gate. Project sits at **WP9 — Evidence-Driven Hardening / Evolution**, not WP6/7/8. No WP10 started. No new source modifications since Round 5 (rounds 6–8 evidence-only). Deterministic evidence engine stable: `dist/cli.js check --base <ref> --json --coverage-file <path>` produces schema 0.2 JSON with git/complexity/coverage capabilities, changed-function intervals, CC/CRAP/coverage attribution, PASS/WARN gate, completeness.

Latest round (8) attempted 2-point historical/delta on `microsoft/tsdoc` commits `00203d4` (base c908cc8) and `e11ec0b` (base cc1dbc6) using Jest v8 via heft-web-rig. **Blocked by Node/Rush incompatibility** (env Node v24.18.1 not in allowed 16.13/18.15/20.9 ranges). Fell back to reusing Round 7 full-union coverage artifact (1,621,110 bytes, 64 entries) for both commits. Complexity delta real, coverage reused → delta partially real, partially not. Verification clean (see §15/§16).

**Graphify:** graph at `graphify-out/GRAPH_REPORT.md` built from commit 2972e5e, 3121 nodes, corpus large enough for graph value, stale by staged docs only (no src change).

---

## 2. WP9 Round-by-Round Reconstruction

| Round | Objective / Question | Environment / Repo | Evidence Generated | Findings / Defects / Corrections | Regression Protection | Result | Remaining Uncertainty |
|-------|----------------------|--------------------|--------------------|----------------------------------|------------------------|--------|----------------------|
| **WP9 Baseline** (ca7af83) | Prioritize WP8 findings into evidence-backed evolution; answer "what evolution is justified without violating CONTINUE WITH CONSTRAINTS?" | This repo (code-risk-prototype), Node v24.18.1, local prototype as fallback | `prioritization.md` (7 candidates), `threshold-guidance.md` (5 FN blind spots + threshold sensitivity + 4.96s burden), `repro.md` (2 external attempts nanoid bnt / clsx uvu deferred), `external-pilot.json` 157230 bytes local fallback | Defect: CLI functions `parseCliArgs` CC23 / `main` CC12 had `crap:null` due to 0% unit coverage → correctly skipped per INV-01 but signal density gap. Correction deferred to hardening. | INV-01..04 preserved, contract 0.2 frozen, reversible | COMPLETE, CONTINUE WITH CONSTRAINTS proposal, fallback validates adapter mismatch not broad usefulness | External diversity 0 real successes, monorepo untested, historical untested, CLI attribution gap open |
| **WP9 Hardening (Round 1)** bef0ace | Close CLI attribution gap: can parseCliArgs be measured without hacking CRAP math? Second: does any external TS vitest repo validate engine with caller-owned coverage? | This repo + `unjs/defu` v6.1.7 (vitest + v8), Node v24.18.1 | `test/cli.unit.spec.ts` 17 tests (parseCliArgs now 61.2% stmt, CRAP 54), `src/cli.ts` exports + guard, `external-pilot-retry.json` 12673 bytes defu diff (3 funcs isPlainObject cc8, _defu cc14, createDefu cc1 all 100% PASS, helpers null-skipped), `threshold-addendum.md` before/after | Gap closed: parseCliArgs measured, main() still null (integration-only) — correct per INV-01. No src CRAP change. | 166/166 pass (up from 149), tsc clean, build ok, INV-01..04 verified, 0 FP, reversible | Main() still 0%, provider n=1, monorepo untested, historical untested |
| **Round 2** cb254da | Close main() gap: does integration test cover main without flaky child processes? | This repo, Node v24.18.1 | `test/cli.integration.spec.ts` 8 tests (mocked git/evidence, spied process.exit), both CLI funcs now measured: 87.8% stmt aggregate, main() 8 hits, `threshold-addendum-round2.md`, 174/174 pass | Main() now 87.8% combined, mocked but deterministic. No src change beyond round1. | 174 pass preserved, INV-01..04 + exit-code mapping verified | Provider still n=1, monorepo untested, historical untested, mocks not real git |
| **Round 3** 16cf1c0 | Does second provider (Jest/Istanbul) increase diversity to n=2? Validate per-repo hypothesis. | Search under /tmp: type-fest (type-only), guideline (no TS intervals), fallback defu variant2 base 869a053 | `external-pilot-jest.json` 5599 bytes fallback defu variant2 (same v8, base 869a053, 9 funcs 3 source PASS 6 helpers skipped, PASS), `repro-jest.md`, `threshold-addendum-round3.md` | Finding: Jest TS scarcity — no suitable small TS Jest repo with TS intervals found in budget → fallback proves search cost. Per-repo validation cost validated. No new provider. | 174 preserved, no src change | Provider still n=1, Jest genuine still 0 |
| **Round 4** b50f977 | Genuine Jest/Istanbul validation | `kulshekhar/ts-jest` Jest + babel coverageProvider, base eb135eb vs HEAD b1a97ac, `npx jest --coverage --coverageProvider=babel --coverageReporters=json`, artifact 277177 bytes, Node v24.18.1 | `external-pilot-jest-genuine.json` 4440 bytes (6 funcs: TsCompiler._transpileOutput cc4 crap4.37 71% PASS, _filterDiagnostics cc7 86% PASS, Importer.typescript cc5 88% PASS + 3 skipped null), `repro-jest-genuine.md`, `threshold-addendum-round4.md` | Genuine second provider validated: v8 + babel/Istanbul both PASS under same engine, same threshold, schema 0.2. Provider diversity n=2. | 174 preserved, tsc/build clean, INV-01..04 preserved | Monorepo untested, historical untested, sample n=2 still small |
| **Round 5** 914219e | Real-git main integration without mocks (FM-D10) | This repo, real `git init` + commits, PATH hack for ENOENT | `test/cli.real-git.spec.ts` 4 tests: valid repo PASS, not-a-repo "Not a git repository" exit1, invalid base "Cannot resolve base reference", ENOENT "Git executable not found" — all 4 distinct per INV-03, `threshold-addendum-round5.md`, 178/178 pass | FM-D10 proven with real git binary: ENOENT ≠ not-a-repo. Schema 0.2 contract verified in valid-repo JSON. | 178 pass (+4 real-git), 87.8% unchanged (no src), INV-03/04 truthful | Provider n=2, monorepo untested, historical untested |
| **Round 6** 2972e5e | Third provider: Jest v8 via Rush/Heft on microsoft/tsdoc | `microsoft/tsdoc` eslint-plugin only (subset), base cc1dbc6→e11ec0b, `heft test --jest:config ./jest.custom.json`, artifact 29210 bytes 3 entries, Node v24.18.1 | `tsdoc-genuine.json` 1131 bytes (2 funcs: getRootDirectoryFromContext cc12 crap116 cov10 WARN + plugin.rules.syntax.create cc6 crap18 cov30 PASS, gate WARN), `repro-tsdoc-genuine.md`, `threshold-addendum-round6.md`, n=3 (defu v8 12K + ts-jest babel 277K + tsdoc Jest v8 29K) | Provider diversity n=2→n=3 (2 v8 variants + 1 babel). Same engine handles Rush heft-web-rig Jest custom json override. Monorepo subset only. | 178 preserved, no src change, schema 0.2, threshold 30/15 frozen | Full monorepo untested, historical delta untested |
| **Round 7** 2972e5e+ | Monorepo boundary: does full Rush union (1.6M 64 entries) break attribution? | Same tsdoc, full Rush: `heft test` per package (tsdoc 1.2M 59 entries + tsdoc-config 90K 2 entries + eslint-plugin 29K 3 entries + api-demo empty 3 bytes), python dict union → 1621110 bytes 64 entries, Node v24.18.1 | `full-union-coverage.json` 1621110 bytes 64 entries, `repro.md` (per-package jest.custom.json + merge), `threshold-addendum-round7.md`, comparison subset vs full union proves identical 2 funcs, same CRAP, same WARN/WARN gate, attribution via endsWith among 64 without ambiguous decline, normalizeCoveragePaths rebases 64 absolute keys | Monorepo boundary validated at 55× scale (29K 3 entries → 1.62M 64 entries). Caller must configure Jest to emit json (rig default is cobertura/html only). Empty projects (api-demo {}) correctly ignored. No src change. | 178 preserved, tsc/build clean, INV-01..04 preserved, schema 0.2, F-03 fix validated at scale | Single monorepo, single diff (1 file 2 funcs), ambiguous suffix collision (e.g., two `src/index.ts`) not observed, historical delta still untested, another monorepo not tested |
| **Round 8** staged | Historical/delta 2-point: does engine process historical diffs + produce deterministic CRAP/gate trend? | Same tsdoc, commits 00203d4 (base c908cc8) and e11ec0b (base cc1dbc6), same Jest v8/heft-web-rig, Node v24.18.1 (incompatible with rush.json 16/18/20), full-union fallback 1621110 bytes reused for both | `00203d4-coverage.json` 1621110 bytes (copy of full union) + `00203d4-engine.json` 7598 bytes (11 funcs, key plugin cc5 crap15.54 cov25 PASS gate PASS INCOMPLETE) and `e11ec0b-coverage.json` 1621110 bytes + `e11ec0b-engine.json` 1714 bytes (2 funcs, getRoot cc12 crap116 cov10 WARN + plugin cc6 crap18 cov30 PASS gate WARN COMPLETE), `repro-history-delta.md`, `threshold-addendum-round8.md` | Attempt blocked: `node common/scripts/install-run-rush.js run -p eslint-plugin -- test` failed with "Node.js version 24.18.1 not supported by rush.json (requires >=16.13.0 <17.0.0 || >=18.15.0 <19.0.0 || >=20.9.0 <21.0.0)". Fallback to Round7 union valid per caller-owned coverage model but means coverage not per-commit. Complexity delta real (plugin 5→6 CC, +new getRoot 12), gate PASS→WARN trend demonstrated. No src change. | 178 preserved, tsc/build clean, INV-01..04 preserved, schema 0.2 frozen | Fresh per-commit historical coverage NOT demonstrated (blocked), coverage attribution under historical coverage not validated, 2-point scale only |

---

## 3. Cumulative Claim / Evidence / Limitation Matrix

| # | Claim | Evidence | Rounds | Repos / Envs | Strength | Known Limitations | Material Gap? | Recommended Action |
|---|-------|----------|--------|--------------|----------|-------------------|---------------|--------------------|
| C1 | Deterministic changed-function detection (git diff → intervals) | git diff on real repos: defu, ts-jest, tsdoc (subset+full union+history), real-git tests; 178 tests including wp55 git tests | 1–8, WP5.5 | This repo + defu + ts-jest + tsdoc, Node v24, v8/babel | **Strong** | Single Git implementation (git CLI), no libgit2 path | No | None for closure |
| C2 | Git historical analysis (base→target diff) | Bases: e50528 (defu), eb135eb (ts-jest), cc1dbc6/e11ec0b, c908cc8/00203d4, PATH-invalid base | 1–8 | 3 external repos + local, real git | **Strong** | Base is commit SHA only (branch refs tested via CLI unit) | No | None |
| C3 | Complexity measurement (CC via crap-typescript) | CC values consistent across rounds for same funcs (plugin 5/6, getRoot 12, _defu 14, isPlainObject 8); F-03 not CC | 1–8 | All repos, @barney-media/crap-typescript-core@0.5.0 | **Strong** | TS-only, no other language | Acceptable for WP9 (see §8) | Defer language |
| C4 | Coverage ingestion (Istanbul JSON caller-owned) | Artifacts: 12K v8, 277K babel, 29K tsdoc subset, 1.62M full union, reused 1.62M fallback; parseCoverageReport handles both v8 and Istanbul | 1–8 | v8 + babel/Istanbul, 4 sizes | **Strong** | Requires caller to emit json (Rush rig default cobertura only, needs jest.custom.json) | No — documented as caller burden | Keep docs |
| C5 | Coverage attribution (file suffix + normalizeCoveragePaths) | EndsWith isolates eslint-plugin/src/index.ts among 64 entries (R7), rebases 3 and 64 absolute keys, F-03 validated at 1.6M; FM-A08 exact→suffix→ambiguous decline holds | 4–8 | All, including 1.6M scale | **Medium/Strong** | Ambiguous suffix collision (two src/index.ts) not collision-tested at scale; single monorepo | Partial — acceptable (see §7) | Optional dedicated collision test as future enhancement |
| C6 | Zero-coverage semantics (ZERO≠NULL, INV-01) | Measured 0% would be 0 not null (not observed but logic in evidence.ts: cc/crap/coverage null only when skipped); parseCliArgs before/after shows null→54, helpers null, main after R2 non-null; 178 tests include ZERO cases | WP5.6 + R1–8 | All | **Strong** | True 0% vs unmeasured not separately artifact-tested at scale | No | None |
| C7 | Unavailable/missing/malformed (INV-02 MISSING≠MALFORMED) | Evidence: `coverageErrorReason: missing` vs `malformed` distinct, CLI tests for missing/malformed, wp55 tests | WP5.5 + R1–8 | All | **Strong** | Historical case always had available coverage (fallback) | No | None |
| C8 | CRAP calculation deterministic (CC²×(1-cov)³+CC) | Same inputs → same outputs across R6 subset vs R7 full union identical (116.97/18.34), defu 8/14, threshold addenda frozen math in crapCalc.ts | 1–8 | All | **Strong** | Threshold is policy not math; branch coverage kind | No | None |
| C9 | Threshold evaluation (30/15 frozen) | evidence-contract.md:38 + rules.ts default 30, addenda R1–8 all frozen, PASS/WARN flips at 30 (sup-a 36 vs sup-b 28 in WP5.6, parseCliArgs 54 WARN, getRoot 116 WARN vs plugin 15–18 PASS) | WP5.6 + R1–8 | All | **Strong** | Single threshold value tested; tuning not engine change | No | None |
| C10 | PASS/WARN behavior + gate | Gate PASS (defu, ts-jest) vs WARN (tsdoc e11ec0b, getRoot 116) vs PASS→WARN delta (R8 00203d4 PASS to e11ec0b WARN), exit 0 PASS / 1 WARN | 1–8 | All | **Strong** | Only PASS/WARN observed, no FAIL path in hardening (FAIL is provider error) | No | None |
| C11 | Incomplete evidence behavior (COMPLETE vs INCOMPLETE) | 00203d4 INCOMPLETE (11 funcs, 10 skipped no coverage for those files) vs e11ec0b COMPLETE (2 funcs both covered) vs defu/ts-jest INCOMPLETE (test helpers skipped) | 4–8 | All | **Medium/Strong** | INCOMPLETE due to missing configs not deeply probed | No | None |
| C12 | Truthful statuses (INV-04 analyzer truthful) | analyzerStatus passed vs skipped vs failed truthful per function; capabilities git/complexity/coverage truthful; real-git tests verify | 1–8 | All | **Strong** | No failed-complexity case in hardening (unsupported TS not hit) | No | None |
| C13 | Machine-readable evidence (schema 0.2 frozen) | All engine JSON: schemaVersion 0.2, analysis/base/target, capabilities, changedFunctions, policy, ruleResults, analysisStatus, gate, completeness; validated in R2,5,6,7,8 | 1–8 | All | **Strong** | Schema not version-bumped, additive F-03 compatible | No | None |
| C14 | Evidence API (CLI check --json --coverage-file) | CLI unit+integration+real-git tests 25+4, defu/ts-jest/tsdoc invocations via `node dist/cli.js check --base ... --json --coverage-file` | 1–8 | All | **Strong** | Single CLI entrypoint, no service/DB | No | None |
| C15 | CI gate (exit codes per evidence.ts) | exit 0 PASS, 1 WARN/FAILED verified in integration + real-git tests | 2,5 | This repo | **Medium** | Only local, no CI runner matrix | Acceptable | None for WP9 |
| C16 | Reproducibility | repro.md files in each round (commands, SHAs, sizes, Node v24.18.1, engine commit), 178 tests deterministic offline | 1–8 | All | **Medium/Strong** | Historical rerun blocked by Node mismatch (R8) — not engine but env (see §5) | Partial — needs doc fix | Add env note + container guidance (doc only) |
| C17 | Multiple repositories | defu + ts-jest + tsdoc (subset+full+histo) = 3 distinct external repos, plus this repo CLI | 1–8 | 3 external | **Medium** | n=3 still small statistically | Acceptable — not universal claim | None for closure; claim scoped as "validated across tested repos" |
| C18 | Multiple coverage/test environments | v8 (defu vitest v8), babel/Istanbul (ts-jest Jest babel), Jest v8 via heft-web-rig (tsdoc 3 artifacts); sizes 12K–1.62M | 4–8 | 3 providers, 2 frameworks (vitest, Jest) | **Medium** | Only Istanbul-family (v8+babel+Jest v8), no lcov-only-only reinterpretation needed | Acceptable — count is 3 not inflated by reuse | None for closure; R8 reuse NOT counted as new provider |
| C19 | Monorepo behavior | R7 full union 1.62M 64 entries (tsdoc 59 + tsdoc-config 2 + eslint-plugin 3) vs R6 subset 29K 3 entries same results; merge via python union | 7 | 1 monorepo (tsdoc Rush) | **Medium** | n=1, 1 diff (1 file 2 funcs), empty projects (api-demo {}, playground no-file) expected, collision not tested | Acceptable limitation, not universal claim | None for closure; claim "validated under tested monorepo scenario" |
| C20 | Historical/delta behavior | R8 2-point historical complexity delta real (plugin 5→6, +new func), gate PASS→WARN; coverage reused so not per-commit | 8 | 1 repo, 2 commits | **Partial** | Coverage not per-commit, only 2 points, 1 repo, 1 provider (Jest v8) | Material? See §4 — historical coverage is extension not core, so PARTIAL sufficient for closure | One narrow rerun (see §10) is smallest sufficient if closure requires it; otherwise accept as partial |
| C21 | Provider diversity (distinct artifact formats) | As C18, plus note: Rush needs jest.custom.json to emit json (rig default not json) | 4–8 | Same as C18 | **Medium** | All Istanbul-json-family, not lcov/cobertura | Acceptable (contract is Istanbul json) | None |
| C22 | Language diversity | TS-only throughout, engine language-neutral at evidence layer (CLI agnostic to artifact) but @barney-media/crap-typescript-core is TS-specific | WP5–R8 | TS | **Weak** | No second language demonstrated | Acceptable — WP9 scope was TS, defer language to WP10/productization (see §8) | Defer |
| C23 | Scalability (artifact size) | 12K → 277K → 29K → 1.62M (55×) handled without attribution break, same CRAP | 6–8 | Same as above | **Medium** | Upper bound not probed beyond 1.62M 64 files | Acceptable | None |
| C24 | Provenance / traceability | Each report lists engine commit, Node, base/head SHAs, artifact sizes, repro steps, plan file path, evidence paths | 1–8 | All | **Strong** | Graphify labels still from 2972e5e (staged docs not yet in graph) — minor | No | Update graph after commit |

---

## 4. Round 8 Specific Assessment

**What R8 genuinely established (real):**
1. Engine can `git diff --name-only` and compute changed-function intervals for historical commits (00203d4 base c908cc8, e11ec0b base cc1dbc6) — 11 and 2 funcs respectively, with line ranges.
2. Complexity (CC) for those historical changes is real and reflects actual code (plugin 5 vs 6, getRoot 12) — no coverage involved, so not polluted by fallback.
3. Engine produces deterministic CRAP/gate when supplied coverage artifact: `crap=15.54 PASS` vs `116.97 WARN + 18.34 PASS` with thresholds 30, gate PASS→WARN deterministic.
4. Engine identifies high-risk historical change (getRoot WARN) and gate transition PASS→WARN between two historical points — demonstrates trend signal shape.
5. Engine stable under reuse: same full-union artifact reused for both commits still yields consistent attribution (endsWith, normalizeCoveragePaths) and schema 0.2 SUCCESS.

**What was only partially demonstrated:**
- Historical complexity delta is fully demonstrated.
- Historical CRAP/gate delta is demonstrated *conditionally* on supplied coverage (engine side), not on historical coverage correctness.

**What was blocked (not demonstrated):**
1. Coverage used does NOT represent historical commit — both points reuse Round 7 union (1,621,110 bytes, 64 entries) not per-commit heft output.
2. Historical coverage attribution under freshly generated per-commit coverage not validated.
3. Coverage delta across 2 commits not valid (identical artifact → delta 0 by construction).
4. End-to-end Rush historical reproduction not demonstrated under current Node (v24.18.1).

**What reused prior evidence (must not be inflated):**
- Coverage artifact size/entries identical to Round 7 full union (diff -q confirms 00203d4-coverage.json == full-union-coverage.json and e11ec0b-coverage.json == same).
- Provider diversity remains n=3 (no new provider counted for R8).
- No new language, no new repo beyond tsdoc, no new framework beyond Jest v8/heft.
- Classification: **PARTIAL HISTORICAL/DELTA VALIDATION — REAL COMPLEXITY DELTA, NON-HISTORICAL/REUSED COVERAGE EVIDENCE** per prompt definition. Report `repro-history-delta.md` correctly states limitation; `wp9-hardening-round8-report.md` also notes 1621110 fallback.

---

## 5. Material Remaining Uncertainties

Only material uncertainties (would change closure decision if unresolved):

| ID | Uncertainty | Why material or not | Classification |
|----|-------------|---------------------|----------------|
| MU-1 | Fresh per-commit historical coverage attr not validated (R8 blocked) | **Material if** project intends to claim "historical coverage risk analysis" as core capability. **Not material if** historical analysis is experimental extension and core claim is current-diff CRAP with caller-owned coverage (which is validated). WP9 prioritization explicitly **DEFERRED** Historical Risk Delta (Candidate 6) as hypothesis (Low value, High cost, no WP8 evidence). Current intended claims are deterministic evidence, threshold sensitivity, provider diversity, monorepo boundary — not historical coverage trends. → **Not a blocker for closure under documented scope**, but requires claim scoping. | B (Material Uncertainty) **scoped as Acceptable Limitation** if claims exclude historical coverage. If any doc claims historical coverage validated, drifts to A/C confusion. |
| MU-2 | Single monorepo, single diff (1 file 2 funcs), no suffix-collision test at scale | Not material for WP9 closure — boundary validated cheaply (55× scale proof that engine not single-package-only). Universal monorepo claim not intended. | C |
| MU-3 | n=3 providers, n=3 repos — small sample | Not material — WP9 closed provider diversity from n=1→n=3, threshold still limited but evidence strong enough for "validated across tested envs" not "universal". | C |
| MU-4 | Language TS-only | Not material — engine evidence layer language-neutral, TS complexity tool is scope, WP9 deferred language per prioritization. | C |

**Therefore:** Only MU-1 could be considered material, but its materiality hinges on intended claim. Since WP9 master docs deferred historical delta, keeping WP9 open solely for fresh historical coverage would be curiosity not closure requirement.

---

## 6. Known Acceptable Limitations (do not prevent closure)

- TS-only scope (Known WP5) — unchanged, documented, contract TS-specific.
- Istanbul/v8 coverage dependency (Known WP5) — engine consumes Istanbul JSON; other formats out of scope.
- Caller-owned coverage burden ~4.96s per run (Known WP5, quantified in threshold-guidance.md §3, dx-operational.md) — burden unchanged, not defect.
- Monorepo untested beyond one scenario (tsdoc 1.62M 64 entries) — validated boundary but not universal.
- Test quality vs quantity — statistical power limited (n=3 external repos), but deterministic behavior strong, zero FP observed.
- External repo validation still limited — fallback pattern shows per-repo validation needed, documented.
- Historical coverage — as §4/§5, partial only, not claimed as proven.
- Reproducibility limited by external runtime (Node/Rush) — documented, not engine defect (§9).
- Performance/scalability upper bound not probed beyond 1.62M — acceptable, no perf regression observed (3.62s suite).

---

## 7. Future Enhancements (must NOT block WP9)

- Additional language support (JS/Python/Go) — WP9 Candidate 7 deferred, WP10 candidate.
- Additional coverage provider/format (lcov-only, cobertura) — would need new adapter, out of 0.2 contract.
- Additional monorepo (e.g., pnpm workspace, Nx) with collision test (two packages sharing src/index.ts suffix).
- Larger historical sample (4+ commits, multi-file diffs) + fresh per-commit coverage matrix.
- Coverage caching / incremental coverage — Candidate 4 deferred hypothesis.
- Dependency blast radius / security AST patterns — Candidate 7 deferred.
- Human usefulness study (does reviewer change behavior?) — requires human review packet, not engine work.
- CI matrix for gate (GitHub Actions on multiple Node versions).

---

## 8. Historical/Delta Assessment (explicit)

*What R8 genuinely established?* See §4 bullets 1–5: historical diff + complexity + deterministic CRAP/gate shape + PASS→WARN trend, all real except coverage per-commit.

*What remains unestablished?* §4 blocked list: per-commit coverage correctness, attribution under historical coverage, coverage delta validity, end-to-end Rush historical execution.

*Is fresh per-commit coverage necessary?* Only if intended claim includes "historical coverage risk analysis" or "CRAP trend over time based on historical coverage". Under current WP9 roadmap, **no** — WP9 prioritization Candidate 6 was DEFERRED as hypothesis, and WP9's proven capability is current-diff deterministic evidence. Historical complexity alone is sufficient for "historical complexity analysis" claim, not for "historical coverage risk".

*Would a successful compatible-environment rerun materially change confidence?* Yes for MU-1, but magnitude is incremental: would validate attribution under historical coverage and prove Rush env reproducibility, raising historical claim from partial to demonstrated for one repo/provider. Would NOT change core WP9 claims (provider diversity n=3, monorepo boundary, threshold, invariants).

*Is historical complexity sufficient for intended claim?* Yes, if claim is scoped to "historical complexity analysis demonstrated" — R8 already proves that even under fallback.

*Is historical coverage necessary?* No for WP9 closure per documented scope; Yes if future WP10 intends to offer historical trend feature.

*Is historical/delta a core capability or experimental extension?* Per `experiments/wp9/prioritization.md` and `OPENCODE_START_HERE.md`, **experimental extension — DEFERRED hypothesis**, not selected for WP9 evolution.

*Does current project intend to claim historical risk analysis?* No — WP9 reports through Round 7/8 maintain threshold parity, schema frozen, no historical feature in contract. Round 8 report correctly labels "Delta Table" but limitation notes reused coverage.

*Would failing to complete fresh historical coverage prevent WP9 closure?* **No**, provided claims are scoped (§13) and limitation explicitly documented. Would prevent only a broader "historical coverage validated" claim.

---

## 9. Assessment of Node/Rush Blocker (§5 of task)

**Determination:** **B — Experiment-environment limitation, plus E — Acceptable external-environment limitation**, not A/C/D.

- **Not A (engine defect):** Engine never executes Rush/Heft; it consumes `coverage-final.json` via `--coverage-file`. Rush Node constraint (`rush.json` allows 16.13/18.15/20.9, env is v24.18.1) is property of `microsoft/tsdoc`'s pinned toolchain, not engine's code. Engine succeeded when supplied valid artifact (deterministic CRAP/ gate).
- **Not C (reproducibility problem of engine):** Engine reproduction steps in `repro-history-delta.md` are reproducible for engine invocation; Rush step is third-party prerequisite. Repro file explicitly documents the failure and fallback, preserving traceability.
- **Not D (project integration issue):** No integration expected between engine and Rush version manager; caller-owned coverage model intentionally decouples.
- **Is B (experiment-environment limitation):** The experiment required generating fresh coverage via Rush, but available env mismatched. This is lab env mismatch, not product defect.
- **Is also E (acceptable external-environment limitation):** Historical repos pin old Node; expecting v24 to run them is not engine requirement. Historical coverage generation is best-effort per-commit, not guaranteed across Node eras.

**Reproduction strategy assessment:** Reasonable strategies exist (compatible Node via nvm 20.9, container `node:20`, CI matrix, version manager docs). Absence of such env is **not a WP9 blocker** — it is reproducibility limitation for this specific historical experiment. Should be documented as dependency ("historical Rush coverage requires Node 20.9/18.15/16.13 per tsdoc rush.json") and packet should note fallback. No engine change needed. Implementing container now is out of assessment scope (per task DO NOT implement).

---

## 10. Provider Diversity Reassessment

**Exactly validated (fresh, not reused):**

| # | Repo | Lang | Test framework | Coverage provider | Format | Fresh? | Run | Attribution validated? |
|---|------|------|----------------|-------------------|--------|--------|-----|------------------------|
| 1 | unjs/defu | TS | vitest | @vitest/coverage-v8 | Istanbul JSON | Fresh (npx vitest --coverage.provider=v8) | Full suite | Yes (isPlainObject, _defu, createDefu PASS, helpers skipped) |
| 2 | kulshekhar/ts-jest | TS | Jest (babel) | --coverageProvider=babel --coverageReporters=json | Istanbul JSON (statementMap/fnMap/branchMap) | Fresh (npx jest --coverage…) | Full suite | Yes (TsCompiler funcs 71–88% PASS, helpers skipped) |
| 3 | microsoft/tsdoc eslint-plugin subset | TS | Jest v8 via heft-web-rig | jest.custom.json coverageReporters json | Istanbul JSON | Fresh (heft test --jest:config) | Package subset (eslint-plugin only) | Yes (2 funcs WARN/PASS) |
| 3b| microsoft/tsdoc full union | TS | Same Jest v8 heft | Same, per-package + python union | Istanbul JSON | Fresh per-package then merged (tsdoc 1.2M + tsdoc-config 90K + eslint-plugin 29K) | 3 packages full union 64 entries | Yes (same 2 funcs among 64, same CRAP) — validates scale not new provider |
| — | microsoft/tsdoc historical 00203d4/e11ec0b | TS | Same (attempted) | Same (attempted) | Istanbul JSON | **Reused** (fallback 1.62M) | Not fresh | **Not counted as new validation** — attribution still exercised but coverage not per-commit |

**Count:** n=3 distinct provider configurations (2 v8 variants + 1 babel). All Istanbul JSON family (contract scope). Do **not** inflate to n=4 by counting reused fallback. Frameworks: vitest + Jest (2). Freshness: 4 fresh artifacts (defu, ts-jest, tsdoc subset, tsdoc full union) + 2 reused fallbacks (identical bytes). Scoped vs full: both subset and full-suite validated (R6 vs R7). **All attribution validated** (passed funcs had coverage 10–100%, skipped helpers null).

---

## 11. Monorepo Validation Reassessment

*Was full-union artifact processed successfully?* Yes — 1,621,110 bytes, 64 entries, engine produced schema 0.2 SUCCESS/WARN/COMPLETE.

*Was attribution preserved?* Yes — endsWith suffix matching found single match per changed file among 64, no ambiguous decline triggered, no wrong-file attribution.

*Were results stable?* Yes — subset 29,210 bytes 3 entries → full union 1.62M 64 entries gave identical CC 12/6, coverage 10/30, CRAP 116.97/18.34, gate WARN.

*Was artifact materially larger?* Yes — 55× larger (29K→1.62M, 3→64 entries, +61 files, +2 packages with data).

*Was this enough to establish relevant monorepo boundary?* **Yes for cheap proof** that engine is not single-package-only. Establishes that `normalizeCoveragePaths` scales (3→64 rebases) and monorepo-aware analysis works for this Jest/Rush variant. See `repro.md` and `wp9-hardening-round7-report.md` operational delta table.

*What remains unknown?* Second monorepo (pnpm/Nx), larger diffs (4+ funcs, multi-file) at monorepo scale, suffix collision scenario (two packages with same `src/index.ts` triggering ambiguous decline), build-rig vs library packages. None block closure; they bound the claim.

*Preserve limitation:* Do not claim universal monorepo support. Claim: "validated under tested monorepo scenario (microsoft/tsdoc Rush, Jest v8 via heft-web-rig, 1.62M 64-entry union, single diff 1 file/2 funcs)".

---

## 12. Language Generality Reassessment

*Is engine language-neutral at evidence layer?* **Partially** — `git diff`, file interval conversion, `coverage ingestion` (`parseCoverageReport`), `crap calculation` are generic, but `complexity` step delegates to `@barney-media/crap-typescript-core` which is TS-specific. CLI agnostic to coverage artifact source.

*Which parts language/tool-specific?* `src/complexity.ts` (TS), `crap-typescript-core@0.5.0` dependency, interval discovery via TS AST. Coverage parsing is format-specific (Istanbul JSON) not language-specific but currently only TS coverage emitted.

*Has prototype demonstrated across languages?* **No** — all 3 external repos TS, all coverage TS. No JS/Python/Go evidence.

*Is another language required for WP9 closure?* **No** — WP9 scope per prioritization deferred "Additional Language Support" (Candidate 7, Low value, High cost, no WP8 evidence). WP9 evolution selected CLI fix + external TS validation + threshold guidance, not language expansion.

*Future?* Additional language support is WP10/productization concern, requires new parser/adapter and per-language coverage tool validation. Not a WP9 blocker. Claim must remain "TypeScript-only scope" (Known WP5 limitation unchanged).

---

## 13. Value-of-Information Analysis

For each candidate additional experiment:

### Candidate H1: Fresh historical per-commit coverage in compatible TSDoc env (Node 20.9)

- **Question:** Does per-commit historical coverage attribution work end-to-end for tsdoc Rush heft?
- **Currently know:** Complexity delta real, gate PASS→WARN real conditional on coverage, coverage attribution works for current HEAD union, Rush requires Node 20.9, fallback proved engine side deterministic.
- **Not know:** Per-commit coverage correctness, per-commit attribution under fresh coverage, coverage delta validity.
- **Pass would change:** Elevates historical claim from partial to demonstrated for 1 repo/1 provider/2 points; modest confidence increase, validates reproducibility recipe (nvm/container).
- **Failure would change:** If historical coverage still mismatched or CC/coverage diverge, would reveal coverage-generation fragility for old commits, but not engine defect (since engine already works with fresh union).
- **Likelihood to change conclusion:** **Low/Medium** — core WP9 claims unchanged; only historical coverage claim affected, which is already deferred.
- **Cost:** Medium (needs Node 20.9 env via nvm or container, re-clone tsdoc, checkout 00203d4/e11ec0b, per-package heft with jest.custom.json, merge, re-run engine, ~1–2 hours).
- **Material?** **Low for WP9 closure** (historical deferred), **Medium for future historical feature**.
- **Verdict:** Smallest sufficient if historical coverage claim were required; otherwise deferred.

### Candidate L1: Another language (e.g., JS via crap-js, or Python)

- **Question:** Is evidence engine language-neutral beyond TS?
- **Know:** Engine TS-only validated, language-neutral claim not made.
- **Not know:** Cross-language CC/coverage mapping.
- **Pass/Failure change:** Would expand scope, not WP9 closure criteria.
- **Cost:** High (new parser, new fixtures, new coverage tool).
- **Material?** No for WP9.
- **Verdict:** Future enhancement, not blocker.

### Candidate P1: Another coverage provider (e.g., c8, nyc lcov→json, another Jest preset)

- **Question:** Does engine handle another Istanbul-compatible provider beyond tested 3?
- **Know:** 3 Istanbul JSON variants already validated (v8, babel, Jest v8).
- **Not know:** Additional provider edge formats.
- **Pass:** Incremental provider confidence n=3→n=4.
- **Cost:** Medium (find suitable TS repo with different provider).
- **Material?** No — diminishing returns beyond 3.
- **Verdict:** Defer.

### Candidate M1: Another monorepo (e.g., pnpm workspace, Nx, Turborepo)

- **Question:** Does attribution scale generalize beyond Rush?
- **Know:** Rush validated at 1.62M 64 entries (cheap proof).
- **Not know:** Other monorepo layouts, collision handling.
- **Pass:** Broadens monorepo claim from 1 to 2.
- **Cost:** Medium-High (find monorepo with TS diffs, generate coverage).
- **Material?** No for WP9 (claim already scoped).
- **Verdict:** Defer, or bundle with collision test.

### Candidate H2: Additional historical cases (4+ commits, multi-file diffs)

- **Question:** Does delta trend hold across more points / multi-file?
- **Know:** 2-point single-file trend PASS→WARN.
- **Not know:** Multi-file, larger history.
- **Pass:** Stronger trend evidence.
- **Cost:** High (multiple checkouts + coverage generations).
- **Material?** No — not required for WP9 closure.
- **Verdict:** Defer to WP10 trend feature.

**Summary:** Highest value per cost is H1, but its materiality is low under current WP9 scope. All others lower ROI for closure.

---

## 14. Smallest Sufficient Next Step (if WP9 must continue)

**Required only if** human review decides historical coverage claim is required for WP9 closure. Otherwise skip to §15 closure recommendation.

- **Experiment Name:** WP9 Hardening Round 8 Addendum — Fresh Historical Per-Commit Coverage Rerun (tsdoc 00203d4/e11ec0b, Node 20.9 compatible)
- **Question:** Does the engine produce deterministic per-commit CRAP/coverage/gate for the same 2 historical commits when coverage is freshly generated per-commit in a compatible Rush environment?
- **Hypothesis:** With Node 20.9, `heft test --jest:config ./jest.custom.json` per package will generate per-commit `coverage-final.json` for eslint-plugin subset (or full union if time permits), and `node dist/cli.js check --base <parent> --json --coverage-file <per-commit-file>` will reproduce same CC but with per-commit coverage values (likely close to current 25/10/30 but now attributable to historical code), preserving gate PASS→WARN shape or revealing coverage delta.
- **Why matters:** Closes MU-1's only material gap if historical coverage is deemed core claim; proves Rush/Node reproducibility recipe; distinguishes engine defect from env limitation. Smallest because reuses same repo/commits/provider already validated, only changes runtime and regenerates coverage — no new repo search, no new language, no src change.
- **Repository:** `microsoft/tsdoc` (https://github.com/microsoft/tsdoc)
- **Commit(s):** 00203d4 (base c908cc830b18c2bedb56ee93f436066a51822b2d) and e11ec0b (base cc1dbc604dd056d250879138407596cd23d42f8d) — same as R8
- **Runtime:** Node 20.9.0 (or 18.15.0) via `nvm install 20.9.0 && nvm use 20.9.0`, or container `node:20.9-bullseye`, matching `rush.json` constraint `>=20.9.0 <21.0.0`
- **Language:** TypeScript
- **Test framework:** Jest via heft-web-rig (`heft test --jest:config ./jest.custom.json`)
- **Coverage provider:** Jest v8 (Istanbul JSON via `coverageReporters: ["json"]` override)
- **Coverage generation method:** Fresh per-commit, per-package `heft test` with `jest.custom.json` extending `./config/jest.config.json`, then optional python dict union for full union; artifact saved as `00203d4-coverage-fresh.json` and `e11ec0b-coverage-fresh.json` (do not overwrite reused fallback; compare)
- **Changed-function selection:** `git diff --name-only <base>..HEAD` → `eslint-plugin/src/index.ts` (plus playground/tsdoc files for 00203d4 case) — same as R8
- **Expected output:** Fresh coverage JSON per commit (eslint-plugin subset ~29K 3 entries, or full union ~1.6M 64 entries), engine JSON schema 0.2 SUCCESS with same CC (plugin 5/6, getRoot 12) but per-commit coverage (e.g., 25→? , 10→? , 30→?) and CRAP accordingly, gate PASS→WARN preserved if getRoot still high CRAP, completeness per files covered
- **Success criteria:** Both commits produce valid Istanbul JSON (has statementMap/fnMap/branchMap, size >0), engine JSON valid per schema 0.2, CC matches R8 (plugin 5 vs 6, getRoot 12), attribution finds same functions, no src change, tsc 0 errors, 178 tests preserved
- **Failure criteria:** Heft still fails even on Node 20.9 (reveals deeper Rush pin), or coverage JSON malformed/empty, or attribution fails (no match), or CC diverges (would indicate checkout/base error)
- **Interpretation of PASS:** Historical coverage attribution validated end-to-end for Jest/Rush; MU-1 moves from partial to demonstrated for this repo/provider; claim "historical complexity+coverage analysis demonstrated for tsdoc under Node 20.9" becomes supportable. Gate still PASS→WARN if high-risk persists.
- **Interpretation of FAILURE:** If fresh coverage still impossible, confirms historical coverage generation is inherently fragile for old Rush commits (env drift) — not engine defect; reinforces that historical coverage is extension not core. Document as external limitation and keep WP9 closure scoped without historical coverage claim.
- **What decision follows:** After rerun, create new addendum `wp9-hardening-round8-addendum-fresh.md` comparing fresh vs reused (R8) results, update `OPENCODE_START_HERE.md` and threshold addendum, do NOT overwrite R8 evidence — keep 4 files + 2 fresh files for provenance. Then re-evaluate closure (likely CLOSE with narrowed claim or accept partial).
- **Why smaller/more valuable than alternatives:** Reuses same repo/commits/provider (no search cost), only runtime change, validates the one blocked dimension (fresh coverage) with minimal scope; broader alternatives (new language, new provider, new monorepo, 4+ history) are higher cost and lower closure relevance.

*Stop at approval gate — do NOT implement this experiment as part of assessment task.*

---

## 15. Recommendation

**Choose exactly one: OPTION A — CLOSE WP9**

**Justification:**

- **Intended WP9 claims are now supported:** Deterministic changed-function detection, Git historical diff, complexity, coverage ingestion (Istanbul JSON caller-owned), coverage attribution (including at 1.62M scale), ZERO≠NULL, MISSING≠MALFORMED, CRAP deterministic, threshold 30/15 frozen, PASS/WARN, INCOMPLETE/COMPLETE, truthful statuses, schema 0.2, Evidence API, CI gate exit codes, provenance — all **DEMONSTRATED** or **PARTIALLY DEMONSTRATED within scoped claim** (see §16). Only historical coverage remains partial, but historical was explicitly **DEFERRED** per `experiments/wp9/prioritization.md` Candidate 6, not selected for WP9 evolution.

- **Remaining limitation is not material for closure under documented scope:** R8's Node/Rush blocker is experiment-environment limitation (E) not engine defect (A). Fresh per-commit historical coverage would be nice to have but does not undermine core claims WP9 intends to make. Value-of-information for H1 is low for WP9 closure (§13).

- **Provenance preserved, reversible, clean verification:** 178/178 pass, tsc 0, build ok, schema 0.2 frozen, threshold frozen, no src modifications since R5, all changes reversible via git revert, artifacts traceable (commit SHAs, sizes, Node, plan paths).

- **Alternative (Continue with one experiment) would be warranted only if** human review declares historical coverage analysis as required claim for WP9. In that case, the smallest sufficient step is H1 as defined in §14. But per current roadmap/prioritization, **closure is responsible without it**, provided claims are scoped (§17).

*Do not select B merely because more evidence would be nice; do not select C (no defect violating contract); do not select D (architecture satisfies intended capability under CONTINUE WITH CONSTRAINTS).*

---

## 16. Closure Test — Per-Item Classification

| Item | Verdict | Reason |
|------|---------|--------|
| changed-function identification | **DEMONSTRATED** | Real repos + real git, 178 tests, historical intervals real |
| Git integration | **DEMONSTRATED** | Bases across 3 external repos + invalid base/ENOENT distinct |
| complexity evidence | **DEMONSTRATED** | CC 5/6/12/8/14 etc consistent, TS only but scope is TS |
| coverage ingestion | **DEMONSTRATED** | 4 fresh artifacts 12K–1.62M, Istanbul JSON v8/babel |
| coverage attribution | **DEMONSTRATED** (scoped) | EndsWith + normalizeCoveragePaths validated to 64 entries; collision not tested but claim scoped to tested scenario |
| zero coverage | **DEMONSTRATED** | INV-01 logic + before/after parseCliArgs null→54, helpers null |
| unavailable coverage | **DEMONSTRATED** | MISSING vs MALFORMED distinct, wp55 + CLI tests |
| missing coverage | **DEMONSTRATED** | Same as above (coverageErrorReason missing) |
| malformed coverage | **DEMONSTRATED** | Same (coverageErrorReason malformed) |
| deterministic CRAP | **DEMONSTRATED** | Same inputs → same outputs across subset vs full union |
| thresholds | **DEMONSTRATED** | 30/15 frozen, PASS/WARN flips verified |
| PASS/WARN | **DEMONSTRATED** | defu/ts-jest PASS, tsdoc WARN, R8 PASS→WARN |
| incomplete evidence | **DEMONSTRATED** | COMPLETE (e11ec0b) vs INCOMPLETE (00203d4 11 funcs) |
| truthful status reporting | **DEMONSTRATED** | INV-04 analyzer truthful, capabilities truthful, real-git 4 cases |
| schema 0.2 | **DEMONSTRATED** | All engine JSON 0.2 valid, frozen since WP5.6 |
| Evidence API | **DEMONSTRATED** | CLI check --json --coverage-file across all repos |
| CI gate | **DEMONSTRATED** (scoped) | Exit 0 PASS / 1 WARN verified locally; CI runner matrix deferred but gate logic proven |
| provenance | **DEMONSTRATED** | Commit/Node/size/repro/plan traceability in every report |
| multiple repositories | **DEMONSTRATED** (scoped) | 3 external + this repo, n=3 small but claim scoped as "across tested repos" |
| multiple coverage/test envs | **DEMONSTRATED** (scoped) | v8 + babel + Jest v8 (n=3), vitest+Jest (2 frameworks), sizes 12K–1.62M; R8 reuse not counted |
| monorepo behavior | **PARTIALLY DEMONSTRATED** (scoped) | Validated under tested Rush monorepo 1.62M 64 entries; not universal, claim scoped accordingly |
| historical/delta behavior | **PARTIALLY DEMONSTRATED** | Historical complexity + deterministic gate shape demonstrated; per-commit historical coverage not demonstrated (blocked) — experimental extension, not core |
| reproducibility | **PARTIALLY DEMONSTRATED** | Deterministic offline + repro.md for engine; historical Rush coverage requires Node 20.9 (document as env dependency) |
| performance/scalability | **PARTIALLY DEMONSTRATED** | Handled 1.62M 64 entries without break (55×); upper bound not probed, no perf regression |

---

## 17. Boundary of Claims

### Claims We Can Responsibly Make (precise, scoped)

- "Engine provides **deterministic evidence** (git diff → changed functions → CC → coverage attribution → CRAP → PASS/WARN) **under the tested conditions** (TS, Istanbul JSON caller-owned, Node v24.18.1, schema 0.2, threshold 30/15)."
- "Coverage ingestion and attribution **validated across the tested repositories and coverage environments** (defu vitest v8 12K, ts-jest Jest babel 277K, tsdoc Jest v8 via heft-web-rig subset 29K and full union 1.62M 64 entries) with consistent PASS/WARN behavior."
- "Monorepo-aware analysis **produced consistent results under the evaluated monorepo scenario** (microsoft/tsdoc Rush, 1.62M 64-entry full union vs 29K 3-entry subset, same 2 funcs, same CRAP/gate), demonstrating the engine is not single-package-only."
- "Historical **complexity analysis was demonstrated** for two historical commits (00203d4 base c908cc8 and e11ec0b base cc1dbc6), including gate PASS→WARN transition driven by real CC change (plugin 5→6, +new getRoot 12)."
- "Deterministic CRAP calculation and threshold evaluation remain **frozen (30/15) and truthful** per INV-01..04, with machine-readable schema 0.2 evidence and provenance traceability across 8 rounds."
- "Failure semantics (ZERO≠NULL, MISSING≠MALFORMED, GIT≠REPO, ANALYZER TRUTHFUL) remain **preserved** across 178 tests and real-git integration."

### Claims We Cannot Make

- Universal language support (only TS validated).
- Universal coverage-provider support (only Istanbul-family v8/babel/Jest v8, n=3).
- Universal monorepo support (only one Rush monorepo with one diff validated; collision scenario not tested).
- Universal historical coverage support (per-commit historical coverage not validated; R8 reused Round 7 union, so coverage delta not valid historical trend).
- Defect prediction or causal CRAP→production defects (never claimed; not evidenced).
- Autonomous risk judgment or replacement of human review (system produces evidence, not judgment; human usefulness requires human review packet per WP5.6).
- Performance upper bound beyond 1.62M/64 entries (not probed).
- General CI environment portability (Rush historical coverage requires Node 20.9/18.15/16.13 per rush.json).

---

## 18. Human Usefulness Guardrail

System demonstrates: deterministic behavior (same inputs → same CRAP/gate across R6 vs R7), meaningful differentiation (getRoot cc12 crap116 WARN vs plugin cc6 crap18 PASS), threshold sensitivity (sup-a 36 WARN vs sup-b 28 PASS near boundary, parseCliArgs 54 WARN, documented in threshold-guidance.md), reproducibility (repro.md steps + 178 deterministic tests), evidence quality (schema 0.2, provenance).

**Whether human reviewer would change review behavior because of the signal remains human judgment** unless project has explicitly collected and documented that human evidence (which it has not beyond 8 WP4R samples accepted as EXPECTED_PASS and 5 re-executed cases). Per `OPENCODE_START_HERE.md`, human gate pending `CONTINUE / CONTINUE WITH CONSTRAINTS / STOP`; packet must end `AWAITING HUMAN REVIEW` until that judgment supplied. Do not autonomously declare usefulness.

---

## 19. Regression Verification (against historical anchors)

Verified on current worktree (2026-08-30, branch main, commit 2972e5e + staged docs):

- **ZERO≠NULL (INV-01):** Preserved. `src/coverage.ts` normalizeCoveragePaths + `src/evidence.ts` coverage null only when unmeasured; `test/cli.unit.spec.ts` before/after null→54, helpers null, 00203d4 10 skipped null vs 1 measured 25, e11ec0b both measured 10/30. **No regression.**
- **MISSING≠MALFORMED (INV-02):** Preserved. `evidence.ts:146-158` distinct `coverageErrorReason`, CLI tests for both, wp55 tests. **No regression.**
- **GIT unavailable ≠ not-a-repository (INV-03):** Preserved. `evidence.ts:65-72` capabilities, `test/cli.real-git.spec.ts` 4 distinct stderr phrases verified. **No regression.**
- **Analyzer status truthful (INV-04):** Preserved. `evidence.ts:216` analyzerStatus passed/skipped/failed truthful; e11ec0b passed, 00203d4 skipped for no-coverage files. **No regression.**
- **Coverage path normalization (F-03):** Preserved and validated at scale. `src/coverage.ts` `normalizeCoveragePaths` rebases 64 absolute keys (1.62M artifact) onto cwd, confirmed in R7 vs R6 identical results. **No regression.**
- **Function attribution deterministic (FM-A08):** Preserved. `src/attribution.ts` exact→suffix→ambiguous decline, validated 3→64 entries without wrong-file match. **No regression.**
- **Schema 0.2:** Frozen. All engine JSON `schemaVersion: "0.2"` validated; `docs/contracts/evidence-contract.md` Version 0.2.0 FROZEN (WP5.6 at 21daa57, F-03 additive compatible). **No drift.**
- **Threshold 30/15:** Frozen. `docs/contracts/evidence-contract.md:38` + `src/rules.ts` default 30, all threshold addenda R1–R8 state unchanged. **No drift.**
- **CLI and JSON semantics consistent:** Preserved. `src/cli.ts` check --json --coverage-file --crap-threshold --base, exit 0 PASS / 1 WARN/FAILED, verified in 25+4 tests. **No regression.**
- **WP9 fixes still present:** F-03 (normalizeCoveragePaths), F-04 docs (§Test-File Function Discovery), D-APOLLO re-clone report, CLI unit/integration/real-git tests all present (178 tests). **No regression.**

**If any anchor failed, WP9 would be BLOCKED — none failed.**

---

## 20. Current Test / Build State (verified, not assumed)

- **TypeScript:** `npx tsc --noEmit` → 0 errors (TSC_EXIT 0)
- **Build:** `npm run build` (tsc) → success, `dist/cli.js` 6096 bytes (BUILD_EXIT 0)
- **Tests:** `npx vitest run --no-coverage` → **59 test files, 178 tests passed, 0 failed, 0 skipped**, Duration 3.62s (transform 1.12s, import 13.59s, tests 14.12s)
- **Breakdown delta:** 149 → 166 (R1) → 174 (R2–4) → 178 (R5–8) — stable since R5 real-git, no flake observed.
- **Lint:** No separate lint beyond tsc; `eslint.config.js` present but not gated in reports — not relevant to closure.
- **Exact output tails:** Test Files 59 passed, Tests 178 passed verified 2026-08-30 09:36 UTC.

---

## 21. Current Git State

- **Branch:** `main`
- **Commit:** `2972e5e docs: update OPENCODE_START_HERE — round5 complete 178 pass real-git` (HEAD)
- **Staged:** `OPENCODE_START_HERE.md` (modified), `experiments/wp9-hardening-round8/repro-history-delta.md` (new), `experiments/wp9-hardening-round8/wp9-hardening-round8-report.md` (new) — 3 files, 124 insertions/7 deletions, `git diff --cached --stat` shows these only.
- **Untracked (others, exclude-standard):**
  - `.opencode/plans/2026-08-30T03:06:43Z-wp9-hardening-round7-monorepo-boundary.md` (plan, approved:true)
  - `.opencode/plans/2026-08-30T04:00:00Z-wp9-hardening-round6-tsdoc-provider.md` (plan, approved:true)
  - `.opencode/plans/2026-08-30T15:41:21Z-wp9-hardening-round8-history-delta.md` (plan, approved:true)
  - `docs/Project Master Plans/SESSION_CONTEXT_2026-08-26.txt` (context restoration, not in git)
  - `experiments/wp9-hardening-round6/*` (evidence/tsdoc-genuine.json 1131 bytes, repro-tsdoc-genuine.md, threshold-addendum-round6.md, wp9-hardening-round6-report.md) — untracked but evidence for R6
  - `experiments/wp9-hardening-round7/evidence/full-union-coverage.json` 1621110 bytes + repro.md + threshold-addendum-round7.md + report.md — untracked R7
  - `experiments/wp9-hardening-round8/evidence/*` 4 files (2×1621110 coverage + 7598/1714 engine) — untracked R8 evidence
  - `experiments/wp9-hardening-round8/threshold-addendum-round8.md` — untracked R8 addendum
- **Classification:**
  - Staged docs: **legitimate** (R8 completion docs, per task reversible).
  - Untracked evidence/plans: **legitimate experimental artifacts**, not yet committed — expected for staged hardening rounds. Should be added before final WP9 close commit; `graphify-out/GRAPH_REPORT.md` built from 2972e5e so graph labels stale for these untracked files (expected, update after commit).
  - No unexpected modifications to `src/` or `dist/` — confirms "no src modifications" claim for R6–8.
  - No unrelated work detected.
- **Graph freshness:** Built from 2972e5e, current HEAD same, staged docs not in graph yet — `graphify update .` recommended after commit.

---

## 22. Documentation Reconciliation (drift search)

Search across `OPENCODE_START_HERE.md`, `PROJECT_STATUS.md`, `docs/contracts/evidence-contract.md`, `experiments/wp9*/**`, `experiments/wp9-hardening*/*`, `threshold-addendum*`, `repro*.md`:

- **OPENCODE_START_HERE.md:** Current Step correctly states "WP9 Hardening Round 8 — COMPLETE … history/delta 2-point … coverage fallback … due to Rush Node 24 incompatibility, complexity delta real, schema 0.2 frozen, threshold 30/15 frozen, reviewer ACCEPTED, security PASS, Human gate pending." — **No drift**, correctly characterizes partial.
- **PROJECT_STATUS.md:** Still at "WP5.6 DONE / ACCEPTED 2026-08-27, Next work package WP6" — **stale** relative to WP9 progress. Needs update to reflect WP9 through R8 complete awaiting human review (or keep as historical WP5 snapshot? But drift vs OPENCODE_START_HERE which is source of truth for Next Step). Recommend updating Current State section or adding WP9 handoff note.
- **Round 8 docs:** `repro-history-delta.md` and `wp9-hardening-round8-report.md` correctly note "Coverage files are the full union from Round7 (not per-commit)" and "Coverage generation blocked by Rush Node version … Fallback full-union … so coverage delta is not per-commit real. Complexity delta is real." — **No drift**, honest.
- **Threshold addendum R8:** Correctly states "Threshold remains 30/15, Schema remains 0.2, No changes" — **no drift**.
- **Potential drift risk:** If any future doc were to claim "historical coverage validation completed" without qualifier, would be drift. Current R8 report does NOT make that claim — it says "History/delta trend validated — … coverage fallback limitation documented". **No silent correction needed**, but guardrail: keep phrasing "PARTIAL HISTORICAL/DELTA VALIDATION — REAL COMPLEXITY DELTA, REUSED COVERAGE" in closure docs.
- **Node runtime constraint docs:** `repro-history-delta.md` lists `Error: Node.js version 24.18.1 not supported by rush.json (requires >=16.13.0 <17.0.0 || >=18.15.0 <19.0.0 || >=20.9.0 <21.0.0)` — **present**, good. Should also note compatible env recipe (nvm 20.9/container) in closure assessment or future reproducibility guide.
- **Provider diversity docs:** `wp9-hardening-round6-report.md` correctly n=3, `round7` correctly says "no new provider", `round8` does not inflate count — **no drift**.
- **Monorepo claims:** R7 report correctly scopes "validated for Jest/v8 Rush variant at 1.6M scale — cheap proof that engine is not single-package-only" and limitations list "only one monorepo" — **no drift** toward universal.
- **Reproducibility:** Add note that historical Rush coverage requires Node 20.9/18.15/16.13 — currently only in repro, not in master docs. Recommend adding to `docs/implementation` or closure doc via §14 recipe.
- **Evidence artifacts provenance:** All reports list engine commit, Node, base/head SHAs, sizes — **consistent**.

**Required doc corrections before WP9 close commit:**
1. Update `PROJECT_STATUS.md` Current State / Next work package to reflect WP9 through R8 (or add WP9 section — currently stops at WP5.6).
2. Commit untracked evidence/plans from R6–8 (or explicitly keep as `experiments/` evidence and add to git tracking per prior rounds).
3. After commit, run `graphify update .` to refresh `GRAPH_REPORT.md` from 2972e5e to new commit.
4. No threshold/schema/INV doc changes needed — already frozen.

---

## 23. Historical Experiment Immutability

Preserve Round 8 as **PARTIAL HISTORICAL/DELTA VALIDATION** with **REAL COMPLEXITY DELTA but NON-HISTORICAL/REUSED COVERAGE EVIDENCE**.

Do not retroactively convert R8 into "fully successful historical coverage experiment" even though PASS/WARN results are attractive. The 4 evidence files remain as generated:

- `00203d4-coverage.json` 1621110 bytes 64 entries (identical to `full-union-coverage.json`)
- `00203d4-engine.json` 7598 bytes 11 funcs PASS/INCOMPLETE
- `e11ec0b-coverage.json` 1621110 bytes 64 entries (identical)
- `e11ec0b-engine.json` 1714 bytes 2 funcs WARN/COMPLETE

If future compatible-env rerun (Node 20.9) succeeds, create new round/addendum `wp9-hardening-round8-addendum-fresh` with 2 fresh files (`*-coverage-fresh.json` + `*-engine-fresh.json`), compare against R8, do not overwrite R8 evidence. Provenance of reused coverage must stay visible in git history.

---

## 24. Final Gate

**WP9 READY FOR CLOSURE**

**Conditions for closure (all met under scoped claims):**

- 178/178 tests pass, tsc 0, build ok, schema 0.2 frozen, threshold 30/15 frozen, INV-01..04 preserved — verified.
- Provider diversity n=3 validated across fresh artifacts, monorepo boundary 55× validated, historical complexity + gate trend demonstrated (partial coverage limitation explicitly documented and acceptable per deferred historical hypothesis).
- No defect blocking (A) — Node/Rush mismatch is env limitation (B/E), not engine defect.
- Remaining uncertainties are acceptable limitations (C) or future enhancements (D), not material blockers for intended claims.
- Human gate pending human review of evidence packet (per WP5.6 pattern, end with `AWAITING HUMAN REVIEW`).

**If human review requires historical coverage claim, then:** **WP9 NOT READY FOR CLOSURE — ONE SPECIFIC EXPERIMENT REQUIRED — Fresh Historical Per-Commit Coverage Rerun (Node 20.9) as defined in §14** — stop at approval gate, do not implement without explicit approval.

---

```text
AWAITING HUMAN REVIEW
```

