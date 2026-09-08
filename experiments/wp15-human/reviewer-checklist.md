# WP15 Reviewer Checklist

> Per-case instrument for solo human-usefulness review.
> Reviewer fills one instance per case. All fields required before moving to next case.

---

## Pre-Review

- [ ] Read `PACKET.md` (overview, fields, ordering)
- [ ] Open timing log (`timing-log-template.md` copy) — start timer before first case
- [ ] Confirm case bundle loaded in `experiments/wp15-human/cases/`

---

## Per-Case Review Steps

For each case row (WP14 pair / WP5.6 pipeline-run):

### 1. NOTICE

| Field | Instructions |
|-------|-------------|
| **caseId** | Copy from packet row (e.g. `commit-A`, `sup-a`, `hono-03`) |
| **noticeRank** (1-5) | After reviewing the case output, rate how prominently the WARN/PASS notice surfaces. 1 = buried/missed, 5 = unmissable. |

### 2. RANKING

| Field | Instructions |
|-------|-------------|
| **testsToAdd** (int) | Count of tests you would add if you were the reviewer. 0 = output sufficient as-is. |

### 3. TIME

| Field | Instructions |
|-------|-------------|
| **timeSpentMin** (float) | Minutes spent on this case (pause timer, record, resume for next). |

### 4. CONFIDENCE

| Field | Instructions |
|-------|-------------|
| **confidenceDelta** (-5 to +5) | Shift in your confidence that the risk classification is correct after reviewing. Negative = less confident post-review. |

### 5. FALSE POSITIVE ASSESSMENT

| Field | Instructions |
|-------|-------------|
| **fpBurden** (none / low / medium / high) | How much effort to dismiss or verify false positives in the output. |

---

## Post-Case

- [ ] All five fields filled for this case
- [ ] No verdict recorded (packet footer = `AWAITING HUMAN REVIEW`)
- [ ] Pause timer, record elapsed in timing log

---

## Cases to Review

| # | caseId | Source |
|---|--------|--------|
| 1 | commit-A | WP14 delta |
| 2 | commit-B | WP14 delta |
| 3 | sup-a (T15) | WP5.6 pipeline-run |
| 4 | sup-a (T30) | WP5.6 pipeline-run |
| 5 | hono-03 (T15) | WP5.6 pipeline-run |
| 6 | hono-03 (T30) | WP5.6 pipeline-run |
| 7 | hono-01 (T15) | WP5.6 pipeline-run |
| 8 | hono-01 (T30) | WP5.6 pipeline-run |

---

## Review Complete

- [ ] All 8 cases reviewed
- [ ] Timing log completed
- [ ] File saved as `experiments/wp15-human/reviewer-checklist-COMPLETED.md`
