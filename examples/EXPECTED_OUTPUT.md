# Example Output

```text
$ tool check --base main

Capabilities
  ✓ Git
  ✓ crap-typescript
  ✓ Vitest coverage
  ✓ TypeScript
  ✓ ESLint

Checks
  ✓ 143 tests passed
  ✓ typecheck
  ✓ lint

Findings

HIGH  calculateFinalPrice
      CRAP              24.7
      Complexity        18
      Branch coverage   61%

      Changed high-risk function with inadequate coverage.

Gate: FAIL
```

Missing evidence is distinct:

```text
Coverage
  ? UNAVAILABLE
    No supported fresh coverage output was detected.
```
