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

**WP9 Hardening Round 2 — COMPLETE 2026-08-29 (174/174 pass 58 files, cli.ts 86/98 87.8% main 8 hits parseCliArgs 25 hits, main integration 8 tests, round2 addendum+report, reviewer ACCEPTED) — AWAITING HUMAN REVIEW for CONTINUE/STOP fork.**

Scope completed: main() 0%→87.8% measured, both funcs now non-null CRAP (27/12 PASS at 30), external pilot defu PASS still valid, contract 0.2 frozen INV-01..04 preserved, reversible.

Artifacts: `experiments/wp9-hardening-round2/threshold-addendum-round2.md`, `wp9-hardening-round2-report.md`
Verification: 174/174 pass, tsc clean, build ok, CLI --help 0, coverage 23 keys cli.ts