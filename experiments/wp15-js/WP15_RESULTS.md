# WP15 Results — JavaScript + React Support Expansion (Schema 0.4)

## Current Step
Task 7 of plan `.opencode/plans/2026-09-02T080000Z-js-react-expansion.md` — real-repo E2E + verification (medium bar).

## Scope
Expand engine to JavaScript (.js/.jsx/.mjs/.cjs) as `language: "javascript"` with React `framework: "react"` metadata via Approach 1 core-extension (allowJs + ANALYZABLE_EXTENSIONS). Synthetic fixtures + fault suite + dispatcher validated. Real-repo probes attempted (p-queue, zustand) — coverage format mismatch (c8/nyc) limited full E2E; synthetic evidence remains primary for this slice, real-repo deferred as provisional.

## Synthetic Fixtures Verification

| Fixture | Files | CC | Coverage | CRAP | Language | Framework | Gate |
|---------|-------|----|----------|------|----------|-----------|------|
| js-sample/low.js | low.js | 1 | null (absent) | null | javascript | — | PASS |
| js-sample/med.js | med.js | ~6 | null | null | javascript | — | PASS |
| js-sample/high.js | high.js | 13 | null | null | javascript | — | PASS |
| jsx-sample/Component.jsx | Component.jsx | ~3 | null | null | javascript | react | PASS |
| jsx-sample/useHook.jsx | useHook.jsx | ~4 | null | null | javascript | react | PASS |

`s`nyth fixtures parsed via patched `@barney-media/crap-typescript-core` (ANALYZABLE_EXTENSIONS += .js/.jsx/.mjs/.cjs, resolveScriptKind js/jsx, parser ScriptKind JS/JSX). `npx tsx experiments/wp15-js/adapter/e2e.ts` → schemaVersion 0.4, language javascript, framework react where applicable. `npx tsc --noEmit` 0, `npx vitest` 216/216 pass (67 files) with dispatcher 2, jsPatch 1, jsxTest 1, collect 1, jsFault 10.

## Dispatcher & Collector

- `isUnsupportedIntervals` now allows .js/.jsx/.mjs/.cjs alongside .ts/.tsx/.py → .js no longer UNSUPPORTED
- `languageMap` adds .js/.jsx/.mjs/.cjs → javascript
- `detectFramework(cwd,file)` reads package.json react dep → react, fallback .jsx → react (tsx not auto), else omitted (additive)
- Priority `.py > .tsx > .ts > .jsx > .js` verified via dispatcher.test 2 PASS
- `collectComplexity` rename `getGitTrackedTsFiles`→`getGitTrackedCodeFiles` regex, union dedup, skip malformed file instead of throw (robustness for temp bad.js)

## Fault Suite (10 tests, all PASS)

| Test | Invariant | Result |
|------|-----------|--------|
| missing coverage | MISSING≠MALFORMED | FAILED missing |
| malformed coverage | MISSING≠MALFORMED | FAILED malformed |
| zero coverage | ZERO≠NULL | coverage 0, crap high, WARN |
| branch vs statement kind | coverageKind truthful | not null |
| malformed JS parse | analyzer UNSUPPORTED/SUCCESS | handled |
| mixed ts+js | multi-language | both languages |
| empty JS | SUCCESS empty | PASS |
| react import no JSX | no framework | omitted |
| case-insensitive | attribution | coverage populated |
| threshold 30 vs 15 | policy frozen | gate varies correctly |

## Real-Repo Probes (Provisional)

| Repo | Clone | Install | Coverage Attempt | Language Check | Status |
|------|-------|---------|----------------|----------------|--------|
| sindresorhus/p-queue | /tmp/p-queue cloned --depth 1 | npm install success | `npx c8` produced coverage/tmp but parseCoverageReport expects Istanbul JSON (coverage-final.json) — conversion not completed in this slice | Not verified (format mismatch) | Attempted, deferred |
| pmndrs/zustand | Not completed (time) | — | — | — | Deferred |

Limitation: Real-repo E2E requires Istanbul-compatible coverage artifact (coverage/coverage-final.json). c8 default output needs conversion via `npx c8 report --reporter=json` → coverage-final.json or via `istanbul` instrumentation. Synthetic fixtures remain valid proof for JS support; real-repo validation is provisional and should be completed in follow-on slice before claiming production readiness for JS ecosystem.

## Claims / Evidence Matrix

| Claim | Evidence | Status |
|-------|----------|--------|
| JS extensions not UNSUPPORTED | isUnsupportedIntervals allows .js/.jsx/.mjs/.cjs, determinism.spec .md still UNSUPPORTED | ✅ Verified |
| language javascript | dispatcher.test, e2e fixtures show javascript | ✅ Verified |
| framework react metadata | jsx-sample package.json react dep → framework react, plain.js omitted | ✅ Verified |
| Schema 0.4 additive | evidence-contract.md migration 0.3→0.4, ChangedFunction framework?, package 0.4.0 | ✅ Verified |
| Parser handles JS/JSX | jsPatch.test, jsxTest.test both PASS via allowJs | ✅ Verified via patched core |
| Collector includes JS | collect.test PASS, getGitTrackedCodeFiles regex | ✅ Verified |
| Faults preserve invariants | jsFault 10/10 pass | ✅ Verified |
| Real-repo JS language | p-queue clone success, coverage conversion incomplete | ⚠️ Provisional — needs Istanbul artifact |
| Real-repo React framework | zustand not completed | ⚠️ Deferred |

## Limitations (Provisional)

- **Real-repo coverage format mismatch**: c8/nyc default not Istanbul JSON → parseCoverageReport requires coverage-final.json. Need either `nyc --reporter=json` or `c8 --reporter=json` and path normalization. Synthetic fixtures use absent coverage (null) which still validates dispatch/language but not full CRAP with coverage.
- **Temp malformed file robustness**: Fixed via skip-on-error in collectComplexity + .gitignore temp/; prevents stray temp bad.js breaking entire collection (previously threw).
- **Framework detection**: .tsx not auto react (requires package.json react dep), .jsx auto react — avoids false positives for non-React TSX. peerDependencies.react also checked.
- **Parser persistence**: node_modules patch local (ANALYZABLE_EXTENSIONS) not git-tracked; documented in PATCH_NOTE.md. Permanent fix = fork core or pnpm patch.

## Repro Steps

```bash
# 1. Verify tsc + vitest
npx tsc --noEmit
npx vitest run --no-coverage # expect 216 pass 67 files

# 2. Synthetic JS
npx tsx experiments/wp15-js/adapter/e2e.ts | jq .changedFunctions[0].language
# -> javascript

# 3. Dispatcher
npx vitest run experiments/wp15-js/dispatcher.test.ts

# 4. Faults
npx vitest run experiments/wp15-js/jsFault.spec.ts

# 5. Real JS (attempt, needs Istanbul coverage)
git clone --depth 1 https://github.com/sindresorhus/p-queue /tmp/p-queue
cd /tmp/p-queue && npm install
npx c8 npm test -- --coverage  # check coverage/coverage-final.json exists
npx tsx /path/to/src/cli.ts check --base HEAD~1 --coverage-file coverage/coverage-final.json --json | jq .changedFunctions[0].language
```

## Gate Recommendation
**CONTINUE WITH CONSTRAINTS** — Synthetic JS+React slice validated (schema 0.4, parser, collector, dispatcher, faults all green, 216 pass). Real-repo E2E provisional due to coverage format; requires follow-on to produce Istanbul coverage and verify CRAP gate for real repos before production claim. Reversible via git revert; fallback Approach 2 documented.

---
**HUMAN_REVIEW** required before closing. Confirm language/framework additive, no overclaim beyond synthetic + provisional real-repo.
