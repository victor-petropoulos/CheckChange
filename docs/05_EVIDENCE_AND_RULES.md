# Minimal Evidence and Rules

Preserve enough information to explain each finding. Do not invent a universal quality ontology.

## Minimum evidence

**Git:** baseline/current revision and changed files; changed functions only if reliable.

**crap-typescript:** function identity, complexity, CRAP, coverage value if exposed, tool/version.

**Tests/coverage:** pass/fail, easy test counts, report availability, reliable coverage values.

**TypeScript:** typecheck pass/fail.

**ESLint:** lint pass/fail and easy finding count.

Missing evidence must never become a clean result.

```text
Coverage: UNAVAILABLE
Reason: no supported fresh coverage output detected
```

## Three initial rules

**R1 — Tests failed:** if tests execute and fail → FAIL.

**R2 — Changed function has high CRAP:** changed function + CRAP above visible threshold → WARN/FAIL.

**R3 — Changed high-risk function has inadequate coverage:** changed function + high CRAP/complexity + reliable coverage below threshold → FAIL.

Use simple visible defaults. Do not build a policy DSL.
