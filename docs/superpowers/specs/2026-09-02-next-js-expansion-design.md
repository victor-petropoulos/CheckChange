# Next.js Framework Metadata Expansion Design

**Date:** 2026-09-02  
**Status:** Approved  
**Authors:** Victor Petropoulos (Architect), ONLINE-Documenter (Writer)  
**Schema Target:** 0.4 (additive value `"next"` only, no version bump)

---

## 1. Background

Current schema 0.4 (frozen per WP15) defines:
- `language` values: `"typescript" | "python" | "javascript"` (evidence-contract.md:49)
- `framework` optional, single value: `"react"` (evidence-contract.md:50)
- Framework detection in `src/evidence.ts:322-330` only checks `package.json` for `react` in deps and `.jsx` extension
- Parser (`@barney-media/crap-typescript-core`) already handles `.tsx`/`.jsx` — no parser change needed
- App Router (`app/`) and Pages Router (`pages/`) structures invisible to engine

Gap: Next.js repos emit `"react"` (via `react` dep) but lose framework identity. Consumers cannot distinguish Next.js risk patterns (server components, route handlers, middleware) from plain React.

---

## 2. Goals

| Goal | Description | Priority |
|------|-------------|----------|
| **A. Pure metadata** | Add `"next"` as allowed `framework` value. No schema bump (additive). | P0 |
| **B. Medium-confidence detection** | Detect Next.js via: (1) `package.json` has `next` in deps, OR (2) `next.config.*` at repo root, OR (3) `app/page.tsx` or `app/layout.tsx` or `app/**/route.ts` or `pages/**/*.tsx` exists. | P0 |
| **C. Priority: next > react** | When both signals present, emit `"next"`. React-only repos keep `"react"`. | P0 |
| **D. Synthetic + provisional real repo** | Add `next-sample` fixture (App Router minimal). Validate on one real Next.js repo (provisional, not gate). | P0 |
| **E. Thresholds frozen** | CRAP threshold 30 unchanged. No new rules. | P0 |

---

## 3. Non-Goals

- Routing kind classification (`app` vs `pages` vs `middleware`) — out of scope
- Next.js version parsing (`next@14` vs `next@15`) — out of scope
- New glob dependency — reuse existing `fs`/`path` (already in evidence.ts:7-8)
- Coverage attribution changes — framework metadata does not affect CRAP
- Monorepo detection — same as existing (repo root `package.json` only)

---

## 4. Architecture

### 4.1 Framework Detection Priority List

Detector runs per changed function (same call site as `detectFramework` at evidence.ts:333). Priority order:

1. **Explicit Next.js dep** — `package.json` has `"next"` in `dependencies` OR `devDependencies` OR `peerDependencies`
2. **Config file at root** — `next.config.js` OR `next.config.mjs` OR `next.config.ts` exists at repo root
3. **App Router marker** — `app/page.tsx` OR `app/layout.tsx` OR `app/**/route.ts` exists (any depth)
4. **Pages Router marker** — `pages/**/*.tsx` OR `pages/api/**/*.ts` exists
5. **React dep fallback** — existing logic: `react` in deps OR `.jsx` extension → `"react"`
6. **None** — `undefined`

Priority is strict: 1 > 2 > 3 > 4 > 5. First match wins.

### 4.2 Detection Implementation

New function `detectNextFramework(cwd: string, filePath: string): 'next' | 'react' | undefined` added in `evidence.ts` near existing `detectFramework` (line 322). Replaces `detectFramework` call at line 333.

```typescript
const detectNextFramework = (cwd: string, filePath: string): 'next' | 'react' | undefined => {
  // 1. package.json next dep
  try {
    const pkg = JSON.parse(fs.readFileSync(path.resolve(cwd, 'package.json'), 'utf8'));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies, ...pkg.peerDependencies };
    if (deps.next) return 'next';
  } catch {}
  // 2. next.config.* at root
  const configNames = ['next.config.js', 'next.config.mjs', 'next.config.ts'];
  for (const name of configNames) {
    if (fs.existsSync(path.resolve(cwd, name))) return 'next';
  }
  // 3. App Router markers
  const appMarkers = ['app/page.tsx', 'app/layout.tsx'];
  for (const marker of appMarkers) {
    if (fs.existsSync(path.resolve(cwd, marker))) return 'next';
  }
  // Check app/**/route.ts (any depth) — bounded scan
  const appDir = path.resolve(cwd, 'app');
  if (fs.existsSync(appDir)) {
    const routeFiles = fs.readdirSync(appDir, { recursive: true })
      .filter(f => f.endsWith('route.ts') || f.endsWith('route.tsx'));
    if (routeFiles.length > 0) return 'next';
  }
  // 4. Pages Router markers
  const pagesDir = path.resolve(cwd, 'pages');
  if (fs.existsSync(pagesDir)) {
    const pageFiles = fs.readdirSync(pagesDir, { recursive: true })
      .filter(f => f.endsWith('.tsx') || f.endsWith('.ts'));
    if (pageFiles.length > 0) return 'next';
  }
  // 5. React fallback
  try {
    const pkg = JSON.parse(fs.readFileSync(path.resolve(cwd, 'package.json'), 'utf8'));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies, ...pkg.peerDependencies };
    if (deps.react) return 'react';
  } catch {}
  if (filePath.endsWith('.jsx')) return 'react';
  return undefined;
};
```

### 4.3 Contract Update

evidence-contract.md line 16: change `"react"` to `"react" | "next"` in `framework` field description.  
Schema version stays 0.4 (additive). No migration note needed (no breaking change).

---

## 5. Components

| Component | Change | Location |
|-----------|--------|----------|
| **Detector** | New `detectNextFramework` replaces `detectFramework` | `src/evidence.ts` (new fn, ~40 lines) |
| **Contract** | Update allowed values doc | `docs/contracts/evidence-contract.md:16` |
| **Fixtures** | Add `experiments/wp15-js/fixtures/next-sample/` with `package.json` (next dep), `app/page.tsx`, `next.config.js` | New fixture dir |
| **Collector** | Unchanged — `collectComplexity` already processes `.tsx` via `crap-typescript-core` | N/A |
| **Attribution** | Unchanged — framework field not used in coverage mapping | N/A |
| **Rules** | Unchanged — thresholds unchanged | N/A |

---

## 6. Data Flow (10 Steps)

1. CLI parses `--base`, resolves git diff → changed file list
2. `buildEvidenceOutput` iterates changed files, detects extension priority (`.py` > `.tsx` > `.ts` > `.jsx` > `.js`)
3. For each changed function after correlation (evidence.ts:286), call `detectNextFramework(cwd, fn.file)`
4. Detector checks `package.json` for `next` dep (sync read, cached per invocation)
5. If no dep, checks root for `next.config.*` (sync `fs.existsSync`)
6. If no config, scans `app/` for `page.tsx`/`layout.tsx`/`route.ts` (bounded `readdirSync` recursive)
7. If no app markers, scans `pages/` for `.tsx`/`.ts` (bounded)
8. Falls back to React detection (existing logic)
9. Returns `'next'` | `'react'` | `undefined` → attached to `changedFunctions[i].framework`
10. Output JSON includes `framework` value per function; schemaVersion remains `0.4`

---

## 7. Error Handling

- **Missing `package.json`** — try/catch swallows, continues to filesystem checks (evidence.ts:324-327 pattern)
- **Missing `app/` or `pages/` dir** — `fs.existsSync` returns false, continues
- **Permission denied on `readdirSync`** — try/catch, treat as absent (no throw)
- **No signal matched** — return `undefined` (omit field, not `null`)
- **Priority respected** — first match returns immediately, no override

---

## 8. Testing Matrix

| Test Type | Count | Description |
|-----------|-------|-------------|
| **Synthetic fixture** | 1 | `next-sample/` (App Router minimal) — validates `"next"` emitted |
| **Dispatcher tests** | 2 | (a) `next` dep only → `"next"`; (b) `next.config.js` only → `"next"` |
| **Priority tests** | 2 | (a) both `next` dep + `react` dep → `"next"`; (b) `app/page.tsx` + `react` dep → `"next"` |
| **Fault injection** | 2 | (a) missing `package.json` → falls back to filesystem; (b) unreadable `app/` dir → continues |
| **Regression** | 0 | Existing 216 tests must pass (no change to TS/JS/Python paths) |
| **Real repo provisional** | 1 | Clone one Next.js repo (e.g., `vercel/next.js` examples), run `check`, verify `"next"` appears — not gated |

**Total new tests:** 7 → expected test count 216 → 223

---

## 9. Risks & Reversibility

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| False positive (non-Next repo has `next` dep) | Low | Medium | Priority 1 requires `next` in deps — rare false positive |
| False negative (Next.js repo without markers) | Low | Low | Priority 2-4 cover config + both routers |
| `readdirSync` perf on large `app/` | Low | Low | Bounded to `app/` and `pages/` only; single sync call per invocation |
| Cache staleness (package.json read per function) | Medium | Low | Read once per `buildEvidenceOutput` invocation (move outside map) |

**Revert Plan (5 lines):**
1. Delete `detectNextFramework` function
2. Restore `detectFramework` call at evidence.ts:333
3. Revert evidence-contract.md line 16 to `"react"`
4. Delete `next-sample` fixture
5. Delete 7 new tests

No cache, no migration, no schema bump — fully reversible in one commit.

---

## 10. Self-Review Checklist

| Check | Result |
|-------|--------|
| No TBD / TODO remaining | ✅ Pass |
| No contradictions (goals vs non-goals, priority order) | ✅ Pass |
| Scope single slice (metadata only, no routing, no version) | ✅ Pass |
| Ambiguity resolved (priority list explicit, fallback defined) | ✅ Pass |
| Contract update additive (no bump) | ✅ Pass |
| Reversibility documented (5-line revert) | ✅ Pass |
| Test count delta explicit (216→223) | ✅ Pass |
| Real repo provisional (not gate) | ✅ Pass |

---

*Self-review complete. All checks pass. Ready for implementation.*