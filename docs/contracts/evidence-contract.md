# Evidence Contract

## Version: 0.4.0
## Date: 2026-09-02
## Status: FROZEN (WP15 JS+React schema 0.4, additive language javascript + framework react)

### Migration 0.2→0.3

- Added optional `language` field to `changedFunctions[]` entries (values: "typescript" | "python").
- This is an additive change; consumers ignoring unknown fields remain compatible (forward compatibility).
- Schema version bump from 0.2 to 0.3 reflects proven multi-language gap (WP10) and language-registry implementation (WP13-LANG-REGISTRY).

### Migration 0.3→0.4

- Added optional `language` value `"javascript"` to `changedFunctions[]` entries.
- Added optional `framework?: string` field (values: `"react" | "next"`).
- Both additive; consumers ignoring unknown values remain compatible.
- Schema version bump 0.3→0.4 reflects proven JS gap

### Hardening B Addendum (2026-09-02)

#### P0-1 Parser Persistence
- Patched `@barney-media/crap-typescript-core@0.5.0` via `pnpm patch` (committed `patches/crap-typescript-core+0.5.0.patch`, `package.json:patchedDependencies`, `pnpm-lock.yaml`).
- Changes in patch:
  - `dist/fileSelection.js`: `ANALYZABLE_EXTENSIONS = [".ts",".tsx",".js",".jsx",".mjs",".cjs"]`
  - `dist/utils.js`: `resolveScriptKind` returns `"tsx"` for `.tsx`/`.jsx`, `"ts"` for `.ts`, `"js"` for `.js`/`.mjs`/`.cjs` (jsx maps to tsx to handle TS JSX with destructuring)
  - `dist/parser.js`: `scriptKindMap = { "ts": TS, "tsx": TSX, "js": JS, "jsx": TSX }` with fallback
- Verification:
  - `rm -rf node_modules && pnpm install` → grep `ANALYZABLE_EXTENSIONS` shows `.js` etc., utils returns `tsx` for `.jsx`
  - `npx tsc --noEmit` 0, `npx vitest run` 225 pass (71 files, includes cc-bench)
- Persistence: pnpm patch survives clean checkout. Reversible via `git revert` or `pnpm patch --reverse`.
- Supports previous local `node_modules` edit.

#### P0-3 Registry
- Minimal dispatch table in `src/evidence.ts` for `.ts`/`.tsx`/`.js`/`.jsx`/`.mjs`/`.cjs` + `.py` delegation.
- Uses arrow delegation (`collectComplexity: (...args) => collectComplexity(...args)`) to preserve `vi.spyOn` mocks.
- No schema bump required (additive change only).

#### P1-4 CC Benchmark
- Benchmark of 10 synthetic functions (empty, if/else, ternary, logical AND, logical OR, try/except, for loop, while loop, switch, async/await).
- Measured correlation: 0.626 (Lizard vs crap-typescript-core CC values) for TS/JS.
- Divergence table:
  | Construct | Lizard CC (Python) | crap-typescript-core CC (TypeScript) |
  |-----------|-------------------|--------------------------------------|
  | Empty | 0 | 0 |
  | If/Else | 2 | 2 |
  | Ternary | 1 | 2 |
  | Logical AND | 1 | 2 |
  | Logical OR | 1 | 2 |
  | Try/Except | 1 | 2 |
  | For Loop | 2 | 2 |
  | While Loop | 2 | 2 |
  | Switch | 2-3 | 2-3 |
  | Async/Await | 1 | 2 |
- Update 2026-09-02: Python AST provider achieves correlation 1.0 on synthetic benchmark (WP13).
- Conclusion: TS/JS correlation < 0.95, no correction factor applied. Documented divergence for transparency.
- Rationale: Correction factor deferred until TS benchmark ≥0.95; Python side now passes (≥0.95).
- Proposed approach: Linear regression mapping Lizard→crap-typescript-core CC values when TS benchmark improves.

#### Resolved Limitations
1. **Real-repo coverage format mismatch**: 
   - `c8`/`nyc` → Istanbul JSON via `c8 --reporter=json` or `vitest --coverage`.
   - Path normalization via `coverage.ts`.
   - Verified for p-queue (1.2MB), zustand, and next-sample (1.4K).
   - Synthetic null coverage still valid for dispatch.

2. **Temp malformed file robustness**:
   - Skip-on-error in `collectComplexity` (`getGitTrackedCodeFiles` try/catch, `continue` on parse error).
   - `.gitignore` temp/ directory.
   - Verified via `collect.test` and `jsFault`.

3. **Framework detection**:
   - `.tsx` requires `package.json` react dep.
   - `.jsx` auto react.
   - PeerDeps checked.
   - Next>React priority.
   - Verified via nextDispatcher (5/5 tests pass).

4. **Parser persistence**: 
   - As documented in P0-1 (pnpm patch persistence).

### Security Addendum (2026-09-03)

High/Medium fixes applied — status: **CLOSED**

| Fix | Area | Severity | Commit |
|-----|------|----------|--------|
| SHA regex: `^[a-f0-9]{40}$` strict validation in `git.ts` | Input validation | High | (reference commit) |
| LCOV size limit: 10 MB max in `lcov-provider.ts` | DoS prevention | High | (reference commit) |
| Python prune: skip `site-packages`, `venv`, `dist`, `build` in `detectPythonFramework` | Path traversal | Medium | (reference commit) |
| `readdir` depth limited to 3 in `detectNextFramework` (`src/evidence.ts`) | DoS/performance | Medium | (reference commit) |
| `--coverage-file` allowed outside cwd with symlink-follow validation | Path traversal | Medium | (reference commit) |

All fixes verified: `npx tsc --noEmit` exit 0, `npm test` 233 pass. No schema changes required (defensive hardening only).

### Schema Version 0.4

The evidence contract defines the deterministic output of the CheckChange evidence engine. Schema 0.4 adds `language: "javascript"` and optional `framework: "react"` to ChangedFunction.

#### Top-Level Structure

```typescript
interface EvidenceOutput {
  analysis: {
    base: string;      // Git baseline reference (commit SHA)
    target: string;    // Git target reference (commit SHA)
  };
  capabilities: {
    git: 'available' | 'unavailable' | 'failed';
    complexity: 'available' | 'unavailable' | 'failed';
    coverageArtifact: 'available' | 'unavailable' | 'failed';
    crapTypescript?: 'available' | 'unavailable' | 'failed';
  };
  changedFunctions: {
    file: string;               // Relative path from repo root
    method: string;             // Function name or method signature
    lineStart: number;          // Starting line number (1-indexed)
    lineEnd: number;            // Ending line number (1-indexed)
    cc: number;                 // Cyclomatic complexity
    crap: number;               // CRAP score
    coverage: number | null;    // Coverage percentage (0-100) or null if unavailable
    coverageKind: 'statements' | 'branches' | 'functions' | 'lines' | null;
    analyzerStatus: 'SUCCESS' | 'FAILED' | 'UNSUPPORTED';
    source: string;             // Analyzer tool/version (e.g., 'crap-typescript-core@0.5.0');
    language?: string;          // Language of the function (e.g., "typescript" | "python" | "javascript")
    framework?: string;         // Framework of the function (e.g., "react" | "next")
  }[];
  policy: {
    crapThreshold: number;      // CRAP threshold for WARN/PASS gate
  };
  ruleResults: {
    ruleId: string;             // Identifier of the rule (e.g., 'changed-function-high-crap')
    result: 'PASS' | 'WARN' | 'FAIL' | 'NOT_EVALUATED';
    file: string;               // Relative path from repo root
    method: string;             // Function name or method signature
    crap: number;               // CRAP score of the function
    threshold: number;          // CRAP threshold used for this evaluation
    cc: number;                 // Cyclomatic complexity
    coverage: number | null;    // Coverage percentage
  }[];
  analysisStatus: 'SUCCESS' | 'FAILED' | 'UNSUPPORTED';
  gate: 'PASS' | 'WARN' | null;
  completeness: 'COMPLETE' | 'INCOMPLETE' | 'NOT_APPLICABLE';
  coverageErrorReason?: 'missing' | 'malformed';
};
```

### Invariants Preserved

The following invariants are preserved from WP5.6 and must hold in all evidence outputs:

- **INV-01: ZERO≠NULL** — Numeric fields (cc, crap, coverage) use 0 for measured zero, null for unavailable/unmeasurable.  
  *Evidence: evidence.ts:216 (analyzerStatus truthfulness) and coverage.ts:21 (coverage parsing)*

- **INV-02: MISSING≠MALFORMED** — Missing coverage (no artifact) vs malformed coverage (invalid JSON) are distinguished via `coverageErrorReason`.  
  *Evidence: evidence.ts:146-158 (coverageErrorReason setting)*

- **INV-03: GIT≠REPO** — Git capability reflects ability to access the repository, not whether it is a monorepo (untested).  
  *Evidence: evidence.ts:65-72 (capabilities construction)*

- **INV-04: ANALYZER TRUTHFUL** — `analyzerStatus` accurately reflects the success/failure/unsupported state of the complexity and coverage analyzers.  
  *Evidence: evidence.ts:216 (analyzerStatus assignment in buildFailedOutput)*

- **INV-05: DIAGNOSTICS TRUTHFUL** — The `diagnostics` object never contradicts evidence values; quality labels align with corresponding capabilities and analysisStatus.
  *Evidence: prospective — see docs/decisions/diagnostics-schema-design.md; no diagnostics construction in src/ yet (src/evidence.ts is 442 lines).*

### CLI Contract

The `check` command produces evidence and exits with codes reflecting the deterministic outcome:

```
check --base <ref> [--json] [--crap-threshold <T>] [--coverage-file <path>]
```

- **Exit 0**: When `analysisStatus` is `SUCCESS` and `gate` is `PASS` (or `UNSUPPORTED` with `gate` null and `completeness` `NOT_APPLICABLE` for unsupported cases).
- **Exit 1**: When `analysisStatus` is `FAILED` (provider failure) or `gate` is `WARN` or `FAIL` (based on rule results), or when Git command fails.
- **JSON Output**: When `--json` flag is present, the full evidence object is output as JSON; otherwise, a human-readable summary is printed.
- **JSON Truthfulness**: All fields in the JSON output reflect the actual state computed by the evidence engine; no fields are omitted or defaulted when unavailable.

### Provenance Pipeline

Evidence is produced through a deterministic pipeline:

1. **Git diff** → Compute changed files between `base` and `target`
2. **Intervals** → Convert changed files to function-level intervals (requires complexity analyzer)
3. **Complexity** → Compute cyclomatic complexity (CC) per function via `crap-typescript`
4. **Coverage Attribution** → Map Istanbul/v8 coverage to changed functions (requires coverage artifact)
5. **CRAP Calculation** → Compute CRAP score using CC and coverage
6. **Threshold Application** → Compare CRAP against policy threshold
7. **Analyzer Status** → Set `analyzerStatus` per function based on analyzer success
8. **Rule Evaluation** → Apply project rules (e.g., changed-function-high-crap) to produce `ruleResults`
9. **Gate/Completeness** → Derive `gate` (PASS if no WARN rules, WARN if any WARN) and `completeness` (COMPLETE if all rules evaluated, INCOMPLETE if any NOT_EVALUATED)
10. **Analysis Status** → Set `analysisStatus` based on provider failures (SUCCESS by default, FAILED on coverage/complexity/attachment failure, UNSUPPORTED on non-TS changes or complexity failure)
11. **JSON Output** → Serialize evidence object to JSON (if requested)
12. **CLI Output** → Print JSON or human-readable summary and set exit code

### Versioning & Compatibility (WP11)

Following semantic versioning given the contract stability, with WP11 additions for explicit versioning policy:

- **Schema Version 0.3 Lifecycle**: Currently frozen per WP5.6; no breaking changes permitted without demonstrated gap requiring engine evolution.
- **Forward Compatibility**: Additive fields (new optional properties) allowed in minor/patch versions; consumers must ignore unknown fields.
- **Backward Compatibility**: Removal or type changes of existing fields constitute breaking changes requiring major version bump.
- **Breaking-Change Policy**: Major schema version bump (e.g., 0.2 → 0.3) requires:
  - Migration note in evidence-contract.md documenting changes
  - Engine commit tag indicating version compatibility (e.g., `v0.3.0-compatible`)
  - Explicit validation that change addresses proven gap in WP10 scoped claims
- **Deprecation Process**: Fields marked deprecated via `@deprecated` JSDoc in TypeScript interfaces for one minor version before removal.
- **Version Detection**:
  - Caller detects version via `schemaVersion` field in JSON output
  - Engine signals version via `package.json` version + `evidence-contract.md` header
- **Current State**: Bumped to 0.3.0 as of 2026-09-01, with language field added to ChangedFunction interface.
  *Evidence: evidence-contract.md:3-5 (frozen status), Post_WP9_Detailed_Roadmap.md:135-160 (WP11 §6)*
- **Additive Diagnostics**: The optional `diagnostics` object (schema 0.5) is an additive change; consumers ignoring unknown fields remain compatible. Schema version bump from 0.4 to 0.5 is minor when the additive fields stabilize.

### 11.1 Input Contract

The engine accepts the following CLI inputs, each with deterministic validation and effect on evidence output:

| Input | Required | Default | Validation | Effect on Evidence |
|-------|----------|---------|------------|-------------------|
| `--base <ref>` | Yes | — | Non-empty, resolvable via `git rev-parse` | `capabilities.git = 'available'` if valid; `'failed'` + `analysisStatus='FAILED'` + exit 1 if invalid |
| `--coverage-file <path>` | No | `coverage/coverage-final.json` | Path readable, valid JSON, Istanbul shape (`statementMap`, `fnMap`, `branchMap`) | `coverageErrorReason='missing'|'malformed'` + `capabilities.coverageArtifact='failed'` + `analysisStatus='FAILED'` if invalid; `available=false` if absent default |
| `--crap-threshold <T>` | No | `30` | Finite non-negative number | Used in `policy.crapThreshold`; invalid → exit 1, stderr |
| Repository path (`process.cwd()`) | Implicit | — | Valid git repo (`validateGitRepo()`) | `capabilities.git='failed'` + `analysisStatus='FAILED'` + exit 1 if not repo |
| Engine version | Implicit | Node 24.18.1, `@barney-media/crap-typescript-core@0.5.0` | Fixed per WP10 §3 | Recorded in `changedFunctions[].source` and implicit in `schemaVersion` |

*Evidence: cli.ts:21-99 (parsing), evidence.ts:92 (cwd usage), coverage.ts:77-108 (readCoverage), package.json:3,16*

### 11.2 Output Contract

The top-level `EvidenceOutput` structure (schema 0.2) is stable and frozen:

```typescript
interface EvidenceOutput {
  analysis: { base: string; target: string };
  capabilities: {
    git: 'available' | 'unavailable' | 'failed';
    complexity: 'available' | 'unavailable' | 'failed';
    coverageArtifact: 'available' | 'unavailable' | 'failed';
    crapTypescript?: 'available' | 'unavailable' | 'failed';
  };
  changedFunctions: {
    file: string;
    method: string;
    lineStart: number;
    lineEnd: number;
    cc: number;
    crap: number;
    coverage: number | null;
    coverageKind: 'statements' | 'branches' | 'functions' | 'lines' | null;
    analyzerStatus: 'SUCCESS' | 'FAILED' | 'UNSUPPORTED';
    source: { tool: string; version: string };
  }[];
  policy: { crapThreshold: number };
  ruleResults: {
    ruleId: string;
    result: 'PASS' | 'WARN' | 'FAIL' | 'NOT_EVALUATED';
    file: string;
    method: string;
    lineStart: number;
    lineEnd: number;
    cc: number;
    crap: number;
    coverage: number | null;
  }[];
  analysisStatus: 'SUCCESS' | 'FAILED' | 'UNSUPPORTED';
  gate: 'PASS' | 'WARN' | null;
  completeness: 'COMPLETE' | 'INCOMPLETE' | 'NOT_APPLICABLE';
  coverageErrorReason?: 'missing' | 'malformed';
};
```

**External Consumer Guarantee**: This output is fully self-contained and requires no knowledge of engine internals to consume. A downstream CI gate, reviewer tool, or LLM agent can evaluate risk using only the fields above — no internal types, provider details, or pipeline steps are needed.

**Minimal Valid JSON Example** (single changed function, full coverage):
```json
{
  "schemaVersion": "0.2",
  "analysis": { "base": "abc123", "target": "current" },
  "capabilities": { "git": "available", "complexity": "available", "coverageArtifact": "available" },
  "changedFunctions": [{
    "file": "src/foo.ts",
    "method": "calculateRisk",
    "lineStart": 10,
    "lineEnd": 25,
    "cc": 3,
    "crap": 12.5,
    "coverage": 85,
    "coverageKind": "statements",
    "analyzerStatus": "SUCCESS",
    "source": { "tool": "@barney-media/crap-typescript-core", "version": "0.5.0" }
  }],
  "policy": { "crapThreshold": 30 },
  "ruleResults": [{
    "ruleId": "changed-function-high-crap",
    "result": "PASS",
    "file": "src/foo.ts",
    "method": "calculateRisk",
    "crap": 12.5,
    "threshold": 30,
    "cc": 3,
    "coverage": 85
  }],
  "analysisStatus": "SUCCESS",
  "gate": "PASS",
  "completeness": "COMPLETE"
}
```

*Evidence: evidence.ts:265-308 (output construction), rules.ts:20-56 (ruleResults), crapCalc.ts:1-10 (CRAP formula)*

### 11.3 Error Semantics

Mapping of error conditions to deterministic evidence state, preserving INV-01..04:

| Condition | capabilities.state | analysisStatus | completeness | gate | coverageErrorReason | exit code | stderr diagnostic |
|-----------|-------------------|----------------|--------------|------|---------------------|-----------|-------------------|
| Missing coverage file (--coverage-file missing) | coverageArtifact: 'failed' | FAILED | INCOMPLETE | null | 'missing' | 1 | "coverage artifact missing" |
| Malformed coverage JSON | coverageArtifact: 'failed' | FAILED | INCOMPLETE | null | 'malformed' | 1 | "coverage artifact malformed" |
| > Note: 'Malformed coverage JSON → FAILED' applies only when changed TS functions exist (isUnsupportedIntervals returns false). If no TS changes, 'Non-TS changes only → UNSUPPORTED/exit0' takes precedence and coverage artifact is never read (evidence.ts:121 early return). |
| Git ENOENT (executable unavailable) | git: 'failed' | FAILED | any | null | unchanged | 1 | "Git executable not found" |
| Not-a-repo (invalid cwd) | git: 'failed' | FAILED | any | null | unchanged | 1 | "Not a git repository" |
| Zero coverage (cc=12, cov=0 → crap=156) | coverageArtifact: 'available' | SUCCESS | COMPLETE | WARN | null | 1 | (none; gate WARN) |
| Low coverage (cc=12, cov=10 → crap=124.2) | coverageArtifact: 'available' | SUCCESS | COMPLETE | WARN | null | 1 | (none; gate WARN) |
| Full coverage (cc=12, cov=100 → crap=12) | coverageArtifact: 'available' | SUCCESS | COMPLETE | PASS | null | 0 | (none; gate PASS) |
| Unavailable coverage (no artifact, default path) | coverageArtifact: 'unavailable' | SUCCESS | COMPLETE | PASS/WARN | null | 0/1 | (none; depends on changed functions) |
| Complexity failure (TS parse error) | complexity: 'failed' | UNSUPPORTED | NOT_APPLICABLE | null | unchanged | 1 | (from collectComplexity catch) |
| > Note: UNSUPPORTED is returned when no TS changes exist (isUnsupportedIntervals returns true); coverage artifact is not read in this case, so malformed/missing coverage cannot cause FAILED. See evidence.ts:109-124 for isUnsupportedIntervals implementation. |
| Non-TS changes only | git: 'available' | UNSUPPORTED | NOT_APPLICABLE | null | unchanged | 0 | (none; special case) |

Truthful propagation: raw condition → internal evidence (capabilities/coverageErrorReason) → function result → analyzerStatus → gate/completeness → JSON → CLI → exit code
*Evidence: evidence-contract.md:61-71 (invariants), evidence.ts:216 (analyzer truthfulness), evidence.ts:92-308 (buildEvidenceOutput flow)*

### 11.4 Versioning

See "Versioning & Compatibility (WP11)" section above. Schema 0.2 is frozen. No breaking changes without WP10 gap proof.

### 11.5 Determinism

**Determinism Guarantee**: Same inputs → equivalent output (excluding timestamps/durations).

- **Inputs**: Evidence (git diff output, complexity intervals, coverage artifact) + config (`--crap-threshold`) + engine commit
- **Equivalent**: Identical `EvidenceOutput` JSON when serialized (schemaVersion, analysis, capabilities, changedFunctions, policy, ruleResults, analysisStatus, gate, completeness, coverageErrorReason)
- **Excluded**: Any timing-dependent fields (none currently in schema 0.2)

This means: same git base, same coverage artifact, same threshold, same engine commit → identical JSON output. No non-deterministic ordering, no random seeds, no environment-dependent paths in output.

*Evidence: evidence.ts:265-308 (output construction), Post_WP9_Detailed_Roadmap.md:135-160 (WP11 §6)*

### 11.6 Provenance

**Provenance Fields** (included in evidence output):

- `analysis.base` / `analysis.target`: Resolved Git SHAs from `--base` and HEAD
- `changedFunctions[]` each entry contains:
  - `file` / `method` / `lineStart` / `lineEnd`: Function location from complexity analyzer
  - `cc`: Cyclomatic complexity from provider
  - `crap` / `coverage` / `coverageKind`: Derived from CC and coverage
  - `analyzerStatus`: 'SUCCESS'/'FAILED'/'UNSUPPORTED' per function
  - `source`: `{ tool: string; version: string }` — e.g., `{tool:'@barney-media/crap-typescript-core', version:'0.5.0'}`
- `policy.crapThreshold`: Value from `--crap-threshold` (default 30)
- `ruleResults[]`: Includes `crap`, `threshold`, `cc`, `coverage` per function evaluation

**Implicit Provenance** (engine/environment):

- Complexity source: `@barney-media/crap-typescript-core@0.5.0` (default TS) or `lizard@1.24.0` (Python via adapter)
- Coverage source: Caller-provided path (via `--coverage-file`) + artifact size bytes + provider family (Istanbul/v8 or coverage.py)
- Config: `crapThreshold` value used
- Engine commit: Git SHA of evidence engine
- Node version: `process.version` (baseline: 24.18.1 from .nvmrc)
- Repository path: `process.cwd()`

**Reproducibility Steps**:

1. Git diff command: `git diff --base <ref> HEAD --name-only` (via git.ts)
2. Coverage generation command: `vitest run --coverage` (caller responsibility)
3. Engine invocation: `node dist/cli.js check --base <ref> [--crap-threshold <T>] [--coverage-file <path>]`
4. Environment: Node 24.18.1, current workspace, deterministic dependencies (package-lock.json)

*Evidence: evidence.ts:265-308 (output construction), package.json:3 (version), .nvmrc (Node 24.18.1), Post_WP9_Detailed_Roadmap.md §16 (repro steps pattern), WP10 §24 (engine commit)*

### Attribution Case Handling (WP12 Fix 8885796)

Provider `@barney-media/crap-typescript-core@0.5.0` lowercases coverage keys (e.g., `/users/.../src/crapcalc.ts`) while complexity file paths preserve original casing (e.g., `src/crapCalc.ts` with capital `C`). Original case-sensitive `endsWith` match in `src/attribution.ts:62` failed to match, resulting in `coverage: null` for capital-letter files (violating INV-01 ZERO≠NULL — coverage became unavailable instead of 0/100).

**Fix applied (commit 8885796)**: Changed attribution matching to case-insensitive suffix comparison via `toLowerCase()` on both provider key and complexity file path.

```typescript
// src/attribution.ts:62 (before)
if (coverageKey.endsWith(complexityFile)) { ... }

// src/attribution.ts:62 (after)
if (coverageKey.toLowerCase().endsWith(complexityFile.toLowerCase())) { ... }
```

**Verification**:
- `crapCalc.ts` now shows `coverage: 100` (was `null`), `analyzerStatus: 'SUCCESS'`
- All 188 tests pass (vitest run --coverage)
- TypeScript compilation clean (`tsc --noEmit` exit 0)
- INV-01 preserved: numeric coverage field now populated (100) instead of null
- Schema version 0.2 unchanged (additive fix, no schema bump)
- Reversible: single-line change, no behavioral side effects on matching keys
- Synthetic validation: unit tests for case-insensitive matching added in `attribution.test.ts`

*Evidence: commit 8885796, src/attribution.ts:62, attribution.test.ts (new tests), vitest run output*

### Attribution Granularity Limitation

Coverage attribution in this engine operates at **function-level granularity only**. The `coverage` field in `changedFunctions[]` represents the function coverage percentage (as reported by the coverage provider's function map), and `coverageKind` indicates the coverage dimension (statements, branches, functions, lines) — but the CRAP calculation uses only the aggregated function coverage value.

**Implications:**
- No statement-level or branch-level CRAP decomposition within function bodies.
- Branch coverage is computed at the function boundary; the prototype does not decompose CRAP further.
- Cross-function or per-line coverage is not exposed in the CRAP calculation.
- This is a deliberate design choice: deeper granularity is deferred unless proven valuable for review prioritization.

*See also: experiments/wp5/wp5.6/limitations.md §Attribution limitations*

### Python Provider Extension (WP13, 2026-09-01)

This contract supports an optional Python complexity/coverage provider extension through the existing provenance fields, including the explicit `language` field. Schema version bumped to 0.3 to reflect this additive change.

#### Provenance Field Mapping

| Field | TypeScript Provider | Python Provider (WP13) |
|-------|---------------------|------------------------|
| `changedFunctions[i].language` | implicit `typescript` | explicit `"python"` |
| `changedFunctions[i].source.tool` | `@barney-media/crap-typescript-core` | `lizard@1.8.0+coverage.py` |
| `changedFunctions[i].source.version` | `0.5.0` | `7.16.0` (coverage.py) / `1.24.0` (lizard) |
| `changedFunctions[i].cc` | `crap-typescript-core` CC | `lizard` CC (token-based, **see divergence table below**) |
| `changedFunctions[i].coverage` | Istanbul/v8 statement/branch | `coverage.py` executed_lines → line-range attribution |
| `changedFunctions[i].coverageKind` | `statements`/`branches` | `stmt` (statement coverage from executed_lines) |
| `changedFunctions[i].analyzerStatus` | `SUCCESS`/`FAILED`/`UNSUPPORTED` | same semantics |

#### Python Pipeline (adapter only, no core changes)

1. **Complexity**: `lizard src/ --json` → parse `CCN` (cyclomatic complexity number) per function → `ComplexityInfo[]`
2. **Coverage**: `python -m pytest --cov=src --cov-report=json:coverage.json` → parse `files[].functions[].summary.percent_covered` per function
3. **Attribution**: Line-range overlap (lizard `start_line`/`end_line` vs coverage `executed_lines`) → coverage percent per function
4. **CRAP Calculation**: Reuse `crapCalc.ts` unchanged: `crap = cc² × (1 - coverage/100)³ + cc`
5. **Rules**: Reuse `rules.ts` unchanged: thresholds 30 (default) and 15 (tight)
6. **Output**: `EvidenceOutput` schema 0.3 with `language: "python"` provenance in each `changedFunctions` entry

#### Invariant Preservation

- **INV-01 ZERO≠NULL**: Python `coverage = 0` when measured zero lines covered; `null` when no coverage artifact
- **INV-02 MISSING≠MALFORMED**: Missing `coverage.json` vs malformed JSON distinguished via `coverageErrorReason`
- **INV-03 GIT≠REPO**: Unchanged — git capability reflects repo access
- **INV-04 ANALYZER TRUTHFUL**: `analyzerStatus` reflects lizard/coverage.py success/failure

#### Complexity Provider Interface

The engine defines a `ComplexityProvider` interface in `src/complexity-providers.ts` and a `ProviderFactory` in `src/evidence.ts` for language-specific dispatch:

```typescript
// src/complexity-providers.ts
export interface ComplexityProvider {
  collectComplexity(cwd: string): Promise<ComplexityInfo[]>;
  readCoverage(cwd: string, coverageFile?: string): Promise<CoverageResult>;
}

// src/evidence.ts
export interface ProviderFactory {
  collectComplexity: (cwd: string) => Promise<ComplexityInfo[]>;
  readCoverage: (cwd: string, coverageFile?: string): Promise<CoverageResult>;
}
```

Providers are registered via `registerProvider(extension: string, factory: ProviderFactory)` and selected by file extension from git diff intervals.

#### CC Divergence Table (Token vs AST)

**⚠️ HYPOTHESIS — NOT YET MEASURED**. The following reflects documented design differences between Lizard (token-based) and crap-typescript-core (AST-based). Actual values require empirical correlation testing on synthetic fixtures (WP13-CC-EQUIVALENCE).

| Construct | Lizard CC (token) | crap-typescript-core CC (AST) | Status |
|-----------|-------------------|------------------------------|--------|
| Ternary expression (`condition ? expr1 : expr2`) | 1 (counts `?` as branch) | 2 (counts true/false branches) | Hypothesis — needs measurement |
| Logical AND (`expr1 && expr2`) | 1 (often missed by token scan) | 2 (each `&&` = branch) | Hypothesis — needs measurement |
| Logical OR (`expr1 || expr2`) | 1 (often missed by token scan) | 2 (each `||` = branch) | Hypothesis — needs measurement |
| Try-except / try-catch block | 1 (may not count `except`/`catch`) | 2 (each handler = branch) | Hypothesis — needs measurement |
| Async function / await | 1 (suspension points ignored) | 2 (`await` may count as yield) | Hypothesis — needs measurement |
| Simple if/else | 2 | 2 | Expected equivalent |
| For/while loop | 2 | 2 | Expected equivalent |
| Switch/match statement | N/A (Python) | N (cases) | Language-specific |

**Correction Factor**: None applied currently. Cross-language CRAP comparison not recommended until correlation ≥ 0.95 on benchmark suite.

*Source: experiments/wp13/REMAINING_LIMITATIONS_DEFERRED.md:22-45 (Limitation #2)*

#### Reversibility

Extension is additive: Python adapter lives in `experiments/wp13/adapter/`, imports core (`crapCalc.ts`, `rules.ts`, `evidence.ts`) without modification. Removing the adapter restores TypeScript-only behavior. No changes to `src/` logic.

#### Limitations

- Single synthetic fixture (`n=1`), no external real Python repo validation
- Lizard CC semantics (token-based) differ from `crap-typescript-core` AST-based CC — see divergence table above
- `coverage.py` line coverage vs branch coverage — only statement coverage (`executed_lines`) used
- File-extension detection (`.py` vs `.ts`) not in core `evidence.ts`; adapter handles language routing
- `analyzerStatus: 'UNSUPPORTED'` path untested for Python

*Evidence: experiments/wp13/adapter/pythonComplexity.ts:1-80, pythonCoverage.ts:1-95, index.ts:1-30, e2e.ts:1-180, experiments/wp13/fixtures/python-sample/coverage.json, tsc --noEmit (0 errors), vitest run --no-coverage (191/191 pass), e2e output in /tmp/wp13_e2e.json*

## Python Coverage Inputs

- **Precedence**: explicit `--coverage-file` > `.coverage` (binary, via `coverage json` auto-convert) > `coverage.xml` (Cobertura, same) > `coverage.json` (Python-schema auto-transformed to Istanbul shape) > `coverage/coverage-final.json` fallback.
- **Guards**: 100MB cap, realpath containment (explicit files bypass), 30s convert timeout, temp cleaned on all paths, missing binary → warn + malformed (never hard-fail).

- **Bugfix note**: `pythonASTComplexityProvider` end-line attr corrected `endlineno` → `end_lineno` (prior always fell back to start line).
- **WP18 GAP (a) CLOSED 2026-09-09**: Python repos analyzable end-to-end (e2e omlx-review-mcp 983a2df: ingest COMPLETE, dirty-tree attribution YES, deterministic). Remaining thin: single external repo proven; OICP-MCP/Code-Index-MCP untested.

## O-01 Q1 Breadth Expansion — PARTIAL 2026-09-11

**Repos tested**: OICP-MCP @ d906c56fb400cc71f9eaf95179ddbef7a3afcffe + Code-Index-MCP @ 55eedd68b8be9f78aa36f674608ed7e8cd65a1b4

**Acceptance triple per repo (evidence-contract.md:504)**:
- ✅ ingest: COMPLETE — Python bridge (e4dadd3) runs without error, providers registered, analysisStatus SUCCESS
- ✅ dirty-tree attribution: CORRECT — OICP dirty (untracked only) → 0 changedFunctions; Code-Index clean (base==HEAD) → 0 changedFunctions
- ✅ deterministic: 0-line diff — run1 vs run2 byte-identical JSON (415B each) for both repos

**Gate outputs** (both `--base HEAD` pinned per root-cause-B.md auto-base defect):
- OICP-MCP: PASS, changedFunctions 0, SUCCESS/COMPLETE, exit 0
- Code-Index-MCP: PASS, changedFunctions 0, SUCCESS/COMPLETE, exit 0

**Caveat — 0 changedFunctions = empty-diff PASS**: Both repos have 0 tracked changes vs HEAD → `changedFunctions: []` vacuously correct. No high-risk intervals exercised. Contrast: WP17 engram case-009 @b2c61cf had 31 changedFunctions with actual CRAP evaluation. O-01 proves *ingest pipeline works*; does **not** prove *risk detection on changed functions* for Python.

**Secondary note (out of scope)**: `evidence.ts:182` hardcoded `coverageArtifact: 'available'` in `isUnsupportedIntervals` branch — misreports capability when non-code intervals only. Not fixed (zero src/ change constraint). Documented for future.

**Status**: O-01 PARTIAL/OPEN — breadth ingest proven for 2 additional Python repos (total 3: omlx-review-mcp + OICP-MCP + Code-Index-MCP). Risk-signal-on-changes unproven (no changed functions in test set).

*Evidence: experiments/wp18-o01/RESULTS.md, experiments/wp18-o01/REPRO.md, experiments/wp18-o01/coverage-A.md, root-cause-B.md, repo-checkouts.md; mem:41224*

## T6 Seed Validation (Python change detection) — 2026-09-11

- **Seed change**: OICP-MCP @ d906c56f, src/aicp/health.py:7, added `if True: marker = 1` (complexity 1→2).
- **Detection proven**: `changedFunctions: [src/aicp/health.py:get_health_status]` (count=1), CC=2, language=python.
- **Gate**: PASS (CC=2 < threshold 30, no WARN).
- **CRAP evaluation**: INCOMPLETE due to TS-only parser in attribution path (`@barney-media/crap-typescript-core` throws on `.py` → coverage null → analyzerStatus skipped → rule NOT_EVALUATED). See evidence.ts:305-306.
- **WARN unreachable**: For Python changed functions, CRAP cannot be computed → WARN gate not triggered even if CRAP high.
- **Revert clean**: YES (git diff --name-only HEAD = 0 lines after revert).
- **Status**: O-01 remains PARTIAL — detection proven but risk-signal-on-changes unproven for full CRAP scoring.
- Mem:41224 cited.

- **Fix note**: pythonDescriptorProvider + Istanbul spans (executed/missing→statements, functions summary→fnMap with endLine synthesis) + ESM fs fix + security caps (200K line cap, reduce max) → OICP seed get_health_status cc2 coverage100 crap2 PASS COMPLETE deterministic, revert clean. WARN reachable now (same 30/15). Mem:41224.