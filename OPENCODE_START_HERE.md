# OpenCode Start Here

WP4R.2 real-artifact verification: COMPLETE — VERIFIED  
WP4R final usefulness rerun: **CURRENT**

Read:

1. `docs/research/WP4R.2_REAL_ARTIFACT_VERIFICATION_RESULTS.md`
2. `docs/research/WP4R.2_FINAL_DECISION_SUMMARY.md`
3. `docs/implementation/WP4R_FINAL_USEFULNESS_RERUN.md`
4. `docs/implementation/WP4R_FINAL_EXECUTION_PLAYBOOK.md`
5. `docs/research/WP4R_FINAL_HUMAN_REVIEW_TEMPLATE.md`

Execute the final usefulness experiment only.

Production code is frozen.

Use real historical changes and real externally generated Istanbul artifacts via `--coverage-file`. Run thresholds 30 and 15.

Build the required human-review packet.

Do not autonomously classify usefulness.

If human review has not been supplied, end the results report:

```text
AWAITING HUMAN REVIEW
```

After human review it may end with `CONTINUE`, `CONTINUE WITH CONSTRAINTS`, or `STOP`.
