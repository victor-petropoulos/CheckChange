# OpenCode Start Here

Read, do not skip this,:

1. `docs/Project Master Plans/EXECUTION GUIDANCE FOR FUTURE LLMS.txt`
2. `docs/Project Master Plans/Roadmap.txt`
3. `docs/Project Master Plans/SESSION_CONTEXT_2026-08-26.txt`
4. `experiments/wp5/wp5.6/WP5_6_REMEDIATION_CLOSURE.md` (2026-08-27)
5. `docs/Project Master Plans/Post_WP9_Detailed_Roadmap.md` (post-WP9 provisional)

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
**WP13 REMAINING 3 + WP10/11/12 + SCHEMA BUMP COMPLETE 2026-09-01 — AWAITING HUMAN REVIEW (commit be2bca4, tag v0.3.0-compatible)**
WP13-LANG-REGISTRY dispatch table (ProviderFactory Map, .py>.tsx>.ts) + CC-EQUIVALENCE interface+divergence table + SCHEMA BUMP 0.2→0.3 language field, WP10 capability definition, WP11 contract hardening (migration note), WP12 integration validation. 191→201/201 pass tsc0, e2e 3 fns 0.3 python PASS@30 WARN@15, package 0.3.0, INV-01..04 preserved, thresholds 30/15 frozen. Plan .opencode/plans/2026-09-01T18:14:51Z-wp13-remaining-wp10-wp11-wp12.md approved:true. Reviewer PASS, security PASS (2 pre-existing shell:true in pythonComplexity.ts deferred).

## Next Step
**NEXT WIP: Awaiting human review CONTINUE / CONTINUE WITH CONSTRAINTS / STOP — then WP14 historical (Node 20.9 fresh per-commit coverage) OR WP15 usefulness (human study) OR STOP/NARROW. No further code until gate.**

```
AWAITING HUMAN REVIEW
```

