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

**WP9 Hardening Round 1 — COMPLETE 2026-08-29 (166/166 pass, cli.ts parseCliArgs 61% CRAP54, defu external pilot PASS, threshold addendum, reviewer ACCEPTED). Human gate 2026-08-29: CONTINUE WITH CONSTRAINTS (second, approved).**

---
## Next Step

**WP9 Hardening Round 2 — main() integration + coverage densification (CONTINUE WITH CONSTRAINTS) — ACTIVE per plan `.opencode/plans/2026-08-29T19:30:00Z-wp9-hardening-round2-main-integration.md` (approved:true, 3 tasks). Single narrow slice only.**

Scope: Task1 tester adds main() integration `test/cli.integration.spec.ts` via vi.mock git/evidence, covers PASS/WARN/FAILED/malformed/gits error paths, asserts exit codes; Task2 addendum round2 main() before/after; Task3 round2 report ending AWAITING HUMAN REVIEW. Constraints: contract 0.2.0 frozen, no CRAP/threshold change, INV-01..04 preserved, reversible, Low/Medium.

Artifacts pending: `experiments/wp9-hardening-round2/*`
Verification target: 170+ tests pass, tsc clean, build ok, main() coverage >0%