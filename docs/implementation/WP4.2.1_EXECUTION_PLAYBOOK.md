# WP4.2.1 Execution Playbook

## Phase 1 — Reproduce Before Fixing

Run the current WP4.2 test suite.

Record:

- exact command;
- total tests;
- failing tests;
- failure messages.

Do not edit production code until the WP4.2 failures are reproduced.

## Phase 2 — Correct Attribution

Fix the coverage attribution data-shape defect.

Add a regression test that fails before the fix and passes afterward.

## Phase 3 — Correct Status Tests

Repair implementation and/or fixtures for:

- SUCCESS/PASS/COMPLETE
- SUCCESS/WARN/COMPLETE
- UNSUPPORTED/null/NOT_APPLICABLE
- FAILED/null/INCOMPLETE

If a test was wrong rather than production code, document that explicitly.

## Phase 4 — Build Real Changed-Function Fixtures

Ensure PASS/WARN/incomplete fixtures actually contain Git intervals that
intersect current TypeScript function ranges.

Use production correlation code.

## Phase 5 — Full Tests

Run the complete suite.

Acceptance:

```text
failing tests = 0
```

## Phase 6 — End-to-End Verification

Capture three real outputs:

1. changed function -> PASS
2. changed function -> WARN
3. changed function -> NOT_EVALUATED due to absent coverage

Each must contain at least one `changedFunctions` item.

Also capture:

4. unsupported source -> UNSUPPORTED/null/NOT_APPLICABLE
5. malformed artifact -> FAILED/null/INCOMPLETE

## Phase 7 — Report and Stop

Write:

`docs/research/WP4.2.1_CORRECTIVE_VERIFICATION_RESULTS.md`

End with exactly:

```text
VERIFIED — READY FOR WP4 RERUN
VERIFIED WITH CONSTRAINTS
STOP
```

Then stop.

Do not execute WP4R.
