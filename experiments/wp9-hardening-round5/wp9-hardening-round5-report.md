# WP9 Hardening Round 5 Report — Real-git Main Integration (Candidate A)

**Date:** 2026-08-30  
**Status:** ADDENDUM to Round 4  
**Contract:** Schema 0.2 frozen

---

## Summary

- **Tests:** 178/178 pass (174 existing + 4 new real-git integration tests) across 59 test files
- **Typecheck:** `tsc --noEmit` → clean (0 errors)
- **Build:** `npm run build` → succeeds (`dist/cli.js` exists)
- **Integration:** Main CLI (`src/cli.ts`) now tested with real git operations — no `vi.mock` on `../src/git.js` or `../src/evidence.js`
- **FM-D10 proven:** ENOENT vs "Not a git repository" distinction verified with real git calls

---

## Test Matrix — `test/cli.real-git.spec.ts`

| Scenario | Exit Code | Stderr Key Phrase | INV Mapping |
|----------|-----------|-------------------|-------------|
| Valid repo (real `git init` + commit) | 0 | `gate: PASS`, `analysisStatus: SUCCESS` | INV-01, INV-02 |
| Not-a-repo (temp dir without `.git`) | 1 | `Not a git repository` | INV-03, INV-04 |
| Invalid base ref (`nonexistent`) | 1 | `Cannot resolve base reference: nonexistent` | INV-03, INV-04 |
| ENOENT (PATH hack → `git` not found) | 1 | `Git executable not found` | INV-03, INV-04 |

**Key:** All four error messages are **distinct** per INV-03 requirement. ENOENT (binary missing) ≠ not-a-repo (dir exists but no `.git`).

---

## Schema 0.2 Contract Verification

Output from valid-repo test confirms:

```json
{
  "schemaVersion": "0.2",
  "analysisStatus": "SUCCESS",
  "gate": "PASS",
  "completeness": "COMPLETE",
  "capabilities": {
    "git": "available",
    "complexity": "available",
    "coverageArtifact": "absent"
  }
}
```

- `schemaVersion: "0.2"` ✓
- `analysisStatus ∈ {SUCCESS, FAILED}` ✓
- `gate ∈ {PASS, WARN, FAILED, null}` ✓
- `completeness ∈ {COMPLETE, INCOMPLETE, NOT_APPLICABLE}` ✓
- `capabilities.git/complexity/coverageArtifact` all present ✓
- Exit codes: 0 for PASS/UNSUPPORTED, 1 for WARN/FAILED/git errors (INV-04) ✓

---

## Operational Delta

| Metric | Round 4 | Round 5 | Change |
|--------|---------|---------|--------|
| CLI coverage % | 87.8% | 87.8% | **Unchanged** (no new source lines) |
| Main integration confidence | Mocked git | **Real git** | **Higher confidence** — FM-D10 proven with actual git binary |
| Test count | 174 | 178 | +4 (real-git) |
| Schema contract | 0.2 | 0.2 | Frozen |

**Note:** Coverage percentage unchanged because no `src/` changes — only test addition. The value is higher confidence in the same code paths.

---

## Threshold Addendum

See `threshold-addendum-round5.md` — threshold remains **30/15**, contract frozen, no source changes. Reversible.

---

## Limitations

1. **Providers:** Still only 2 (typescript, jest). TSDoc deferred to Round 6.
2. **Sample size:** Small (n=2 providers, single repo structure).
3. **Monorepo:** Not tested — deferred.
4. **Coverage artifact:** Only `absent`/`available` exercised; `failed` paths covered in wp55 but not in real-git main.

---

## Gate Recommendation

**PROPOSAL: CONTINUE WITH CONSTRAINTS**

- **Confidence:** Medium/High (real-git integration proven, FM-D10 distinction verified)
- **Next gate blocker (B):** TSDoc provider (Round 6) to reach ≥3 providers
- **Constraints:** No source changes in this round; threshold frozen; monorepo deferred

---

```
AWAITING HUMAN REVIEW
```