# WP1.1 — Correlation Verification

## Purpose

Mechanically verify the foundational Git-hunk-to-function-range correlation before proceeding. WP1 is otherwise accepted.

## Required Cases

Verify the existing fixture cases:

- modified `add`
- added function
- rename `multiply` → `times`
- deleted `halve`

For each current function, generate the exact Git current-side changed intervals, analyzer method interval, computed intersection(s), and final changed/not-changed decision.

For deletion report only:

```text
Git deletion detected: true
Current analyzer evidence: absent
Historical metrics: unavailable
```

Do not claim deleted-function analyzer correlation.

## Required Artifact

Generate from code:

`experiments/wp1.1/correlation-verification.json`

Suggested shape:

```json
{
  "cases": [{
    "case": "modified-add",
    "file": "src/math.ts",
    "gitIntervals": [{"start": 2, "end": 17}],
    "method": {"name": "add", "start": 1, "end": 17},
    "intersections": [{"start": 2, "end": 17}],
    "changed": true
  }]
}
```

Illustrative numbers above must not be copied unless mechanically verified.

Use the same Git hunk parser and interval-intersection code used by WP1. Preserve exact diff inputs. If verification exposes a defect, fix it and add regression tests.

## Forbidden

No new product feature, AST/source parsing, symbol resolution, risk rules, new analyzers, or generalized architecture.

## Report

Create `docs/research/WP1.1_CORRELATION_VERIFICATION_RESULTS.md` containing exact hunks, parsed intervals, analyzer ranges, intersections, case results, defects found, code changes, and tests.

End with exactly one:

```text
VERIFIED
DEFECT FOUND AND FIXED
STOP
```

Then stop. Do not implement WP2.
