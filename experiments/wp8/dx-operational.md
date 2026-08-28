# WP8 DX & Operational Findings

## Developer Experience Evaluation
- **Trust**: Deterministic results across cases 1-4; invariants INV-01..04 preserved (see reviewer-notes.md §59-64). Zero ≠ null, missing ≠ malformed, git ≠ repo, analyzer truthful.
- **Comprehension**: Skipped functions (null CRAP) vs passed (CRAP < threshold) clearly shown; gate logic focuses on changed functions only (repro.md lines 21-22, 34-35, 47-48, 60-61).
- **Noise**: Zero false positives/negatives in 5 cases (reviewer-notes.md lines 18,31,39,47,55). Threshold 30 sensitivity: small changes in CRAP near threshold would flip gate (e.g., CRAP 29→31).
- **Friction**: Coverage generation burden (~4.96s wall-clock per WP7 baseline); caller-owned coverage (must run `vitest run --coverage` before analysis).
- **Review Focus**: CRAP highlights only changed functions (ignore unchanged), reducing noise (reviewer-notes.md lines 16,28,36,44).
- **Willingness to Use**: Positive deterministic feedback, low noise, clear pass/fail.
- **Actionability**: Failed case (missing coverage) yields exit code 1 and explicit `analysisStatus=FAILED` (repro.md lines 73-74), enabling CI gating.

## Operational Evaluation
- **Runtime**: Coverage generation ~4.96s (large, WP7 baseline line 8); analysis check ~0.34s (small, WP7 baseline line 6); WP8 artifact 157230 bytes similar size.
- **Memory**: Artifact 157K bytes small; not large monorepo scale.
- **Scaling**: Linear with test suite size; coverage dominates wall-clock.
- **Ease of Use**: Flags `--base`, `--json`, `--coverage-file`, `--verbose`; exit codes 0 (pass), 1 (fail/missing), 2 (error).
- **Failure Recovery**: Case 5 missing coverage → `gate=null`, `analysisStatus=FAILED`, exit code 1 (no crash) (repro.md lines 70-74).
- **Installability**: `files:dist` includes CLI binary; `prepare` script builds dist; install via `npm install`.

## Performance Baselines Table
| Case | Artifact Size | Gate | Wall-clock Estimate | Changed Funcs |
|------|---------------|------|---------------------|---------------|
| 1    | 157230 B      | PASS | ~5.3s (cov+check)   | 3             |
| 2    | 157230 B      | PASS | ~5.3s               | 4             |
| 3    | 157230 B      | PASS | ~5.3s               | 4             |
| 4    | 157230 B      | PASS | ~5.3s               | 4             |
| 5    | 0 B (missing) | null | ~5.3s (cov fails)   | 0             |

## Friction Points
- Coverage generation cost dominates runtime (~4.96s).
- Caller-owned coverage burden (must run vitest --coverage first).
- Threshold policy confusion (sensitivity near 30).
- Skipped functions comprehension (null vs 0).

## Operational Findings
- No secrets, path traversal safe (engine reads only specified coverage file).
- Git exec array safety (no injection).
- No crash on malformed/missing coverage (fails gracefully).

## References
- Reproducibility log: repro.md
- Evidence JSONs: case-1.json through case-5.json