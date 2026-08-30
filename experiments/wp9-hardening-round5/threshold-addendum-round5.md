# WP9 Hardening Round 5 — Threshold Addendum

**Date:** 2026-08-30  
**Reference:** Round 4 threshold (30/15) — `experiments/wp9-hardening-round4/threshold-addendum-round4.md`

---

## Threshold Status

| Parameter | Round 4 | Round 5 | Decision |
|-----------|---------|---------|----------|
| CRAP threshold | 30 | **30 (unchanged)** | Frozen |
| Coverage threshold | 15% | **15% (unchanged)** | Frozen |
| Schema version | 0.2 | **0.2 (frozen)** | Contract locked |

---

## Rationale

- **No source changes** in Round 5 — only added `test/cli.real-git.spec.ts` (integration test using real git)
- Real-git integration validates existing code paths; does not alter behavior or thresholds
- Contract 0.2 frozen since Round 4 — no schema evolution needed
- Reversible: threshold addendum documents no-change; can be superseded in Round 6 if TSDoc provider adds new rules

---

## Verification

- `tsc --noEmit` → 0 errors
- `vitest run --no-coverage` → 178/178 pass
- `npm run build` → success
- All INV-01..04 preserved (exit codes 0/1 match schema 0.2 contract)

---

**No action required.** Threshold remains 30/15. Documented for audit trail.