# WP4.1 Decision Summary

Final decision: **COMPOSE EXISTING PROVIDERS**

Architecture:

```text
Git -> changed intervals
crap-typescript-core -> function ranges + CC
existing coverage/coverage-final.json -> coverage evidence
deterministic attribution -> function coverage
tiny CRAP arithmetic -> CRAP
existing WP3 rule -> PASS / WARN / NOT_EVALUATED
```

Failure semantics remain three-dimensional:

```text
analysisStatus
gate
completeness
```

WP4.2 adopts this clarification for unsupported input:

```text
analysisStatus: UNSUPPORTED
gate: null
completeness: NOT_APPLICABLE
```

`COMPLETE` is reserved for applicable analyses where all required evidence was available.

No test execution, coverage generation, JavaScript support, baseline/delta, new rules, or new analyzers are authorized.
