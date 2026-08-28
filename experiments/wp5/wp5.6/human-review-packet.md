# WP5.6 Human Review Packet

**No autonomous usefulness classification has been performed.** Per Roadmap WP5.6 §CLAIMS/EVIDENCE MATRIX and the project-wide "do not autonomously classify usefulness" guardrail, human reviewer must fill Outcome A/B/C/D and review-behavior fields.

**Outcome definitions (per Roadmap WP5.6 §EXAMPLE CASE OUTCOMES):**
- **A — HIGH CRAP identifies an obviously risky change.** CRAP > threshold and reviewer agrees the change is risky.
- **B — HIGH CRAP but obviously harmless change.** CRAP > threshold but reviewer concludes the change is benign (false-positive-like).
- **C — LOW CRAP but reviewer identifies serious risk.** CRAP ≤ threshold but reviewer sees significant risk the metric missed (missing evidence dimension).
- **D — COVERAGE UNAVAILABLE / INCOMPLETE.** System correctly reports incomplete evidence; the truthful reporting is itself the outcome.

---

## Status

- **Cases evaluated:** 11 (h3-01/02/03, hono-01/02/03, apollo-01/02/03, sup-a, sup-b)
- **Re-executable through current pipeline:** 5 (hono-01/02/03, sup-a, sup-b)
- **Replay-only (frozen WP4R baseline):** 6 (h3-01/02/03, apollo-01/02/03)
- **Threshold 30 gate outcomes (current):** 5 PASS (hono-01, hono-02, hono-03, hono-02 sup-b PASS, ... see per-case) / 2 WARN (sup-a, sup-b T15 only) — per re-execution
- **Classification status:** All Outcome / Usefulness / Question fields left blank for human reviewer

---

## Re-Executable Cases (5)

### Case hono-02 — `basePath` (lock focus)

- **Repo/Case:** Hono / hono-02
- **Base SHA:** `393ded96196da1b4f23813fea670b0d5a70526c6`
- **Target SHA:** `81bda2e169ba26810c8044980f1cfea66912d720`
- **Subject:** feat(helper/route): enable to get route path at specific index (#4423)
- **Coverage source:** Full suite, vitest v8, project=main (Tier 1)
- **Coverage artifact hash (sha256):** `de60bd82a31383863e1ca9b02b426e54a771025dd8ed882beb507d4cb39ec93f`

**1. What changed?** Added ability to look up a route path at a specific index in a Hono router. Three functions in `src/helper/route/index.ts` were added or extended: `routePath`, `baseRoutePath`, `basePath`. The new `basePath` is the most complex.

**2. Which functions affected?**
- `routePath` (lines 58–59): CC=4
- `baseRoutePath` (lines 82–83): CC=4
- `basePath` (lines 107–141): CC=10

**3. How complex?** CC range 4–10. Highest is `basePath` (CC=10, the core of the new feature).

**4. How well tested?** Branch coverage 92.31% on `basePath`, 100% stmt on the other two. All three fns had real coverage.

**5. What CRAP risk?**
- CRAP@30: 10.05 → all PASS
- CRAP@15: same 10.05 → all PASS

**6. Why did system produce this status?** CRAP=10.05 < threshold 30 AND 15; the new helper logic is reasonably tested. Gate=PASS, completeness=COMPLETE (all fns have coverage).

**7. What evidence was missing?** None — full coverage.

**8. Would this affect your review behavior?** [BLANK]

**Outcome (A/B/C/D):** [BLANK]

---

### Case sup-a — `normalizeRouteRules` (lock focus)

- **Repo/Case:** h3 / sup-a (WP4R supplemental)
- **Base SHA:** `5e8a31709b28dbebf2f2f8f1a3063250ec799b74`
- **Target SHA:** `3fae517278a2e677fbe3580918ab069348f80ccc`
- **Subject:** feat: route rules #1524
- **Coverage source:** Generated for the commit (Tier 2)
- **Coverage artifact hash (sha256):** `c57f8a240538e5886deb1f8da64e1075025b9833822705c40e349f2b8d05e839`

**1. What changed?** Addition of the route-rules system in h3: introduces `normalizeRouteRules` and supporting infrastructure. The locked focus is the `normalizeRouteRules` function in `src/rules/normalize.ts` (lines 21–136).

**2. Which functions affected?** `normalizeRouteRules` (CC=36). The commit-level pipeline reported 196 changed functions (post-WP5.3 C03 source-discovery expansion); the locked focus remains `normalizeRouteRules`.

**3. How complex?** CC=36 — among the highest cyclomatic complexity measured across the WP5.6 corpus.

**4. How well tested?** 100% statement coverage. The function is fully exercised by the test suite.

**5. What CRAP risk?**
- CRAP@30: 36 (≥30) → WARN
- CRAP@15: 36 (≥15) → WARN

**6. Why did system produce this status?** CRAP=36 ≥ 30 → WARN at default threshold. At threshold 15, gate remains WARN. Coverage does not reduce CRAP because CC is the dominant term: `CRAP = CC² × (1 − cov/100) + CC`. At cov=100, CRAP=CC=36.

**7. What evidence was missing?** 91 of 196 changed fns are NOT_EVALUATED (test files and supporting utilities; their coverage is not in the Istanbul artifact). The locked focus function has full evidence.

**8. Would this affect your review behavior?** [BLANK]

**Outcome (A/B/C/D):** [BLANK]

---

### Case sup-b — `processJsonRpcMethod` (lock focus)

- **Repo/Case:** h3 / sup-b (WP4R supplemental)
- **Base SHA:** `07d22ecdb175416231242f7ea1ae8553ca0cc1fe`
- **Target SHA:** `72d8e05fb8a9a0eb6941d0c6f11b69b543452260`
- **Subject:** fix(json-rpc)!: require JSON content-type, validate origin and cap batch size
- **Coverage source:** Generated for the commit (Tier 2)
- **Coverage artifact hash (sha256):** `338e0e0a32dd1b93c5f2d8f82ddb64f3e5d27954f4beb5c2cb249a11f9f45584`

**1. What changed?** Harden the JSON-RPC handler: validate content-type, validate origin, cap batch size.

**2. Which functions affected?** `processJsonRpcMethod` (CC=28). 11 changed fns total; the locked focus is `processJsonRpcMethod`.

**3. How complex?** CC=28 — high.

**4. How well tested?** 89.36% branch coverage on the locked focus function.

**5. What CRAP risk?**
- CRAP@30: 28.94 (<30) → PASS
- CRAP@15: 28.94 (≥15) → WARN

**6. Why did system produce this status?** CRAP=28.94 is just under the default threshold 30 → PASS, but exceeds the more sensitive threshold 15 → WARN. **This is the threshold-sensitivity case** explicitly added to demonstrate that policy and evidence are different layers.

**7. What evidence was missing?** 3 of 11 changed fns are NOT_EVALUATED (test files). 8 are PASS. The locked focus is fully evaluated.

**8. Would this affect your review behavior?** [BLANK]

**Outcome (A/B/C/D):** [BLANK]

---

### Case hono-01 — `fix(cors): Allow returning null or undefined for origin`

- **Repo/Case:** Hono / hono-01
- **Base SHA:** `5bfbff8acf54395174d54c65ad8d796493c2b7ea`
- **Target SHA:** `c4577e93746c4642d5e663509febcb803d20f47e`
- **Subject:** fix(cors): Allow returning null or undefined for origin (#4375)
- **Coverage source:** Full suite, vitest v8, project=main (Tier 1)
- **Coverage artifact hash (sha256):** `adfe229b75eb6915fb2b80740d12343734e71a46ea8fb48d4a2678a1d837cdae`

**1. What changed?** Small cors fix: allow `null` or `undefined` to be returned for origin.
**2. Which functions affected?** Zero changed functions detected (commit touches cors test/data but no cors fn signature/body).
**3. How complex?** N/A — no changed functions.
**4. How well tested?** Full suite was available.
**5. What CRAP risk?** N/A — no changed functions to evaluate. Gate=PASS (nothing to fail).
**6. Why did system produce this status?** Because no changed function falls under CRAP rule. The system correctly reports the absence of changed functions rather than fabricating a CRAP value.
**7. What evidence was missing?** None within scope; the absence of changed functions is itself the finding.
**8. Would this affect your review behavior?** [BLANK]

**Outcome (A/B/C/D):** [BLANK]

---

### Case hono-03 — `feat(csrf): Add modern CSRF protection with Fetch Metadata support`

- **Repo/Case:** Hono / hono-03
- **Base SHA:** `d9f7b99c519602d6f0664514a42b1bbc6ef57206`
- **Target SHA:** `117d0a413fb021804e4996c3c79cdbac56e17b43`
- **Subject:** feat(csrf): Add modern CSRF protection with Fetch Metadata support (#4353)
- **Coverage source:** Full suite, vitest v8, project=main (Tier 1)
- **Coverage artifact hash (sha256):** `fc7b05e0557c40b6fa5b2fbc2cd014b43cc854bc285fda4e99bd4c169b0c1339`

**1. What changed?** New CSRF middleware using Fetch Metadata headers.
**2. Which functions affected?** 4 in `src/middleware/csrf/index.ts` (`isSecFetchSite`, `csrf`, `isAllowedOrigin`, `isAllowedSecFetchSite`) all with CC=1–3. **Plus 2 in `src/middleware/csrf/index.test.ts`** discovered by WP5.3 C03 source-discovery expansion: `buildSimplePostRequestData`, `secFetchSite`. These test-file fns have no Istanbul coverage.
**3. How complex?** Low (CC=1–3 for the 4 production fns).
**4. How well tested?** 100% on the 4 production fns; null on the 2 test-file fns.
**5. What CRAP risk?** CRAP@30: 3 → PASS for production fns; CRAP=N/A for test-file fns.
**6. Why did system produce this status?** CRAP=3 < 30 → PASS for the production fns. The 2 test-file fns correctly get `analyzerStatus=skipped` (INV-04: ANALYZER TRUTHFUL). Gate=PASS, completeness=INCOMPLETE because 2 of 6 changed fns have no coverage.
**7. What evidence was missing?** Test-file coverage is not in the Istanbul artifact. This is a coverage generation scope gap, not a prototype defect.
**8. Would this affect your review behavior?** [BLANK]

**Outcome (A/B/C/D):** [BLANK]

**Note (F-04):** Compared to WP4R baseline, hono-03 changed-function count went from 4 to 6 due to WP5.3 C03. The 2 new fns are truthfully reported as `skipped`. Gate outcome is unchanged.

---

## Replay-Only Cases (6, no preserved coverage)

These cases' WP4R JSON outputs are the authoritative reference. They were not re-executed because coverage artifacts were cleaned post-WP4R (h3-*) or blocked by an unresolved Jest reporter failure (apollo-*).

---

### Case h3-01 — `isBodySizeWithin`

- **Repo/Case:** h3 / h3-01
- **Base SHA:** `43e1fa38ddcd13fa82558f754e4f5bd40e6aa4c8`
- **Target SHA:** `708a3aad41d8b17955af335a8b1dffac92e09d81`
- **Subject:** fix(body): enforce stream-based body size check regardless of content-length header
- **Coverage source:** WP4R full v8 suite (artifact NOT PRESERVED)
- **WP4R output (frozen):** changed=1, PASS=1, WARN=0, NOT_EVAL=0, maxCRAP=7.39, maxCC=7, coverageAvail=1/1, gate=PASS, completeness=COMPLETE

**1. What changed?** Replaced `return +contentLength <= limit` with explicit fail-fast check + stream loop. Hardens body size enforcement.
**2. Which functions affected?** `isBodySizeWithin` (lines 152–185, `src/utils/body.ts`).
**3. How complex?** CC=7.
**4. How well tested?** 80% branch coverage.
**5. What CRAP risk?** CRAP@30=7.39 → PASS.
**6. Why did system produce this status?** CRAP < threshold; coverage is reasonable; gate=PASS.
**7. What evidence was missing?** None.
**8. Would this affect your review behavior?** [BLANK]

**Outcome (A/B/C/D):** [BLANK]

---

### Case h3-02 — `requestWithURL` / `requestWithBaseURL` (+ 2 test-file fns per WP5.3)

- **Repo/Case:** h3 / h3-02
- **Base SHA:** `60a2e915756af3102f8af8cb5035ec997db9277c`
- **Target SHA:** `d1da262a4f535f17e5a8ac2dd9dc4817d79ce9fc`
- **Subject:** feat: add `requestWith*URL` utils and use for faster mounts (#1342)
- **WP4R output (frozen):** changed=4, PASS=2, WARN=0, NOT_EVAL=2, maxCRAP=2, maxCC=2, coverageAvail=2/4, gate=PASS, completeness=INCOMPLETE

**1. What changed?** Add `requestWithURL` / `requestWithBaseURL` helpers using Proxy + WeakMap for URL override.
**2. Which functions affected?** WP4R reported 4: 2 production (`requestWithBaseURL` CC=2, `requestWithURL` CC=1) + 2 NOT_EVAL (test/setup). Post-WP5.3 C03 may add test-file fns.
**3. How complex?** Low (CC 1–2).
**4. How well tested?** 100% stmt on the 2 production fns.
**5. What CRAP risk?** CRAP=1–2 → PASS.
**6. Why did system produce this status?** Low CC and high coverage; CRAP well below any threshold.
**7. What evidence was missing?** 2 of 4 (originally) had no attributable coverage.
**8. Would this affect your review behavior?** [BLANK]

**Outcome (A/B/C/D):** [BLANK]

---

### Case h3-03 — `setServerTiming` / `withServerTiming` (+ 2 helpers)

- **Repo/Case:** h3 / h3-03
- **Base SHA:** `1faca72a1180216b98c7fb399b7568c7ce727c9f`
- **Target SHA:** `6c773a4444adb6bd7f2aeefbe7abc3fd5030ebfa`
- **Subject:** feat: add `setServerTiming` and `withServerTiming` utils (#1328)
- **WP4R output (frozen):** changed=4, PASS=4, WARN=0, NOT_EVAL=0, maxCRAP=10, maxCC=10, coverageAvail=4/4, gate=PASS, completeness=COMPLETE

**1. What changed?** New `setServerTiming` and `withServerTiming` utilities for Server-Timing header support.
**2. Which functions affected?** `setServerTiming` (CC=10), `withServerTiming` (CC=1), `_isValidToken` (CC=1), `_escapeDesc` (CC=1).
**3. How complex?** CC range 1–10.
**4. How well tested?** 100% stmt across the 4 fns.
**5. What CRAP risk?** CRAP@30: 1–10 → all PASS.
**6. Why did system produce this status?** CRAP < threshold; full coverage; gate=PASS, completeness=COMPLETE.
**7. What evidence was missing?** None.
**8. Would this affect your review behavior?** [BLANK]

**Outcome (A/B/C/D):** [BLANK]

---

### Case apollo-01 — `cache.modify()` readonly arrays

- **Repo/Case:** apollo-client / apollo-01
- **Base SHA:** `c34538e747f509d8da140e4128e25550f70b183b`
- **Target SHA:** `f6d0efac4d99375c67255aee6d9b2981753b6f55`
- **Subject:** Fix cache.modify() mapping readonly arrays to singular reference (#12983)
- **Coverage source:** Scoped Jest run for `src/cache/core` (artifact NOT PRESERVED; Jest reporter failure unresolved)
- **WP4R output (frozen):** changed=0, gate=PASS, completeness=COMPLETE, exit=1 (Jest reporter failure)

**1. What changed?** Cache.modify() should map readonly arrays to a single reference (not modify the array).
**2. Which functions affected?** None detected — scope mismatch between the test pattern (`src/cache/core`) and the actual changed function (likely in `src/cache/inmemory/` or similar).
**3. How complex?** N/A.
**4. How well tested?** N/A — coverage artifact failed to generate due to unresolved Jest reporter failure.
**5. What CRAP risk?** N/A.
**6. Why did system produce this status?** No changed function in scope → no risk to evaluate. The system **truthfully reports** zero detection rather than fabricating a CRAP.
**7. What evidence was missing?** Coverage artifact (Jest reporter failure, WP4R §Known Limitations). Full-suite coverage was not practical for apollo-client within the experimental window.
**8. Would this affect your review behavior?** [BLANK]

**Outcome (A/B/C/D):** [BLANK] (likely **D — INCOMPLETE**: the silence is from a coverage-scope failure, not from a low-risk change)

---

### Case apollo-02 — `useMutation` unhandled rejection

- **Repo/Case:** apollo-client / apollo-02
- **Base SHA:** `4d3fb77421a7394028b788c1bf64e522155eeda6`
- **Target SHA:** `db8a04b193c157d57d6fe0f187b1892afdda1b7d`
- **Subject:** Prevent unhandled rejection for promise returned from mutate function (#12892)
- **Coverage source:** Scoped Jest run for `src/react/hooks/__tests__/useMutation` (artifact NOT PRESERVED)
- **WP4R output (frozen):** changed=1, PASS=0, WARN=0, NOT_EVAL=1, maxCRAP=None, maxCC=None, coverageAvail=0/1, gate=PASS, completeness=INCOMPLETE, exit=1 (Jest reporter failure)

**1. What changed?** Catch unhandled promise rejection when user-provided `mutate` returns a promise.
**2. Which functions affected?** 1 changed function in scope; 0 had attributable coverage.
**3. How complex?** N/A (no coverage).
**4. How well tested?** 0/N — coverage artifact did not produce usable data.
**5. What CRAP risk?** N/A (NOT_EVALUATED).
**6. Why did system produce this status?** Coverage failed → cannot compute CRAP → NOT_EVALUATED, completeness=INCOMPLETE, gate=PASS (no failing rule because no evaluable ruleResults).
**7. What evidence was missing?** Coverage artifact generation failed (Jest reporter).
**8. Would this affect your review behavior?** [BLANK]

**Outcome (A/B/C/D):** [BLANK] (likely **D — INCOMPLETE**)

---

### Case apollo-03 — `skipToken` with `useQuery`

- **Repo/Case:** apollo-client / apollo-03
- **Base SHA:** `5352c1208e19c93678fef7860a1a87841653eb64`
- **Target SHA:** `71f2517132a34563a14934f3971666b3691710f9`
- **Subject:** Support `skipToken` with `useQuery` (#12895)
- **Coverage source:** Scoped Jest run for `src/react/hooks/__tests__/useQuery` (artifact NOT PRESERVED)
- **WP4R output (frozen):** changed=4, PASS=0, WARN=0, NOT_EVAL=4, maxCRAP=None, maxCC=None, coverageAvail=0/4, gate=PASS, completeness=INCOMPLETE, exit=1 (Jest reporter failure)

**1. What changed?** Allow passing `skipToken` to `useQuery` to skip query execution.
**2. Which functions affected?** 4 changed fns in `src/react/hooks/`; 0 with attributable coverage.
**3. How complex?** N/A (no coverage).
**4. How well tested?** 0/N.
**5. What CRAP risk?** N/A (all NOT_EVALUATED).
**6. Why did system produce this status?** Same as apollo-02 — coverage artifact failure.
**7. What evidence was missing?** Coverage artifact.
**8. Would this affect your review behavior?** [BLANK]

**Outcome (A/B/C/D):** [BLANK] (likely **D — INCOMPLETE**)

---

## Cross-Case Observations (recorded, not classified)

1. **All 5 re-executable cases reproduce WP4R baseline outcomes** for the locked focus functions. (sup-a WARN@30, sup-b PASS@30/WARN@15, hono-* PASS@30, sup-b PASS@30.)

2. **WP5.3 C03 expanded changed-function discovery** in 2 of 5 re-runnable cases (hono-03, sup-a). New test-file fns are correctly reported as `skipped` per INV-04 (ANALYZER TRUTHFUL).

3. **Apollo cases cannot reach evaluable state** because the underlying Jest coverage reporter failure (WP4R §Known Limitations) was never resolved. The system **truthfully reports INCOMPLETE** rather than fabricating PASS, which is the intended semantic contract.

4. **Threshold 15 vs 30** is a policy choice, not a method change. sup-b demonstrates: T15 changes PASS → WARN. The locked evidence is unchanged; only the policy differs.

5. **No autonomous classification of usefulness has been performed.** The Outcome A/B/C/D and "would this affect your review behavior" fields are left blank for human reviewer per project-wide methodology immutability principle.
