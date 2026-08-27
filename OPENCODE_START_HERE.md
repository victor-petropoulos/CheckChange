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

**WP5.4 — Correction pass: implemented & verified, awaiting human review.**

Four semantic truthfulness findings corrected:
- FM-V01: `coverageArtifact` reports `'absent'` (not `'available'`) when default coverage missing
- FM-G07: `analyzerStatus` reports `'skipped'` (not `'passed'`) when coverage is null
- FM-D10: Git ENOENT reports `"Git executable not found"` (not `"Not a git repository"`)
- FM-G06: Missing explicit coverage reports `"missing"` (not `"malformed"`)

Test results: 49 files, 125 tests pass. WP5.2 regression anchors (7/7) green. WP5.3 fixtures (10/10) green.

Human-review packet:
- `experiments/wp5/wp5.4/WP5_4_RESULTS.md` — full results, invariants, code changes, test results
- `experiments/wp5/wp5.4/failure-semantics-contract.md` — validated status taxonomy
- `experiments/wp5/wp5.4/diagnostic-matrix.md` — CLI diagnostics per condition

---

## Next Step

**WP5.5 — End-to-end integration verification, only after WP5.4 closure via human review.**

Per Roadmap: "WP5.4 proves individual semantic corrections. WP5.5 asks: Do the corrected semantics remain correct when the complete pipeline is composed?"

WP5.5 authorized ONLY after human review of this document with:
- `CONTINUE` — proceed to WP5.5
- `CONTINUE WITH CONSTRAINTS` — proceed with specified constraints
- `STOP` — do not proceed

Do not proceed to WP5.5 until WP5.4 gate is satisfied or an explicit project-level decision changes the gate.
