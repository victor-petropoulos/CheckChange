# WP4 Decision Summary

## Decision

**INCONCLUSIVE — FIX THE EXPERIMENT BEFORE CLAIMING USEFULNESS**

WP4 did not successfully test the core usefulness hypothesis.

Across 9 historical change cases and 18 threshold runs:

- 0 changed functions were evaluated;
- 0 PASS function results were produced;
- 0 WARN function results were produced;
- 0 NOT_EVALUATED function results were produced.

The selected repositories exposed applicability and evidence-acquisition failures before the prototype could generate the signal WP4 was intended to evaluate.

## What Actually Happened

### p-limit

The repository's implementation was JavaScript with TypeScript declarations. The TypeScript-only analyzer therefore emitted no changed functions for the selected implementation changes.

This was a repository-selection problem for this experiment, not proof that the correlation or rule logic failed.

### zod and zustand

Both contained relevant TypeScript, but `@barney-media/crap-typescript` failed while attempting to obtain coverage through the repositories' Vitest/coverage environments.

This exposed an evidence-acquisition portability problem.

## Important Failure-Semantics Finding

All nine cases reported a PASS gate and COMPLETE completeness despite zero evaluated functions; six of those cases also had analyzer capability failure.

That state is not acceptable as a final user-facing semantic because a failed evidence pipeline can resemble a clean result.

WP4.1 must investigate the correct distinction among:

```text
successful analysis with no relevant functions
successful analysis with partial evidence
evidence-provider failure
unsupported source/change
```

## What WP4 Did Not Establish

WP4 did **not** establish whether:

- threshold 30 is useful on real changes;
- threshold 15 is noisier;
- WARN findings are useful;
- changed-function CRAP is valuable to developers.

No warnings existed to review.

## What Remains Valid

Earlier verified work remains valid:

- Git hunk parsing and changed-function correlation;
- v0.1 evidence envelope;
- `0` versus `null` semantics;
- advisory rule logic;
- separation of policy from measurement.

## Next Step

WP4.1 is a research and decision work package.

It must investigate the evidence boundary and failure semantics before authorizing production changes.

Do not optimize repository selection around repositories already known to work with the current analyzer merely to obtain a successful demo.
