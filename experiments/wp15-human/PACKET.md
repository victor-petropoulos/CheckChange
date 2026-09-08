# WP15 Human-Usefulness Review Packet

**Created**: 2026-09-08T16:09:32Z  
**Status**: ACCEPTED — all 5 cases accepted solo reviewer 2026-09-08. Gate: CONTINUE.  
**Scope**: WP14 delta pair + 3 WP5.6 re-executable pipeline cases — no autonomous classification

---

## WP14 Delta Table (Commit A / Commit B)

| Commit | Gate | Max CRAP | CC (warn fn) | Coverage (warn fn) | Focus Function | Schema |
|--------|------|----------|--------------|-------------------|----------------|--------|
| A (`00203d4`) | **WARN** | 54.67 | 12 | 33.33% (branch) | `ConfigCache.getForSourceFile` (ConfigCache.ts:39-111) | 0.3 |
| B (`e11ec0b`) | **WARN** | 116.98 | 12 | 10% (branch) | `getRootDirectoryFromContext` (index.ts:24-42) | 0.3 |

**Engine**: `@barney-media/crap-typescript-core@0.5.0`  
**Thresholds**: 30 (frozen)  
**Provenance**: Fresh per-commit coverage (worktrees `/tmp/wp14-A`, `/tmp/wp14-B`), Node 20.10.0, `heft test` separate runs  
**Source**: `experiments/wp14/commit-A.json`, `experiments/wp14/commit-B.json`, `experiments/wp14/WP14_RESULTS.md`

---

## WP5.6 Re-Executable Cases (3 Selected)

### Case 1: `sup-a` — WARN at T15 & T30

| Field | Value |
|-------|-------|
| **Repo** | `sup-a` (internal) |
| **Base SHA** | `5e8a31709b28dbebf2f2f8f1a3063250ec799b74` |
| **Thresholds Tested** | 15, 30 |
| **Gate (T15)** | WARN |
| **Gate (T30)** | WARN |
| **Changed Functions** | 80+ (see pipeline-runs) |
| **Focus Function** | `normalizeRouteRules` (normalize.ts:21-136) |
| **Focus CC** | 36 |
| **Focus Coverage** | 100% (stmt) |
| **Focus CRAP** | 36 (T15 & T30) |
| **Completeness** | COMPLETE |
| **Schema** | 0.2 |
| **Source Files** | `sup-a-threshold-15.json`, `sup-a-threshold-30.json` |

| Reviewer Field | Entry |
|----------------|-------|
| **noticeRank** (1-5) |  |
| **testsToAdd** (count) |  |
| **timeSpentMin** |  |
| **confidenceDelta** (-5..+5) |  |
| **fpBurden** (none/low/medium/high) |  |

---

### Case 2: `hono-03` — PASS at T30, INCOMPLETE

| Field | Value |
|-------|-------|
| **Repo** | `hono-03` (hono csrf middleware) |
| **Base SHA** | `d9f7b99c519602d6f0664514a42b1bbc6ef57206` |
| **Thresholds Tested** | 15, 30 |
| **Gate (T15)** | PASS |
| **Gate (T30)** | PASS |
| **Changed Functions** | 4 src + 2 test (skipped) |
| **Max CC (src)** | 3 (`csrf`) |
| **Max CRAP (src)** | 3 |
| **Coverage (src)** | 100% (stmt) |
| **Test Functions Skipped** | 2 (`buildSimplePostRequestData`, `secFetchSite` in `.test.ts`) — INV-04 |
| **Completeness** | INCOMPLETE |
| **Schema** | 0.2 |
| **Source Files** | `hono-03-threshold-15.json`, `hono-03-threshold-30.json` |

| Reviewer Field | Entry |
|----------------|-------|
| **noticeRank** (1-5) |  |
| **testsToAdd** (count) |  |
| **timeSpentMin** |  |
| **confidenceDelta** (-5..+5) |  |
| **fpBurden** (none/low/medium/high) |  |

---

### Case 3: `hono-01` — PASS at T30, Zero Changed Functions

| Field | Value |
|-------|-------|
| **Repo** | `hono-01` (hono cors test/data only) |
| **Base SHA** | `5bfbff8acf54395174d54c65ad8d796493c2b7ea` |
| **Thresholds Tested** | 15, 30 |
| **Gate (T15)** | PASS |
| **Gate (T30)** | PASS |
| **Changed Functions** | 0 (empty array) |
| **Rule Results** | 0 (empty array) |
| **Completeness** | COMPLETE |
| **Edge Case** | CORS test/data only — no production code changes detected |
| **Schema** | 0.2 |
| **Source Files** | `hono-01-threshold-15.json`, `hono-01-threshold-30.json` |

| Reviewer Field | Entry |
|----------------|-------|
| **noticeRank** (1-5) |  |
| **testsToAdd** (count) |  |
| **timeSpentMin** |  |
| **confidenceDelta** (-5..+5) |  |
| **fpBurden** (none/low/medium/high) |  |

---

## Reviewer Instructions

Per-case decision (no composite scores, no CRAP-as-probability):

1. **noticeRank** — How prominently does WARN/PASS surface? (1 = buried, 5 = impossible to miss)
2. **testsToAdd** — How many tests would you add after seeing this output?
3. **timeSpentMin** — Actual review time for this case (minutes)
4. **confidenceDelta** — Pre-review → post-review confidence shift (-5 to +5)
5. **fpBurden** — Perceived false-positive load: none / low / medium / high

**Guardrails** (must not change):
- Thresholds 30/15 frozen
- `src/crapCalc.ts` untouched
- INV-01..04 preserved
- Schema 0.4 frozen (for WP15 run)

---

## Footer

**ACCEPTED — all 5 cases accepted by solo reviewer 2026-09-08. Gate: CONTINUE.**

No verdict columns. Fill per-case fields above. Packet complete when all 5 cases have reviewer entries.