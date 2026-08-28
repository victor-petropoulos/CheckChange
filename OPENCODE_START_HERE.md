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

**WP8 — Real-World Validation — COMPLETE AWAITING HUMAN REVIEW (2026-08-28), executed per plan `.opencode/plans/2026-08-28T16:46:26Z-wp8-real-world-validation.md` (approved:true, 7 tasks) after human CONTINUE on WP7.**

Artifacts:
- `experiments/wp8/repo-selection.md`
- `experiments/wp8/changes.md`
- `experiments/wp8/evidence/case-1.json`
- `experiments/wp8/evidence/case-2.json`
- `experiments/wp8/evidence/case-3.json`
- `experiments/wp8/evidence/case-4.json`
- `experiments/wp8/evidence/case-5.json`
- `experiments/wp8/repro.md`
- `experiments/wp8/reviewer-notes.md`
- `experiments/wp8/fp-fn-analysis.md`
- `experiments/wp8/dx-operational.md`
- `experiments/wp8/wp8-report.md`

Verification: 149/149 pass, tsc clean, build ok, WP7 baseline preserved, invariants INV-01..04 preserved.

Summarize WP8 evidence: 5 cases (4 PASS 1 FAILED), fallback local prototype used, external Zod/Fastify deferred, zero FP observed, FN blind spots documented, DX trust/comprehension/friction, gate proposal CONTINUE WITH CONSTRAINTS awaiting human.

---
## Next Step

**WP9 — Evidence-Driven Evolution — NEXT only after human review of WP8 packet. Per Roadmap WP8 forks handling (reliability weak etc). If not supplied, ends AWAITING HUMAN REVIEW. WP8 evidence complete bullet list same as report.**