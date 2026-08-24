# WP4R.2 Execution Playbook

## Phase 1 — Freeze Baseline

Before editing:

```bash
npx vitest run
npx tsc --noEmit
```

Record the current passing baseline.

## Phase 2 — Add CLI Input

Add optional:

```text
--coverage-file <path>
```

Do not add any other CLI options.

## Phase 3 — Thread Exact Path

Pass the optional path to the existing coverage reader with the smallest
reasonable internal change.

Do not introduce provider abstractions or discovery.

## Phase 4 — Implement Explicit-Path Semantics

Verify:

```text
explicit valid     -> consume
explicit missing   -> FAILED
explicit malformed -> FAILED
no explicit path   -> existing default behavior
```

Explicit-path failure must not silently fall back.

## Phase 5 — Tests

Run the complete suite.

Acceptance:

```text
0 failing tests
0 TypeScript errors
```

## Phase 6 — h3 Compatibility

Use a compatible h3 V8 JSON artifact generated externally and pass its path
explicitly.

Record resulting changed-function coverage/CRAP evidence.

## Phase 7 — Hono Compatibility

Use:

```text
coverage/raw/default/coverage-final.json
```

without moving it.

Pass the path explicitly and record the result.

## Phase 8 — Report and Stop

Create:

`docs/research/WP4R.2_IMPLEMENTATION_RESULTS.md`

End with exactly:

```text
READY FOR WP4R RERUN
READY WITH CONSTRAINTS
STOP
```

Then stop.

Do not run the full WP4R usefulness experiment.
