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

**WP5.6 — Usefulness, Robustness, Freeze — CLOSED via CONTINUE 2026-08-27 (remediation accepted). WP5 = COMPLETE / ACCEPTED.**

WP5.4 gate satisfied 2026-08-27 via `CONTINUE`. WP5.5 gate satisfied 2026-08-27 via `CONTINUE` after corrections (commits 6c690a7 + 7ab2301). WP5.6 gate satisfied 2026-08-27 via `CONTINUE` (usefulness, robustness, freeze, 11-case corpus, 143 tests, F-03/F-04 documented). WP5.6 defect remediation accepted 2026-08-27 (F-03 fixed in src/coverage.ts via `normalizeCoveragePaths()`; F-04 documented; D-APOLLO resolved via re-clone; 145/145 tests pass).

Invariants verified:
- INV-01 ZERO≠NULL: `coverage:0`→`passed` / `null`→`skipped` (evidence.ts:216) — PASS via T2+T5
- INV-02 MISSING≠MALFORMED: `missing` vs `malformed` distinct reason+stderr (coverage.ts:21, cli.ts:125) — PASS via T3+T5
- INV-03 GIT≠REPO: `Git executable not found` vs `Not a git repository` — PASS via T4
- INV-04 ANALYZER TRUTHFUL: status from evaluation state — PASS via T2

Test results: 54 files, 145 tests pass, 0 fail (was 143 + 2 new F-03 tests). WP5.2 anchors 7/7 green, WP5.3 10/10 green, WP5.5 18/18 green, WP5.6 11-case corpus 5/5 re-executed + 6/6 replay-only preserved, F-03 fix verified by 2 new tests.

WP5.6 corrections and remediation:
- F-01 FIXED: diagnostic-matrix.md:54 `COMPLETE` → `INCOMPLETE` per code (commit 6c690a7, WP5.5)
- F-02 hardened: CLI pre-build in `beforeAll` (commit 6c690a7, WP5.5)
- F-03 RESOLVED: `normalizeCoveragePaths()` in src/coverage.ts rebases absolute Istanbul keys onto current cwd when matching file exists; verified by wp56-f03-path-normalization.spec.ts (2 tests pass)
- F-04 RESOLVED (by design): documented in failure-semantics-contract.md §Test-File Function Discovery
- D-APOLLO RESOLVED: apollo-client re-clone confirmed apollo-02/03 work in isolation; apollo-01 needs `toBeCalled → toHaveBeenCalled` shim for Jest 27+

Closure documents:
- `experiments/wp5/wp5.5/WP5_5_RESULTS.md` — WP5.5 integration results
- `experiments/wp5/wp5.6/WP5_6_CLOSURE.md` — WP5.6 usefulness/robustness/freeze closure
- `experiments/wp5/wp5.6/WP5_6_REMEDIATION_CLOSURE.md` — WP5.6 defect remediation closure (2026-08-27)
- `experiments/wp5/wp5.4/failure-semantics-contract.md` — validated status taxonomy (authoritative)
- `experiments/wp5/wp5.4/diagnostic-matrix.md` — CLI diagnostics per condition

---

## Next Step

**WP6 — Strategic Direction and Minimal Proof — NEXT (begin in new session).**

Per Roadmap WP6: "WP6 should answer: What is the smallest useful engineering capability justified by WP5 evidence?"

WP5 evidence is now complete:
- 145/145 tests pass
- 11-case usefulness corpus (5 re-executed, 6 replay-only)
- 3 defects remediated (F-03 fixed, F-04 documented, D-APOLLO resolved)
- WP5.6 freeze + remediation closure complete
- All WP5.3, WP5.4, WP5.5 anchors green
- Cross-environment artifact replay now works (F-03 fix)

Handoff to WP6:
- Read `experiments/wp5/wp5.6/WP5_6_REMEDIATION_CLOSURE.md` for current state
- Read `experiments/wp5/wp5.6/WP5_6_CLOSURE.md` for WP5.6 freeze + WP6 open decisions
- Read `experiments/wp5/wp5.6/known-defects-rootcause.md` for deferred items
- Read `docs/Project Master Plans/Roadmap.txt` WP6 section for decision forks

Per Roadmap WP6 decision forks:
- IF USEFULNESS IS WEAK → consider freeze/stop, narrow scope
- IF USEFULNESS IS STRONG BUT CONSUMER IS UNCLEAR → prioritize stable evidence contract
- IF ENGRAM IS STRONGEST → build minimal Engram proof
- IF CI IS STRONGEST → build minimal CI proof
- IF HISTORY IS VALUABLE → prototype historical comparison
- IF LANGUAGE LIMITATIONS DOMINATE → prove one second language

WP6 should produce:
- Strategic direction selected
- Rejected alternatives recorded with rationale
- Architecture chosen
- Evidence contract preserved
- Minimal integration proof
- Reversibility assessed

Process notes for next session:
- Documenter subagent (`9router/ONLINE-Documenter`) returned "Model not found" repeatedly; plan ahead for fallback to direct file edits
- Engram MCP returned suspiciously fast "approved" with no findings; local MTPLX showed no activity; reviewer subagent was used as substitute. Re-evaluate Engram trust at session start.
- Implementer subagent may hit step limits and leave debug logs; verify all changes against git diff before accepting
- All other subagents (researcher, tester, reviewer) are working reliably
