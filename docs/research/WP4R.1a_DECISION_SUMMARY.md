# WP4R.1a Decision Summary

## Final Decision

**V8 JSON CONFIRMED — ADD EXPLICIT ISTANBUL PATH**

WP4R.1a resolved the remaining h3/Hono contradiction.

h3 does **not** require `@vitest/coverage-istanbul`.

Its existing:

```text
Vitest 4.1.11
@vitest/coverage-v8 4.1.11
```

can emit a fully compatible Istanbul `coverage-final.json`.

The original h3 failure was caused by Vitest suppressing coverage output when a
test failed while `coverage.reportOnFailure` remained at its default false value.

With explicit JSON reporting and report-on-failure enabled, h3 produced a valid
Istanbul artifact without adding dependencies or modifying committed project
configuration.

## Architectural Interpretation

The prototype must **not** invoke or configure the target project's coverage
command.

Responsibility remains:

```text
developer / CI / target project
    -> generate Istanbul-compatible coverage JSON

prototype
    -> consume the supplied artifact
```

The experiments demonstrate that projects using Vitest's v8 provider can produce
the exact artifact model the prototype already consumes.

## Next Implementation Decision

Add one optional input:

```text
--coverage-file <path>
```

Semantics:

- if supplied, consume exactly that path;
- if omitted, retain the current default:
  `coverage/coverage-final.json`;
- do not search;
- do not generate coverage;
- do not invoke Vitest/Jest/nyc;
- do not inspect package-manager/test-runner configuration.

This preserves determinism and keeps the tool's evidence boundary small.

## What Is Explicitly Rejected

Do not implement:

- automatic coverage execution;
- Vitest reporter flags inside the prototype;
- artifact discovery;
- LCOV parsing;
- multiple coverage formats;
- coverage-provider installation;
- target configuration mutation.

WP4R.2 is authorized to implement only the explicit Istanbul artifact path.
