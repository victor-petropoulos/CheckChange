# Generic Language Providers Design

**Date:** 2026-09-19  
**Status:** Approved — single-plan scope, no TBD/TODO, no contradictions  
**Scope:** Replace hardcoded extension-to-provider mappings with a config-driven registry; add approval gate, vacuous-PASS ban, and test matrix.

---

## §1 Architecture: Kill Hardcodes

### Current Hardcoded Locations (to eliminate)

| File | Lines | What Hardcodes |
|------|-------|----------------|
| `src/evidence.ts` | 231–236 | `.ts/.tsx/.js/.jsx/.mjs/.cjs` → `typescriptProvider` |
| `src/evidence.ts` | 248 | `.py` → `pythonASTComplexityProvider` |
| `src/evidence.ts` | 300–301 | `EXTENSION_PRIORITY`, `JS_EXTENSIONS` for `detectExtension` |
| `src/evidence.ts` | 329–337 | `LANGUAGE_MAP` for `getLanguageForFile` |
| `src/cli.ts` | 19 | `SUPPORTED_EXTENSIONS` Set for doctor probe |
| `src/cache.ts` | 404–411 | `registerCachedProviders` re-registers same hardcoded ext sets |
| `src/coverage.ts` | 23 | `PYTHON_COVERAGE_FILES` constant array |

### New Files

**`src/providers/config.ts`** — Config schema + loader + registry derivation

```typescript
export interface ProviderConfig {
  version: number;                    // schema version = 1
  providers: ProviderEntry[];
  allowlist: string[];                // CLI paths allowed for --provider-config
}

export interface ProviderEntry {
  language: string;                   // e.g. "typescript", "python"
  extensions: string[];               // [".ts", ".tsx", ...]
  complexityCmd?: string;             // shell command template; {cwd} {files} expanded
  coverageFiles?: string[];           // artifact search order (like PYTHON_COVERAGE_FILES)
  coverageCmd?: string;               // shell command to generate/convert coverage
}

export interface ResolvedProvider {
  language: string;
  extensions: string[];
  complexityCmd: string | null;
  coverageFiles: string[];
  coverageCmd: string | null;
}

export function loadProviderConfig(cwd: string, explicitPath?: string): ProviderConfig;
export function deriveRegistry(config: ProviderConfig): Map<string, ResolvedProvider>;
export function builtinConfig(): ProviderConfig;  // current hardcoded defaults as config
```

**`src/providers/genericCommand.ts`** — Implements `ComplexityProvider` via shell command

```typescript
export interface GenericCommandProvider extends ComplexityProvider {
  extensions: string[];
  collectComplexity: (cwd: string) => Promise<ComplexityInfo[]>;
  describe(): string;
}

export function createGenericCommandProvider(
  entry: ResolvedProvider,
  cwd: string
): GenericCommandProvider;
```

- `complexityCmd` template variables: `{cwd}`, `{files}` (newline-separated file list via stdin or temp file), `{ext}` (first matched extension)
- Command MUST output JSON array of `ComplexityInfo` to stdout; non-zero exit → provider failure → `UNSUPPORTED`
- Timeout: 30s (configurable via `CHECKCHANGE_PROVIDER_TIMEOUT_MS`, default 30000)
- No network, no ambient authority — command runs in `cwd` with `PATH` only

### Registry Population

- `providers` Map (`src/evidence.ts:223–224`) populated at startup from `deriveRegistry(loadProviderConfig(cwd, explicitPath))`
- Builtin config (`builtinConfig()`) used when no config file found
- Explicit `--provider-config <path>` flag > `./checkchange.providers.json` > builtin
- Extension conflicts: later entries override earlier; diagnostic warning emitted

---

## §2 Config Schema: `checkchange.providers.json`

```json
{
  "version": 1,
  "providers": [
    {
      "language": "typescript",
      "extensions": [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"],
      "complexityCmd": "npx -y @barney-media/crap-typescript-core analyze --format json {files}",
      "coverageFiles": ["coverage/coverage-final.json", "coverage/lcov.info"],
      "coverageCmd": "npx vitest run --coverage --reporter=json --outputFile={out}"
    },
    {
      "language": "python",
      "extensions": [".py"],
      "complexityCmd": "python3 -m checkchange_providers.python_complexity {files}",
      "coverageFiles": [".coverage", "coverage.xml", "coverage.json", "coverage/coverage-final.json"],
      "coverageCmd": "coverage json -o {out}"
    }
  ],
  "allowlist": [
    "./checkchange.providers.json",
    "./.checkchange/providers.json"
  ]
}
```

### Discovery Order (CLI flag `--provider-config`)

1. `--provider-config <path>` (explicit, must be in allowlist or `--allow-external-config`)
2. `./checkchange.providers.json` (repo root)
3. `./.checkchange/providers.json` (repo root)
4. Builtin defaults (`builtinConfig()`)

### Template Expansion

| Token | Expands To |
|-------|------------|
| `{cwd}` | Current working directory (absolute) |
| `{files}` | Newline-separated list of changed files (via temp file, path passed as env `CHECKCHANGE_FILES_LIST`) |
| `{out}` | Temp output path for coverage artifact (provider writes here) |
| `{ext}` | First matched extension from `extensions` array |

### `doctor` Subcommand Source Attribution

```
providerAvailability: ok (config: ./checkchange.providers.json, language: typescript)
providerAvailability: ok (builtin, language: python)
```

Shows `config:` vs `builtin:` so operators know which source is active.

---

## §3 Approval Gate

### Flow

1. **Agent writes config diff** — `checkchange.providers.json` created/modified
2. **Human reviews** — `git diff checkchange.providers.json` (or `git diff --staged`)
3. **Human approves** — Commits config; subsequent `checkchange check` runs with it
4. **Agent never auto-runs** with uncommitted config changes

### Enforcement

- `loadProviderConfig()` reads from disk; if file has uncommitted changes (detected via `git status --porcelain`), emits warning but **does not block** — approval is social, not technical
- `--allow-external-config` flag required when `--provider-config` points outside repo root (symlink-resolved)
- **Timeout:** 30s per provider command (env `CHECKCHANGE_PROVIDER_TIMEOUT_MS`)
- **Coverage size limit:** `MAX_COVERAGE_SIZE = 100MB` (`src/coverage.ts:22`) enforced on artifact read
- **Path containment:** `isWithinCwd()` (`src/coverage.ts:25–60`) — all artifact paths must resolve inside `cwd` (realpath-aware for macOS `/tmp` → `/private/tmp`)
- **Cache invalidation:** Run-shard key (`src/cache.ts:104–114`) includes `configHash` (SHA-256 of canonical config JSON) + `engineIdentity()` (`src/evidence.ts:64–91`) — config change = cache miss = recompute

---

## §4 Data Flow: `getChangedIntervals` → Generic Providers

### Current Pipeline (simplified)

```
cli.ts:336  getChangedIntervals(base)
    ↓
evidence.ts:537  buildEvidenceOutput(base, intervals, cwd, threshold, coverageFile)
    ↓
evidence.ts:555  detectExtension(intervals) → ".ts" | ".py" | ...
    ↓
evidence.ts:560  providers.get(ext)?.collectComplexity(cwd, trace)
evidence.ts:610  readCoverageWithProvider(ext, cwd, coverageFile, trace, autoGenerated)
    ↓
coverage.ts:302  readCoverage(cwd, coverageFile, trace, autoGenerated)
    ↓
coverage.ts:354  detectCoverageFormat(...) → parseCoverageReport / parseLcovContent
    ↓
coverage.ts:148–238  transformPythonCoverageToIstanbul(...)  (transform pattern)
    ↓
evidence.ts:670  attachCoverage(complexityInfo, coverageResult)
    ↓
evidence.ts:451  mapToMethodEvidence(attributedComplexity)
    ↓
evidence.ts:697  correlate(methodEvidence, intervals) → changedFunctions
    ↓
evidence.ts:700  evaluateHighCrap(changedFunctions, threshold)
    ↓
evidence.ts:319–326  computeGateAndCompleteness(ruleResults) → {gate, completeness}
```

### Generalization Points

| Stage | Current | Generic |
|-------|---------|---------|
| Complexity collection | `collectComplexity` (TS) / `pythonASTComplexityProvider` (Python) | `provider.collectComplexity(cwd)` via `ComplexityProvider` interface — dispatch by resolved extension |
| Coverage read | `readCoverage` (multi-format) / `cachedReadCoverage` | `provider.readCoverage(cwd, file?)` — same interface, config-driven `coverageFiles`/`coverageCmd` |
| Format detection | `detectCoverageFormat` (LCOV / Python / Istanbul) | Unchanged — parser stays in `coverage.ts`; providers only supply artifact path |
| Transform pattern | `transformPythonCoverageToIstanbul` (coverage.ts:148–238) | **Removed from core** — provider's `coverageCmd` handles conversion; core only reads final Istanbul JSON |
| CRAP calc / rules / gate | `crapCalc` / `evaluateHighCrap` / `computeGateAndCompleteness` | **Unchanged** — pure functions, language-agnostic |

### Provider Interface (unchanged from `src/complexity-providers.ts:3–7`)

```typescript
export interface ComplexityProvider {
  extensions: string[];
  collectComplexity: (cwd: string) => Promise<ComplexityInfo[]>;
  describe(): string;
}
```

- `readCoverage` added to `ProviderFactory` (`src/evidence.ts:219–222`) for parity
- Generic command provider implements both via shell commands

---

## §5 Vacuous-PASS Ban (per mem:53909)

### Problem

`changedFunctions: []` + `coverage: UNAVAILABLE` + `complexity: NATIVE` → `gate: PASS` / `completeness: COMPLETE` — **false confidence**

### New Rules (enforced in `buildEvidenceOutput`)

| Condition | `analysisStatus` | `gate` | `completeness` | Rationale |
|-----------|------------------|--------|----------------|-----------|
| `changedFunctions.length === 0` AND no provider supports any changed extension | `UNSUPPORTED` | `null` | `NOT_APPLICABLE` | Nothing to analyze |
| `changedFunctions.length === 0` AND at least one supported extension present | `SUCCESS` | `PASS` | `COMPLETE` | Legitimate no-changes-in-functions |
| `coverage: UNAVAILABLE` (no artifact, no auto-gen) | `SUCCESS` | `NOT_EVALUATED` | `INCOMPLETE` | Cannot evaluate CRAP without coverage |
| `coverage: DIRECT` but `changedFunctions.length === 0` | `SUCCESS` | `PASS` | `COMPLETE` | Coverage present, no changed functions |
| Partial `providerAvailability` (`src/cli.ts:343`) | `SUCCESS` | `WARN` if any `WARN` rule | `INCOMPLETE` if any `NOT_EVALUATED` | Doctor already reports `partial` |

### Implementation

In `buildEvidenceOutput` (after `changedFunctions = correlate(...)`):

```typescript
const hasSupportedFiles = intervals.size > 0 && !isUnsupportedIntervals(intervals);
const coverageUsable = coverageResult.available && !coverageResult.error;

if (changedFunctions.length === 0) {
  if (!hasSupportedFiles) {
    // No supported files in diff → UNSUPPORTED
    return UNSUPPORTED_OUTPUT;
  }
  // Supported files exist but no changed functions → SUCCESS/PASS/COMPLETE (legit)
}

// Coverage absent/unusable → cannot evaluate CRAP
if (!coverageUsable) {
  return withDiagnostics({
    ...output,
    analysisStatus: 'SUCCESS',
    gate: 'NOT_EVALUATED',
    completeness: 'INCOMPLETE',
  }, ...);
}
```

- `NOT_EVALUATED` gate is **new** — distinct from `PASS`/`WARN`/`null`
- Exit code: `NOT_EVALUATED` → exit 0 (not a failure), but CI can gate on `gate !== 'PASS'`

---

## §6 Testing Matrix

### Unit Tests (new)

| Test | Target | Assertion |
|------|--------|-----------|
| `config-loader.test.ts` | `loadProviderConfig` | Loads explicit path > repo root > builtin; rejects invalid JSON; validates schema v1 |
| `registry-derivation.test.ts` | `deriveRegistry` | Map keys = extensions; later entries override; `language`/`coverageFiles`/`coverageCmd` propagated |
| `detectExtension.test.ts` | `detectExtension` | Priority `.py` > `.tsx` > `.jsx` > `.js` > `.ts`; empty intervals → `.ts` |
| `generic-command.test.ts` | `createGenericCommandProvider` | Expands `{cwd}`, `{files}`, `{out}`, `{ext}`; 30s timeout; non-zero exit → throws; stdout JSON parsed to `ComplexityInfo[]` |

### Hermetic CLI Tests (no external deps)

| Test | Scenario | Setup | Expect |
|------|----------|-------|--------|
| `cliLangUnknown.test.ts` | Unknown extension `.rs` in diff | `git diff` staged `.rs` file; no provider for `.rs` | `analysisStatus: 'UNSUPPORTED'`, `gate: null`, `completeness: 'NOT_APPLICABLE'` |
| `cliConfigDenied.test.ts` | `--provider-config` outside root without `--allow-external-config` | Config at `/tmp/external.json` | Exit 1, error "external config requires --allow-external-config" |

### E2E: Python-Only (Zero `.ts` Files)

**Fixture:** `test/fixtures/python-only/` — real Python project with:
- `src/math.py` (functions with CC 1–5)
- `tests/test_math.py` (pytest, generates `.coverage`)
- **No** `.ts`, `.js`, `.json` (except `package.json` for tooling)

```bash
# In fixture dir:
pip install pytest coverage
pytest --cov=src --cov-report=xml  # generates .coverage + coverage.xml
checkchange check --base HEAD --json
```

**Assertions:**
- `changedFunctions.length > 0` (at least one Python function changed)
- `capabilities.complexity === 'available'` (provider ran)
- `capabilities.coverageArtifact === 'available'` (`.coverage` found + converted)
- `gate === 'WARN' || gate === 'PASS'` (real CRAP evaluation, **not** `NOT_EVALUATED`)
- `analysisStatus === 'SUCCESS'`
- `diagnostics.quality.complexity === 'NATIVE'`
- `diagnostics.quality.coverage === 'DIRECT'`
- `diagnostics.quality.score !== null` (INV-01: measured, not null)

### Regression: TS/TSX + Vitest (Existing)

- Run existing test suite: `pnpm test` (56 tests, 20s)
- `test_golden_e2e` still passes (TS project, Istanbul JSON)
- `test_main_rerun_overwrites` still passes (rebuild semantics)
- No behavioral change for builtin TypeScript/Python providers

---

## Self-Review Checklist

- [x] No `TBD`, `TODO`, `FIXME`, or placeholders
- [x] No contradictions between sections
- [x] Single-plan scope (generic providers only — no new formatters, no new rules)
- [x] All line/file references verified against current source
- [x] Config schema versioned (`version: 1`)
- [x] Approval gate is social (git diff), not technical block
- [x] Vacuous-PASS ban adds `NOT_EVALUATED` gate, not breaking change
- [x] Test matrix covers unit, hermetic CLI, Python-only E2E, TS regression
- [x] All 6 approved sections present and complete

---

**Word count:** ~1,850