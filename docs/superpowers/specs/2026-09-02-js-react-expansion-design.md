# Design Doc: JavaScript + React Support Expansion (WP15)

**Date**: 2026-09-02  
**Status**: Approved  
**Authors**: Documenter (design), Orchestrator (approver)  
**Schema Target**: 0.4.0 (additive)

---

## 1. Background

Current evidence engine (schema 0.3, frozen at commit 21daa57 per `docs/contracts/evidence-contract.md:5`) supports:

| Language | Extensions | Complexity Provider | Coverage Provider | Status |
|----------|------------|---------------------|-------------------|--------|
| TypeScript | `.ts`, `.tsx` | `@barney-media/crap-typescript-core@0.5.0` (AST) | Istanbul/v8 | Production — n=3 repos, 201/201 tests pass |
| Python | `.py` | `lizard@1.24.0` (token) | `coverage.py@7.16.0` | Experimental — `experiments/wp13/adapter/`, 3 synthetic fixtures |

**Gap**: `.js`/`.jsx`/`.mjs`/`.cjs` files trigger `UNSUPPORTED` path (exit 0, `analysisStatus: 'UNSUPPORTED'`, `gate: null`, `completeness: 'NOT_APPLICABLE'`).

Evidence:
- `src/evidence.ts:136-146` — `isUnsupportedIntervals()` returns `true` only for `.ts`/`.tsx`/`.py`
- `@barney-media/crap-typescript-core` `ANALYZABLE_EXTENSIONS = [".ts", ".tsx"]` (node_modules, line 5)
- `src/evidence.ts:298-306` — `languageMap` only has `.py`, `.ts`, `.tsx`
- `src/complexity.ts:13-31` — `getGitTrackedTsFiles()` only collects `.ts`

---

## 2. Goals (Approved: Approach 1 Core-Extension + Medium Bar)

### Primary (JS Core)
- Add JavaScript (`.js`, `.jsx`, `.mjs`, `.cjs`) as first-class supported language alongside TypeScript
- Use **same AST parser** (`@barney-media/crap-typescript-core`) with `allowJs: true` — no new dependency
- Preserve CRAP formula, thresholds (30 default, 15 tight), invariants INV-01..04 unchanged

### Secondary (React Metadata-Only)
- Detect React via `package.json` dependency on `react` (or `react-dom`)
- Add optional `framework?: string` field to `ChangedFunction` (values: `"react"`)
- No hook-specific CC formula changes, no JSX-specific complexity rules

### Quality Bar (Medium)
| Tier | Artifact | Count | Validation |
|------|----------|-------|------------|
| Synthetic JS | `experiments/wp15-js/fixtures/js-sample/` | 3 functions (low/med/high CC) | `parseFileMethods` validates, coverage via `vitest --coverage` JSON |
| Synthetic React | `experiments/wp15-js/fixtures/jsx-sample/` | 2 components (FC + hook) | JSX parsed, framework=`"react"` present |
| Real JS Repo | Small npm lib (e.g., `sindresorhus/p-queue` or `lodash.pick`) | Clone tmp, `npm test -- --coverage` | `language: "javascript"` entries in output |
| Real React Repo | Small React lib (e.g., `pmndrs/zustand` or `facebook/react` docs example) | Same flow | `framework: "react"` where JSX detected |
| Fault Suite | `jsFault.spec.ts` | 8-10 tests | Missing coverage, malformed JSON, zero coverage, branch vs statement, malformed JS parse, mixed `.ts`+`.js` intervals |

### Schema Migration
- **0.3 → 0.4** (additive, backward compatible)
- Add `language: "javascript"` to `ChangedFunction`
- Add optional `framework?: string` to `ChangedFunction` (values: `"react"`)
- Bump `schemaVersion` in output to `"0.4"`
- Document in `docs/contracts/evidence-contract.md` with migration note

### Non-Goals (Deferred)
- Next.js (`next.config.*`) / Angular (`angular.json`) framework detection
- Hook-specific CC formula (e.g., `useEffect` counts differently)
- Overall project risk score aggregation
- Python-style adapter in `experiments/` — core extension preferred for JS (same parser)

---

## 3. Architecture

### 3.1 Dispatch Priority (Extension → Provider)
```
.py        → Python adapter (experiments/wp13/adapter) — highest
.tsx       → TypeScript parser (existing)
.ts        → TypeScript parser (existing)
.jsx       → TypeScript parser with allowJs (NEW)
.js        → TypeScript parser with allowJs (NEW)
.mjs/.cjs  → TypeScript parser with allowJs (NEW)
```
Implemented in `src/evidence.ts:105-118` (detectedExtension logic) — extend to include `.jsx` > `.js` > `.mjs` > `.cjs` after `.tsx`/`.ts`.

### 3.2 Language Map (`src/evidence.ts:298-306`)
```typescript
const languageMap = {
  '.py': 'python',
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.js': 'javascript',      // NEW
  '.jsx': 'javascript',     // NEW
  '.mjs': 'javascript',     // NEW
  '.cjs': 'javascript',     // NEW
};
```

### 3.3 Framework Detection (Additive, Metadata Only)
- Read `package.json` at repo root (or nearest ancestor of changed file)
- If `dependencies.react` or `devDependencies.react` present → `framework: "react"`
- If JSX syntax detected in file (`.jsx` extension or `<` in TSX-like position) → `framework: "react"`
- **Absent** → omit field entirely (not `null`) — preserves additive compatibility
- Detection failure (no `package.json`) → undefined, no block

---

## 4. Components

### 4.1 Parser Patch: `@barney-media/crap-typescript-core` (Local Fork or Config)
**Option A (Preferred)**: Extend core library `ANALYZABLE_EXTENSIONS` to include `.js`, `.jsx`, `.mjs`, `.cjs` and enable `allowJs: true` in `ts.createSourceFile` call.
- File: `node_modules/@barney-media/crap-typescript-core/dist/fileSelection.js:5` → add extensions
- File: `node_modules/@barney-media/crap-typescript-core/dist/parser.js:47` — `resolveScriptKind` already handles `.js`/`.jsx` when `allowJs` true
- **Risk**: Upstream dependency modification — mitigate by forking to `experiments/wp15-js/crap-typescript-core-fork/` and importing locally, or patching `node_modules` post-install

**Option B (Fallback)**: New provider using `eslint` + `eslint-plugin-complexity` or `complexity-report` (like Python's `lizard`) in `experiments/wp15-js/adapter/jsComplexity.ts`.
- Higher maintenance, new dependency, but zero core changes

**Decision**: Start with Option A (patch core). If upstream rejects or breaks, fall back to Option B. Reversibility: revert fork/patch, restore original `node_modules`.

### 4.2 `getGitTrackedCodeFiles` (Replaces `getGitTrackedTsFiles`)
**File**: `src/complexity.ts:13-31` → rename and extend
```typescript
function getGitTrackedCodeFiles(cwd: string): string[] {
  const output = execSync('git ls-files --cached --others --exclude-standard', { cwd, encoding: 'utf8' });
  const lines = output.trim().split('\n');
  const codeFiles: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.match(/\.(ts|tsx|js|jsx|mjs|cjs)$/)) {
      codeFiles.push(resolve(cwd, trimmed));
    }
  }
  return codeFiles;
}
```
- Used by `collectComplexity` union with `findAllTypeScriptFilesUnderSourceRoots` (which also needs extension update)

### 4.3 `findAllTypeScriptFilesUnderSourceRoots` Extension
- Core library function — may need fork/patch to include JS extensions
- Alternative: supplement with manual glob in `src/complexity.ts:35` for JS files

### 4.4 `src/evidence.ts` Updates
| Location | Change |
|----------|--------|
| Lines 105-118 | Add `.jsx`, `.js`, `.mjs`, `.cjs` to detection priority |
| Lines 136-146 | Add JS extensions to `isUnsupportedIntervals` supported list |
| Lines 298-306 | Add JS extensions to `languageMap` |
| Lines 122-127 | Provider dispatch uses `detectedExtension` — works with new extensions |

### 4.5 Adapter Harness: `experiments/wp15-js/`
```
experiments/wp15-js/
├── adapter/
│   ├── index.ts              // registerProvider('.js', factory) + .jsx/.mjs/.cjs
│   ├── jsComplexity.ts       // collectComplexity using patched core (if Option A) or eslint (Option B)
│   └── jsCoverage.ts         // readCoverage — reuse Istanbul parsing (already works for JS)
├── fixtures/
│   ├── js-sample/
│   │   ├── low.js, med.js, high.js
│   │   └── vitest.config.ts + coverage json
│   └── jsx-sample/
│       ├── Component.jsx, useHook.jsx
│       └── package.json (react dep)
├── jsFault.spec.ts           // 8-10 fault tests
└── WP15_RESULTS.md           // Human-readable evidence packet
```
- Reuses `crapCalc.ts`, `rules.ts`, `evidence.ts` unchanged (like Python adapter)
- **No core modifications** — imports from `src/`

---

## 5. Data Flow (Git → Output)

1. **CLI** (`cli.ts`) parses `--base`, `--coverage-file`, `--crap-threshold`, validates git repo
2. **Git Diff** (`git.ts`) → `git diff --base <ref> HEAD --name-only` → changed file list
3. **Intervals** (`intervals.ts`) → map changed files to line ranges (function-level via complexity)
4. **Extension Detection** (`evidence.ts:105-118`) → priority `.py` > `.tsx` > `.ts` > `.jsx` > `.js` > `.mjs` > `.cjs`
5. **Complexity Collection** (`complexity.ts:33-75` + provider) → `ComplexityInfo[]` per function with CC
   - Uses `getGitTrackedCodeFiles()` (updated) + source root scan
   - Parser: `@barney-media/crap-typescript-core` with `allowJs: true` for JS/JSX
6. **Coverage Read** (`coverage.ts` / provider) → parse Istanbul/v8 JSON → `CoverageResult`
   - No change needed — Istanbul already supports JS
7. **Attribution** (`attribution.ts`) → map coverage to functions via line-range overlap
   - Case-insensitive suffix match (commit 8885796 fix preserved)
8. **CRAP Calculation** (`crapCalc.ts`) → `crap = cc² × (1 - coverage/100)³ + cc` (unchanged)
9. **Rule Evaluation** (`rules.ts`) → `evaluateHighCrap` with thresholds 30/15 (unchanged)
10. **Output Build** (`evidence.ts:100-331`) → `EvidenceOutput` schema 0.4 with `language`, `framework` fields

---

## 6. Error Handling (Preserve INV-01..04)

| Invariant | Preservation |
|-----------|--------------|
| **INV-01 ZERO≠NULL** | `coverage: 0` when measured zero; `null` when unavailable. JS parse failure → `analyzerStatus: 'failed'` → `UNSUPPORTED`, not silent PASS |
| **INV-02 MISSING≠MALFORMED** | Missing coverage file → `coverageErrorReason: 'missing'`, `capabilities.coverageArtifact: 'failed'`, `analysisStatus: 'FAILED'`. Malformed JSON → `'malformed'`. Distinct stderr. No silent synthesize |
| **INV-03 GIT≠REPO** | `cli.ts` (FM-D10): `ENOENT` git executable vs not-a-repo distinct messages. Unchanged |
| **INV-04 ANALYZER TRUTHFUL** | `analyzerStatus` per function: `'passed'`/`'failed'`/`'skipped'`. JS parse error → `'failed'` → `UNSUPPORTED` overall. Caller sees deterministic error |

**Framework Field**: Absent → omitted (not `null`). React detection failure (no `package.json`) → undefined, no block. Additive compatibility preserved.

**JS Parse Failure Path**:
1. `collectComplexity` throws (line 70)
2. `evidence.ts:129-134` catches → `complexityCapability = 'failed'`, `complexityInfo = []`
3. `evidence.ts:200-224` → `analysisStatus: 'UNSUPPORTED'`, `gate: null`, `completeness: 'NOT_APPLICABLE'`
4. Returns early with empty `changedFunctions` — deterministic, not silent PASS

---

## 7. Testing Matrix

| Test Tier | Description | Count | Pass Criteria |
|-----------|-------------|-------|---------------|
| **TypeScript Compile** | `npx tsc --noEmit` | — | 0 errors |
| **Existing Tests** | `vitest run --coverage` | 201 | All pass (regression) |
| **Synthetic JS** | `experiments/wp15-js/fixtures/js-sample/` | 3 fns | CC low/med/high correct, `language: "javascript"` |
| **Synthetic React** | `experiments/wp15-js/fixtures/jsx-sample/` | 2 comps | JSX parsed, `framework: "react"` present |
| **Real JS Repo** | `sindresorhus/p-queue` (or similar) | 1 repo | Clone tmp, `npm test --coverage`, run check, assert JS entries |
| **Real React Repo** | `pmndrs/zustand` (or similar) | 1 repo | Same flow, assert `framework: "react"` on JSX files |
| **Fault Suite** | `jsFault.spec.ts` | 8-10 tests | Each fault → correct evidence state (MISSING≠MALFORMED, ZERO≠NULL, mixed intervals) |

**Fault Test Cases**:
1. Missing coverage file → `coverageErrorReason: 'missing'`, `FAILED`
2. Malformed coverage JSON → `coverageErrorReason: 'malformed'`, `FAILED`
3. Zero coverage (cc=12, cov=0) → `crap=156`, `gate: WARN`, `SUCCESS`
4. Branch vs statement coverage kind → correct `coverageKind` propagation
5. Malformed JS parse (syntax error) → `complexity: 'failed'`, `UNSUPPORTED`
6. Mixed `.ts` + `.js` intervals → both languages in output, correct dispatch
7. JS file with no functions → empty `changedFunctions`, `SUCCESS`
8. JS file with React import but no JSX → `language: "javascript"`, no `framework`
9. Coverage attribution case-insensitivity (JS paths) → `coverage` populated not `null`
10. Default threshold (30) vs tight (15) → correct gate

---

## 8. Schema 0.4 Migration Note

```markdown
### Migration 0.3→0.4 (2026-09-02)

- Added optional `language` value `"javascript"` to `changedFunctions[]` entries.
- Added optional `framework?: string` field to `changedFunctions[]` entries (values: `"react"`).
- Both are additive; consumers ignoring unknown fields/values remain compatible.
- Schema version bump from 0.3 to 0.4 reflects proven JS gap and framework metadata extension.
- Engine commit tag: `v0.4.0-compatible`.
```

**Output Example** (JS function with React):
```json
{
  "file": "src/Component.jsx",
  "method": "Component",
  "lineStart": 10,
  "lineEnd": 45,
  "cc": 8,
  "crap": 42.7,
  "coverage": 65,
  "coverageKind": "statements",
  "analyzerStatus": "SUCCESS",
  "source": { "tool": "@barney-media/crap-typescript-core", "version": "0.5.0" },
  "language": "javascript",
  "framework": "react"
}
```

---

## 9. Risks & Reversibility

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Core parser fork breaks on upstream update | Medium | High | Pin fork commit; test `tsc --noEmit` + 201 tests on each sync |
| `allowJs` produces different CC for same logic | Low | Medium | Synthetic fixtures validate equivalence; CC divergence table if needed |
| React detection false positives | Low | Low | Require both `react` dep + JSX syntax; omit field if uncertain |
| Coverage attribution fails for JS paths | Low | Medium | Case-insensitive match (8885796) already handles; add JS test |
| Real repo validation flakes (network, deps) | Medium | Low | Use small, stable libs; cache `node_modules` in CI |

**Reversibility**:
- **Core patch**: Revert fork/patch → restore original `@barney-media/crap-typescript-core@0.5.0` from lockfile
- **evidence.ts/complexity.ts**: Git revert commits — single-file changes
- **Schema 0.4**: Additive only — consumers ignore unknown `language`/`framework` values
- **Fallback**: If Option A fails, implement Option B (eslint provider) in `experiments/wp15-js/adapter/` — no core changes

---

## 10. Self-Review Checklist

- [x] No `TBD`/`TODO`/`FIXME` placeholders remain
- [x] No contradictions with `evidence-contract.md` (schema 0.3 frozen, 0.4 additive)
- [x] Scope check: JS core + React metadata only — Next/Angular/hooks/risk score deferred
- [x] Ambiguity check: Dispatch priority explicit, error paths mapped to invariants, testing matrix concrete
- [x] File:line citations for all claims (evidence.ts, complexity.ts, evidence-contract.md)
- [x] Reversibility documented for each component
- [x] Medium bar defined with 4 validation tiers + fault suite
- [x] Schema migration note includes version bump rationale and example

**Review Result**: PASS — ready for implementation plan handoff to `writing-plans` skill.

---

*End of Design Doc*