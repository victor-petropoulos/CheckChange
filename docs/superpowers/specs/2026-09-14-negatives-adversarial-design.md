# Negative + Adversarial Test Design

**Date:** 2026-09-14
**Status:** Approved — tests-only, no src changes
**Target:** vitest suite only (`test/**/*.test.ts`, `test/**/*.spec.ts`)

---

## §1 Scope + Matrix

### Approved Scope

| Dimension | Decision |
|-----------|----------|
| **Type** | Tests-only — zero src edits |
| **Mocking** | A: mocked git-errors + evidence-gaps (unit, fast, deterministic) |
| **CLI Anchors** | B: 3 hermetic CLI integration tests (real git + real binary) |
| **Adversarial** | Separate follow-up PR (spaces/unicode/symlinks/monorepo/identical-fns) |
| **Acceptance** | `npx tsc --noEmit` exit 0, `npm test` ~90 new + ~405 existing = ~495 green, `git diff --stat src/` empty |

### Gap Coverage Matrix (from prior analysis)

| Area | Current | Added by This Design | How |
|------|---------|---------------------|-----|
| **Threshold boundary T-1/T/T+1** | Integer only (29/30/31) | Float boundary: 29.9 / 30 / 30.1 + threshold 15: 14.9/15/15.1 | A: mocked CRAP calc at boundary |
| **Zero vs null vs missing vs malformed vs unavailable** | Mocked units exist | Real-artifact matrix through full pipeline + `0 + high CC → WARN` vs `null → NOT_EVALUATED` same file | A: mocked parse/attach/calc pipeline + B: CLI anchor with real coverage artifacts |
| **Negative cases (6/9 uncovered)** | Partial (file missing/malformed/tool-absent) | Add: tool missing (3 taxonomy), repo invalid, path unusual, evidence empty, evidence partial, fn unmapped, test cmd fail, external tool unexpected | A: mocked (8 new unit tests) + B: 2 CLI anchors |
| **Adversarial (0/6 covered)** | Symlinks only | **Deferred** — separate PR per approval | — |

---

## §2 Harness + Taxonomy

### A: Mocked Unit Harness (vitest)

**Pattern:** `vi.spyOn(module, 'fn').mockResolvedValue(...)` / `.mockRejectedValue(...)`

**Modules to spy:**
- `src/git.ts` → `getChangedFunctions`, `getBaseCommit`, `validateGitRepo`
- `src/complexity.ts` → `calculateComplexity`, `getComplexityForFunction`
- `src/coverage.ts` → `parseCoverageReport`, `attachCoverage`
- `src/crap.ts` → `calculateCrap`
- `src/evidence.ts` → `collectEvidence`, `mapFunctionToEvidence`
- `src/index.ts` → `runCheck` (orchestrator)

**Test file naming:** `test/negatives/<area>.test.ts`

### B: CLI Hermetic Anchors (3 tests)

**Pattern:** `tmpdir = await mkdtemp(); await gitInit(tmpdir); write artifacts; exec cli`

**Anchors:**
1. **Empty evidence** — clean repo, no changes, `check --json` → `changedFunctions: [], gate: null, completeness: NOT_APPLICABLE`
2. **Malformed coverage** — real `.coverage` file with invalid JSON → `reason: 'malformed'` propagates to CLI output
3. **Tool missing** — `coverage` binary absent from PATH, `.coverage` present → `reason: 'malformed'` (existing taxonomy)

**CLI exec helper:**
```ts
async function runCli(cwd: string, args: string[]) {
  return execFile(process.execPath, ['dist/cli.js', ...args], { cwd, env: { ...process.env, CHECKCHANGE_CACHE: '0' } });
}
```

### Taxonomy Strings (verbatim — must match src/error-codes.ts or equivalent)

| Category | Code | When |
|----------|------|------|
| **Git errors** | `GIT_EXECUTABLE_UNAVAILABLE` | `git` not in PATH |
| | `NOT_A_GIT_REPOSITORY` | cwd not a git repo |
| | `GIT_COMMAND_FAILED` | git command non-zero exit |
| **Coverage errors** | `COVERAGE_FILE_MISSING` | `--coverage-file` path not exist |
| | `COVERAGE_FILE_MALFORMED` | JSON parse fail / schema invalid |
| | `COVERAGE_TOOL_ABSENT` | coverage binary missing but artifact present |
| **Evidence errors** | `EVIDENCE_EMPTY` | `changedFunctions.length === 0` |
| | `EVIDENCE_PARTIAL` | some fns have evidence, some not |
| | `FUNCTION_UNMAPPED` | changed fn not found in complexity/coverage maps |
| **Test errors** | `TEST_COMMAND_FAILED` | test runner non-zero exit |
| | `EXTERNAL_TOOL_UNEXPECTED` | tool returns unrecognized output format |

### Evidence Gap Semantics (verbatim)

| Input | `changedFunctions` | `gate` | `completeness` |
|-------|-------------------|--------|----------------|
| Empty (no changes) | `[]` | `null` | `NOT_APPLICABLE` |
| Partial (some fns covered) | `[fn1, fn2]` | `PASS`/`WARN` per fn | `INCOMPLETE` |
| Unmapped (fn not in maps) | `[fn1]` | fn skipped in gate calc | `INCOMPLETE` (fn counted in denominator) |

### Out of Scope (Explicit)

- Windows-only paths / backslash handling
- Network filesystem edge cases (NFS/SMB)
- Concurrent git operations / lock contention
- Filesystem permission errors (EACCES/EPERM)
- Locale/encoding issues (non-UTF8 repos)
- Giant repos (>100k files) — performance, not correctness

---

## §3 Test Inventory (Planned)

### A: Mocked Unit Tests (~18 new)

| File | Cases |
|------|-------|
| `test/negatives/threshold-float.test.ts` | 29.9→PASS, 30→PASS, 30.1→WARN; 14.9→WARN, 15→PASS, 15.1→PASS (threshold=15) |
| `test/negatives/zero-null-missing-malformed-unavailable.test.ts` | 5×2 matrix: each semantic through parse→attach→calc→status; `0+highCC→WARN` vs `null→NOT_EVALUATED` same file |
| `test/negatives/git-errors.test.ts` | 3 taxonomy: `GIT_EXECUTABLE_UNAVAILABLE`, `NOT_A_GIT_REPOSITORY`, `GIT_COMMAND_FAILED` |
| `test/negatives/coverage-errors.test.ts` | 3 taxonomy: `COVERAGE_FILE_MISSING`, `COVERAGE_FILE_MALFORMED`, `COVERAGE_TOOL_ABSENT` |
| `test/negatives/evidence-gaps.test.ts` | 3 taxonomy: `EVIDENCE_EMPTY`→NOT_APPLICABLE, `EVIDENCE_PARTIAL`→INCOMPLETE, `FUNCTION_UNMAPPED`→INCOMPLETE |
| `test/negatives/test-tool-errors.test.ts` | 2 taxonomy: `TEST_COMMAND_FAILED`, `EXTERNAL_TOOL_UNEXPECTED` |

### B: CLI Anchors (3 new)

| File | Cases |
|------|-------|
| `test/negatives/cli-empty-evidence.spec.ts` | Clean repo → `changedFunctions: [], gate: null, completeness: NOT_APPLICABLE` |
| `test/negatives/cli-malformed-coverage.spec.ts` | Real malformed `.coverage` → `reason: 'malformed'` in JSON output |
| `test/negatives/cli-tool-absent.spec.ts` | Coverage binary missing + artifact present → `reason: 'malformed'` |

---

## §4 Acceptance Checklist

- [ ] `npx tsc --noEmit` → exit 0
- [ ] `npm test` → all ~495 tests pass (391 existing + ~90 new + ~14 existing negatives)
- [ ] `git diff --stat src/` → empty (no src files modified)
- [ ] New test files only under `test/negatives/`
- [ ] All taxonomy strings match `src/error-codes.ts` (or equivalent source of truth)
- [ ] CLI anchors use `mkdtemp` + `git init` — no shared state, hermetic
- [ ] No adversarial tests (spaces/unicode/symlinks/monorepo/identical-fns) in this PR

---

## §5 Non-Goals

- Adversarial path tests (separate PR)
- Property-based / fuzz testing
- Performance benchmarks
- Windows CI matrix
- Documentation updates (separate chore if needed)