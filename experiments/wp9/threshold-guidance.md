# WP9 Threshold Sensitivity & Blind-Spot Guidance

**Date:** 2026-08-28  
**Status:** DRAFT — awaiting human review  
**WP8 Evidence Link:** `experiments/wp8/wp8-report.md`, `experiments/wp8/fp-fn-analysis.md`, `experiments/wp8/dx-operational.md`, `experiments/wp8/reviewer-notes.md`

---

## 1. Threshold Sensitivity

### 1.1 CRAP Formula

The engine computes CRAP deterministically per function:

```
CRAP = CC² × (1 - coverage/100)³ + CC
```

where:
- **CC** = cyclomatic complexity (integer ≥ 1)
- **coverage** = statement/branch coverage percentage (0–100), or `null` if unavailable
- **CRAP** = `null` when coverage is `null` (INV-01: ZERO≠NULL)

Implemented in `src/crapCalc.ts:1-8`.

### 1.2 Default Threshold Policy

| Threshold | Purpose | Source |
|-----------|---------|--------|
| **30** | Default gate (`changed-function-high-crap` rule) | `docs/contracts/evidence-contract.md:38`, `src/rules.js` |
| **15** | Supplemental / stricter review mode (operator opt-in) | `docs/contracts/evidence-contract.md:38` |

Gate logic (from `src/evidence.ts:248`):
- Any rule result `WARN` → overall gate = `WARN`
- All `PASS` → overall gate = `PASS`

### 1.3 WP8 Empirical Cases

| Case | Function | CC | Coverage | CRAP | Gate | Notes |
|------|----------|----|----------|------|------|-------|
| 1–4 | `normalizeCoveragePaths` | 8 | 75% | 9 | PASS | Well below threshold |
| 2–4 | `readCoverage` | 10 | 100% | 10 | PASS | Full coverage eliminates debt |

Both cases confirm deterministic pass behavior well under threshold 30.

### 1.4 Near-Threshold Boundary Analysis

The gate is sensitive to small CRAP changes near the threshold. Hypothetical illustration for `parseCliArgs` (CC=23, currently skipped due to attribution gap):

| Coverage | CRAP Calculation | CRAP | Gate (th=30) | Gate (th=15) |
|----------|------------------|------|--------------|--------------|
| 100% | 23²×(0)³+23 = 23 | 23 | PASS | WARN |
| 50% | 23²×(0.5)³+23 = 529×0.125+23 = 89 | 89 | WARN | WARN |
| 20% | 23²×(0.8)³+23 = 529×0.512+23 ≈ 294 | 294 | WARN | WARN |
| 0% | 23²×1³+23 = 552 | 552 | WARN | WARN |

**Boundary flip example** (hypothetical CC=15 function):
| CRAP | Gate (30) | Gate (15) |
|------|-----------|-----------|
| 29 | PASS | WARN |
| 30 | WARN | WARN |
| 31 | WARN | WARN |

A 1-point CRAP change at 29→30 flips the gate under default threshold.

### 1.5 Threshold Tuning Guidance

- **Do not silently change** the default threshold (30) in CI pipelines. Document any override explicitly.
- **Use supplemental threshold (15)** for stricter review contexts (e.g., security-critical paths, core library functions).
- **Tune per repository** — threshold choice depends on codebase complexity profile, test culture, and risk appetite.
- **Avoid per-function threshold overrides** in rule configuration; prefer supplemental rule sets.
- **Record threshold rationale** in project docs or ADR when deviating from defaults.

---

## 2. False Negative Blind Spots

Per WP8 analysis (`experiments/wp8/fp-fn-analysis.md:23-36`), the CRAP engine is structurally blind to five risk categories. Complementary tools/processes are required.

| Blind Spot | Why CRAP Misses It | Complementary Tool / Process | Example | Risk If Ignored |
|------------|-------------------|------------------------------|---------|-----------------|
| **Security Vulnerabilities & Input Sanitization** | CC/coverage measure structure, not data flow or taint tracking. A CC=1 function can have SQL injection. | Static analysis (ESLint security plugins, Semgrep), SAST, dependency scanning (npm audit, Snyk) | `query("SELECT * FROM users WHERE id=" + input)` passes CRAP with 100% coverage | Data breach, injection attacks |
| **Dependency Blast Radius** | Changing a shared utility doesn't increase CC of callers unless their own logic changes. | Dependency graph analysis (`madge`, `depcheck`), integration test suites, consumer-driven contracts | Modify `utils/date.ts` → 50 downstream callers unaffected by CRAP | Silent breaking changes in consumers |
| **API Exposure & Breaking Changes** | Public signature changes (removed params, altered types) don't affect CC/coverage of implementation. | API contract testing (Pact), TypeScript `tsc --noEmit` on consumers, semantic versioning enforcement | Remove optional `timeout` param from public `fetchData()` | Consumer runtime failures |
| **Data Sensitivity & Concurrency Flaws** | Race conditions, memory leaks, insecure storage are orthogonal to control flow complexity. | Thread sanitizers, load/chaos testing, code review checklists, `tsan`/`lsan` | `cache[key] = value` without mutex under concurrency | Data corruption, leaks, security incidents |
| **Historical Defects & Fragile Logic** | Low-CC functions can contain brittle edge-case logic not exercised by tests. | Mutation testing (Stryker), property-based testing (fast-check), defect hotspot mining (git history) | `if (x > 0) return 1/x` — CC=2, passes tests, divides by zero at x=0 | Production incidents from "simple" code |

---

## 3. Operational Friction Notes

### 3.1 Caller-Owned Coverage Burden
- **Cost:** ~4.96s wall-clock for coverage generation (`vitest run --coverage`) per `experiments/wp8/dx-operational.md:13`.
- **Workflow:** User must generate coverage artifact before engine invocation. Engine does not execute tests.
- **Mitigation:** Cache coverage in CI; consider incremental coverage tools if runtime becomes blocker.

### 3.2 Attribution Gap (CLI Functions)
- **Observation:** `parseCliArgs` (CC=23) and `main` (CC=12) show `crap: null`, `analyzerStatus: skipped`.
- **Root Cause:** Coverage mapping gap between execution bundles and source files — not a code defect.
- **Invariant:** INV-01 (ZERO≠NULL) preserved — `null` correctly signals "unmeasured", not "zero risk".
- **Action:** Fix attribution mapping (WP9 Task 2) so CLI functions participate when unit coverage exists.

### 3.3 Monorepo Untested
- Cross-package dependency tracking and multi-package coverage aggregation untested (`experiments/wp8/wp8-report.md:78-79`).
- Git diff may produce unexpected intervals in monorepo workspaces.

### 3.4 TypeScript-Only & Istanbul/V8 Dependency
- Engine parses TypeScript ASTs only; non-TS files → `UNSUPPORTED` (`evidence-contract.md:115-118`).
- Requires Istanbul/v8 JSON coverage format; LCOV unsupported.

---

## 4. Limitations Carried Forward

| Limitation | Origin | Status |
|------------|--------|--------|
| TypeScript-only scope | Known (WP5) | Unchanged |
| Istanbul/V8 coverage dependency | Known (WP5) | Unchanged |
| Caller-owned coverage burden | Known (WP5) | Unchanged |
| Monorepo untested | Known (WP5) | Unchanged |
| Test quality vs. quantity | Known (WP5) | Unchanged |
| External repo validation deferred | New (WP8) | Pilot planned (WP9 Task 3) |
| Small sample (n=4+1 from single repo) | New (WP8) | Statistical power limited |
| Skipped CLI functions (attribution gap) | New (WP8) | Fix planned (WP9 Task 2) |

---

## 5. References

- `experiments/wp8/wp8-report.md` — Full validation report, claims/evidence matrix, gate recommendation
- `experiments/wp8/fp-fn-analysis.md` — FP/FN analysis, 5 blind spots, limitation classification
- `experiments/wp8/dx-operational.md` — DX findings, friction points, performance baselines
- `experiments/wp8/reviewer-notes.md` — Case-by-case engineering significance assessment
- `docs/contracts/evidence-contract.md` — Frozen contract v0.2.0, invariants INV-01..04, threshold policy
- `src/crapCalc.ts` — CRAP formula implementation
- `src/evidence.ts` — Threshold application, gate derivation

---

## 6. Confidence Note

**Overall confidence: Low/Medium** (given small sample n=4+1 from single repository).

Hypothesis items explicitly **deferred** per prioritization (`experiments/wp9/prioritization.md`):
- Monorepo/multi-package coverage aggregation
- Coverage generation caching / incremental coverage
- Historical delta analysis (CRAP trend over time)
- Additional language support (JS, Python, Go)
- Security/AST-pattern detection integrated into engine
- Dependency blast radius quantification

These remain future candidates; current scope limited to evidence-backed items with reversible changes.