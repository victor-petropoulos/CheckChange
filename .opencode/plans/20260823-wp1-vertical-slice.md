---
task: "WP1 — Changed-Function Vertical Slice"
created: 2026-08-23T12:00:00.000Z
approved: true
tasks:
  - id: "1"
    description: "Bootstrap project scaffolding: package.json (npm ESM Node 24), tsconfig.json (strict NodeNext), eslint.config.js, src/execute.ts (execFile wrapper with timeout/cwd/stdout/stderr/exitCode)"
    agent: "implementer"
    files: ["package.json", "tsconfig.json", "eslint.config.js", "src/execute.ts"]
    acceptance: "npm install succeeds, npx tsc --noEmit passes, execute.ts wraps execFile with command/args/cwd/timeout/maxBuffer"
    depends_on: []
  - id: "2"
    description: "Implement git diff parsing: src/git.ts — validate git repo, resolve base ref (git rev-parse --verify), run git diff --unified=0 <base> and parse hunk headers (@@ -old,len +new,len @@) into current-side intervals (newStart..newEnd), handle single-line forms, map by file"
    agent: "implementer"
    files: ["src/git.ts"]
    acceptance: "Parses @@ -10,2 +12,5 @@ => 12..16; single-line @@ -19 +19 @@ => 19..19; pure deletions produce no interval; handles added/deleted files; unit tests green"
    depends_on: ["1"]
  - id: "3"
    description: "Implement crap-typescript full JSON execution: src/crap.ts — invoke npx --no-install crap-typescript --format json, capture stdout/stderr/exitCode/duration, handle exit 2 as valid JSON when stdout parses, normalize to MethodEvidence {file, method, lineStart, lineEnd, cc, crap, coverage, coverageKind, analyzerStatus}"
    agent: "implementer"
    files: ["src/crap.ts"]
    acceptance: "Parses WP0 sample crap-full.json correctly, maps cov:null/covKind=N/A/status=skipped as unavailable, handles exit 2 with valid JSON, rejects invalid JSON"
    depends_on: ["1"]
  - id: "4"
    description: "Implement interval correlation: src/evidence.ts — correlate MethodEvidence[] against git intervals via integer overlap (same file AND methodStart <= changeEnd AND changeStart <= methodEnd), emit ChangedFunction[] with source {tool,version}"
    agent: "implementer"
    files: ["src/evidence.ts"]
    acceptance: "Modified add (1-17 ∩ 2-15) => matched, new multiply (19-31 ∩ 17-30) => matched, rename times (19-31 ∩ 19) => matched via lines not name, non-overlapping => not matched; no AST used"
    depends_on: ["2", "3"]
  - id: "5"
    description: "Implement CLI: src/cli.ts — parseArgs for check --base <ref> --json, validate explicit base required, orchestrate git→crap→evidence, emit JSON shape {schemaVersion:0.1, analysis:{base,target}, capabilities:{git,crapTypescript}, changedFunctions:[]}"
    agent: "implementer"
    files: ["src/cli.ts"]
    acceptance: "tool check --base <ref> --json outputs required shape; --base missing => error; invalid base => capability failed with detail; git unavailable / crap unavailable distinguished"
    depends_on: ["4"]
  - id: "6"
    description: "Tests for required cases: hunk parsing, interval intersection, sample WP0 JSON parsing, exit code 2 valid JSON, unavailable coverage, no-match behavior"
    agent: "implementer"
    files: ["test/git.test.ts", "test/crap.test.ts", "test/evidence.test.ts"]
    acceptance: "vitest run green covering all 6 required test areas per WP1 spec § Required Tests"
    depends_on: ["5"]
  - id: "7"
    description: "Experiments and results doc: capture real tool output against WP0 fixture (git diff + crap JSON), verify correlation on 4 cases, write docs/research/WP1_VERTICAL_SLICE_RESULTS.md with size, commands, sample JSON, supported/unsupported, observed behavior, deviations, custom analysis check, ending GO/GO WITH CONSTRAINTS/STOP"
    agent: "implementer"
    files: ["experiments/wp1/**", "docs/research/WP1_VERTICAL_SLICE_RESULTS.md"]
    acceptance: "Results doc exists, contains all required sections per WP1 spec, ends with exactly one decision line, no WP2 work started"
    depends_on: ["6"]
---

# WP1 — Changed-Function Vertical Slice — Plan

## Overview
Build minimal deterministic glue: `git diff -U0` against explicit base + full `crap-typescript` JSON → `changed-function JSON`. No rules, no gates, no AST parsing.

## Scope
- Only WP1 deliverables: `src/cli.ts`, `src/execute.ts`, `src/git.ts`, `src/crap.ts`, `src/evidence.ts`, tests, `experiments/wp1/`, `docs/research/WP1_VERTICAL_SLICE_RESULTS.md`
- Node 24, TS 6.x strict ESM, npm, parseArgs, execFile, vitest

## Constraints (from WP0 / WP1 spec)
1. Run FULL crap-typescript analysis, not --changed for attribution
2. Require explicit --base <git-ref>
3. Preserve cov:null / covKind:"N/A" / status:"skipped" as unavailable
4. Do not reconstruct deleted-function metrics (git-side only)
5. Pin @barney-media/crap-typescript@0.5.0
6. Correlate by file+line interval, not method name
7. Do not evaluate CRAP thresholds in WP1
8. No AST, no provider/plugin abstractions, no Engram/MCP/LLM

## Execution Flow (per WP1 spec §Execution Flow)
1. Validate git repo, base ref resolves
2. Parse current-side changed intervals from git diff -U0
3. Run full crap JSON, capture stdout/stderr/exit/duration (exit 2 = threshold breach but valid JSON)
4. Normalize to MethodEvidence
5. Correlate via integer overlap
6. Emit JSON only

## Error States to distinguish
- git unavailable
- invalid base ref
- crap-typescript unavailable
- analyzer execution failure
- invalid analyzer JSON
- coverage unavailable (valid evidence but skipped)
- no changed methods matched (not error)

## Forbidden in WP1
Do not implement rules, CRAP calc, complexity, coverage parsing, ESLint/typecheck/test evidence, LLM, Engram, MCP, security, multi-lang, provider registries, plugins, DB, telemetry, dashboard.

## Verification
- npx tsc --noEmit clean
- npx eslint . (if config present)
- npx vitest run green
- Manual: tool check --base <ref> --json against WP0 fixture produces expected changedFunctions
- Graphify update after code changes (optional)

## Risks
- No src/package.json at root yet → bootstrap needed
- git diff parsing edge cases (renames, deletes, added files)
- crap-typescript may not be installed at repo root (fixture has it) — need to handle unavailable gracefully or install at root for WP1
- Empty git history at repo root (no commits) — use WP0 fixture repo for correlation verification
