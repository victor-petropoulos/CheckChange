# Evidence Contract

## Version: 0.2.0
## Date: 2026-08-28
## Status: FROZEN (WP5.6 freeze at commit 21daa57, F-03 additive compatible)

### Schema Version 0.2

The evidence contract defines the deterministic output of the code-risk evidence engine.

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
    source: string;             // Analyzer tool/version (e.g., 'crap-typescript-core@0.5.0')
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
}
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

- **Schema Version 0.2 Lifecycle**: Currently frozen per WP5.6; no breaking changes permitted without demonstrated gap requiring engine evolution.
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
- **Current State**: No bump to 0.3 now; gap must be proven via WP10 §9 (caller-owned coverage burden 4.96s) or WP11 roadmap validation before any engine change.
  *Evidence: evidence-contract.md:3-5 (frozen status), Post_WP9_Detailed_Roadmap.md:135-160 (WP11 §6)*

### Input Contract & Validation (WP11)

Validation rules for CLI inputs and their deterministic effects on evidence output:

- **--base (required)**:
  - Valid: Non-empty string resolving via `git rev-parse` → `capabilities.git = 'available'`, `analysisStatus` proceeds
  - Invalid (empty/null/unresolvable): `capabilities.git = 'failed'`, `analysisStatus = 'FAILED'`, `gate = null`, exit code 1, stderr: "Cannot resolve base reference: <ref>"
  *Evidence: cli.ts:21-27 (parse), cli.ts:95-99 (required), cli.ts:154-158 (git errors)*

- **--coverage-file (optional)**:
  - If supplied:
    - Path existence: `access(path, R_OK)` → if fails: `coverageErrorReason = 'missing'`, `capabilities.coverageArtifact = 'failed'`, `analysisStatus = 'FAILED'`, exit 1
    - JSON parse: `parseCoverageReport()` → if throws: `coverageErrorReason = 'malformed'`, `capabilities.coverageArtifact = 'failed'`, `analysisStatus = 'FAILED'`, exit 1
    - Istanbul shape: Must contain `statementMap`, `fnMap`, `branchMap` → if missing: `coverageErrorReason = 'malformed'`, same failure path
    - Absolute keys: Rebased via `normalizeCoveragePaths()` per F-03 (evidence.ts:148-160, coverage.ts:38-75)
  - If not supplied: Uses default `coverage/coverage-final.json`; missing default → `available = false` (not error) per WP5.6
  *Evidence: coverage.ts:77-108 (readCoverage), cli.ts:57-75 (coverageFile parsing)*

- **--crap-threshold (optional, default 30)**:
  - Valid: `parseFloat()` → finite ≥ 0 (integer or float)
  - Invalid (NaN/negative): exit 1, stderr: "Error: --crap-threshold must be a finite non-negative number"
  *Evidence: cli.ts:37-55 (threshold parsing), cli.ts:51-53 (validation error)*

- **Repository Path (`process.cwd()`)**:
  - Must be valid git repo (validated via `validateGitRepo()` in cli.ts:114)
  - If not repo: `capabilities.git = 'failed'`, `analysisStatus = 'FAILED'`, exit 1, stderr: "Not a git repository"
  *Evidence: cli.ts:114 (validateGitRepo), evidence.ts:92 (cwd usage)*

- **Engine Version**:
  - Node 24.18.1 baseline (from `.node-version`/`.nvmrc`)
  - Package version from `package.json` (currently 0.2.0)
  - Complexity analyzer: `@barney-media/crap-typescript-core@0.5.0` (fixed per WP10 §3 refusal)
  *Evidence: package.json:3,16, evidence.ts:221-225 (source setting)*

For each invalid input, the engine preserves truthful propagation:
  raw condition → internal evidence (capabilities/coverageErrorReason) → function result (empty arrays) → analyzerStatus → gate/completeness → JSON → CLI → exit code
  *Evidence: evidence.ts:92-308 (buildEvidenceOutput flow)*

### Error Semantics Exhaustive (WP11)

Mapping of error conditions to deterministic evidence state, preserving INV-01..04:

| Condition | capabilities.state | analysisStatus | completeness | gate | coverageErrorReason | exit code | stderr diagnostic |
|-----------|-------------------|----------------|--------------|------|---------------------|-----------|-------------------|
| Missing coverage file (--coverage-file missing) | coverageArtifact: 'failed' | FAILED | INCOMPLETE | null | 'missing' | 1 | "coverage artifact missing" |
| Malformed coverage JSON | coverageArtifact: 'failed' | FAILED | INCOMPLETE | null | 'malformed' | 1 | "coverage artifact malformed" |
| Git ENOENT (executable unavailable) | git: 'failed' | FAILED | any | null | unchanged | 1 | "Git executable not found" |
| Not-a-repo (invalid cwd) | git: 'failed' | FAILED | any | null | unchanged | 1 | "Not a git repository" |
| Zero coverage (cc=12, cov=0 → crap=156) | coverageArtifact: 'available' | SUCCESS | COMPLETE | WARN | null | 1 | (none; gate WARN) |
| Low coverage (cc=12, cov=10 → crap=124.2) | coverageArtifact: 'available' | SUCCESS | COMPLETE | WARN | null | 1 | (none; gate WARN) |
| Full coverage (cc=12, cov=100 → crap=12) | coverageArtifact: 'available' | SUCCESS | COMPLETE | PASS | null | 0 | (none; gate PASS) |
| Unavailable coverage (no artifact, default path) | coverageArtifact: 'unavailable' | SUCCESS | COMPLETE | PASS/WARN | null | 0/1 | (none; depends on changed functions) |
| Complexity failure (TS parse error) | complexity: 'failed' | UNSUPPORTED | NOT_APPLICABLE | null | unchanged | 1 | (from collectComplexity catch) |
| Non-TS changes only | git: 'available' | UNSUPPORTED | NOT_APPLICABLE | null | unchanged | 0 | (none; special case) |

Truthful propagation examples:
- **missing coverage file**: `--coverage-file missing.json` → `access()` fails → `coverageErrorReason='missing'` → `coverageArtifact='failed'` → `analysisStatus='FAILED'` → `gate=null` → exit 1
  *Evidence: coverage.ts:91-96 (missing file handling), evidence.ts:195-200 (failed coverage → FAILED status)*
- **malformed JSON**: invalid `{` in coverage file → `parseCoverageReport()` throws → `coverageErrorReason='malformed'` → same failure path
  *Evidence: coverage.ts:104-107 (malformed catch), evidence.ts:195-200*
- **git ENOENT**: `validateGitRepo()` catches ENOENT from git command → exits before evidence build
  *Evidence: cli.ts:154-158 (git error handling)*
- **zero vs low coverage**: CC=12, cov=0 → crap=12²×(1-0/100)³+12=156 → WARN if threshold=150; cov=10 → crap≈124.2 → WARN; cov=100 → crap=12 → PASS
  *Evidence: crapCalc.ts:1-10 (CRAP formula), rules.ts:20-56 (threshold comparison)*
- **unavailable coverage**: No coverage file → `readCoverage()` returns `{available:false, error:false}` → `coverageArtifact='unavailable'` → `analyzerStatus='SUCCESS'` → gate based on rule results
  *Evidence: coverage.ts:94-97 (default missing), evidence.ts:153-155 (available=false handling)*

All mappings preserve INV-01..04:
  - INV-01: Numeric fields use 0 for measured zero (cc=0 possible), null for unavailable (coverage=null when unavailable)
  - INV-02: `coverageErrorReason` distinguishes 'missing' (no file) vs 'malformed' (invalid JSON)
  - INV-03: `capabilities.git` reflects repo access ability, unaffected by monorepo structure
  - INV-04: `analyzerStatus` accurately reflects provider success/failure/unsupported state
  *Evidence: evidence-contract.md:61-71 (invariants), evidence.ts:216 (analyzer truthfulness)*

### Determinism & Provenance (WP11)

Determinism guarantee and provenance tracking for reproducible evidence:

- **Determinism Guarantee**: Same inputs → equivalent output (excluding timestamps/durations)
  - Inputs: evidence (git diff output, complexity intervals, coverage artifact) + config (--crap-threshold) + engine commit
  - Equivalent: Identical `EvidenceOutput` JSON when serialized (schemaVersion, analysis, capabilities, changedFunctions, policy, ruleResults, analysisStatus, gate, completeness, coverageErrorReason)
  - Excluded: Any timing-dependent fields (none currently in schema 0.2)
  *Evidence: evidence-contract.md:74-101 (provenance pipeline), Post_WP9_Detailed_Roadmap.md:135-160 (WP11 §6)*

- **Provenance Fields** (included in evidence output):
  - `analysis.base`/`analysis.target`: Resolved Git SHAs from `--base` and HEAD
  - `changedFunctions[]`: Each entry contains:
    - `file`/`method`/`lineStart`/`lineEnd`: Function location from complexity analyzer
    - `cc`: Cyclomatic complexity from `@barney-media/crap-typescript-core@0.5.0`
    - `crap`/`coverage`/`coverageKind`: Derived from CC and coverage
    - `analyzerStatus`: 'SUCCESS'/'FAILED'/'UNSUPPORTED' per function
    - `source`: `{tool:'@barney-media/crap-typescript-core', version:'0.5.0'}`
  - `policy.crapThreshold`: Value from `--crap-threshold` (default 30)
  - `ruleResults[]`: Includes `crap`, `threshold`, `cc`, `coverage` per function evaluation
  - Implicit provenance (engine/environment):
    - Complexity source: `@barney-media/crap-typescript-core@0.5.0` (evidence.ts:221-225)
    - Coverage source: Caller-provided path (via `--coverage-file`) + artifact size bytes + provider family (Istanbul/v8)
    - Config: `crapThreshold` value used (evidence.ts:92, rules.ts:10,29)
    - Engine commit: Git SHA of evidence engine (current: bd6bb3e... from package.json version 0.2.0)
    - Node version: `process.version` (baseline: 24.18.1 from .nvmrc)
    - Repository path: `process.cwd()` (evidence.ts:92)

- **Reproducibility Steps** (WP9-style):
  1. Git diff command: `git diff --base <ref> HEAD --name-only` (via git.ts)
  2. Coverage generation command: `vitest run --coverage` (caller responsibility)
  3. Engine invocation: `node dist/cli.js check --base <ref> [--crap-threshold <T>] [--coverage-file <path>]`
  4. Environment: Node 24.18.1, current workspace, deterministic dependencies (package-lock.json)
  *Evidence: Post_WP9_Detailed_Roadmap.md §16 (repro steps pattern), WP10 §24 (engine commit), WP10 §3 (refusals)*

This section adds no new schema fields; all provenance is either in existing output structure or implicit in engine/version.
  *Evidence: evidence.ts:265-308 (output construction), package.json:3 (version), .nvmrc (Node 24.18.1)*