# WP0 — Evidence Feasibility Spike

Date: 2026-08-23
Controlling document: `docs/implementation/UGLY_PROTOTYPE_OPENCODE_PROJECT_PLAN.md` §5
Fixture: `experiments/wp0/fixture/` (standalone git repo, 6 commits: 5977cae → 2355b84)
Raw evidence policy: every tool invocation preserved byte-for-byte under `experiments/wp0/raw/`; analysis lives in notes, raw files untouched after capture.

## Objective

> Can existing TypeScript tools provide the minimum deterministic facts needed by the prototype without us writing an analyzer?

Primary tool under test: `@barney-media/crap-typescript@0.5.0` (installed in fixture only).

## Method

1. Built minimal strict-TS fixture (ESM, Node 24, vitest + v8 coverage, ESLint flat) with a simple baseline (`add`), a branching modification of it, and an added function (`multiply`). Baseline committed, change committed. Verification at each stage: `npx tsc --noEmit` exit 0, `npx vitest run` green.
2. Ran crap-typescript full + changed modes; captured stdout/stderr/exit codes unmodified.
3. Probed unavailable-coverage representation via an untested file (added, measured, removed).
4. Probed `--changed` semantics with an uncommitted edit (applied, measured, reverted).
5. Correlated git `-U0` hunks against per-function line ranges across four cases: modified, new, renamed, deleted function.

## Findings by step

### Step 0.1 — Fixture
Created and verified. Evidence: `notes/vitest-transcript.txt`, `notes/tsc-transcript.txt`, fixture git history.

### Step 0.2 — crap-typescript JSON schema
Stable, machine-readable, sufficient. Full field map with citations: `notes/schema-observations.md`. Summary:
- Top level: `{status, threshold, methods[]}`.
- Per method: `{status: passed|failed|skipped, crap, cc, cov, covKind, method, src, lineStart, lineEnd}`.
- Function identifier = bare name + project-relative `src` path + exact line span.
- CRAP value derivable from captured fields (cc²·(1−cov/100)+cc verified against emitted value).
- Default threshold 6.0, overridable via `--threshold`; meaningful exit codes 0/1/2 (threshold breach = 2); human message on stderr, pure JSON on stdout.
Evidence: `raw/crap-full.json`, `raw/crap-full.exit.txt` (stale mis-capture, superseded by `raw/exit-code-verification.txt`: verified exit 2), `raw/crap-full.stderr.txt`.

### Step 0.3 — Coverage
crap-typescript drives the project's own test runner and emits per-function statement coverage directly in its JSON (`cov`, `covKind:"stmt"`). Direct coverage-output parsing would duplicate data the tool already provides → **defer ingestion** (simplest option per plan §5 Step 0.3). Unavailable coverage is explicit, never silent: `{cov:null, covKind:"N/A", status:"skipped"}`. Evidence: `raw/crap-nocov.json`.

### Step 0.4 — Typecheck
`npx tsc --noEmit`: exit 0 = PASS, nonzero = FAIL details on stderr. For prototype purposes PASS/FAIL/UNAVAILABLE semantics are trivially derivable from exit code alone; no diagnostic parsing needed now. Evidence: `notes/tsc-transcript.txt`.

### Step 0.5 — ESLint
Machine-readable output available via `--format json`; zero findings on fixture (exit 0). PASS/FAIL from exit code; finding counts available from JSON array lengths if later wanted. No rule normalization required for WP0. Evidence: `notes/eslint-transcript.txt`.

### Step 0.6 — Git correlation
**All four cases correlate with integer line-interval arithmetic only — no AST parsing performed or needed.**

| Case | Result |
|------|--------|
| modified `add` | correlated (hunks 2–15,17–30 ∩ range 1–17) |
| new `multiply` | correlated (hunk 17–30 ∩ 19–31) |
| renamed → `times` | correlated (single-line hunk @19 ∈ 19–31). Note: name-matching alone FAILS here; line overlap is what survives renames |
| deleted `halve` | detected (removal hunk −33,6; entry vanishes from fresh JSON vs prior capture) |

Full matrix with commands: `notes/correlation-matrix.md`.

## Key constraints discovered

1. **`--changed` is FILE-granular** and has no base-ref flag; any dirty byte lists every function in that file (evidence: `raw/crap-changed-dirty.json`). The correlator must therefore run FULL analysis and intersect `lineStart..lineEnd` with git hunk ranges itself — demonstrated cheap (~integer interval checks).
2. **Coverage values exist only when the tool drives the test runner.** Rule R3 must treat missing coverage as explicit `skipped`, not zero (tool already complies).
3. **Deleted functions cannot appear in tool output** (nothing left to analyze); deletion detection comes from the git side.
4. Threshold default (6.0) flags even modest branching (`add` at cc=7 fails); must be surfaced as config (plan WP3 requirement already anticipates this).

## Limitations & threats to validity

- Single-file fixture; monorepo/pathological cases untested (WP5's job).
- `method` name lacks class/namespace qualification — acceptable because correlation keys on file+lines, not names.
- Tool version pinned to 0.5.0; schema stability across future versions unverified.
- Rename detection validated for signature-line renames only.

## Decision rationale

The controlling question — whether existing tools expose enough stable machine-readable data so the prototype stays a small correlator rather than becoming an analyzer — is answered affirmatively:

- Required facts (per-function CRAP, complexity, coverage, location, threshold verdicts) all present in one stable JSON document.
- Missing fact (function-level change attribution) obtainable through trivial git-hunk intersection, proven on all four required cases without AST parsing.
- Failure/unavailability states explicit; stdout/stderr separation clean; threshold configurable.

The work our side must do is small, deterministic glue — inside the plan's "small deterministic composition layer" boundary. Constraints above are documented configurations, not blockers.

GO WITH CONSTRAINTS
