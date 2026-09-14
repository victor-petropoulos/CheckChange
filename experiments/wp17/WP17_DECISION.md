# WP17 Decision — Productization Path Recommendation

**Date:** 2026-09-14  
**Status:** RECOMMENDATION PENDING HUMAN DECISION  
**Source Evidence:** experiments/wp17/WP17_RESULTS.md

---

## Executive Summary

WP17/WP18 validation completed with **12/12 cases ACCEPTED** (human review 2026-09-09). Core workflow gates **Q2, Q4, Q5, Q6 PASS**. Constraints: **Q1 PARTIAL** (single repo + 1 external), **Q7 CLOSED**. Multi-repo depth remains thin.

**Recommendation: C — Keep as research-tooling** (with option to revisit A if multi-repo validation added).

---

## Constraints & Evidence (file:line refs to WP17_RESULTS.md)

| Constraint | Status | Evidence |
|------------|--------|----------|
| **Q1 Repository Selection** | PARTIAL | Line 12-13: single repo, 1 external TS repo only; "partially met" |
| **Q2 Case Selection** | FINAL | Line 14: manual sampling + 2 AI-generated; no random/stratified run |
| **Q3 Ground Truth** | FINAL | Line 15: human judgment 8/8 ACCEPTED |
| **Q4 AI-Agent Independence** | PASS (partial) | Line 16: 2 AI cases, pipeline ran independently, no config changes |
| **Q5 Reproducibility** | PASS | Lines 17, 39-41: 0-line diffs for `--help` and `--verbose` |
| **Q6 Workflow Cost** | PASS | Lines 18, 43-46: 0.333s/check, 0.5-2KB evidence/case |
| **Q7 Human Review** | CLOSED | Line 18: ACCEPTED 2026-09-09, 8/8 sign-off |
| **Multi-repo Depth** | THIN | Line 57: "009 WARN via INCOMPLETE, honest gap: Python-only repos unanalyzable" |
| **High-CC Coverage** | CLOSED | Line 58: "011 CC=28 PASS 3fns" |
| **Seeded Random** | CLOSED | Line 59: "012 PASS 0fns seed=13" |

---

## Option Analysis

| Option | Verdict | Rationale |
|--------|---------|-----------|
| **A. Productize standalone** | ⚠️ Conditional | Core workflow solid, but Q1 PARTIAL (multi-repo thin) blocks general-purpose claim. Would need 2-3 more external repos (JS/TS/Python) to meet Q1 fully. |
| **B. Integrate Engram** | ❌ Not supported | No Engram integration tested in WP17. Engram is separate review gate (see AGENTS.md), not a CheckChange dependency. |
| **C. Keep research-tooling** | ✅ **Recommended** | Validated for local AI-coding workflow (the actual use case). Constraints documented. Low maintenance, high signal for current user. |
| **D. Stop** | ❌ Premature | 12/12 ACCEPTED, reproducibility proven, cost negligible. Value exists for validated scope. |

---

## Recommendation Detail

**Choose C: Keep as research-tooling** because:

1. **Validated scope matches actual use** — Local AI coding workflow around `checkchange` CLI (Q1 audience, line 12)
2. **Constraints are honest and documented** — Q1 PARTIAL, multi-repo thin explicitly called out (lines 12-13, 57)
3. **Zero maintenance burden** — No CI/CD, no multi-repo matrix, no external dependencies beyond current
4. **Reversible** — If user later needs productization, WP17 evidence package exists; add 2-3 repos → Q1 met → Option A viable

**If user wants Option A later:** Run WP17 expansion with 2-3 additional external repos (1 JS, 1 TS, 1 Python) using same protocol. Estimated 2-3 days.

---

## Flag

> **This is a recommendation pending human decision.** No autonomous reclassification of usefulness. Evidence presented above; final call rests with user.