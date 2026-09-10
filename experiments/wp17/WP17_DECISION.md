# WP17 Final Product / Architecture Decision

**Date**: 2026-09-10  
**Status**: AWAITING HUMAN REVIEW  
**Predecessor**: WP16 Hardening Re-verification (Task 1) — REVERIFY.md all 6 checks PASS  
**Evidence Basis**: WP17/WP18 Validation Results (12 cases, FINAL) — WP17_RESULTS.md

---

## Decision

**CONTINUE WITH CONSTRAINTS** — No autonomous productization. Human review required before selecting Option A/B/C/D.

### Rationale

The deterministic evidence engine is technically sound and validated under tested conditions (12/12 cases ACCEPTED). However, the evidence does not yet support an autonomous product/architecture decision because:

1. **Multi-repo breadth remains thin** — Q1 partially met (1 external TS repo only; WP17_RESULTS.md:8-9)
2. **Human review protocol closed** — Q7 ACCEPTED but no reviewer pool beyond solo reviewer (WP17_RESULTS.md:10, 14)
3. **Practical usefulness unproven at scale** — WP15 usefulness demonstrated only in solo-human review of 12 cases, not in real review workflows
4. **Constraints from WP16 (a-d) still bind** — Language adapter isolation, additive schema, Angular deferred (ASSESSMENT.md:130)

The engine passes the deterministic correctness bar. The product value bar requires human judgment on whether the signal improves real engineering decisions across teams/repos.

---

## Constraints Carried Forward

From **WP16 ASSESSMENT.md:130** (constraints a–d) + **WP17_RESULTS.md** Q1/Q7:

| ID | Constraint | Source | Status |
|----|------------|--------|--------|
| **a** | New languages only as self-contained `ComplexityProvider` in `src/complexity-providers/`; zero core change | ASSESSMENT.md:130 | Active |
| **b** | Graduation requires AST-based CC with correlation ≥0.95 + standard LCOV/Istanbul coverage output | ASSESSMENT.md:130 | Active |
| **c** | Schema additive-only (0.4 frozen); no breaking changes without WP10 gap proof | ASSESSMENT.md:130, evidence-contract.md:3 | Active |
| **d** | Angular stays deferred; no Angular work in any option | ASSESSMENT.md:130, REVERIFY.md:6 | Active |
| **Q1-thin** | Multi-repo evidence thin — 1 external TS repo only (omlx-review-mcp); Python repos analyzable but unproven at scale | WP17_RESULTS.md:8, 14 | Active |
| **Q7-closed** | Human review protocol CLOSED — ACCEPTED 12/12 solo reviewer 2026-09-09; no reviewer pool expansion | WP17_RESULTS.md:10, 14 | Active |

---

## Evidence Summary (12 Cases)

All 12 cases from WP17_RESULTS.md ACCEPTED by human review 2026-09-09:

| Case | Type | Evidence File | Key Result |
|------|------|---------------|------------|
| case-001 | Feature (+499/-228) | `evidence/case-001.txt` | Largest change, clean attribution |
| case-002 | Fix (+2/-1) | `evidence/case-002.txt` | Small change, correct delta |
| case-003 | Test-only (+100) | `evidence/case-003.txt` | Test-only → no src changed functions |
| case-004 | Mechanical rename (+41/-20) | `evidence/case-004.txt` | Rename handled, no false risk |
| case-005 | Prod-without-test (+37/-6) | `evidence/case-005.txt` | Flags changed src fn despite no test change |
| case-006 | AI-generated: rename+comment | `evidence/case-006.txt` | WARN gate, deterministic (Q4 PASS) |
| case-007 | AI-generated: unused stub | `evidence/case-007.txt` | 2 changed fns surfaced, PASS (Q4 PASS) |
| case-008 | Docs-only (+452/-5) | `evidence/case-008.txt` | Clean evidence, no src changes |
| case-009 | External behavioral (engram) | `evidence/case-009.txt` | WARN via INCOMPLETE, Python-only gap honest |
| case-010 | Behavioral/mechanical feature | `evidence/case-010.txt` | 23 files, correct attribution |
| case-011 | Attribution fix, high-CC (28) | `evidence/case-011.txt` | CC=28 PASS 3 fns (high-CC covered) |
| case-012 | CI-only, seeded random | `evidence/case-012.txt` | Seed 13, PASS 0 fns |

**Reproducibility**: `reproducibility/pilot-run1-vs-run2.diff` (0-line diff, exit 0) + `reproducibility/case-006-run1-vs-run2.diff` (0-line diff, exit 1 WARN) — WP17_RESULTS.md:11-12  
**Cost**: check 0.333s, evidence 9907 bytes across 8 baseline cases — WP17_RESULTS.md:12-13

---

## Options Analysis (Post_WP9_Detailed_Roadmap.md:780-840)

### Option A — Productize Standalone
**Choose if**: Users have clear use case; integration cost manageable; signal useful; architecture stable.

**Evidence for**: Deterministic engine passes all technical gates; CLI + JSON contract stable (schema 0.4); sub-second CI overhead (0.333s); packaging clean (25.8 kB, 38 files — REVERIFY.md:20).

**Evidence against**: No multi-team reviewer study; integration cost unmeasured in real CI; usefulness signal limited to 12 cases solo-reviewed.

**Verdict**: **Not yet** — requires WP12 real integration validation + WP15 human usefulness at scale.

---

### Option B — Integrate into Engram
**Choose if**: Deterministic evidence materially improves Engram; evidence/interpretation separation valuable; Engram is natural workflow context.

**Evidence for**: Architecture designed for separation (Post_WP9_Detailed_Roadmap.md:790-800); Engram capability interface exists; WP17 case-009 (engram) produced evidence.

**Evidence against**: Engram integration untested beyond case-009; coupling risk if Engram architecture shifts; no evidence that Engram reviewers value CRAP signal over LLM reasoning.

**Verdict**: **Not yet** — requires Engram integration experiment (WP11/12 fork).

---

### Option C — Keep as Research/Tooling
**Choose if**: Evidence valuable; product value limited; experimentation useful; production investment not justified.

**Evidence for**: Engine technically robust; deterministic contract valuable for research; 12-case corpus reproducible; adapter pattern proven for TS/JS/Python.

**Evidence against**: Does not answer whether engine should become a product; defers decision without new evidence.

**Verdict**: **Viable holding pattern** — continue evidence gathering (WP15 multi-reviewer, WP12 integration, WP13 language) without production commitment.

---

### Option D — Stop
**Choose if**: Real-world value insufficient; integration cost excessive; signal adds little; evidence does not justify further investment.

**Evidence for**: None — engine works deterministically under tested conditions.

**Evidence against**: Core technical bar met; architecture stable; adapter pattern extensible; 12-case validation complete.

**Verdict**: **Rejected** — technical evidence does not support stopping.

---

## Required Next Steps Before Decision

| Step | Description | Evidence Needed |
|------|-------------|-----------------|
| **WP12** | Real CI integration validation (GitHub Actions, GitLab, Azure) | Setup time, failure modes, evidence completeness in real pipelines |
| **WP15-expanded** | Multi-reviewer human study (≥3 reviewers, ≥20 real PRs) | Reviewer agreement, time, tests added, defects found, warnings ignored |
| **WP11** | Stable evidence contract v1.0 for external consumers | Contract stability under versioning, consumer feedback |
| **Multi-repo expansion** | ≥3 external repos (TS/JS/Python/Go) | Q1 fully met, corpus breadth |

---

## Human Review Gate

This decision **does not** select A/B/C/D. It presents the evidence and constraints for human judgment.

**Review packet for decision maker**:
1. This document (WP17_DECISION.md)
2. WP17_RESULTS.md (12 cases, Q1–Q7 final)
3. WP16 ASSESSMENT.md (architecture stability, constraints a–d)
4. REVERIFY.md (re-verification: 6/6 PASS, zero src changes)
5. Post_WP9_Detailed_Roadmap.md §13 (WP17 options A–D definitions)
6. evidence-contract.md (schema 0.4 frozen, invariants INV-01..04)

**Decision authority**: Human reviewer — not autonomous.

**Outcome options**:
- CONTINUE WITH CONSTRAINTS (select A/B/C with explicit rationale)
- AWAITING HUMAN REVIEW (defer until WP12/WP15-expanded evidence)
- STOP (if reviewer judges value insufficient)

---

## No Autonomous Reclassification

Per project discipline (WP16 ASSESSMENT.md:94, WP17_RESULTS.md:15):

> **Per project rules, no new subjective usefulness claims are generated autonomously.**

This decision document makes no claim that the CRAP signal is "useful" or "not useful" in practice. It reports only what the 12-case evidence demonstrates under tested conditions.

---

## Angular Note

Angular remains **deferred** per constraint (d). No Angular work is proposed in any option. If Angular support becomes required, it must pass constraint (b) (AST CC correlation ≥0.95 + standard coverage output) and require a new explicit decision.