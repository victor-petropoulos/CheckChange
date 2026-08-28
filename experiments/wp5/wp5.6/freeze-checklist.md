# WP5.6 Freeze Checklist

Per Roadmap WP5.6 §FREEZE: source, tests, contracts, methodology, thresholds, results, limitations, reproducibility.

## Frozen Items

- [x] **Source code** — post-WP5.4 corrections (V01/D10/G06/G07 + INV-01..04 invariants), post-WP5.3 source-discovery expansion (A07/A08/C03), engine commit `21daa57`.
- [x] **Tests** — 53 files, 143 tests, all pass (`npx vitest run`). Frozen baseline 2026-08-27.
- [x] **Contracts** — `experiments/wp5/wp5.4/failure-semantics-contract.md`, `diagnostic-matrix.md`, `status-contract.md`, `cli-contract.md`. Status taxonomy preserved.
- [x] **Methodology** — no silent changes per project-wide §NO SILENT METHODOLOGY CHANGES. WP4R results preserved as baseline; WP5.6 re-executions labeled separately.
- [x] **Thresholds** — 30 (default) and 15 (supplemental). No new threshold tuning.
- [x] **Experiment results** — 11-case corpus: 5 re-executed (hono-01/02/03, sup-a, sup-b), 6 replay-only (h3-01/02/03, apollo-01/02/03). Outputs at `experiments/wp5/wp5.6/pipeline-runs/`.
- [x] **Limitations** — `limitations.md` lists scope, methodological, attribution, coverage, CRAP-inherent, reproducibility, and documentation limitations. Two WP5.6 findings (F-03 path coupling, F-04 C03 expansion) recorded.
- [x] **Reproducibility** — `reproducibility-record.md` per case with engine commit, Node version, SHAs, coverage commands, artifact hashes, analysis commands, results.
- [x] **Regression suite green** — 143/143 pass. WP5.2 anchors 7/7, WP5.3 anchors 10/10.
- [x] **WP5.3 regression anchors** — verified green.
- [x] **WP4R frozen behavior preserved** — `experiments/wp4r-final/` and `experiments/wp4r-supplemental/` artifacts unchanged.

## Items deferred to WP6+

The following remain open or explicitly deferred:

- [x] **F-03 resolution** — Istanbul coverage path normalization in `src/attribution.ts` or `src/coverage.ts`. Resolved by normalizeCoveragePaths() in src/coverage.ts; verified by wp56-f03-path-normalization.spec.ts.
- [ ] **Apollo Jest reporter failure** — unresolved per WP4R §Known Limitations. Out of scope for WP5.6.
- [ ] **Untracked TS discovery** (D019) — `git ls-files` only. Future policy decision required.
- [ ] **Usefulness classification** — awaiting human review of `human-review-packet.md`. No autonomous classification.
- [ ] **Monorepo support** — `getGitTrackedTsFiles` is theoretically capable but untested with real monorepos.
- [ ] **Language expansion** — TypeScript only.
- [ ] **Coverage provider expansion** — Istanbul and v8 only.
- [ ] **Engram / CI integration** — per WP6 decision forks.

## Closure readiness

WP5.6 exit gate per Roadmap:

- [x] Usefulness experiment complete (11-case human-review packet built; awaiting human classification)
- [x] Robustness evaluation complete (7 PASS, 2 PARTIAL, 1 UNSUPPORTED)
- [x] Human-review packet complete
- [x] Claims/evidence matrix complete
- [x] Limitations documented
- [x] Regression suite green (143/143)
- [x] Reproducibility documented
- [x] Methodology documented
- [x] Prototype frozen

**Note:** "Usefulness experiment complete" means the experiment was run; the *usefulness conclusion* is intentionally not autonomously classified. The human-review packet contains the structured data; the conclusion is the human reviewer's call per project-wide guardrail.
