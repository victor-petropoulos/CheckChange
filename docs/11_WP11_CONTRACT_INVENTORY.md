# WP11 Contract Inventory

## 1. Input Contract (Caller Provides)
- Git base reference: `--base <ref>` (required) [cli.ts:21-27]
- Git target reference: implicit HEAD (current commit) [evidence.ts:125-126, 167-168, 267-270]
- Istanbul JSON coverage artifact path: `--coverage-file <path>` (statementMap/fnMap/branchMap) [cli.ts:57-75, coverage.ts:77-108]
- Configuration: `--crap-threshold <T>` (default 30, CC threshold 15) [cli.ts:14, 37-55, evidence.ts:92, rules.ts:10, 17-18, 29, 40-41, 50-51]
- Repository path: `process.cwd()` (current working directory) [evidence.ts:92, cli.ts:120]
- Engine version: embedded in source (crap-typescript-core@0.5.0) [evidence.ts:221-224, complexity.ts:3, coverage.ts:3]

## 2. Output Contract (EvidenceOutput Schema 0.2)
- `analysis`: { `base`: string, `target`: string } [evidence-contract.md:15-18, evidence.ts:265-270]
- `capabilities`: {
  - `git`: 'available' | 'unavailable' | 'failed' [evidence-contract.md:19-24, evidence.ts:271-274]
  - `complexity`: 'available' | 'unavailable' | 'failed' [evidence-contract.md:19-24, evidence.ts:271-274]
  - `coverageArtifact`: 'available' | 'unavailable' | 'failed' [evidence-contract.md:19-24, evidence.ts:271-274]
  - `crapTypescript?`: 'available' | 'unavailable' | 'failed' [evidence-contract.md:19-24, evidence.ts:271-274]
}
- `changedFunctions`: [] of {
  - `file`: string (relative path from repo root) [evidence-contract.md:25-36, evidence.ts:8-19, 22-26, 40, 229-231]
  - `method`: string (function name or method signature) [evidence-contract.md:25-36, evidence.ts:8-19, 22-26, 41, 230-231]
  - `lineStart`: number (1-indexed) [evidence-contract.md:25-36, evidence.ts:8-19, 22-26, 42, 232-233]
  - `lineEnd`: number (1-indexed) [evidence-contract.md:25-36, evidence.ts:8-19, 22-26, 43, 234-235]
  - `cc`: number (cyclomatic complexity) [evidence-contract.md:25-36, evidence.ts:8-19, 22-26, 30, 44, 215, 236-237]
  - `crap`: number | null (CRAP score) [evidence-contract.md:25-36, evidence.ts:8-19, 22-26, 31, 45, 215-217, 238-239]
  - `coverage`: number | null (coverage percentage 0-100 or null) [evidence-contract.md:25-36, evidence.ts:8-19, 22-26, 32, 46, 218-219, 240-241]
  - `coverageKind`: 'statements' | 'branches' | 'functions' | 'lines' | null [evidence-contract.md:25-36, evidence.ts:8-19, 22-26, 33, 47, 220, 242-243]
  - `analyzerStatus`: 'SUCCESS' | 'FAILED' | 'UNSUPPORTED' [evidence-contract.md:25-36, evidence.ts:8-19, 22-26, 34, 48, 216-220, 244-245]
  - `source`: string (analyzer tool/version, e.g., 'crap-typescript-core@0.5.0') [evidence-contract.md:25-36, evidence.ts:8-19, 22-26, 35, 49, 221-225, 246-250]
}
- `policy`: { `crapThreshold`: number } [evidence-contract.md:37-39, evidence.ts:275-279, rules.ts:10, 29]
- `ruleResults`: [] of {
  - `ruleId`: string (e.g., 'changed-function-high-crap') [evidence-contract.md:40-49, rules.ts:3-5, 20-21, 24-26]
  - `result`: 'PASS' | 'WARN' | 'FAIL' | 'NOT_EVALUATED' [evidence-contract.md:40-49, rules.ts:3-5, 20-21, 25]
  - `file`: string (relative path from repo root) [evidence-contract.md:40-49, rules.ts:3-5, 20-21, 6-7]
  - `method`: string (function name or method signature) [evidence-contract.md:40-49, rules.ts:3-5, 20-21, 6-7]
  - `crap`: number (CRAP score of the function) [evidence-contract.md:40-49, rules.ts:3-5, 20-21, 8]
  - `threshold`: number (CRAP threshold used for this evaluation) [evidence-contract.md:40-49, rules.ts:3-5, 20-21, 9]
  - `cc`: number (cyclomatic complexity) [evidence-contract.md:40-49, rules.ts:3-5, 20-21, 10]
  - `coverage`: number | null (coverage percentage) [evidence-contract.md:40-49, rules.ts:3-5, 20-21, 11]
}
- `analysisStatus`: 'SUCCESS' | 'FAILED' | 'UNSUPPORTED' [evidence-contract.md:50-54, evidence.ts:50-52, 280-282]
- `gate`: 'PASS' | 'WARN' | null [evidence-contract.md:50-54, evidence.ts:50-52, 281-283]
- `completeness`: 'COMPLETE' | 'INCOMPLETE' | 'NOT_APPLICABLE' [evidence-contract.md:50-54, evidence.ts:50-52, 282-284]
- `coverageErrorReason?`: 'missing' | 'malformed' [evidence-contract.md:50-54, evidence.ts:146-158, 149, 157-158, 206, 212, 307]

## 3. Error Vocabulary & Invariants
- INV-01: ZERO≠NULL — Numeric fields use 0 for measured zero, null for unavailable/unmeasurable [evidence-contract.md:61-62, evidence.ts:216, coverage.ts:21]
- INV-02: MISSING≠MALFORMED — Missing coverage (no artifact) vs malformed coverage (invalid JSON) distinguished via `coverageErrorReason` [evidence-contract.md:64-65, evidence.ts:146-158]
- INV-03: GIT≠REPO — Git capability reflects ability to access repository, not monorepo status [evidence-contract.md:67-68, evidence.ts:65-72]
- INV-04: ANALYZER TRUTHFUL — `analyzerStatus` accurately reflects success/failure/unsupported state of analyzers [evidence-contract.md:70-71, evidence.ts:216]

Mapping of conditions:
- Coverage missing → `coverageErrorReason`: 'missing', `coverage`: null, `coverageCapability`: 'absent' [coverage.ts:91-96]
- Coverage malformed → `coverageErrorReason`: 'malformed', `coverage`: null, `coverageCapability`: 'failed' [coverage.ts:104-107]
- Complexity failure → `analyzerStatus`: 'UNSUPPORTED', `complexity`: 'failed' [evidence.ts:167-172]
- Coverage failure → `analysisStatus`: 'FAILED', `coverageArtifact`: 'failed' [evidence.ts:194-200]
- Git failure → handled in cli.ts [cli.ts:154-158]
- Non-TS changes → `analysisStatus`: 'UNSUPPORTED', `gate`: null, `completeness`: 'NOT_APPLICABLE' [evidence.ts:120-142]

## 4. CLI Contract
- Command: `check --base <ref> [--json] [--crap-threshold <T>] [--coverage-file <path>] [--verbose] [--help]` [cli.ts:86-93]
- `--base <ref>`: Git baseline reference (required SHA/branch/tag) [cli.ts:21-27, 95-99]
- `--json`: Output JSON (default: false) [cli.ts:28-30, 124-127]
- `--crap-threshold <T>`: CRAP threshold for WARN (default: 30) [cli.ts:37-55, 14, evidence.ts:92]
- `--coverage-file <path>`: Istanbul coverage JSON file path [cli.ts:57-75, 15, coverage.ts:77-108]
- `--verbose`: Print diagnostic info to stderr [cli.ts:34-36, 121-123]
- `--help`: Show usage and exit [cli.ts:31-33, 85-94]
- Positional: "check" (required) [cli.ts:100-104]
- Exit 0: When `analysisStatus` is `SUCCESS` and `gate` is `PASS` (or `UNSUPPORTED` with `gate` null and `completeness` `NOT_APPLICABLE`) [evidence-contract.md:81, cli.ts:143-152]
- Exit 1: When `analysisStatus` is `FAILED` (provider failure) or `gate` is `WARN` or when Git command fails [evidence-contract.md:82, cli.ts:132-141, 143-152]
- JSON Truthfulness: All fields reflect actual state; no omissions or defaulting when unavailable [evidence-contract.md:83-84, 108-109]

## 5. Determinism Guarantee
- Same evidence (git base/target SHAs, changed functions, coverage artifact) + same config (--crap-threshold) + same engine version (crap-typescript-core@0.5.0, Node version) → equivalent output (identical EvidenceOutput JSON) [WP10 §3, WP10 §9, Post_WP9_Detailed_Roadmap.md §6]
- Deterministic pipeline: git diff → intervals → complexity → coverage attribution → CRAP → threshold → analyzerStatus → rules → gate/completeness → analysisStatus → JSON/CLI [evidence-contract.md:86-102]
- Engine does not infer, predict, or apply judgment — only produces factual evidence [WP10 §3, evidence-contract.md:120-122]

## 6. Provenance Tracking
- Base SHA: resolved Git baseline reference [evidence.ts:125, cli.ts:116]
- Target SHA: resolved Git target reference (HEAD) [evidence.ts:126, cli.ts:116-118]
- Function evidences: file, method, lineStart, lineEnd, cc, crap, coverage, coverageKind, analyzerStatus, source [evidence.ts:8-19, 22-26, 229-250]
- Complexity source: `@barney-media/crap-typescript-core@0.5.0` [evidence.ts:221-224, complexity.ts:3, coverage.ts:3]
- Coverage source: artifact path + file size (from --coverage-file or default coverage/coverage-final.json) [coverage.ts:77-108]
- Config: crapThreshold value used [evidence.ts:92, rules.ts:10, 29]
- Engine commit: git SHA of evidence engine [Post_WP9_Detailed_Roadmap.md §6, WP10 §24]
- Node version: process.version [Post_WP9_Detailed_Roadmap.md §16]
- Repro steps: exact command + environment + artifact versions [Post_WP9_Detailed_Roadmap.md §16]

## 7. References
- Roadmap WP11 §6: Input/output contract definition [Post_WP9_Detailed_Roadmap.md:135-160]
- WP10 §3 Evidence In/Out: Consumed vs produced + refusals [docs/10_WP10_CAPABILITY_DEFINITION.md:62-100]