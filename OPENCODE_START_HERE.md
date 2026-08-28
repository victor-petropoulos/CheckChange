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

**WP7 — Productionization — COMPLETE, AWAITING HUMAN REVIEW (2026-08-28).**

WP7 executed per plan `.opencode/plans/2026-08-28T15:51:18Z-wp7-productionization.md` (approved: true, 8 tasks) after human CONTINUE on WP6.

Artifacts:
- `package.json` 0.2.0 + `files:["dist/"]` + `prepare` + `docs/contracts/evidence-contract.md` frozen 0.2 + INV-01..04
- `src/cli.ts` --verbose/--debug stderr diagnostics, exit codes per contract, duplicate exit removed (HIGH reversibility)
- `src/coverage.ts` path.relative boundary check (HIGH traversal fixed WP5.6, reverified)
- `tsconfig.json` declaration:true, types bundled
- `experiments/wp7/perf-baseline.md` — small 0.34s/0.54s medium 4.13s large 4.96s 696K
- `experiments/wp7/WP7_RESULTS.md` + `experiments/wp7/human-review-packet.md` + `docs/wp7-release-checklist.md` — packet ends AWAITING HUMAN REVIEW
- WP6 proof preserved: `experiments/wp6/minimal-ci-proof/run-proof.sh` still PASS

Verification:
- 149/149 tests pass (56 files), tsc clean, build ok, npm pack 15.7kB/32 files (was 4.2M/1251 without files field — fixed per security audit)
- Security audit: CONDITIONAL PASS → fixed files field; boundary check intact; npm audit 0 vuln; no secrets
- WP5 invariants preserved (ZERO≠NULL, MISSING≠MALFORMED, GIT≠REPO, ANALYZER TRUTHFUL)

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

**WP8 — Real-World Validation — NEXT, only after human review of WP7 packet.**

Per Roadmap, human must classify productionization readiness (CONTINUE / CONTINUE WITH CONSTRAINTS / STOP). If human review not supplied, report ends:

```text
AWAITING HUMAN REVIEW
```

Per Roadmap WP7: WP7 turns selected WP6 capability into dependable component (predictable, installable, testable, observable, secure, documented). WP8 validates outside controlled WP5 experiment.

WP7 evidence now complete:
- 149/149 tests pass (56 files), tsc clean, build reproducible
- package 0.2.0 + files:["dist/"] 15.7kB/32 files, bin works, prepare builds, types ok
- CLI --verbose added, exit codes truthful, --crap-threshold/--coverage-file/--json stable, evidence semantics unchanged
- Security: path.relative boundary intact, git exec array, malicious coverage handled, npm audit 0, no secrets
- Observability: diagnostics ↔ analysisStatus/gate/completeness truthful
- Perf baseline: 0.34s CLI, 0.54s small, 4.13s medium, 4.96s large 696K
- WP6 minimal proof still PASS, contract 0.2 frozen, invariants preserved
- Production readiness checklist green (clean install, build, regression, integration, security, perf, docs)

Handoff to WP8:
- Read `experiments/wp7/WP7_RESULTS.md` for productionization state
- Read `experiments/wp7/human-review-packet.md` for gate packet (ends AWAITING HUMAN REVIEW)
- Read `experiments/wp7/perf-baseline.md` for baseline
- Read `docs/contracts/evidence-contract.md` for frozen contract 0.2
- Read `docs/Project Master Plans/Roadmap.txt` WP8 section for validation forks

Per Roadmap WP8 forks:
- IF RELIABILITY WEAK → return to WP7
- IF USEFULNESS WEAK → investigate signal
- IF FALSE POSITIVES DOMINATE → thresholds/policy/CRAP limits
- IF FALSE NEGATIVES DOMINATE → missing evidence dimensions
- IF COST TOO HIGH → optimize or narrow

WP8 should produce: real-world validation report, false-positive/negative analysis, operational + DX findings, adoption assessment, next steps

Process notes for next session:
- Documenter subagent (`9router/ONLINE-Documenter`) returned "Model not found" repeatedly; plan ahead for fallback to direct file edits
- Engram MCP returned suspiciously fast "approved" with no findings; local MTPLX showed no activity; reviewer subagent was used as substitute. Re-evaluate Engram trust at session start.
- Implementer subagent may hit step limits and leave debug logs; verify all changes against git diff before accepting
- All other subagents (researcher, tester, reviewer) are working reliably
