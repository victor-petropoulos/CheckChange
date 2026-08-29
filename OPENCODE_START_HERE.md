# OpenCode Start Here


Read, do not skip this,:

1. `docs/Project Master Plans/EXECUTION GUIDANCE FOR FUTURE LLMS.txt`
2. `docs/Project Master Plans/Roadmap.txt`
3. `docs/Project Master Plans/SESSION_CONTEXT_2026-08-26.txt`
4. `experiments/wp5/wp5.6/WP5_6_REMEDIATION_CLOSURE.md` (2026-08-27)


Execute the next project step in the roadmap only. Record in this document which step you are currently working on and what step is next.

Build the required human-review packet.

Do not autonomously classify usefulness.

If human review has not been supplied, end the results report:

```text
AWAITING HUMAN REVIEW
```

After human review it may end with `CONTINUE`, `CONTINUE WITH CONSTRAINTS`, or `STOP`.



---
## Current Step

**WP9 — COMPLETE — Human gate 2026-08-29: CONTINUE WITH CONSTRAINTS (approved). WP9 proposal (reliability strong, external diversity limited, threshold guidance) accepted. No autonomous classification.**

---
## Next Step

**WP9 Hardening — CLI unit coverage + external pilot retry (CONTINUE WITH CONSTRAINTS) — ACTIVE per plan `.opencode/plans/2026-08-29T00:42:47Z-wp9-hardening-cli-coverage.md` (approved:true, 4 tasks). Single narrow slice only.**

Scope: Task1 tester adds CLI unit tests `test/cli.unit.spec.ts` for parseCliArgs (no src change, INV-01 preserved); Task2 implementer retries external pilot with vitest-native TS repo (/tmp) or documents fallback; Task3 documenter addendum; Task4 verification report ending AWAITING HUMAN REVIEW. Constraints: contract 0.2.0 frozen, no CRAP/threshold change, no new languages/DB/service, reversible via git revert.

Artifacts pending: `experiments/wp9-hardening/*`
Verification target: 150+ tests pass, tsc clean, build ok, INV-01..04 preserved.