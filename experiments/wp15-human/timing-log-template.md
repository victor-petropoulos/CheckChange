# WP15 Timing Log

> Copy this file before starting review. Fill one row per case.
> Timer must be paused during breaks.

---

## Session Info

| Field | Value |
|-------|-------|
| **Reviewer** | |
| **Date** | |
| **Start Time** | |
| **End Time** | |
| **Total Elapsed (min)** | (auto-calc or sum of rows) |

---

## Per-Case Timing

| # | caseId | Start | End | Pause | Resume | Elapsed (min) | Notes |
|---|--------|-------|-----|-------|--------|---------------|-------|
| 1 | commit-A | | | | | | |
| 2 | commit-B | | | | | | |
| 3 | sup-a (T15) | | | | | | |
| 4 | sup-a (T30) | | | | | | |
| 5 | hono-03 (T15) | | | | | | |
| 6 | hono-03 (T30) | | | | | | |
| 7 | hono-01 (T15) | | | | | | |
| 8 | hono-01 (T30) | | | | | | |

---

## Field Definitions

| Field | Format | Description |
|-------|--------|-------------|
| **Start** | `HH:MM` | Timestamp when case review began |
| **End** | `HH:MM` | Timestamp when case review ended |
| **Pause** | `HH:MM` | Timestamp when timer was paused mid-case (leave blank if none) |
| **Resume** | `HH:MM` | Timestamp when timer resumed after pause (leave blank if none) |
| **Elapsed (min)** | `X.X` | Net minutes = (End - Start) - sum of (Resume - Pause) gaps |
| **Notes** | free text | Interruptions, context switches, anything affecting timing |

---

## Interruption Log

| Case # | Started At | Ended At | Reason |
|--------|------------|----------|--------|
| | | | |
