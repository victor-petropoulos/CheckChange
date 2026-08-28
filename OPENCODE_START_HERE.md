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

**WP9 — Evidence-Driven Evolution — COMPLETE AWAITING HUMAN REVIEW (2026-08-28), executed per plan `.opencode/plans/2026-08-28T17:36:20Z-wp9-evidence-driven-evolution.md` (approved:true, 5 tasks) after human CONTINUE WITH CONSTRAINTS on WP8.**

Artifacts:
- `experiments/wp9/prioritization.md`
- `experiments/wp9/threshold-guidance.md`
- `experiments/wp9/evidence/external-pilot.json`
- `experiments/wp9/repro.md`
- `experiments/wp9/wp9-report.md`

Verification: 149/149 pass, tsc clean, build ok, WP8 baseline preserved, contract 0.2.0 frozen, invariants INV-01..04 preserved, no src code change (diagnosis: CLI gap correct per INV-01, external pilot fallback due to adapter mismatch).

Summarize WP9 evidence: Prioritization SELECTED 3 (CLI diagnosis, external pilot, threshold guidance) DEFERRED 4 hypotheses; CLI gap diagnosed as correct skipped (needs unit tests, not path hack); external pilot attempted 2 (nanoid bnt, clsx uvu) deferred, fallback local hardening PASS (3 funcs, same as WP8 case1, artifact 157230); threshold-guidance reduces friction; gate proposal CONTINUE WITH CONSTRAINTS awaiting human.

---
## Next Step

**NEXT — AWAITING HUMAN REVIEW of WP9 packet. Per Roadmap WP9 forks handling. If not supplied, ends AWAITING HUMAN REVIEW. No autonomous classification.**