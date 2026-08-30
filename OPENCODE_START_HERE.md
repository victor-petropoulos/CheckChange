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

**WP9 Hardening Round 5 — COMPLETE 2026-08-30 (178/178 pass 59 files, real-git main 4 tests PASS, tsc clean, build ok, FM-D10 real-git proven distinct ENOENT vs not-a-repo, schema 0.2 contract, threshold 30/15 frozen, reviewer ACCEPTED). Human gate 2026-08-30: CONTINUE WITH CONSTRAINTS (fifth, approved → Round5 executed as A first).**

Scope completed: Real-git main without mocks (valid repo PASS exit 0, not-a-repo, invalid base, ENOENT via execute stub) validates FM-D10/INV-03 truthful without vi.mock on git/evidence. No src change, contract 0.2 frozen, reversible. A first done, B (microsoft/tsdoc n=3) deferred to Round6 per grill.

Artifacts: `test/cli.real-git.spec.ts` (4 tests), `experiments/wp9-hardening-round5/threshold-addendum-round5.md`, `wp9-hardening-round5-report.md`
Verification: 178/178 pass (174+4), tsc 0, build ok, 4 real-git cases PASS

---
## Next Step

**AWAITING HUMAN REVIEW for CONTINUE / CONTINUE WITH CONSTRAINTS / STOP — next candidate B: additional Jest repo microsoft/tsdoc genuine provider (n=2→n=3, Low/Medium cost). Deferred: monorepo/history/languages/security Candidate 7 still deferred.**
