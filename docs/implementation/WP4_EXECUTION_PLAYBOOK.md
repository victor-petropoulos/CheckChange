# WP4 Execution Playbook

## Phase 1 — Select Before Testing

Select three public TypeScript repositories before running the prototype against any of them.

Document the rationale in:

`experiments/wp4/repository-selection.md`

Do not cherry-pick repositories based on preliminary CRAP output.

## Phase 2 — Pin Revisions

For each repository:

1. clone locally;
2. record repository URL;
3. record license;
4. select three historical target commits;
5. identify the appropriate parent/base for each;
6. record exact SHAs;
7. install dependencies according to the repository's own instructions.

Do not modify project source to improve compatibility.

## Phase 3 — Execute Cases

For each target:

1. checkout the target revision;
2. verify a clean working tree;
3. run the WP3 tool against the pinned base at threshold 30;
4. preserve stdout/stderr and JSON;
5. repeat at threshold 15;
6. record runtime and any setup friction.

If execution fails, preserve the failure and continue to another case where possible.

## Phase 4 — Human Review

Inspect each WARN in the actual changed source.

Classify:

```text
USEFUL | PLAUSIBLE | NOISY | UNDETERMINED
```

Write the reason in one or two sentences.

Do not let OpenCode or another LLM decide whether its own warning is useful.

## Phase 5 — Aggregate

Produce `aggregate-results.json` with counts and rates across all cases.

Do not hide failed runs or NOT_EVALUATED functions.

## Phase 6 — Report and Stop

Create:

`docs/research/WP4_USEFULNESS_VALIDATION_RESULTS.md`

End with:

```text
CONTINUE
CONTINUE WITH CONSTRAINTS
STOP
```

Then stop for human review.
