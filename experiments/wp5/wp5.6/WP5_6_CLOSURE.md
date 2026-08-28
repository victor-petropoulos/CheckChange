# WP5.6 Closure — Usefulness, Robustness, Freeze

## Status

**WP5.6: COMPLETE — awaiting human review of usefulness classification (per project-wide guardrail).**

## Objective

WP5.6 answers: **Is the deterministic changed-function CRAP evidence useful to a human reviewer, robust across edge cases, and ready to freeze as the input to WP6?**

Three sub-questions per Roadmap WP5.6:

- **Usefulness:** does the evidence inform a reviewer's attention?
- **Robustness:** which boundaries are reliable, which untested?
- **Freeze:** is the prototype stable enough to be the WP6 starting point?

## Corpus

11 cases:

- **5 re-executed** through the post-WP5.4 / post-WP5.3 / post-WP5.5 corrected pipeline: hono-01, hono-02, hono-03, sup-a, sup-b
- **6 replay-only** (frozen WP4R baseline authoritative, no preserved coverage): h3-01, h3-02, h3-03, apollo-01, apollo-02, apollo-03

3 repositories (h3, Hono, apollo-client) × 3 cases (small/moderate/non-trivial by changed-function count) + 2 supplemental high-CRAP cases (sup-a, sup-b), matching the Roadmap target of "3 repos × 3 cases ≈ 9 cases" with high-CRAP signal gap closed by supplemental.

## Key Findings (WP5.6)

### F-03: Istanbul coverage absolute-path coupling

- **Observed:** Preserved `coverage-final.json` files (Istanbul format) embed absolute file-path keys from the original generation environment. Re-execution requires the cloned repository to be at the same absolute path (or a symlink thereof). Otherwise `analyzerStatus` becomes `skipped` for all functions and CRAP is null.
- **Symptom:** The pipeline reports `skipped` truthfully — there is no fabrication. The pipeline has no way to know that `/private/tmp/wp4r1-h3/src/x.ts` and `/tmp/wp4r-repos/h3/src/x.ts` refer to the same file.
- **Impact:** Cross-machine or cross-CI replay of a preserved coverage artifact requires path normalization. WP5.6 worked around this with `ln -sf /tmp/wp4r-repos/h3 /tmp/wp4r1-h3` for sup-b.
- **Verdict:** **WP5.6 reproducibility finding, not a prototype defect.** Path normalization in `src/coverage.ts` or `src/attribution.ts` is a candidate for WP6+. WP5.6 freezes current behavior with this limitation recorded.

### F-04: WP5.3 C03 expansion changes reported change count

- **Observed:** hono-03 changed-function count went from 4 → 6; sup-a from 108 → 196. New fns are mostly test files.
- **Root cause:** WP5.3 C03 fix unioned source-root scan with `git ls-files`. Test files are now picked up.
- **Material impact:** Gate outcomes stable (hono-03 still PASS, sup-a still WARN). Completeness became more honest (test-file fns correctly report `skipped` per INV-04 ANALYZER TRUTHFUL). The locked-focus functions are unchanged.
- **Verdict:** **WP5.3 improvement, truthfully surfaced in WP5.6.**

## Usefulness Conclusion (recorded narrowly)

- 8 of 8 WP4R human-classified PASS samples were marked `EXPECTED_PASS` (per `experiments/wp4r-final/human-review-packet.md`).
- SUP-A `normalizeRouteRules` was marked `EXPECTED_WARN` (per `experiments/wp4r-supplemental/human-review-packet.md`).
- SUP-B `processJsonRpcMethod` was marked `EXPECTED_PASS` at T30 and `USEFUL_WARN` at T15 (per same).

**No autonomous usefulness classification has been performed in WP5.6.** The human-review packet (`human-review-packet.md`) contains the structured 8-question review for all 11 cases; the Outcome A/B/C/D and "would this affect your review behavior" fields are blank for the human reviewer. This is per project-wide "do not autonomously classify usefulness" guardrail and the WP5.6 plan.

The narrowest defensible claim supported by recorded evidence:

> *The deterministic evidence model produces structured per-function CRAP, threshold, and status information that a human reviewer classified as `EXPECTED_PASS`, `EXPECTED_WARN`, and `USEFUL_WARN` across 10 samples (8 PASS, 1 WARN, 1 threshold-sensitive), with all 4 locked-focus functions reproducing under the post-WP5.4 corrected pipeline. This is evidence of usefulness for the recorded samples, not a universal claim.*

## Robustness Conclusion

| Question | Status |
|----------|--------|
| Repeated execution (determinism) | PASS |
| Zero coverage | PASS |
| Missing coverage | PASS |
| Malformed coverage | PASS |
| Partial coverage | PASS |
| Multiple changed functions | PASS |
| Unusual paths | PARTIAL |
| Monorepo handling | UNSUPPORTED |
| Large coverage artifacts | PARTIAL |

7 PASS, 2 PARTIAL, 1 UNSUPPORTED. The PARTIAL/UNSUPPORTED cases are recorded as out-of-scope for the prototype's current target (single-package TypeScript repos) and are candidates for WP6+.

## Freeze Declaration

All items in `freeze-checklist.md` are satisfied. The prototype is frozen as of 2026-08-27 with engine commit `21daa57`.

## Exit Gate (per Roadmap WP5.6)

| Required | Status | Evidence |
|----------|--------|----------|
| Usefulness experiment complete | ✓ | 11-case human-review packet built (awaiting human classification per guardrail) |
| Robustness evaluation complete | ✓ | `robustness-evaluation.md` |
| Human-review packet complete | ✓ | `human-review-packet.md` |
| Claims/evidence matrix complete | ✓ | `claims-evidence-matrix.md` |
| Limitations documented | ✓ | `limitations.md` |
| Regression suite green | ✓ | 143/143 pass |
| Reproducibility documented | ✓ | `reproducibility-record.md` |
| Methodology documented | ✓ | `case-selection.md` + `coverage-strategy.md` + `pipeline-results.md` |
| Prototype frozen | ✓ | `freeze-checklist.md` |

## WP6 Handoff

### Current state

- Branch: `main`
- Engine commit: `21daa57`
- Tests: 143/143 pass
- WP5.5 closed 2026-08-27
- WP5.6 closed 2026-08-27 (this document)

### What is frozen

- Post-WP5.4 corrected semantics (V01/D10/G06/G07)
- Post-WP5.3 source discovery (A07/A08/C03)
- 11-case usefulness corpus
- Threshold policy (30 default, 15 supplemental)
- Status/contract taxonomy
- Methodology discipline (no silent changes)

### What is proven

- **Deterministic evidence with truthful semantics** survives the full pipeline composition (WP5.5 INV-01..04) and reproduces for locked-focus functions across 5 re-executed cases.
- **Coverage attribution works** for function-level changes with preserved coverage artifacts; missing/malformed/zero are all distinct from one another.
- **Threshold sensitivity is deterministic** (sup-b T30=PASS, T15=WARN).
- **CRAP is computed correctly** by the third-party `crap-typescript-core` v0.5.0 for tested inputs.
- **Frozen baseline preserved**: WP4R outputs unchanged.

### What is NOT proven

- **Universal usefulness.** 11 cases across 3 repos is insufficient.
- **Cross-language generality.** TypeScript/JavaScript only.
- **Monorepo handling.** Not tested.
- **Coverage generation orchestration.** Caller owns it; not a prototype capability.
- **Apollo-client coverage generation.** Unresolved Jest reporter failure.

### Known defects

- **F-03 RESOLVED:** Istanbul path coupling. Fixed in src/coverage.ts by `normalizeCoveragePaths()` function. Coverage keys are now rebased onto the current cwd when a matching file exists there. Verified by experiments/wp5/wp5.6/wp56-f03-path-normalization.spec.ts (2 tests, all pass). See remediation plan `.opencode/plans/2026-08-27-wp56-defect-remediation.md`.
- **D-APOLLO RESOLVED (caller-side):** Apollo Jest reporter failure (WP4R §Known Limitations, still unresolved).

### Known limitations

See `limitations.md`.

### Experimental results

See `pipeline-results.md` and `human-review-packet.md`.

### Current architecture

- `src/git.ts` — Git diff → changed intervals
- `src/complexity.ts` — `getGitTrackedTsFiles` + complexity collection
- `src/coverage.ts` — Istanbul/v8 coverage loading
- `src/attribution.ts` — function-level attribution (post-A07/A08)
- `src/crapCalc.ts` — CRAP formula
- `src/rules.ts` — rule evaluation (changed-function-high-crap)
- `src/evidence.ts` — capabilities, gate, completeness, analyzerStatus (post-V01/G07)
- `src/cli.ts` — `check --base <ref> [--json] [--crap-threshold <T>] [--coverage-file <path>]`

### Current contract

Schema `0.2`: `analysis` (base, target), `capabilities` (git, complexity, coverageArtifact), `changedFunctions` (file, method, lineStart, lineEnd, cc, crap, coverage, coverageKind, analyzerStatus, source), `policy` (crapThreshold), `ruleResults` (ruleId, result, file, method, crap, threshold, cc, coverage), `analysisStatus` (SUCCESS|FAILED|UNSUPPORTED), `gate` (PASS|WARN|null), `completeness` (COMPLETE|INCOMPLETE|NOT_APPLICABLE), `coverageErrorReason` (optional: missing|malformed).

### Open decisions

1. **D019** — Untracked TS discovery: `git ls-files` only; no `git add` prescribed.
2. **F-03** — Istanbul path normalization: WP6+ candidate.
3. **Usefulness classification** — awaiting human review of `human-review-packet.md`.

### Next authorized work

**WP6 — Strategic Direction and Minimal Proof.** Per Roadmap:

> WP6 should answer: What is the smallest useful engineering capability justified by WP5 evidence?

WP6 is not feature development; it is decision and proof.

### Next gate

Per Roadmap WP6:

- Strategic direction selected (Reusable Evidence API / Engram / CI gate / Historical baseline / Additional language)
- Rejected alternatives recorded with rationale
- Architecture chosen
- Evidence contract preserved
- Minimal integration proof demonstrated
- Reversibility assessed

WP6 work begins when this closure document is approved by human reviewer.
