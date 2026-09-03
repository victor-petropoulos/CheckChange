# WP12 Local Dry-run Harness Documentation

## Pipelines

### P1: Default (threshold 30)
```bash
vitest run --coverage && checkchange check --base HEAD~1 --json
```

> `checkchange` available globally via `npm link` (or `npx checkchange` from repo root). `--base` now optional — auto-detects fallback chain if omitted.

### P2: Explicit (threshold 15 override)
```bash
vitest run --coverage && checkchange check --base HEAD~1 --coverage-file coverage/coverage-final.json --crap-threshold 15 --json
```

> `--base` optional; auto-detect fallback if omitted.

## Expected JSON Output (Schema 0.2)

The JSON output conforms to the frozen Evidence Contract schema version 0.2. Top-level fields:

```typescript
interface EvidenceOutput {
  schemaVersion: "0.2";
  analysis: {
    base: string;      // Resolved Git SHA of --base ref
    target: string;    // Resolved Git SHA of HEAD (always "current" in CLI)
  };
  capabilities: {
    git: 'available' | 'unavailable' | 'failed';
    complexity: 'available' | 'unavailable' | 'failed';
    coverageArtifact: 'available' | 'unavailable' | 'failed';
  };
  changedFunctions: {
    file: string;
    method: string;
    lineStart: number;
    lineEnd: number;
    cc: number;
    crap: number;
    coverage: number | null;       // 0-100 or null if unavailable
    coverageKind: 'statements' | 'branches' | 'functions' | 'lines' | null;
    analyzerStatus: 'SUCCESS' | 'FAILED' | 'UNSUPPORTED';
    source: { tool: string; version: string };
  }[];
  ruleResults: {
    ruleId: string;
    result: 'PASS' | 'WARN' | 'FAIL' | 'NOT_EVALUATED';
    file: string;
    method: string;
    crap: number;
    threshold: number;
    cc: number;
    coverage: number | null;
  }[];
  policy: {
    crapThreshold: number;   // From --crap-threshold (default 30)
  };
  analysisStatus: 'SUCCESS' | 'FAILED' | 'UNSUPPORTED';
  gate: 'PASS' | 'WARN' | null;
  completeness: 'COMPLETE' | 'INCOMPLETE' | 'NOT_APPLICABLE';
  coverageErrorReason?: 'missing' | 'malformed';  // Only when analysisStatus === 'FAILED'
}
```

**Key corrections from prior draft:**
- `gate` is **not boolean** — it is `'PASS' | 'WARN' | null`
- `completeness` is **not 0-100** — it is `'COMPLETE' | 'INCOMPLETE' | 'NOT_APPLICABLE'`
- No top-level `provenance` object exists — provenance is embedded in `analysis.base/target`, `changedFunctions[i].source`, `policy.crapThreshold`, `ruleResults[]`
- `coverageErrorReason` only present when `analysisStatus === 'FAILED'`

## Exit Code Matrix (cli.ts:143-151)

| Condition                                                                 | Exit Code |
|---------------------------------------------------------------------------|-----------|
| `analysisStatus === 'SUCCESS'` **and** `gate === 'PASS'`                  | 0         |
| `analysisStatus === 'SUCCESS'` **and** `gate !== 'PASS'` (i.e., `WARN`)   | 1         |
| `analysisStatus === 'UNSUPPORTED'` **and** `gate === null` **and** `completeness === 'NOT_APPLICABLE'` | 0         |
| `analysisStatus === 'UNSUPPORTED'` **and** NOT (`gate === null` **and** `completeness === 'NOT_APPLICABLE'`) | 1         |
| `analysisStatus === 'FAILED'` (any coverage/complexity/attachment failure) | 1         |
| Invalid `--base` (unresolvable, not a repo, git ENOENT) — caught in `cli.ts` try/catch | 1         |
| `--coverage-file` missing file (explicit path)                            | 1 (FAILED/missing) |
| `--coverage-file` malformed JSON / invalid Istanbul shape                 | 1 (FAILED/malformed) |
| `--crap-threshold` NaN or negative                                        | 1 (validation error, stderr) |

**Note**: `vitest run --coverage` must succeed (exit 0) for the check to run due to `&&`. If vitest fails, overall command fails before CLI executes.

## F-03 Path Rebasing: `normalizeCoveragePaths` (coverage.ts:38-75)

Coverage artifacts from `vitest run --coverage` contain absolute file paths from the generation environment. When replayed in a different cwd (cross-machine, cross-CI, re-clone), absolute keys no longer match repo-relative paths used by complexity analyzer.

**Rebasing algorithm** (`src/coverage.ts:38-75`):
1. Iterate each absolute key in coverage Map
2. For each key, split into path segments
3. Find longest suffix that, when resolved against current `cwd`, points to an existing file
4. Rewrite key to the rebased absolute path under current checkout
5. If no match found, leave key unchanged (attribution uses `endsWith()` suffix matching as fallback)

**Verification in dry-run**: After `vitest run --coverage`, inspect `coverage/coverage-final.json` — keys should be absolute paths under current working directory, not the CI runner's temp paths.

## UNSUPPORTED Analysis Status

`analysisStatus === 'UNSUPPORTED'` with `gate === null` and `completeness === 'NOT_APPLICABLE'` occurs when:

1. **No changed TypeScript functions**: Git diff produces intervals, but `isUnsupportedIntervals()` returns true — intervals non-empty and **all files non-TS** (no `.ts`/`.tsx` files)
2. **Complexity analyzer failure**: `collectComplexity()` throws (TypeScript parse error) — `capabilities.complexity = 'failed'`

In both cases: `changedFunctions: []`, `ruleResults: []`, exit code 0 (per matrix above).

This is **not an error** — it means the engine cannot evaluate CRAP for the current changes (non-TS changes only or analyzer unavailable), so it passes deterministically with no gate enforcement.

## Common Failure Mode Recovery Steps

### Missing Base Ref (shallow checkout)
- **Symptom**: `git rev-parse HEAD~1` fails, CLI exits 1 with "Cannot resolve base reference"
- **Cause**: CI shallow fetch (`fetch --depth=1`) omits history needed for `HEAD~1`
- **Recovery**: 
  - Fetch base explicitly: `git fetch --depth=1 origin main` (or `git fetch --unshallow`)
  - Use existing ref: `--base origin/main` or `--base <known-sha>`
  - Local: ensure repo has full history (`git fetch --unshallow`)

### Missing Coverage File
- **Symptom**: `analysisStatus: 'FAILED'`, `coverageErrorReason: 'missing'`, exit 1
- **Cause**: Explicit `--coverage-file` path does not exist or is unreadable
- **Recovery**: 
  - Verify vitest generated coverage: `ls -la coverage/coverage-final.json`
  - Check vitest config: `coverage.enabled = true`, `coverage.reporter = ['json']`
  - Default path (no flag): `coverage/coverage-final.json` missing → `capabilities.coverageArtifact: 'unavailable'` (not FAILED)

### Malformed Coverage JSON
- **Symptom**: `analysisStatus: 'FAILED'`, `coverageErrorReason: 'malformed'`, exit 1
- **Cause**: Coverage file exists but invalid JSON or missing Istanbul fields (`statementMap`, `fnMap`, `branchMap`)
- **Recovery**:
  - Validate JSON: `cat coverage/coverage-final.json | jq .`
  - Re-run vitest with clean coverage: `rm -rf coverage && vitest run --coverage`

### Git ENOENT / Not a Repository
- **Symptom**: CLI exits 1 with "Git executable not found" or "Not a git repository"
- **Cause**: `git` not in PATH, or cwd not a git repo
- **Recovery**:
  - Ensure `git` installed and in PATH
  - Run from repo root: `git rev-parse --show-toplevel`
  - CI: `actions/checkout` creates valid repo; verify working directory

### Threshold Validation Error
- **Symptom**: CLI exits 1 with "Error: --crap-threshold must be a finite non-negative number"
- **Cause**: `--crap-threshold` value is NaN, negative, or non-numeric
- **Recovery**: Pass valid number: `--crap-threshold 15` or `--crap-threshold=15`

## Frozen Contract Reference

- **Schema version**: 0.2 (frozen at WP5.6, F-03 additive compatible)
- **Default CRAP threshold**: 30 (override via `--crap-threshold`)
- **Explicit override in P2**: 15
- **Invariants preserved**: INV-01 (ZERO≠NULL), INV-02 (MISSING≠MALFORMED), INV-03 (GIT≠REPO), INV-04 (ANALYZER TRUTHFUL)
- **Determinism**: Same inputs → equivalent JSON output (excluding timestamps/durations)
- **Provenance**: Embedded in output — no separate provenance object
