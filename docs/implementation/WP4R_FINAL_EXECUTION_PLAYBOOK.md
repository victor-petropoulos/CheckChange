# WP4R Final Execution Playbook

1. Freeze prototype; record commit; run full tests and typecheck.
2. Complete `experiments/wp4r-final/repository-selection.md` before prototype execution.
3. Generate coverage externally for each case and record exact artifact path.
4. Run thresholds 30 and 15; preserve all raw outputs.
5. Aggregate machine results.
6. Build `human-review-packet.md` with every WARN and sampled PASSes, but no usefulness classifications.
7. Wait for human review.
8. If human review is not supplied, final report ends `AWAITING HUMAN REVIEW`.
9. After human review, finalize with `CONTINUE`, `CONTINUE WITH CONSTRAINTS`, or `STOP`.
10. Stop. No production implementation.
