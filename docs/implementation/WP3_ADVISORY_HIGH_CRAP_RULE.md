# WP3 — Advisory High-CRAP Rule Implementation

## Objective

Add the first useful deterministic policy to the verified changed-function evidence pipeline.

Implement exactly one rule:

```text
CHANGED_FUNCTION_HIGH_CRAP
```

## Required Behavior

For each current changed function:

```text
crap == null       -> NOT_EVALUATED
crap <= threshold  -> PASS
crap > threshold   -> WARN
```

Default threshold: `30`.

## CLI

Extend the existing command with:

```bash
--crap-threshold <number>
```

Default to 30.

Reject invalid, negative, NaN, or infinite values with a clear CLI/runtime error.

## Output

Extend the v0.1 envelope minimally. Do not redesign it.

Suggested additions:

```json
{
  "policy": {
    "crapThreshold": 30
  },
  "ruleResults": [],
  "gate": "PASS",
  "completeness": "COMPLETE"
}
```

Each rule result should include:

- ruleId
- result
- file
- method
- crap
- threshold
- cc
- coverage

For `NOT_EVALUATED`, preserve `crap: null`.

## Overall Result

```text
any WARN -> gate WARN
otherwise -> gate PASS

any NOT_EVALUATED -> completeness INCOMPLETE
otherwise -> completeness COMPLETE
```

Execution/tool failure remains distinct from gate status.

## Human Output

JSON remains required.

If human output already exists or can be added trivially, keep it factual:

```text
WARN  calculateFinalPrice
      CRAP       37.4
      CC         10
      Coverage   38%
      Threshold  30
      Rule       changed-function-high-crap
```

Do not add subjective recommendations.

## Required Tests

At minimum:

1. CRAP below threshold -> PASS
2. CRAP exactly threshold -> PASS
3. CRAP above threshold -> WARN
4. CRAP null -> NOT_EVALUATED
5. measured CRAP zero -> PASS
6. custom threshold changes result
7. invalid threshold rejected
8. multiple functions with one warning -> gate WARN
9. NOT_EVALUATED -> completeness INCOMPLETE
10. no changed functions -> gate PASS, completeness COMPLETE

## Scope Guardrails

Do not add:

- separate coverage rule;
- test-failure rule;
- complexity gate;
- baseline/delta analysis;
- source parsing;
- LLM;
- Engram;
- MCP;
- provider/plugin architecture;
- multi-language support;
- SARIF;
- CI integration.

## Results

Create:

`docs/research/WP3_IMPLEMENTATION_RESULTS.md`

Include:

- implementation LOC change;
- tests;
- exact CLI examples;
- sample JSON;
- sample warning;
- threshold override example;
- unavailable-CRAP example;
- deviations;
- confirmation that no new analyzer capability was introduced.

End with exactly:

```text
GO
GO WITH CONSTRAINTS
STOP
```

Then stop for human review.
