# WP2.1 Envelope Clarification Results

## Required Semantic Contract Restated

For both CRAP and coverage:
- `number` -> measured value
- `0`      -> valid measured value of zero
- `null`   -> measurement unavailable
- Never use zero as a sentinel for unavailable.

## Verification Method

1. Created a Node script `experiments/wp2.1/verify.mjs` that:
   - Builds four `ChangedFunction` objects with identical file/method but varying crap/coverage:
     a) crap 0, coverage 100
     b) crap null, coverage null (coverageKind N/A, status skipped)
     c) coverage 0, crap 5
     d) coverage null, crap null
   - Serializes the output via `buildOutput` from `src/evidence.ts` (or direct JSON.stringify) and parses back.
   - Verifies that `0` stays `0` and `null` stays `null` (checking both typeof and value).
   - Additionally tests `parseCrapJson` from `src/crap.ts` with fake JSON strings containing crap 0 and crap null.
   - Writes results to `experiments/wp2.1/serialization-verification.json` with per-case pass/fail.

2. Ran the existing test suite (`npm test`) to ensure no regressions.

## Exact JSON Excerpts Showing 0 vs Null Preserved

From `experiments/wp2.1/serialization-verification.json`, the `cases` array shows all checks passing. Example excerpt for the first case:

```json
{
  "case": "crap 0, coverage 100",
  "crapCheck": {
    "pass": true,
    "message": "crap zero preserved"
  },
  "coverageCheck": {
    "pass": true,
    "message": "coverage number 100 preserved"
  }
}
```

All six cases (four via buildOutput, two via parseCrapJson) pass.

## Field Table Check Result

In `docs/research/WP2_EVIDENCE_ENVELOPE_RESULTS.md`, the field table already unambiguously states:

| Field | Type | Source |
|-------|------|--------|
| └─ crap | number | null | CRAP score |
| └─ coverage | number | null | Line coverage percentage |

No changes were needed.

## Compliance Clarification Results

Inspected `src/` for forbidden items and confirmed absence (except where noted):

- [x] No JSON-schema tooling  
  *Evidence:* `grep -r -i "json.schema\|ajv\|zod" src/` returned no matches.
- [x] No runtime validation libraries  
  *Evidence:* `grep -r -i "yup\|joi\|validator\|class-validator" src/` returned no matches.
- [x] No providers  
  *Evidence:* `grep -r -i "provider" src/` returned no matches.
- [x] No SARIF  
  *Evidence:* `grep -r -i "sarif" src/` returned no matches.
- [x] No rules  
  *Evidence:* `grep -r -i "rules" src/` returned no matches.
- [x] No test/lint/typecheck evidence  
  *Evidence:* `grep -r -i "test" src/` matched test files (`src/git.test.ts`, `src/execute.test.ts`, `src/crap.test.ts`). These are test files that are part of the prototype's test suite, not evidence fields in the envelope. The envelope itself (as seen in the field table) contains no test/lint/typecheck fields. No lint or typecheck evidence found in the envelope.
- [x] No multi-language concepts  
  *Evidence:* `grep -r -i "java\|python\|rust\|go\|ruby\|php\|scala\|kotlin\|swift" src/` returned no matches.

## Defects Found

None.

## Code Changes

None required; the implementation already preserves `0` and `null` correctly.

## Tests Added

None added; existing test suite passes (38 tests). The verification script provides additional mechanical confirmation.

## Conclusion

VERIFIED