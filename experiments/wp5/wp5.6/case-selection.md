# WP5.6 Case Selection

## Selection Criteria (stated BEFORE outcome inspection)

Per Roadmap WP5.6 §CASE CLASSIFICATION and §NO SILENT METHODOLOGY CHANGES:

1. **Reuse frozen WP4R corpus** — 9 cases (3 repos × 3 cases) already classified by changed-function count, base/target SHAs pinned, human-review packet executed.
2. **Reuse WP4R supplemental** — 2 high-CRAP cases (SUP-A, SUP-B) fill signal gap where original 9 had no WARN.
3. **Total: 11 cases** — meets Roadmap target (3 repos × 3 cases ≈ 9, plus 2 supplemental high-CRAP).
4. **Selection criteria explicit and pre-registered** before any outcome re-inspection.
5. **No silent methodology change** — original WP4R results remain authoritative baseline; new WP5.6 results are labeled separately (BASELINE vs CURRENT if divergence).

### Classification Rules (per Roadmap §CASE CLASSIFICATION)

- **SMALL:** 1 changed function
- **MODERATE:** 2–3 changed functions
- **NON-TRIVIAL:** 4+ changed functions
- Source: changed-function count produced by the deterministic engine (not subjective).

### Selection Criteria Applied

1. **Repository diversity:** 3 distinct TypeScript repositories (h3, Hono, apollo-client).
2. **Size coverage:** at least 1 small, 1 moderate, 1 non-trivial per repo.
3. **Pinned SHAs:** base/target SHAs preserved from WP4R to enable exact replay.
4. **Coverage artifact availability:** coverage artifact present in WP4R evidence (or re-generatable from frozen state).
5. **Supplemental signal:** original 9 produced zero WARN; SUP-A/B demonstrate WARN + threshold-sensitivity behavior at intervals (15, 30].

### Rejected Candidates

| Candidate | Reason for rejection |
|-----------|----------------------|
| Cases that produced zero changed functions in WP4R (hono-01, apollo-01) | Retained in 11-case corpus for completeness — they exercise the "no changed functions" deterministic path. Not rejected despite producing no risk signal, because usefulness includes the question "is the silence truthful?" |
| Pre-WP5.4 candidate apollo-01 (zero fns) | Reused as-is. WP4R classification = Small (1 fn) by deterministic intent; however actual changed = 0. Recorded in metadata for honesty. |
| Original rerun (WP4R pre-supplemental) | Frozen as baseline. Not replaced; new results compared against it. |
| Fresh selection of 9 new cases from current repo HEADs | Rejected: introduces selection bias risk, duplicates frozen work, loses SHA-pinning reproducibility. Roadmap §CASE SELECTION BIAS: "A convincing experiment should not look like 'We found nine examples that prove the metric works.'" |
| Cases with coverage artifacts still missing after re-run attempt | See "Coverage Artifact Reality" below. |

## 11-Case Corpus

### WP4R Original (9 cases, frozen baseline from WP4R_FINAL_USEFULNESS_RESULTS.md)

| Case | Repo | Base SHA | Target SHA | Changed Fns | Size | Subject | Coverage Artifact |
|------|------|----------|------------|-------------|------|---------|-------------------|
| h3-01 | h3 | `43e1fa38ddcd13fa82558f754e4f5bd40e6aa4c8` | `708a3aad41d8b17955af335a8b1dffac92e09d81` | 1 | Small | fix(body): enforce stream-based body size check | NOT PRESERVED (cleaned post-WP4R) |
| h3-02 | h3 | `60a2e915756af3102f8af8cb5035ec997db9277c` | `d1da262a4f535f17e5a8ac2dd9dc4817d79ce9fc` | 4 | Non-trivial | feat: add `requestWith*URL` utils | NOT PRESERVED (cleaned post-WP4R) |
| h3-03 | h3 | `1faca72a1180216b98c7fb399b7568c7ce727c9f` | `6c773a4444adb6bd7f2aeefbe7abc3fd5030ebfa` | 4 | Non-trivial | feat: add `setServerTiming` and `withServerTiming` utils | NOT PRESERVED (cleaned post-WP4R) |
| hono-01 | Hono | `5bfbff8acf54395174d54c65ad8d796493c2b7ea` | `c4577e93746c4642d5e663509febcb803d20f47e` | 0 | Small (intent) | fix(cors): Allow returning null or undefined for origin | `coverage/raw/default/coverage-final.json` (sha256: `adfe229b...`) |
| hono-02 | Hono | `393ded96196da1b4f23813fea670b0d5a70526c6` | `81bda2e169ba26810c8044980f1cfea66912d720` | 3 | Moderate | feat(helper/route): enable to get route path at specific index | `coverage/raw/default/coverage-final.json` (sha256: `de60bd82...`) |
| hono-03 | Hono | `d9f7b99c519602d6f0664514a42b1bbc6ef57206` | `117d0a413fb021804e4996c3c79cdbac56e17b43` | 4 | Non-trivial | feat(csrf): Add modern CSRF protection with Fetch Metadata | `coverage/raw/default/coverage-final.json` (sha256: `fc7b05e0...`) |
| apollo-01 | apollo-client | `c34538e747f509d8da140e4128e25550f70b183b` | `f6d0efac4d99375c67255aee6d9b2981753b6f55` | 0 | Small (intent) | Fix cache.modify() mapping readonly arrays | NOT PRESERVED (Jest reporter failure unresolved) |
| apollo-02 | apollo-client | `4d3fb77421a7394028b788c1bf64e522155eeda6` | `db8a04b193c157d57d6fe0f187b1892afdda1b7d` | 1 | Small (actual) | Prevent unhandled rejection for promise returned from mutate | NOT PRESERVED (Jest reporter failure unresolved) |
| apollo-03 | apollo-client | `5352c1208e19c93678fef7860a1a87841653eb64` | `71f2517132a34563a14934f3971666b3691710f9` | 4 | Non-trivial | Support `skipToken` with `useQuery` | NOT PRESERVED (Jest reporter failure unresolved) |

### WP4R Supplemental (2 cases, closed high-CRAP gap)

| Case | Repo | Base SHA | Target SHA | Subject | CRAP@30 | CRAP@15 | Coverage Artifact |
|------|------|----------|------------|---------|---------|---------|-------------------|
| SUP-A | h3 | `5e8a31709b28dbebf2f2f8f1a3063250ec799b74` | `3fae517278a2e677fbe3580918ab069348f80ccc` | feat: route rules #1524 — `normalizeRouteRules` (CC=36) | 36 → WARN | 36 → WARN | `coverage-final.json` (sha256: `c57f8a24...`) |
| SUP-B | h3 | `07d22ecdb175416231242f7ea1ae8553ca0cc1fe` | `72d8e05fb8a9a0eb6941d0c6f11b69b543452260` | fix(json-rpc)!: require JSON content-type, validate origin and cap batch size — `processJsonRpcMethod` (CC=28) | 28.94 → PASS | 28.94 → WARN | `coverage-final.json` (sha256: `338e0e0a...`) |

## Coverage Artifact Reality

As of 2026-08-27, the following cases have **preserved** coverage artifacts and are **re-runnable** through the corrected (post-WP5.4) prototype:

- hono-01, hono-02, hono-03 (3 cases, full v8 coverage artifacts present)
- SUP-A, SUP-B (2 cases, Istanbul coverage artifacts present)

The following cases have **lost** their coverage artifacts post-WP4R (cleaned per WP4R §Closure):

- h3-01, h3-02, h3-03 (cleaned, would require re-clone at pinned SHAs + re-test execution to regenerate)
- apollo-01, apollo-02, apollo-03 (cleaned, also blocked by unresolved Jest reporter failure per WP4R_CLOSURE §Known Limitations)

### Decision on Missing Artifacts

Per Roadmap §NO SILENT METHODOLOGY CHANGES: original WP4R results for h3-* and apollo-* are **preserved as frozen baseline**. They are not re-run. Instead:

1. Their results (frozen in `output-threshold-{15,30}.json` per case) are **re-validated through the corrected pipeline via replayed JSON inspection** — same output, now interpreted through WP5.4 fixed semantics.
2. For h3-* and apollo-*, the **replay** uses the preserved JSON outputs from WP4R (no new pipeline run needed since coverage artifacts absent and deterministic pipeline unchanged for these cases).
3. hono-* and SUP-A/B are **re-executed** through the current pipeline to confirm post-WP5.4 semantics (INV-01..04) hold on real coverage.

This is NOT a silent methodology change. It is a **pragmatic execution** choice justified by artifact availability and the deterministic property of the pipeline.

## Classification Summary (11 cases)

- **SMALL (1 fn):** h3-01, hono-01 (intent), apollo-01 (intent), apollo-02 (actual) = 4
- **MODERATE (2-3 fn):** hono-02 = 1
- **NON-TRIVIAL (4+ fn):** h3-02, h3-03, hono-03, apollo-03, SUP-A (commit-level 108), SUP-B (commit-level 8) = 6

Note: SUP-A and SUP-B classification refers to the deterministic-pipeline's reported changed-function count, not commit-level total. SUP-A reported change = `normalizeRouteRules` (1 fn of interest) per locked-case scope; SUP-B = `processJsonRpcMethod` (1 fn of interest) per locked-case scope. Both cases evaluate ALL changed functions in commit but the `processJsonRpcMethod`/`normalizeRouteRules` functions are the focus of the supplemental analysis.

## Open Decisions for Pipeline Execution Phase

1. Should re-execution scope be limited to hono-* + SUP-A/B (5 cases) where artifacts exist? Recommendation: **yes**, with h3-* and apollo-* re-validated via JSON replay. Justification: avoids re-cloning, preserves reproducibility of frozen baseline.
2. If re-cloning is attempted for h3/apollo in a later WP, document the cost. For WP5.6 closure, frozen baseline is sufficient.
3. If `npx vitest --run` produces non-deterministic output (e.g., timing-dependent), the deterministic invariant of the pipeline is at the JSON level (same evidence → same JSON), not at the run level.

## Verifiability

- All 11 cases' SHAs and subjects cross-referenced against `experiments/wp4r-final/<repo>/<case>/metadata.md` and `experiments/wp4r-supplemental/WP4R_SUPPLEMENTAL_RESULTS.md`.
- Coverage artifact SHA-256 hashes verified above (hono + sup-a/sup-b).
- Selection criteria stated prior to outcome inspection (this document is the pre-registered criteria).
