# WP4R Human Review Template

## Case

- Repository: https://github.com/unjs/h3
- Base: bd5cd6a7fd10028277786608065a90280f2fe2e0
- Target: baef4b94af47c3c71024807824657db9336ae9ca
- File: N/A (no WARN)
- Function: N/A (no WARN)
- Threshold: 30 and 15 (no WARN)
- Rule result: N/A (no WARN)
- CRAP: N/A
- CC: N/A
- Coverage: N/A

## WARN Usefulness Classification

Choose one:

```text
USEFUL
PLAUSIBLE
NOISY
UNDETERMINED
```

## Questions

1. Did the tool identify the function actually affected by the change?
2. Is the CC plausible from inspection?
3. Is the coverage evidence believable?
4. Is the CRAP score understandable from CC and coverage?
5. Would this warning cause closer review?
6. Did it reveal something not obvious from the diff?
7. Would repeated warnings like this become annoying?
8. Does threshold 15 improve or worsen the signal?

## Notes

No WARNs at threshold 30 or 15 — no WARN to classify. Human review of PASS sample still required.

Rationale for this case: moderate — fix(static) refuse non-canonical pathname (81 lines + tests)

---

## PASS Sample Review

For sampled PASS functions choose:

```text
EXPECTED PASS
QUESTIONABLE PASS
UNDETERMINED
```

Question:

> Did threshold 30 miss something that appears obviously risky?

No PASS with numeric coverage to sample — all non-zero cases are NOT_EVALUATED. Sample from NOT_EVALUATED instead.

Sampled functions (from NOT_EVALUATED):
- h3 case-02 serveStatic CC38
- hono case-03 reg-exp-router CC22
- nx case-03 version-actions CC38

---

## NOT_EVALUATED Review

Cause:

```text
coverage artifact absent
file missing from coverage artifact
coverage attribution unavailable
other
```

Was the reason understandable from tool output?

```text
YES / NO
```

