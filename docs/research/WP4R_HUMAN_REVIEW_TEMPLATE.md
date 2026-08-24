# WP4R Human Review Template

## Case

- Repository:
- Base:
- Target:
- File:
- Function:
- Threshold:
- Rule result:
- CRAP:
- CC:
- Coverage:

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

Write one or two short paragraphs.

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
