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
**WP12 COMPLETE 2026-08-31 — AWAITING HUMAN REVIEW**

Details: .github/workflows/ci-evidence-{default,explicit}.yml (Node24, fetch base ref, vitest --coverage, evidence.json upload), docs/experiments/wp12/LOCAL_DRYRUN.md (schema-corrected, exit matrix per cli.ts:143-151) + WP12_MEASUREMENT_SPEC.md (9 metrics rubric, fixed top-level fields) + docs/closure/WP12_HUMAN_REVIEW_PACKET.md (executive summary, limitation NO_CHANGED_FUNCTION_SUCCESS_PATH, pipeline table exit0 gate null, measurement data) + experiments/wp12/WP12_RESULTS.md (P1 3.681/0.271, P2 3.679/0.276, JSON samples). Partial validation: UNSUPPORTED path + error path + infra validated; SUCCESS path unit-validated only (188/188). Commits 407315b/859b885/48ce965 on main. tsc 0, 188/188 pass, src clean, wp11 10/10. Packet ends AWAITING HUMAN REVIEW.
---
## Next Step
**HUMAN REVIEW GATE: Select CONTINUE / CONTINUE WITH CONSTRAINTS / STOP** per Roadmap Forks A-E. If CONTINUE → validate SUCCESS path via synthetic changed-function branch (trivial TS change, re-run both pipelines to observe PASS/WARN+ruleResults), then WP13 language or WP14 historical or WP15 usefulness per WP10 §9 priority. Correct drift: LOCAL_DRYRUN now lists gate PASS|WARN|null not boolean. No src/ change unless proven gap.