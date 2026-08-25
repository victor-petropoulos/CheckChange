# WP4R Evidence Manifest Template

## Purpose
Freeze the principal evidence used to accept and close WP4R. Do not alter raw evidence during manifest generation.

| Evidence | Path | SHA-256 | Status |
|---|---|---|---|
| Original final usefulness results | `experiments/wp4r-final/WP4R_FINAL_USEFULNESS_RESULTS.md` | _compute_ | _verify_ |
| Corrected original human-review packet | `experiments/wp4r-final/human-review-packet.md` | _compute_ | _verify_ |
| Human-review diagnostics | `experiments/wp4r-final/human-review-diagnostics.md` | _compute_ | _verify_ |
| Supplemental repository selection | `experiments/wp4r-supplemental/repository-selection.md` | _compute_ | _verify_ |
| Supplemental human-review packet | `experiments/wp4r-supplemental/human-review-packet.md` | _compute after classification_ | _verify_ |
| Supplemental results | `experiments/wp4r-supplemental/WP4R_SUPPLEMENTAL_RESULTS.md` | _compute after update_ | _verify_ |
| SUP-A coverage | `experiments/wp4r-supplemental/sup-a/coverage-final.json` | _compute_ | _verify_ |
| SUP-A threshold 30 | `experiments/wp4r-supplemental/sup-a/output-threshold-30.json` | _compute_ | _verify_ |
| SUP-A threshold 15 | `experiments/wp4r-supplemental/sup-a/output-threshold-15.json` | _compute_ | _verify_ |
| SUP-B coverage | `experiments/wp4r-supplemental/sup-b/coverage-final.json` | _compute_ | _verify_ |
| SUP-B threshold 30 | `experiments/wp4r-supplemental/sup-b/output-threshold-30.json` | _compute_ | _verify_ |
| SUP-B threshold 15 | `experiments/wp4r-supplemental/sup-b/output-threshold-15.json` | _compute_ | _verify_ |
| WP4R closure | `experiments/wp4r-final/WP4R_CLOSURE.md` | _compute last_ | _verify_ |

## Freeze Rule
If required evidence is missing or materially inconsistent, stop and report it. After successful closure, future work must not silently rewrite the WP4R evidence record.
