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

Scope: Task1 tester added 17 CLI unit tests `test/cli.unit.spec.ts` (direct import, parseCliArgs exported, vitest guard), src/cli.ts now 61% stmt coverage CC23 CRAP54; Task2 external pilot retry succeeded unjs/defu v6.1.7 vitest-native 12673 bytes PASS (vs prior 2 deferred); Task3 threshold-addendum before/after; Task4 hardening report. Constraints preserved: contract 0.2.0 frozen, no CRAP/threshold change, INV-01..04 preserved, reversible.

Artifacts: `experiments/wp9-hardening/evidence/external-pilot-retry.json`, `repro-retry.md`, `threshold-addendum.md`, `wp9-hardening-report.md`
Verification: 166/166 pass (57 files, was 149), tsc clean, build ok, CLI --help exit 0, src/cli.ts in coverage 23 keys, external pilot gate PASS