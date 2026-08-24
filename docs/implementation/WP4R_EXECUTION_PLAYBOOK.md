# WP4R Execution Playbook

## Phase 1 — Freeze

Record the current prototype commit.

Run:

```bash
npx vitest run
npx tsc --noEmit
```

Confirm the verified baseline before external validation.

Do not modify production source after this point.

## Phase 2 — Select Repositories

Complete:

`experiments/wp4r/repository-selection.md`

before running the tool against any candidate.

Verify actual TypeScript implementation source exists.

## Phase 3 — Select Historical Changes

Choose approximately three changes per repository.

Pin exact SHAs.

Do not choose based on CRAP output.

## Phase 4 — Prepare Coverage States

For coverage-present cases, use the target repository's own documented mechanism
to generate Istanbul JSON before invoking the prototype.

Record the command.

For coverage-absent cases, ensure the artifact is absent.

The prototype itself must never generate coverage.

## Phase 5 — Execute

Run threshold 30 and 15.

Preserve all raw outputs.

Do not modify production code if a case fails.

## Phase 6 — Human Review

Review every WARN manually.

Also review at least three PASS functions across the corpus.

Record NOT_EVALUATED causes.

Do not delegate usefulness classification to an LLM.

## Phase 7 — Aggregate

Produce `aggregate-results.json`.

Include failed and unsupported runs.

## Phase 8 — Decide

Create:

`docs/research/WP4R_USEFULNESS_VALIDATION_RESULTS.md`

End with:

```text
CONTINUE
CONTINUE WITH CONSTRAINTS
STOP
```

Then stop for human review.
