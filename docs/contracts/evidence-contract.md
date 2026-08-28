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

### Versioning & Compatibility

Following semantic versioning given the contract stability:

- **Patch Version (0.2.x)**: Bug fixes that are additive and backward-compatible (e.g., F-03 path normalization in WP5.6 remediation, which added a function but did not change the schema).
- **Minor Version (0.x.0)**: Additive fields that do not break existing consumers (e.g., adding a new optional field to an object).
- **Major Version (x.0.0)**: Breaking changes to the schema (e.g., removing a field, changing a type, or renaming a field).

### Unsupported Conditions

The evidence engine makes no guarantees outside the tested scope:

- **Monorepos**: Untested; Git diff may produce unexpected results.
- **LCOV**: Only Istanbul/v8 JSON format is supported; LCOV is unsupported.
- **Coverage Generation**: Caller owns coverage generation; the engine only reads existing coverage artifacts.
- **Language Scope**: TypeScript and JavaScript only; other languages will result in `UNSUPPORTED` for complexity and coverage.

### Evidence Boundary

The evidence engine produces **factual, deterministic evidence** about the code state. It does **not** perform judgment on usefulness, quality, or suitability. Consumers (CI systems, policy engines, LLMs) are responsible for applying judgment based on the evidence.

### References

- WP5.6 Freeze: `experiments/wp5/wp5.6/WP5_6_CLOSURE.md` (contract section)
- WP5.6 Remediation: `experiments/wp5/wp5.6/WP5_6_REMEDIATION_CLOSURE.md`
- Failure Semantics Contract: `experiments/wp5/wp5.4/failure-semantics-contract.md`
- Strategic Direction Evaluation: `experiments/wp6/strategy-evaluation.md` (T2 output)
- Project Index: `docs/00_PROJECT_INDEX.md`
- Evidence and Rules: `docs/05_EVIDENCE_AND_RULES.md`