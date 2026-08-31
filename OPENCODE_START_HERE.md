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
**WP11 COMPLETE 2026-08-30 — CONTINUE received 2026-08-31, WP12 PLANNED, PAUSED AT APPROVAL GATE PENDING CHECKCHANGE RENAME**
Docs 11_WP11_CONTRACT_INVENTORY.md 92 lines + evidence-contract.md 230 lines (WP11 §§ V/C/I/E/D, schema 0.2 frozen, threshold 30/15, INV-01..04) + test/contract/wp11.contract.spec.ts 10 tests, 188/188 pass live 2026-08-31, tsc 0, build ok, src/ clean. Commit 07cf9c7. Grill Q1 answered Fork A: both pipelines in this repo on GitHub Actions (P1 default coverage path, P2 explicit --coverage-file + --crap-threshold). Research done (CLI flags, schema 0.2, INV-01..04, F-03 coverage.ts:38-75, caller burden 4.96s, no .github/workflows). Plan written .opencode/plans/2026-08-31T01:01:40Z-wp12-ci-integration-validation.md approved:false (5 tasks). NO implementation started, src/ clean, .github missing. Awaiting explicit human plan approval (reply APPROVED) per EXECUTION GUIDANCE stop-at-gate.
---
## Next Step
**RESUME: Human approves plan → flip approved:false→true (edit only) → dispatch implementer: Tasks 1 scaffold .github/workflows/ci-evidence-{default,explicit}.yml, 2 LOCAL_DRYRUN.md, 3 WP12_MEASUREMENT_SPEC.md (Roadmap §7 9 metrics), 4 collect evidence + WP12_HUMAN_REVIEW_PACKET.md + WP12_RESULTS.md (ends AWAITING HUMAN REVIEW), 5 regression guard 188/188 + tsc 0 + src diff clean + wp11.contract 10/10. Then reviewer/tester gates and WP12 closure packet. No src/ change; only .github/workflows/ + docs/evidence. If integration fragile diagnose caller-side vs contract vs provider before engine change.**