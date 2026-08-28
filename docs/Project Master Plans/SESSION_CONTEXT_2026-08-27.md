# Session Reload Summary — WP5.6 Closed + Remediation Accepted

**Date:** 2026-08-27
**State at end of session:** WP5.6 usefulness/robustness/freeze accepted. WP5.6 defect remediation (F-03, F-04, D-APOLLO) accepted. WP5 = COMPLETE. 145/145 tests pass. WP6 ready to begin in next session.
**Goal of this doc:** bring a fresh agent (or future session) up to the understanding this session ended with, in one read.

---

## 1. WP5.6 + Remediation Closure (2026-08-27)

### WP5.6 implementation
- 11-case corpus: 5 re-executed (hono-01/02/03, sup-a, sup-b), 6 replay-only (h3-01/02/03, apollo-01/02/03)
- All 8 plan tasks complete: case-selection, coverage-strategy, pipeline execution, human-review packet, claims-evidence matrix, robustness evaluation, reproducibility record, closure doc
- 143/143 tests pass at WP5.6 freeze
- Two findings recorded:
  - **F-03** Istanbul path coupling: cross-environment artifact replay produces `analyzerStatus=skipped`
  - **F-04** WP5.3 C03 expansion: changed-function count grew in hono-03 (4→6) and sup-a (108→196) due to test files

### WP5.6 remediation (this session, 2026-08-27)

Three defects remediated:

| Defect | Status | Resolution |
|--------|--------|------------|
| F-03 Istanbul path coupling | **RESOLVED** | `normalizeCoveragePaths()` in src/coverage.ts rebases absolute Istanbul keys onto current cwd when matching file exists. 2 new tests pass. |
| F-04 C03 expansion | **RESOLVED (by design)** | Documented in failure-semantics-contract.md §Test-File Function Discovery. No code change. |
| D-APOLLO coverage failure | **RESOLVED (caller-side)** | Re-clone + re-test confirmed apollo-02/03 work in isolation; apollo-01 needs `toBeCalled → toHaveBeenCalled` shim for Jest 27+ |

### Regression suite post-remediation
- 145/145 pass (54 files) — was 143 + 2 new F-03 tests
- `npx tsc --noEmit` clean
- `npm run build` exits 0
- All WP5.2 (7), WP5.3 (10), WP5.5 (18) regression anchors green

### Files changed in remediation

| File | Type | Size |
|------|------|------|
| `src/coverage.ts` | modified | +67/-4 lines |
| `experiments/wp5/wp5.6/wp56-f03-path-normalization.spec.ts` | new | 113 lines (2 tests) |
| `experiments/wp5/wp5.4/failure-semantics-contract.md` | modified | +17 lines (F-04 section) |
| `experiments/wp5/wp5.6/limitations.md` | modified | +2 paragraphs (F-04 + F-03 resolved) |
| `experiments/wp5/wp5.6/known-defects-rootcause.md` | modified | +1 line (F-04 resolved) |
| `experiments/wp5/wp5.6/WP5_6_CLOSURE.md` | modified | status updates |
| `experiments/wp5/wp5.6/freeze-checklist.md` | modified | F-03 marked resolved |
| `experiments/wp5/wp5.6/d-apollo-reverification.md` | new | 30 lines (apollo re-test) |
| `experiments/wp5/wp5.6/WP5_6_REMEDIATION_CLOSURE.md` | new | full remediation handoff |

### Invariants (preserved post-remediation)
- INV-01 ZERO≠NULL: PASS
- INV-02 MISSING≠MALFORMED: PASS
- INV-03 GIT≠REPO: PASS
- INV-04 ANALYZER TRUTHFUL: PASS
- FM-V01, FM-D10, FM-G06, FM-G07 (WP5.4): not affected
- FM-A07, FM-A08, FM-C03 (WP5.3): not affected

### Process notes for future sessions

- **Engram MCP untrustworthy in this session.** Returned "approved" with zero findings in 145ms (suspicious). Local MTPLX server showed no activity per user observation. The reviewer subagent was used as the Engram substitute. **Re-evaluate Engram trust at session start.** If Engram is still unresponsive, continue using reviewer subagent for review gates.

- **Documenter subagent unavailable.** Model `9router/ONLINE-Documenter` returned "Model not found" repeatedly. All doc edits in T5 and T8 were performed via direct python edits. **If documenter remains down, plan for direct file edits as fallback.**

- **Implementer subagent step limits + debug logs.** The implementer hit step limits twice during F-03 implementation and left 30+ debug `console.log` statements in production code, plus 2 stray console.logs in `src/attribution.ts` (out-of-scope change). Cleanup required direct edit. **For future F-03-style fixes, use the reviewer subagent as the implementation verifier and keep the implementer subagent on a tighter scope.**

- **Reversibility: high.** The F-03 fix is a single additive function. `git revert <commit>` returns to pre-remediation state.

---

## 2. WP6 — Strategic Direction (next session)

Per Roadmap WP6: "WP6 should answer: What is the smallest useful engineering capability justified by WP5 evidence?"

### WP6 starting point
- Engine: see latest git log (post-WP5.6-remediation)
- Tests: 145/145 pass
- WP5 = COMPLETE / ACCEPTED
- Frozen contract preserved (status taxonomy, threshold policy, methodology)

### WP6 decision forks (per Roadmap)
- IF USEFULNESS IS WEAK → freeze/stop, narrow scope
- IF USEFULNESS IS STRONG BUT CONSUMER IS UNCLEAR → stable evidence contract
- IF ENGRAM IS STRONGEST → minimal Engram proof
- IF CI IS STRONGEST → minimal CI proof
- IF HISTORY IS VALUABLE → prototype historical comparison
- IF LANGUAGE LIMITATIONS DOMINATE → prove one second language

### WP6 open decisions
1. Strategic direction (one of the 6 forks)
2. Whether to re-record apollo evidence now that D-APOLLO is resolved (apollo-02/03 work in isolation)
3. Whether to leverage F-03 fix for cross-environment artifact replay in CI scenarios
4. Whether to expand beyond TypeScript (not recommended by Roadmap §minimality principle)

### WP6 deliverables
- Strategic direction selected
- Rejected alternatives recorded with rationale
- Architecture chosen
- Evidence contract preserved
- Minimal integration proof
- Reversibility assessed

---

## 3. Project Identity (unchanged from prior session)

`code-risk-prototype-v0.3-opencode` — deliberately small, free, local-first TypeScript/Node CLI.

**Thesis:** Existing tools produce useful facts independently. A small deterministic correlator may be able to combine those facts into useful change-risk findings without requiring another platform or an LLM.

**Hard guardrail:** Do not build an analysis engine. Consume established tools. No custom TS AST analysis, no custom complexity, no custom coverage instrumentation, no LLM judgment in the deterministic pipeline.

**Cost philosophy:** local-first, account-free, API-key-free, cloud-independent, telemetry-free.

**Tech stack:** Node.js 24 LTS, TypeScript 6.x, ESM, npm, vitest, system Git, `@barney-media/crap-typescript` v0.5.0.

---

## 4. Frozen WP5 contract (preserved)

- Status taxonomy: SUCCESS | FAILED | UNSUPPORTED; gate: PASS | WARN | null; completeness: COMPLETE | INCOMPLETE | NOT_APPLICABLE
- Failure semantics: ZERO≠NULL, MISSING≠MALFORMED, GIT≠REPO, ANALYZER TRUTHFUL
- Threshold policy: 30 default, 15 supplemental
- Methodology: no silent changes
- Architecture: caller owns test execution + coverage generation; engine consumes evidence
- WP4R frozen baseline: 9 cases + 2 supplemental = 11 cases; preserved
- F-03 fix is fully compatible (additive, no contract change)

---

## 5. WP history (working backwards from current)

| WP | Status | Notes |
|----|--------|-------|
| WP6 | next | Strategic direction |
| **WP5.6 Remediation** | **DONE / ACCEPTED 2026-08-27** | F-03 fixed, F-04 documented, D-APOLLO resolved |
| **WP5.6** | **DONE / ACCEPTED 2026-08-27** | Usefulness, robustness, freeze |
| WP5.5 | DONE / CLOSED 2026-08-27 | End-to-end integration (8-row matrix, 5× determinism) |
| WP5.4 | DONE | Failure semantics (V01/D10/G06/G07) |
| WP5.3 | DONE / CLOSED | Attribution correctness (A07/A08/C03) |
| WP5.2 | DONE / ACCEPTED | Deterministic fixture suite |
| WP5.1 | DONE / ACCEPTED | Failure-mode inventory |
| WP4R | DONE / ACCEPTED | Real-repo usefulness rerun |
| WP4R.1/.1a/.2 | DONE | Coverage artifact discovery |
| WP4.2.1 | DONE | Corrective verification |
| WP4.2 | DONE | Composed evidence |
| WP4.1 | DONE | Evidence acquisition |
| WP4 | DONE (inconclusive) | Usefulness validation |
| WP3 | DONE | Three rules |
| WP2.1 | DONE | Envelope clarification |
| WP2 | DONE | Minimal evidence envelope |
| WP1.1 | DONE | Hunk→function correlation verification |
| WP1 | DONE | Git→changed-function correlation |
| WP0 | DONE | Evidence feasibility spike |

---

## 6. Navigation Map

| Need | Path |
|------|------|
| **WP6 handoff** | `experiments/wp5/wp5.6/WP5_6_REMEDIATION_CLOSURE.md` (2026-08-27) |
| **WP5.6 closure** | `experiments/wp5/wp5.6/WP5_6_CLOSURE.md` |
| **WP5.5 closure** | `experiments/wp5/wp5.5/WP5_5_RESULTS.md` |
| WP5.4 contracts | `experiments/wp5/wp5.4/failure-semantics-contract.md`, `diagnostic-matrix.md`, `status-contract.md`, `cli-contract.md` |
| WP5.3 anchors | `experiments/wp5/wp5.3/attribution-invariants.md`, `defect-fix-record.md` |
| F-03 fix | `experiments/wp5/wp5.6/wp56-f03-path-normalization.spec.ts` (2 tests) |
| F-04 documentation | `experiments/wp5/wp5.4/failure-semantics-contract.md` §Test-File Function Discovery |
| D-APOLLO re-test | `experiments/wp5/wp5.6/d-apollo-reverification.md` |
| Project thesis + scope | `docs/01_REVISED_PROJECT_THESIS.md`, `docs/02_SCOPE_AND_GUARDRAILS.md` |
| Prototype design + rules | `docs/03_PROTOTYPE_HYPOTHESIS.md`, `docs/04_PROTOTYPE_DESIGN.md`, `docs/05_EVIDENCE_AND_RULES.md` |
| Work packages | `docs/06_WORK_PACKAGES.md`, `docs/00_PROJECT_INDEX.md` |
| Success/stop criteria | `docs/07_SUCCESS_STOP_AND_EXPANSION_CRITERIA.md` |
| Tech stack | `docs/13_TECH_STACK.md` |
| Roadmap | `docs/Project Master Plans/Roadmap.txt` |
| Execution guidance | `docs/Project Master Plans/EXECUTION GUIDANCE FOR FUTURE LLMS.txt` |
| Production code | `src/{attribution,cli,complexity,coverage,crap,crapCalc,evidence,execute,git,rules}.ts` |

---

## 7. Process Notes (carry into next session)

1. **WP5.6 + remediation closures are committed.** WP6 begins with a clean slate.
2. **Tests are 145/145 green.** Re-run baseline at start of next session.
3. **Subagent availability (this session's findings):**
   - `researcher` (9router/ONLINE-Researcher-Fallback): working reliably
   - `tester` (9router/oc/deepseek-v4-flash-free): working reliably
   - `implementer` (9router/ONLINE-Coder-Pro or similar): works but may hit step limits and leave debug logs
   - `reviewer` (9router/ONLINE-Reviewer): working reliably; used as Engram substitute
   - `documenter` (9router/ONLINE-Documenter): **model not found** — direct file edits as fallback
   - `security-auditor`: not used this session
   - `playwright-*`: not used (UI repo precondition not met)
4. **Engram MCP trust: re-evaluate at session start.** Last response was 145ms with 0 findings — likely no real review occurred. Use reviewer subagent as substitute.
5. **No autonomous usefulness classification.** Per project-wide guardrail.
6. **Node 24 required.** `nvm use 24` before any commands.
7. **Frozen baseline at WP5.6 closure is preserved.** No silent methodology changes.

---

## 8. WP6 Suggested First Steps

1. Read `OPENCODE_START_HERE.md` (already points to this doc + remediation closure).
2. Read `experiments/wp5/wp5.6/WP5_6_REMEDIATION_CLOSURE.md` for full state.
3. Read `docs/Project Master Plans/Roadmap.txt` WP6 section (decision forks).
4. Read `experiments/wp5/wp5.6/known-defects-rootcause.md` for deferred items.
5. Re-run `npx vitest run --no-coverage` to confirm 145/145 baseline.
6. Author a new `.opencode/plans/<timestamp>-wp6-<slug>.md` per orchestrator workflow.
7. Apply `grill-me` skill before any creative work.
8. Dispatch planner for plan, await human approval, then implementers.
