# WP4R Supplemental Verification Plan

## Status
**Current stage:** WP4R final verification. **WP5 has not started.**

This is a narrowly bounded supplemental verification pass, not a new work package and not a rerun of the original nine cases.

## Purpose
Human review found the sampled PASS decisions defensible, but WP4R produced no WARNs. The remaining evidence gap is therefore:
1. validate a real threshold-30 WARN; and
2. validate threshold sensitivity with a real function that PASSes at 30 but WARNs at 15.

## Documentation Correction
Before execution, correct the `isAllowedSecFetchSite` note in `experiments/wp4r-final/human-review-packet.md`. Preserve the observed CC=3, coverage=100%, CRAP=3, but remove the unsupported speculation that this implies a different CRAP formula. This is documentation-only; do not change production arithmetic.

## Exactly Two Supplemental Cases
### SUP-A — Threshold-30 WARN
Select a real historical changed function with **CRAP >30**.

Expected:
- threshold 30: WARN
- threshold 15: WARN

### SUP-B — Threshold Sensitivity
Select a real historical changed function with **15 < CRAP <=30**.

Expected:
- threshold 30: PASS
- threshold 15: WARN

## Case Constraints
Both cases must use real Git history, runtime TypeScript changes, the existing changed-function detector and complexity calculation, real Istanbul-compatible coverage from the repository's supported test path, and numeric attributable CRAP.

Do not use synthetic functions, hand-edited coverage, fabricated evidence, production-code changes, or type-only changes. Prefer existing WP4R repositories when suitable; another real TypeScript repository is acceptable only if necessary and justified.

Discovery may inspect candidate commits and generate evidence. Lock cases based on measured CRAP, not subjective risk. Record repo, subject, base/target SHA, file/function, changed-function count, diff LOC metadata, CC, coverage, CRAP, coverage command and artifact path.

## Execution
For each locked case:
1. Pin immutable base/target SHAs.
2. Generate coverage externally through the native supported test path.
3. Preserve raw Istanbul-compatible coverage.
4. Run the unchanged prototype at threshold 30.
5. Run it at threshold 15 against the same evidence.
6. Preserve outputs and exit codes.
7. Confirm evidence is identical between threshold runs except for threshold configuration.
8. Build human-review evidence.

Do not rerun the original nine-case corpus or turn this into Apollo/Jest debugging.

## Human Review Evidence
Include source, exact diff, changed lines, CC, coverage, CRAP, Istanbul attribution, both threshold results, commands, and a factual description of changed logic.

SUP-A classification:
- EXPECTED_WARN
- QUESTIONABLE_WARN
- UNDETERMINED

SUP-B threshold-30 classification:
- EXPECTED_PASS
- QUESTIONABLE_PASS
- UNDETERMINED

SUP-B threshold-15 classification:
- USEFUL_WARN
- NOISY_WARN
- UNDETERMINED

OpenCode leaves all classifications blank.

## Acceptance Criteria
Exactly two qualifying real cases; numeric attributable coverage/CRAP; SUP-A WARN at 30 and 15; SUP-B PASS at 30 and WARN at 15; identical evidence between threshold runs; raw evidence preserved; no production changes; no manipulated coverage; classifications blank.

If suitable real cases cannot be found within reasonable bounded discovery, stop and report that fact rather than relaxing criteria.

## Closure
After OpenCode stops at the human-review gate, the human reviewer classifies both cases. Only then is WP4R closure decided. WP5 begins only after explicit WP4R acceptance.
