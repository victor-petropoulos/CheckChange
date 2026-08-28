# WP5.6 Limitations

Per Roadmap WP5.6 §LIMITATIONS TO EXPECT and project-wide methodology discipline ("A limitation is not a failure. An undocumented limitation is a problem.").

## Scope limitations

- **TypeScript/JavaScript focus only.** No C#, Python, Go, Rust, or other language adapter exists. CRAP formula comes from `crap-typescript-core` v0.5.0.
- **Single-package repos only.** No monorepo (nx, pnpm workspaces, turborepo) case in WP5.6 corpus. `getGitTrackedTsFiles` in `src/complexity.ts` is theoretically monorepo-capable but not adversarially tested.
- **Coverage providers:** Istanbul and vitest v8 only. LCOV not supported. No provider abstraction.
- **Caller owns coverage generation.** Deterministic engine does not run tests. The engine consumes artifacts.
- **No test orchestration.** Pipeline does not invoke vitest/jest. WP4R §Frozen Boundaries preserved.

## Methodological limitations

- **Sample size: 11 cases (5 re-executed + 6 replay-only).** This is insufficient for universal claims. Per Roadmap §CLAIMS/EVIDENCE MATRIX: signal usefulness confidence is Low/Medium.
- **WARN signal derived primarily from h3 (sup-a, sup-b).** No WARN observed in hono or apollo (apollo due to coverage failure). Cross-repo generalizability of the WARN signal is untested.
- **Apollo-01/02/03 coverage failure** is unresolved (Jest reporter) per WP4R §Known Limitations. These cases are replay-only.

## Attribution limitations

- **Function-level coverage, not statement-level or branch-level within functions.** Branch coverage is computed at the function boundary; the prototype does not decompose CRAP further.
- **Path matching uses `endsWith()`.** Works for same-repo paths. Fails (or requires path coupling) for cross-environment artifact replay (see F-03).
- **Container-method identity is `${containerName}.${functionName}:${startLine}`** (post-WP5.3 A07). Functions in unkeyed anonymous contexts may collapse to identity conflicts.

## Coverage limitations

- **Test files not in Istanbul/v8 artifacts.** Post-WP5.3 C03 discovery may surface changed test-file functions; pipeline correctly reports `skipped` for them per INV-04 (ANALYZER TRUTHFUL).
- **Zero coverage distinct from absent coverage** per INV-01, but only when an artifact is provided. Without an artifact, no coverage is computed at all.
- **Coverage dimension is per-function aggregated.** Cross-function or per-line coverage is not exposed in the CRAP calculation.

- **F-04 (accepted by design):** Changed-function count includes `*.test.ts` functions per WP5.3 C03 source-discovery expansion. This is correct behavior — a changed test function is a real change. Test-file coverage is not present in Istanbul artifacts, so such functions report `analyzerStatus=skipped` per INV-04 (truthful). If test files grow, completeness may shift from COMPLETE to INCOMPLETE as more skipped functions are reported. See `experiments/wp5/wp5.4/failure-semantics-contract.md` §Test-File Function Discovery.

## CRAP inherent limitations

- **CRAP measures only CC × coverage.** It does not measure:
  - Security sensitivity
  - API exposure (public vs private)
  - Dependency impact
  - Architectural centrality
  - Data sensitivity
  - Historical defect rate
  - Concurrency risk
  - External integration risk
- **Threshold 30 is a project default, not a universal optimum.** Threshold 15 produced additional signal in sup-b but no universal recommendation.
- **CRAP is not a defect predictor.** It is a review attention signal.

## Reproducibility limitations (WP5.6 findings)

- **F-03 RESOLVED (2026-08-27):** Istanbul coverage absolute-path coupling. Fixed in `src/coverage.ts` by `normalizeCoveragePaths()` which rebases absolute keys onto the current cwd when a matching file exists. Cross-machine or cross-CI replay of preserved artifacts now works without symlink workarounds. Verified by `experiments/wp5/wp5.6/wp56-f03-path-normalization.spec.ts` (2 tests).
- **F-04: WP5.3 C03 expansion.** hono-03 changed-function count went from 4 → 6; sup-a from 108 → 196. New fns are mostly test files; pipeline correctly reports `skipped`. Gate outcomes unchanged. **Improvement, not regression, but downstream analyses that compare change counts must be aware.**

## Documentation limitations

- **Frozen WP4R results are preserved as baseline.** New WP5.6 results are labeled separately (current pipeline vs frozen baseline).
- **6 of 11 cases are replay-only** (no preserved coverage artifact). Their current-pipeline outputs are not regenerated; frozen WP4R JSON remains authoritative.
- **No autonomous usefulness classification.** Per project-wide guardrail, the system does not judge whether a change is risky — it produces evidence. Usefulness classification is the human reviewer's role.
- **Replay-only cases have not been validated against the post-WP5.4 pipeline.** Their frozen outputs were produced pre-WP5.4 corrections. The semantic contract improvements (V01/D10/G06/G07) only affect absent/malformed/git-missing analyzerStatus distinctions; h3-01..03 and apollo-01..03 had available coverage in WP4R, so their ruleResults should be identical to a hypothetical re-run with available coverage. **A future re-cloning + re-test-run would validate this assumption.**

## Pipeline boundaries preserved

WP5.6 did NOT add (per WP4R §Frozen Boundaries and WP5.1 §Non-Goals):

- Test orchestration
- Automatic coverage discovery
- Coverage provider abstraction
- LCOV ingestion
- Target-project configuration mutation
- LLM judgment inside the deterministic pipeline
- Threshold tuning (30 default, 15 supplemental, both preserved)
- Language expansion
- CI integration
- Engram integration

These remain deferred to WP6+ (per Roadmap).
