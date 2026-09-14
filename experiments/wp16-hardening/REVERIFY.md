# WP16 Hardening Task 1 — Re-verify (read-only, no code changes)

**Date:** 2026-09-14
**HEAD:** `7fa2156` (`docs(bridge): session catch-up — HEAD 5efd353, 87/391 baseline, typing plan staged`)
**Pre-condition:** Only dirty file = `.opencode/plans/2026-09-13T19-30-00Z-evidence-ts-nocheck-remediation.md` (typing plan approval flip). `src/` is clean.

---

## 1. `npx tsc --noEmit`

```
EXIT_CODE=0
```

**Verdict:** PASS — exit 0, no type errors.

---

## 2. `npm test`

```
> checkchange@0.4.0 test
> vitest run

 RUN  v4.1.11 /Users/victorpetropoulos/Cursor Projects/code-risk-prototype-v0.3-opencode

 Test Files  87 passed (87)
      Tests  391 passed (391)
   Start at  08:45:17
   Duration  5.83s (transform 2.61s, setup 0ms, import 28.72s, tests 31.56s, environment 54ms)

EXIT_CODE=0
```

**Verdict:** PASS — 87 files, 391 tests, exit 0.

---

## 3. `npm run build`

```
> checkchange@0.4.0 build
> tsc && chmod +x dist/cli.js

EXIT_CODE=0
```

**Verdict:** PASS — exit 0.

---

## 4. `npm pack --dry-run`

```
> checkchange@0.4.0 prepare
> npm run build

> checkchange@0.4.0 build
> tsc && chmod +x dist/cli.js

npm notice
npm notice  checkchange@0.4.0
npm notice total files: 52
npm notice package size: 46.8 kB
npm notice unpacked size: 179.8 kB

EXIT_CODE=0
```

**Verdict:** PASS — 52 files, exit 0.

---

## 5. `git diff --stat -- src/`

```
EXIT_CODE=0
```

(Empty output — zero src/ changes.)

**Verdict:** PASS — src/ clean, no changes.

---

## Summary

| Check | Command | Exit Code | Expected | Actual | Status |
|-------|---------|-----------|----------|--------|--------|
| TypeScript | `npx tsc --noEmit` | 0 | 0 | 0 | PASS |
| Tests | `npm test` | 0 | 0 | 0 | PASS |
| Test count | - | - | 87/391 | 87/391 | PASS |
| Build | `npm run build` | 0 | 0 | 0 | PASS |
| Pack | `npm pack --dry-run` | 0 | 0 | 0 | PASS |
| Pack file count | - | - | recorded | 52 | PASS |
| src/ diff | `git diff --stat -- src/` | 0 | empty | empty | PASS |

All 7 gates pass. No code changes made. Read-only re-verification of 87/391 baseline.
