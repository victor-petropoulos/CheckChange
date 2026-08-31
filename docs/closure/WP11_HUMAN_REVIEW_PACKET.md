# WP11 Human Review Packet

**Date:** 2026-08-30
**Status:** WP11 PRODUCTION EVIDENCE CONTRACT COMPLETE — AWAITING HUMAN REVIEW

**Engine Baseline:** Node 24.18.1, schema 0.2 frozen, threshold 30/15 frozen, INV-01..04 preserved, src/ clean

---

## 1. What WP11 Delivered

| Artifact | Lines | Sections | Notes |
|----------|-------|----------|-------|
| `docs/11_WP11_CONTRACT_INVENTORY.md` | 92 | 7 | Input/output/error/CLI/determinism/provenance/refs; no src change |
| `docs/contracts/evidence-contract.md` | 230 | +4 appended | §§ Versioning & Compatibility (L103), Input Contract & Validation (L121), Error Semantics Exhaustive (L159), Determinism & Provenance (L195) |
| `test/contract/wp11.contract.spec.ts` | 318 | 10 tests | Groups A–D: schema/threshold, INV-01..04, determinism, provenance |

---

## 2. Verification Evidence (observed 2026-08-30)

- `npx tsc --noEmit` → 0 errors
- `npm run build` → ok, `dist/cli.js` 6K
- `npx vitest run --no-coverage` → 188/188 pass (60 files, was 178/178 +10 contract tests)
- `git diff src/` → clean (no source modifications)

---

## 3. Frozen Contract Reaffirmed

- **Schema:** 0.2 (unchanged, frozen WP5.6 commit 21daa57, F-03 additive compatible)
- **Thresholds:** CRAP 30, CC 15 (unchanged)
- **INV-01 ZERO≠NULL:** Numeric 0 for measured zero, null for unavailable (`evidence.ts:216`, `coverage.ts:21`)
- **INV-02 MISSING≠MALFORMED:** `coverageErrorReason` distinguishes 'missing' vs 'malformed' (`evidence.ts:146-158`)
- **INV-03 GIT≠REPO:** `capabilities.git` reflects repo access ability, not monorepo status (`evidence.ts:65-72`)
- **INV-04 ANALYZER TRUTHFUL:** `analyzerStatus` accurately reflects provider state (`evidence.ts:216`)
- **CRAP Formula:** CC²×(1-cov/100)³+CC unchanged (`crapCalc.ts:1-10`)
- **F-03 Normalize:** Path rebasing rebased, not removed (`evidence.ts:148-160`, `coverage.ts:38-75`)
- **No New Language/Provider/Schema:** TS-only, Istanbul-family n=3, schema 0.2 frozen

---

## 4. Known Limitations Carried (7 Items)

1. **Historical per-commit coverage not validated** — R8 reused Round 7 union 1.62M LOC; coverage delta NOT historical (`evidence-contract.md:94`)
2. **Single monorepo** — Rush 1 diff only; no other monorepo architectures tested (`evidence-contract.md:93`)
3. **Provider n=3** — Istanbul-family only (v8, Istanbul, jest); no other coverage formats (`evidence-contract.md:92`)
4. **TS-only** — No JS/Python adapter; TypeScript is sole validated language (`evidence-contract.md:91`)
5. **Caller burden** — 4.96s + `jest.custom.json` friction for Rush/Heft (`10_WP10_CAPABILITY_DEFINITION.md:259-261`)
6. **Small sample** — n=3 real repos (apollo-client, h3, hono) in WP4R
7. **Perf upper bound not probed** — Beyond 1.62M LOC union no scaling data (`Post_WP9_Detailed_Roadmap.md:695`)

---

## 5. What Is NOT Proven by WP11

- Doc-only contract stabilization; **no new implementation validation**
- Integration cost / DX / review usefulness / FP/FN still unmeasured until WP12
- Engram coupling unvalidated
- Historical coverage requires Node 20.9 fresh experiment (`Post_WP9_Detailed_Roadmap.md:512`)
- Language expansion requires adapter prototype (`Post_WP9_Detailed_Roadmap.md:423`)
- No schema bump proven necessary; gap must be proven via WP10 §9 or WP11 validation before engine change (`evidence-contract.md:118`)

---

## 6. Open Decisions for Human (cite Roadmap forks)

| Fork | Description | Priority |
|------|-------------|----------|
| **A — WP12 Integration Validation** | Validate stable contract in 2 real CI pipelines; measure setup complexity, failure modes, evidence completeness, developer comprehension, CI cost, reproducibility | **Highest** (WP10 §9 + Inventory) |
| **B — WP14 Historical** | Node 20.9 fresh historical coverage rerun; per-commit coverage delta | Lower |
| **C — WP13 Language** | JS/Python adapter prototype; polyglot expansion | Lower |
| **D — WP15 Usefulness Study** | Human review study; measure if reviewers make better decisions | Lower |
| **E — Narrow/Stop** | Do not build more merely because prototype works; smaller research/decision phase or halt | Option |

**Gate:** WP11 enables WP12 contract but **DEFERS choice to human** per EXECUTION GUIDANCE "STOP AT GATE AND ASK" (`OPENCODE_START_HERE.md:18-22`, plan `approved:true`)

---

## 7. Next Gate Definition

**HUMAN REVIEW MUST RETURN ONE OF:**

- **CONTINUE** → Proceed WP12 (2 CI pipelines per Roadmap §7)
- **CONTINUE WITH CONSTRAINTS** → Modified WP12 scope
- **STOP** → Halt or narrow per Fork E

No code changes beyond WP11 without explicit CONTINUE. Cite plan `approved:true` gate (`.opencode/plans/2026-08-30T19:01:12Z-wp11-production-evidence-contract.md:2`).

---

## 8. Reproducibility

**Documents to Read:**
- `docs/11_WP11_CONTRACT_INVENTORY.md` (inventory)
- `docs/contracts/evidence-contract.md` L103–231 (WP11 §§ V/C/I/E/D)
- `docs/10_WP10_CAPABILITY_DEFINITION.md` L233–269 (§9 Provisional Next Branch)
- `test/contract/wp11.contract.spec.ts` (Groups A–D)
- `docs/Project Master Plans/Post_WP9_Detailed_Roadmap.md` L270–346 (§6 WP11), L348–410 (§7 WP12)
- `docs/threshold-guidance.md` §3
- `docs/dx-operational.md`
- `docs/repro-history-delta.md`

**Commands to Re-verify:**
```bash
npx tsc --noEmit
npm run build
npx vitest run --no-coverage
git --no-pager diff -- src/
```

---

```text
AWAITING HUMAN REVIEW
```