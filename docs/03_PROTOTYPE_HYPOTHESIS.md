# Prototype Hypothesis

Suppose existing tools establish:

```text
Git: calculatePrice changed
crap-typescript: complexity=18, CRAP=24.7
coverage: branch coverage=61%
tests: PASS
```

The possible contribution is correlation:

```text
HIGH — CHANGED_HIGH_RISK_FUNCTION

calculatePrice
  CRAP              24.7
  Complexity        18
  Branch coverage   61%
  Tests             PASS

Reason
  function changed
  AND CRAP > threshold
  AND coverage < threshold

Gate: FAIL
```

The prototype did not analyze source quality. It correlated deterministic facts.

## Falsification

Stop if reliable evidence requires substantial custom analysis, function-level correlation is too unreliable, the combined result adds little beyond underlying tools, setup becomes platform-like, or the prototype grows into an analysis framework.
