# WP5.1 — Repository Documentation Audit

Per `experiments/wp5/planning/WP5_REPO_LEVEL_DOCUMENTATION_INTEGRATION.md`.
Each candidate: path, purpose, WP4R/WP5 belongs?, current stale text
(quoted), proposed change (exact), disposition (update-now / defer / no-change).

Facts to propagate (from integration doc):
- WP4R: COMPLETE / ACCEPTED; evidence frozen.
- WP5 active phase: .1 inventory/spec → .2 fixtures → .3 attribution →
  .4 failure semantics → Final verification/closure.
- Caller/CI produces coverage; prototype consumes.
- No orchestration/LCOV/config-mutation/LLM-in-deterministic-pipeline.
- Threshold 30 stays default; threshold 15 useful signal, not universal.
- Chronology: WP4R final → correction/human review → supplemental →
  closure → WP5.

---

## Candidate 1: PROJECT_STATUS.md (repo root)

**Path:** `PROJECT_STATUS.md`
**Purpose:** Project-level status pointer — currently the authoritative
location for "what phase is active."
**WP4R/WP5 belongs?** YES — this is the status owner.
**Current stale text:**
```
Version: v1.7 WP4R final usefulness rerun
WP4R.2 real-artifact verification: COMPLETE — VERIFIED
WP4R final usefulness rerun: CURRENT
Current question:
> Does changed-function CRAP provide useful real-world review signal?
Production is frozen.
```
**Proposed change:** Replace entire body with:
```
# Project Status

Version: v2.0 WP5 robustness and failure-mode validation

**WP4R: COMPLETE / ACCEPTED** — evidence frozen.
**WP5: ACTIVE** — WP5.1 inventory/specification complete.

Current phase: WP5.1 → WP5.2 (deterministic fixture suite)

Production code is frozen through WP5.1; WP5.2–5.4 will add test fixtures
and targeted fixes (attribution key alignment, diagnostics surfacing)
with approval gates between phases.

Default CRAP advisory threshold: 30.
```
**Disposition:** **UPDATE-NOW.** Unambiguous ownership; no duplicate
status text elsewhere. Change reflects frozen WP4R closure + WP5
activation per integration doc facts.

---

## Candidate 2: OPENCODE_START_HERE.md (repo root)

**Path:** `OPENCODE_START_HERE.md`
**Purpose:** Entry point for OpenCode agents — tells them which
experiment to run and what constraints apply.
**WP4R/WP5 belongs?** YES — must point to the current active experiment.
**Current stale text:**
```
WP4R.2 real-artifact verification: COMPLETE — VERIFIED
WP4R final usefulness rerun: **CURRENT**
...
Execute the final usefulness experiment only.
```
**Proposed change:** Replace entire body with:
```
# OpenCode Start Here

**WP4R: COMPLETE / ACCEPTED** — evidence frozen.
**WP5: ACTIVE** — WP5.1 inventory/specification complete.

Read:

1. `experiments/wp5/planning/WP5_MASTER_PLAN.md`
2. `experiments/wp5/planning/OPENCODE_WP5_1_PROMPT.md`
3. `experiments/wp5/wp5.1/WP5_1_FINDINGS.md` (when available)

Current task: Execute the active WP5 sub-phase per its prompt.

Production code is frozen through WP5.1. WP5.2–5.4 add fixtures and
targeted fixes with approval gates.

Do not change thresholds, expand languages, add orchestration, or use
LLM inference to fill missing evidence.
```
**Disposition:** **UPDATE-NOW.** Unambiguous entry pointer; stale guidance
would send agents to completed experiment.

---

## Candidate 3: README.md (repo root)

**Path:** `README.md`
**Purpose:** Public-facing project overview; tracks development status.
**WP4R/WP5 belongs?** YES — status line tracks dev phase.
**Current stale text:**
```
# Deterministic Code-Risk Prototype v0.2
**Status:** research/prototype planning. No production implementation yet.
```
**Proposed change:** Line 1 → `# Deterministic Code-Risk Prototype v0.3`;
line 3 → `**Status:** WP5 robustness and failure-mode validation in progress. WP4R accepted.`.
Minimal: status line + version bump only. No body restructure.
**Disposition:** **UPDATE-NOW.** Factual correction ("No production
implementation yet" is false since WP3 implemented rules + CLI).
Single-line edit; unambiguous.

---

## Candidate 4: docs/00_PROJECT_INDEX.md

**Path:** `docs/00_PROJECT_INDEX.md`
**Purpose:** Chronological navigation index for all docs and experiments.
**WP4R/WP5 belongs?** YES — chronology must be navigable per integration
doc: "WP4R final → correction/human review → supplemental → closure → WP5."
**Current stale text:** Last section reads:
```
## WP4R Final — Current
- `implementation/WP4R_FINAL_USEFULNESS_RERUN.md` — **current experiment**
```
**Proposed change:** Append new section at end:
```

---

## WP4R Closure & WP5 — Current

WP4R closed and accepted. Evidence frozen. WP5 active.

- `experiments/wp4r-final/WP4R_CLOSURE.md` — WP4R closure record
- `experiments/wp4r-final/WP4R_EVIDENCE_MANIFEST.md` — frozen evidence
- `experiments/wp4r-supplemental/WP4R_SUPPLEMENTAL_RESULTS.md` — supplemental cases
- `experiments/wp5/planning/WP5_MASTER_PLAN.md` — WP5 master plan
- `experiments/wp5/planning/WP5_1_FAILURE_MODE_INVENTORY_SPEC.md` — WP5.1 spec
- `experiments/wp5/wp5.1/WP5_1_FINDINGS.md` — WP5.1 findings (**current**)
```
Do NOT modify earlier sections' "Current" markers (historical record;
each section is accurate for its era). New section supersedes by
chronology position.
**Disposition:** **UPDATE-NOW.** Append only; no edits to existing text.
Follows established heading pattern.

---

## Candidate 5: docs/06_WORK_PACKAGES.md

**Path:** `docs/06_WORK_PACKAGES.md`
**Purpose:** Work-package definitions for the original roadmap.
**WP4R/WP5 belongs?** COMPLICATED — "WP5" here means "Reality check
(try ordinary TS repos)", which is a DIFFERENT work package from
`experiments/wp5` (robustness and failure-mode validation). Label collision.
**Current stale text:**
```
## WP5 — Reality check
Try a small set of ordinary TypeScript repos: npm, pnpm/yarn, Jest, Vitest,
coverage present/absent, ESLint present/absent, perhaps a monorepo, and tool failures.
```
**Proposed change:** DO NOT EDIT NOW. Instead, propose exact wording for
approval:
- Option A: Add parenthetical — `## WP5 — Reality check (original plan; superseded by experiments/wp5 robustness phase)`
- Option B: Rename original to `WP5-RC` and note supersession.
- Option C: Leave as-is; accept ambiguity and rely on integration doc
  + `experiments/wp5/planning/` as authoritative for the active WP5.
**Disposition:** **DEFER.** Ambiguous ownership (original roadmap vs active
phase); integration doc says "Do not blindly edit... establish ownership
first." Propose exact change and stop for approval per integration doc rules.

---

## Candidate 6: docs/12_DECISIONS_AND_OPEN_QUESTIONS.md

**Path:** `docs/12_DECISIONS_AND_OPEN_QUESTIONS.md`
**Purpose:** High-level decisions and open questions.
**WP4R/WP5 belongs?** POTENTIALLY — threshold decision lives here
conceptually (open question #6).
**Current stale text:**
```
## Open questions
6. What minimal thresholds make the three rules useful?
```
**Proposed change:** Defer. The threshold decision (30 stays default) is
authoritatively recorded in `WP4R_CLOSURE.md:28,54` and
`WP5_MASTER_PLAN.md` ("threshold 30 remains default"). Adding it here
creates duplicate authority. Per integration doc: "Prefer one authoritative
update over duplicate status text."
**Disposition:** **NO-CHANGE.** Threshold authority lives in closure doc.

---

## Candidate 7: AGENTS.md (repo root)

**Path:** `AGENTS.md`
**Purpose:** Execution guidance for coding agents (Engram review gate).
**WP4R/WP5 belongs?** NO — contains only process/review instructions,
no project-status content. Project-agnostic.
**Proposed change:** None.
**Disposition:** **NO-CHANGE.**

---

## Candidate 8: docs/future/11_FUTURE_ENGRAM_BOUNDARY.md

**Path:** `docs/future/11_FUTURE_ENGRAM_BOUNDARY.md`
**Purpose:** Architectural boundary decision (separate from Engram).
**WP4R/WP5 belongs?** NO — boundary unchanged by WP4R/WP5.
**Proposed change:** None.
**Disposition:** **NO-CHANGE.**

---

## Candidate 9: docs/implementation/* (historical playbooks)

**Path:** `docs/implementation/WP4R_*.md` and earlier.
**Purpose:** Historical execution playbooks for completed work packages.
**WP4R/WP5 belongs?** NO — frozen historical records per WP4R closure
document ("future findings become new work rather than silently modifying
the closed record").
**Proposed change:** None.
**Disposition:** **NO-CHANGE.** Frozen.

---

## Candidate 10: experiments/wp4r-final/* and wp4r-supplemental/*

**Path:** All files under `experiments/wp4r-final/` and
`experiments/wp4r-supplemental/`.
**Purpose:** Frozen WP4R evidence and closure documentation.
**WP4R/WP5 belongs?** NO — explicitly frozen (WP4R_CLOSURE.md:55;
WP4R_EVIDENCE_MANIFEST.md:25-26).
**Proposed change:** None.
**Disposition:** **NO-CHANGE.** Frozen; integrity preserved by manifest hashes.

---

## Summary of updates

| File | Disposition | Action |
|---|---|---|
| PROJECT_STATUS.md | update-now | Full replacement (status pointer) |
| OPENCODE_START_HERE.md | update-now | Full replacement (entry pointer) |
| README.md | update-now | Lines 1,3 only (status + version) |
| docs/00_PROJECT_INDEX.md | update-now | Append new section only |
| docs/06_WORK_PACKAGES.md | defer | Propose exact wording; stop for approval |
| docs/12_DECISIONS_AND_OPEN_QUESTIONS.md | no-change | Authority lives in closure doc |
| AGENTS.md | no-change | Process-only; project-agnostic |
| docs/future/11_FUTURE_ENGRAM_BOUNDARY.md | no-change | Unchanged |
| docs/implementation/* | no-change | Frozen historical records |
| experiments/wp4r-* | no-change | Frozen; manifest-protected |

**Ownership note:** The 4 update-now changes are unambiguous because
each file has a single clear owner role (status pointer, entry pointer,
public overview, chronological index). The WP5 collision in 06_WORK_PACKAGES
requires explicit approval because it touches shared roadmap language.