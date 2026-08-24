# WP2.1 — Evidence Envelope Clarification

## Purpose

Remove two ambiguities from the v0.1 evidence contract before rules depend on it. Do not expand the envelope.

## Required Semantic Contract

For both CRAP and coverage:

```text
number -> measured value
0      -> valid measured value of zero
null   -> measurement unavailable
```

Never use zero as a sentinel for unavailable evidence.

## Required Verification

Mechanically verify serialization of:

1. `crap: 0`
2. `crap: null`
3. `coverage: 0`
4. `coverage: null`

The JSON must preserve all four exactly. If the implementation already does this, do not rewrite it; prove it with tests.

The field table must unambiguously state:

```text
crap      number | null
coverage  number | null
```

## Compliance Clarification

Inspect the implementation and explicitly confirm whether it contains:

- JSON Schema tooling
- runtime validation libraries
- provider abstractions
- SARIF
- risk rules
- test/lint/typecheck evidence
- multi-language concepts

If absent, mark the corresponding `No ...` item `[x]`. If present, document the exact deviation.

## Deliverables

Create:

- `experiments/wp2.1/`
- `docs/research/WP2.1_ENVELOPE_CLARIFICATION_RESULTS.md`

Update the WP2 results document only where necessary.

End the results document with exactly one:

```text
VERIFIED
DEFECT FOUND AND FIXED
STOP
```

Then stop. Do not implement WP3.
