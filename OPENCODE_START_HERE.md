# OpenCode Start Here


Read:

1. `docs/Project Master Plans/EXECUTION GUIDANCE FOR FUTURE LLMS.txt`
2. `docs/Project Master Plans/Roadmap.txt`
3. `docs/Project Master Plans/SESSION_CONTEXT_2026-08-26.txt`


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

**WP5.5 — CLOSED via CONTINUE (2026-08-27). WP5.6 — Usefulness — ACTIVE.**

WP5.4 gate satisfied 2026-08-27 via `CONTINUE`. WP5.5 gate satisfied 2026-08-27 via `CONTINUE` after corrections (commits 6c690a7 + 7ab2301). WP5.5 proves corrected semantics (V01/D10/G06/G07 + ZERO≠NULL, MISSING≠MALFORMED, GIT≠REPO, analyzer truthful) survive full pipeline composition.

Invariants verified:
- INV-01 ZERO≠NULL: `coverage:0`→`passed` / `null`→`skipped` (evidence.ts:216) — PASS via T2+T5
- INV-02 MISSING≠MALFORMED: `missing` vs `malformed` distinct reason+stderr (coverage.ts:21, cli.ts:125) — PASS via T3+T5
- INV-03 GIT≠REPO: `Git executable not found` vs `Not a git repository` — PASS via T4
- INV-04 ANALYZER TRUTHFUL: status from evaluation state — PASS via T2

Test results: 53 files, 143 tests pass, 0 fail. WP5.2 anchors 7/7 green, WP5.3 10/10 green, WP5.5 new 18 tests (T2 3, T3 4, T4 4, T5 7) all PASS. 5× determinism identical. 8-row status propagation matrix via buildEvidenceOutput + CLI (exit, stderr, JSON) all PASS.

Corrections applied 2026-08-27:
- F-01 FIXED: diagnostic-matrix.md:54 `COMPLETE` → `INCOMPLETE` per code (commit 6c690a7)
- F-02 hardened: CLI pre-build moved to `beforeAll`, eliminating per-test build overhead (commit 6c690a7)

Human-review packet:
- `experiments/wp5/wp5.5/WP5_5_RESULTS.md` — integration results, 6 Roadmap scenarios A–F, 8-row matrix, determinism, findings F-01 (diagnostic-matrix stale completeness) + F-02 (transient build timeout healed)
- `experiments/wp5/wp5.4/failure-semantics-contract.md` — validated status taxonomy (still authoritative)
- `experiments/wp5/wp5.4/diagnostic-matrix.md` — CLI diagnostics per condition (row 3 corrected 2026-08-27: `INCOMPLETE` per code, commit 6c690a7)
- `experiments/wp5/wp5.5/wp55-*.spec.ts` — 4 integration suites exercising Git→Changed→Complexity→Coverage→Attribution→CRAP→Threshold→Analyzer→Aggregate→JSON→CLI→Exit

---

## Next Step

**WP5.6 — Usefulness — AUTHORIZED, next action: case design per Roadmap WP5.6 (h3/Hono/apollo-client, 9 cases, tiered coverage). Do not classify usefulness autonomously.**
