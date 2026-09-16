# Auto-Coverage Design Document

**Date:** 2026-09-16  
**Status:** Approved for implementation  
**Target:** checkchange CLI tool (`src/cli.ts`, `src/coverage.ts`, `src/evidence.ts`)

---

## Context

Current behavior: when coverage artifact is absent (auto-detect finds nothing), checkchange returns `SUCCESS`/`PASS`/`INCOMPLETE` with exit code 0. This is by design — `INCOMPLETE` signals artifact gap, not code risk. However, users must manually run `pnpm vitest run --coverage` (or equivalent) before invoking checkchange, as documented in [README.md:93-96] and [`.agents/skills/using-checkchange/SKILL.md:21`].

Goal: Add opt-in `--auto-coverage` flag that detects test runner, spawns coverage generation, retries artifact read, and upgrades result to `COMPLETE` on success — without changing default behavior.

---

## §1 Architecture + CLI Contract

### Flag Definition

| Location | Change |
|----------|--------|
| `src/cli.ts:41` | Add `let autoCoverage = false;` |
| `src/cli.ts:86-103` | Parse `--auto-coverage` boolean flag (no value) |
| `src/cli.ts:137-148` | Add help line: `--auto-coverage   Detect test runner, generate coverage artifact, retry [experimental]` |

### Precedence Rules

1. **Explicit `--coverage-file <path>`** wins always — parsed at `src/coverage.ts:302-306` with `isExplicit=true`. Auto-coverage never overrides.
2. **`--auto-coverage`** (no explicit file) → triggers auto-generation pipeline before `buildEvidenceOutput`.
3. **Neither flag** → unchanged current behavior: auto-detect (`src/coverage.ts:23,310-312`), absent → `SUCCESS`/`PASS`/`INCOMPLETE`/exit 0 per `src/evidence.ts:573-577` and `src/cli.ts:240-242`.

### Integration Point

New function `autoCoverage(cwd: string): Promise<CoverageResult>` called in `src/cli.ts` **after** git diff intervals resolved, **before** `buildEvidenceOutput(base, intervals, cwd, threshold, coverageResult)` at `src/cli.ts:200-210` region.

### Constraints (No Changes)

- `correlate` logic at `src/evidence.ts:265` unchanged — interval overlap against method span.
- CRAP threshold default 30 at `src/cli.ts:40` / `src/evidence.ts:324` unchanged.
- `SUPPORTED_EXTENSIONS` at `src/cli.ts:18` unchanged.
- Cache behavior at `src/cache.ts:384` unchanged (no write on auto-generated miss).

---

## §2 Data Flow + Runner Detection

### Auto-Detect List (Existing)

`src/coverage.ts:23` — `PYTHON_COVERAGE_FILES = ['.coverage', 'coverage.xml', 'coverage.json', 'coverage/coverage-final.json']`

Precedence order at `src/coverage.ts:310-311` — `.coverage > coverage.xml > coverage.json > coverage/coverage-final.json`

### Runner Detection Logic (New)

When auto-detect finds nothing **and** `--auto-coverage` set:

| Runner | Detection Signal | Spawn Command |
|--------|------------------|---------------|
| vitest | `vitest.config.*` exists in cwd | `npx vitest run --coverage` |
| jest | `jest.config.*` exists in cwd | `npx jest --coverage` |
| pytest-cov | `pyproject.toml` or `pytest.ini` exists in cwd | `coverage json -o coverage.json` (Python) |

Detection priority: vitest → jest → Python. First match wins.

### Spawn Precedent

`src/coverage.ts:93-102` — `spawnSync('coverage', ['json', '-o', outputPath])` with `timeout: 30000`. New auto-coverage uses `spawn` (async) with **120s timeout** and same cwd guards.

### Post-Spawn Retry

After spawn completes (success or timeout), call `readCoverage(cwd)` again at `src/coverage.ts:302` to pick up generated artifact.

### Doctor Unchanged

`src/cli.ts:276-323` — 5 probes only (`gitExecutable`, `gitRepo`, `defaultBase`, `providerAvailability`, `coverageArtifact`). No new runner probes added (out of scope).

---

## §3 Error Handling

### Timeout

- **120s** hard limit on coverage generation spawn.
- On timeout: kill process, fall back to absent-path behavior (hint + `INCOMPLETE`).
- Do NOT return `FAILED` — reserved for malformed explicit artifact per `src/evidence.ts:504-508`.

### Malformed Artifact (Explicit)

- Explicit `--coverage-file` missing/malformed → `coverageCapability='failed'` → `FAILED`/`null`/`INCOMPLETE` per `src/evidence.ts:504-508,714-734`.
- CLI exits 1 with message at `src/cli.ts:228-237`.
- Auto-coverage does NOT trigger on explicit file failure.

### Guards Reused

- `MAX_COVERAGE_SIZE = 100MB` at `src/coverage.ts:22`.
- `isWithinCwd` at `src/coverage.ts:29-44` — path traversal protection.
- Explicit missing reason at `src/coverage.ts:354-355`.

### Cache

`src/cache.ts:384` unchanged — auto-generated artifact not written to incremental cache (avoids staleness per `src/cache.ts:3` comment).

---

## §4 Testing + Docs

### Unit Tests (New)

| Test | Target |
|------|--------|
| Runner detector returns vitest/jest/none given config files | `autoCoverage.detectRunner()` |
| Spawn timeout kills process and returns fallback | `autoCoverage.runWithTimeout()` |
| Absent + no flag → hint + `INCOMPLETE` (regression) | CLI integration |

### E2E Tests (New)

| Scenario | Expected |
|----------|----------|
| `--auto-coverage` + vitest project → `COMPLETE` | `analysisStatus=SUCCESS`, `gate=PASS`, `completeness=COMPLETE` |
| `--auto-coverage` + spawn fails → `INCOMPLETE` + hint | `completeness=INCOMPLETE`, stderr hint printed |
| Explicit `--coverage-file` + malformed → `FAILED` (unchanged) | Regression guard at `src/evidence.ts:504` |

### Documentation Updates

| File | Change |
|------|--------|
| `src/cli.ts:137-148` | Add `--auto-coverage` to help text |
| `README.md:93,96` | Update workflow: `checkchange check --auto-coverage --json` as single-step alternative |
| `.agents/skills/using-checkchange/SKILL.md:21` | Step 1: mention `--auto-coverage` flag |

### Out of Scope

- Default-on auto-coverage (remains opt-in).
- Doctor runner probes.
- `--format` / `--cache` changes.
- `PYTHON_COVERAGE_FILES` reorder.

---

## Acceptance Criteria

| # | Scenario | Command | Exit Code | `analysisStatus` | `gate` | `completeness` | Stderr |
|---|----------|---------|-----------|------------------|--------|----------------|--------|
| 1 | No coverage, no flag (current) | `checkchange check` | 0 | SUCCESS | PASS | INCOMPLETE | (none) |
| 2 | No coverage, `--auto-coverage`, no runner configs | `checkchange check --auto-coverage` | 0 | SUCCESS | PASS | INCOMPLETE | "Hint: no test runner detected..." |
| 3 | `--auto-coverage`, vitest runs → artifact generated | `checkchange check --auto-coverage` | 0 | SUCCESS | PASS | COMPLETE | (none) |
| 4 | `--auto-coverage`, spawn times out | `checkchange check --auto-coverage` | 0 | SUCCESS | PASS | INCOMPLETE | "Hint: coverage generation timed out..." |
| 5 | Explicit `--coverage-file missing.json` | `checkchange check --coverage-file missing.json` | 1 | FAILED | null | INCOMPLETE | "Error: coverage artifact missing" |
| 6 | Explicit `--coverage-file malformed.json` | `checkchange check --coverage-file malformed.json` | 1 | FAILED | null | INCOMPLETE | "Error: coverage artifact malformed" |

---

## SPEC SELF-REVIEW

### Placeholder Scan

- [x] No `TODO`/`FIXME`/`XXX` markers remain.
- [x] All file:line citations point to existing code (verified in evidence table).
- [x] No unspecified "etc." or "and so on".

### Consistency Check

- [x] Flag name `--auto-coverage` matches CLI convention (kebab-case, double-dash).
- [x] Timeout 120s distinct from Python conversion 30s at `src/coverage.ts:102`.
- [x] `FAILED`/`null`/`INCOMPLETE` reserved for malformed explicit — auto path never produces `FAILED`.
- [x] `coverageCapability` values: `'absent'` | `'failed'` | `'available'` unchanged at `src/evidence.ts:440-445,695,724`.

### Scope Boundary

- [x] No changes to `correlate`, CRAP threshold, `SUPPORTED_EXTENSIONS`, cache write policy.
- [x] No doctor probes added.
- [x] No default-on behavior.
- [x] No `--format`/`--cache` modifications.

### Ambiguity Resolution

| Ambiguity | Resolution |
|-----------|------------|
| "Hint" wording | Stdout/stderr: "Hint: no test runner detected. Run `pnpm vitest run --coverage` manually or add vitest.config.ts." (exact text in impl) |
| Spawn cwd | Always `cwd` passed to CLI (same as `readCoverage`). |
| Multiple runner configs | First-match priority: vitest → jest → Python. Documented in §2 table. |
| Partial coverage (some files) | `readCoverage` parses whatever exists; CRAP computed per-function — unchanged. |

---

**Document Path:** `/Users/victorpetropoulos/Cursor Projects/code-risk-prototype-v0.3-opencode/docs/superpowers/specs/2026-09-16-auto-coverage-design.md`

**Self-Review Status:** Clean — no placeholders, consistent with cited code, scope bounded, ambiguities resolved inline.