# WP16 Architecture-Stability & Multi-Language Generalization Assessment

**Date**: 2026-09-08  
**Scope**: Architecture-stability review across language expansions (TypeScript/JavaScript/Python), schema evolutions (0.2 → 0.3 → 0.4), coverage integrations (Istanbul, LCOV, coverage.py), and test corpora.  
**Classification Baseline**: No autonomous usefulness claims; evaluation grounded in demonstrated-under-conditions empirical evidence.

---

## Executive Summary & Core Verdict

**Verdict**: **Genuinely general evidence layer with language-specific extraction adapters.**

The core CheckChange pipeline (`src/evidence.ts`, `src/attribution.ts`, `src/crapCalc.ts`, `src/rules.ts`, `src/git.ts`) operates entirely on normalized control-flow complexity intervals and line/branch coverage maps. Language support is abstracted through a lightweight provider interface (`ProviderFactory` / `ComplexityProvider`) requiring zero modifications to core evaluation logic.

### Quantification of Shared vs Language-Specific Code

Across all 1,707 non-test TypeScript source lines in `src/`:

| Component | Files | Line Count | % of Core | Role |
|-----------|-------|------------|-----------|------|
| **Shared Core Engine** | `src/evidence.ts` (442), `src/attribution.ts` (169), `src/cli.ts` (167), `src/git.ts` (149), `src/coverage.ts` (137), `src/coverage-providers/lcovProvider.ts` (132), `src/crap.ts` (112), `src/execute.ts` (78), `src/complexity.ts` (75), `src/rules.ts` (56), `src/crapCalc.ts` (8), `src/complexity-providers.ts` (7), `src/index.ts` (6) | **1,538 lines** | **90.1%** | Universal AST interval correlation, git diff attribution, CRAP metric computation, policy rule evaluation, CLI dispatch, auto-detect coverage normalization. |
| **Language-Specific Adapters** | `src/complexity-providers/pythonASTComplexityProvider.ts` | **169 lines** | **9.9%** | Python AST traversal extracting method boundaries and cyclomatic complexity. |
| **Vendored/Patched Parsers** | `patches/crap-typescript-core+0.5.0.patch` | *pnpm patch* | N/A | Extension map expansion (`.ts`, `.tsx`, `.js`, `.jsx`, `.mjs`, `.cjs`) and JSX script kind mapping. |

Over 90% of the codebase is completely shared and language-agnostic.

---

## Evaluation Questions (Q1 – Q8)

### Q1: Architecture Stability for Adding New Languages
*How stable is the current architecture when integrating an additional language?*

**Assessment: High stability demonstrated under tested conditions.**
- **Registry dispatch pattern**: `src/evidence.ts:11-28` defines `ProviderFactory` and a dispatch map keyed by file extension. Adding a language requires calling `registerProvider(ext, provider)` without altering the correlation loop (`correlate`), git interval computation (`getChangedIntervals`), or CRAP calculation (`calculateCrap`).
- **Validated across 7 extensions**: `.ts`, `.tsx`, `.js`, `.jsx`, `.mjs`, `.cjs` map to `typescriptProvider` (`src/evidence.ts:23-25`), and `.py` maps to `pythonASTComplexityProvider` (`src/evidence.ts:28`).
- **Zero core modifications for fresh environments**: WP14 executed fresh per-commit coverage runs across historical commits with zero engine modifications (`git diff src/` was completely empty; `PROJECT_STATUS.md:99-101`, `experiments/wp14/WP14_RESULTS.md:1-50`).

### Q2: Provider Interfaces Holding
*Are the abstraction boundaries between core and providers holding without leaks?*

**Assessment: Holding effectively across AST complexity and coverage formats.**
- **Complexity Abstraction**: `ComplexityProvider` (`src/complexity-providers.ts:3-7`) and `ProviderFactory` (`src/evidence.ts:11-14`) enforce a simple contract:
  - `collectComplexity: (cwd: string) => Promise<ComplexityInfo[]>`
  - `readCoverage: (cwd: string, file?: string) => Promise<any>`
- **Coverage Abstraction & Auto-Detection**: `src/coverage.ts:103-133` auto-detects LCOV formats via extension (`.info`, `.lcov`) or content markers (`TN:`, `SF:`, `DA:`) vs Istanbul JSON, delegating to `parseLcovContent` (`src/coverage-providers/lcovProvider.ts:9-85`) and `normalizeCoveragePaths`. Language-specific coverage tools (e.g. `coverage.py`, `c8`, `nyc`, `jest`, `vitest`) outputting LCOV or Istanbul formats are consumed uniformly without core changes.
- **WP13 Deferred Items Resolution Status** (referencing `experiments/wp13/REMAINING_LIMITATIONS_DEFERRED.md` / `mem:27746`):
  1. *Limitation #2 (Lizard token CC vs AST CC semantics)*: Remediated by graduating `pythonASTComplexityProvider.ts` into core (`src/complexity-providers/pythonASTComplexityProvider.ts:1-170`), achieving 1.0 correlation on synthetic control constructs.
  2. *Limitation #4 (File-extension dispatch not in core)*: Remediated by implementing `registerProvider` dispatch map in `src/evidence.ts:15-28`.
  3. *Limitation #7 (Schema version frozen at 0.2)*: Remediated via formal additive evolutions to schema 0.3 and schema 0.4.

### Q3: Schema 0.4 & Evidence Contract Stability
*Has the Evidence Contract maintained stability and backward/forward compatibility?*

**Assessment: Fully backward and forward compatible under additive evolution.**
- **Evolution History** (`docs/contracts/evidence-contract.md:3-19`):
  - **Schema 0.2**: Baseline frozen schema.
  - **Schema 0.3**: Added optional `language: "typescript" | "python"` field. Additive only.
  - **Schema 0.4**: Added optional `language: "javascript"` and `framework: "react" | "next"`. Additive only.
- **Consumer Compatibility**: Invariant INV-01 through INV-04 preserved. All schema additions are optional fields on `ChangedFunction` (`src/evidence.ts:30-43`); existing consumers ignore unknown fields without breakage.
- **Framework Metadata**: Bounded `detectNextFramework` helper in `src/evidence.ts:335-388` provides non-intrusive framework tagging based on `package.json` dependency tiers and configuration markers.

### Q4: Security Boundaries & Defensive Hardening
*Are security boundaries sufficient to handle untrusted repository code and external inputs?*

**Assessment: Sufficient under tested threat model; 5 High/Medium vulnerabilities closed.**
- Documented in `docs/contracts/evidence-contract.md:82-94` and verified across test suites:
  1. **Git SHA Validation**: Strict regex `^[a-f0-9]{40}$` in `src/git.ts` prevents command injection.
  2. **LCOV File Size Limits**: 10 MB cap in `src/coverage-providers/lcovProvider.ts:10-14` / `src/coverage.ts:121` prevents memory exhaustion (DoS).
  3. **Python Path Pruning**: Pruning `site-packages`, `venv`, `dist`, and `build` in `src/complexity-providers/pythonASTComplexityProvider.ts:19` prevents traversal into third-party vendor directories.
  4. **Directory Traversal Depth Limit**: `readdir` bounded to max depth 3 in `src/evidence.ts:353-366` prevents filesystem walk recursion DoS.
  5. **Symlink Validation**: `--coverage-file` path validation ensures coverage files outside CWD do not follow unsafe symlink paths.

### Q5: Corpus Adequacy
*Is the test corpus broad enough to ensure regression resistance?*

**Assessment: Adequate for current supported languages (TS/JS/React/Python).**
- **Test Suite Metrics**: 233 unit/integration tests across 72 test files (`PROJECT_STATUS.md:77`, `docs/contracts/evidence-contract.md:94`).
- **Coverage of Edge Cases**:
  - Fault injection tests (`pythonFault.spec.ts`, `jsFault`, `collect.test`) ensuring `MISSING !== MALFORMED` semantics and truthful `analyzerStatus`.
  - Case-insensitivity regression anchors for file path attribution (`test/attribution.case.spec.ts`).
  - Framework detection test suites (`nextDispatcher` 5/5 tests passing).
  - Clean typecheck: `npx tsc --noEmit` exits with 0 errors.

### Q6: Performance & Scalability
*Is engine execution overhead within acceptable bounds for CI pipelines?*

**Assessment: Highly acceptable performance demonstrated under real-world benchmark conditions.**
- **LCOV E2E Execution**: 0.78s runtime / 255 MB peak memory (`PROJECT_STATUS.md:65,85`, `docs/superpowers/plans/hardening-b-perf.md`).
- **Istanbul JSON E2E Execution**: 0.81s runtime / 260 MB peak memory.
- **Monorepo Scale**: Full monorepo union benchmark processed 3.3M lines in 0.92s (`PROJECT_STATUS.md:44,85`).
- Sub-second execution ensures CheckChange adds negligible overhead to standard CI test/lint workflows.

### Q7: Evidence Usefulness
*Has the output been demonstrated to provide actionable change-risk signals?*

**Assessment: Demonstrated under conditions in human reviews; no new autonomous claims asserted.**
- **WP15 Human Review Acceptance**: All 5 human review cases (WP14 fresh-coverage delta pair + 3 WP5.6 re-executable cases) were formally accepted by solo reviewer on 2026-09-08 (`experiments/wp15-human/PACKET.md:1-5`).
- **WP14 Fresh-Coverage Delta**: Demonstrated differential risk detection on real-world commits where function complexity was identical (CC = 12) but test coverage differed (33.3% in Commit A vs 10% in Commit B), accurately driving CRAP from 54.67 to 116.98 (`experiments/wp14/WP14_RESULTS.md:26-48`).
- Per project rules, no new subjective usefulness claims are generated autonomously.

### Q8: Diminishing Returns & Scope for Language Expansion
*Does expanding to additional languages (e.g. Go, Java, Rust) yield diminishing returns or threaten core stability?*

**Assessment: Diminishing returns from additional language adapters unless driven by proven demand.**
- **CC Equivalence Nuance**: As documented in `docs/contracts/evidence-contract.md:39-55`, token-based complexity tools (e.g., Lizard CCN) exhibit a 0.626 correlation with AST-based decision counters for TS/JS, whereas native AST providers (like `pythonASTComplexityProvider`) achieve 1.0 correlation on synthetic benchmarks. Each new language requires either a native AST parser implementation (~150–200 lines) or acceptance of token-heuristic divergence.
- **Core Stability**: Additional languages isolated behind `ProviderFactory` do not threaten core engine stability, but each added language increases adapter maintenance surface (syntax variations, runtime version dependencies, AST parser updates).

---

## Final Recommendation

### Status: **CONTINUE WITH CONSTRAINTS**

1. **Maintain General Core / Isolated Adapter Pattern**:
   - Keep core engine (`src/evidence.ts`, `src/attribution.ts`, `src/crapCalc.ts`, `src/rules.ts`) strictly language-agnostic.
   - Restrict new language additions to self-contained providers implementing `ComplexityProvider` in `src/complexity-providers/`.

2. **Gating Criteria for Future Language Expansion**:
   - Require native AST-based CC extraction or demonstrated correlation ≥ 0.95 against standard decision-point definitions before graduating any adapter to core.
   - Require standard LCOV or Istanbul coverage output from the target language toolchain.

3. **What Would Change This Recommendation**:
   - **Switch to STOP (Language Freeze)**: If a requested language cannot map to line/branch coverage intervals without modifying the core attribution engine, or if maintenance of language AST parsers exceeds core engine development effort.
   - **Switch to UNCONSTRAINED EXPANSION**: If an external AST-standardized complexity provider (e.g., Tree-sitter unified CC) is integrated, removing per-language AST maintenance costs.

---

```text
CONTINUE WITH CONSTRAINTS — human gate 2026-09-08. Constraints carried: (a) new languages only as self-contained ComplexityProvider in src/complexity-providers/, zero core change; (b) graduation requires AST-based CC with correlation ≥0.95 + standard LCOV/Istanbul coverage output; (c) schema additive-only; (d) Angular stays deferred.
```
