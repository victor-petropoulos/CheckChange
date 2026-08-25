# OpenCode Prompt — WP4R Closure Documentation Pass

## Status
WP4R verification has reached closure documentation. This pass is **documentation-only**. WP5 has not started.

Do not run additional experiments or change production code.

## Human Review Decisions to Record

### SUP-A — `normalizeRouteRules`
**Classification:** `EXPECTED_WARN`

**Rationale:** CC=36 and CRAP=36 despite 100% statement coverage. The function performs substantial route-rule normalization and validation across multiple concerns. A threshold-30 WARN is proportionate advisory attention for a structurally complex changed function even with high coverage.

### SUP-B — `processJsonRpcMethod`, threshold 30
**Classification:** `EXPECTED_PASS`

**Rationale:** CC=28, branch coverage=89.36170212765957%, CRAP=28.94391416160196. It falls below threshold 30. The PASS is consistent with the deterministic boundary; proximity alone does not make the result wrong.

### SUP-B — `processJsonRpcMethod`, threshold 15
**Classification:** `USEFUL_WARN`

**Rationale:** The function handles protocol/request validation, notification semantics, handler lookup/execution, exception handling, information-exposure protection, and error translation. With CC=28 and incomplete branch coverage, advisory attention at threshold 15 is useful rather than obviously noisy. This demonstrates meaningful threshold sensitivity using identical evidence.

## 1. Update Supplemental Human Review Packet
Update `experiments/wp4r-supplemental/human-review-packet.md`.

Fill only the three classifications and reviewer rationales above. Do not alter raw source, diff, CC, coverage, CRAP, commands, SHAs, or threshold results except obvious formatting/transcription errors. If substantive evidence conflicts, STOP and report it.

## 2. Update Supplemental Results
Update `experiments/wp4r-supplemental/WP4R_SUPPLEMENTAL_RESULTS.md`.

Replace PENDING human classification with:
- SUP-A: `EXPECTED_WARN`
- SUP-B threshold 30: `EXPECTED_PASS`
- SUP-B threshold 15: `USEFUL_WARN`

Record that supplemental evidence was accepted for its intended WP4R purpose.

Do **not** claim threshold 15 is universally better than 30. Preserve existing limitations: bounded search, one supplemental repository, only thresholds 15/30 evaluated, and commit-level gate semantics.

## 3. Create Final Closure Document
Create `experiments/wp4r-final/WP4R_CLOSURE.md`.

### Status
State: **WP4R: COMPLETE / ACCEPTED**

### Objective
Summarize WP4R as validation of real-world usefulness and operational behavior of the deterministic changed-function CRAP pipeline/advisory rule using externally produced coverage evidence.

### Evidence Completed
Summarize from preserved evidence:
- original nine-case rerun across h3, Hono, and apollo-client;
- 21 reported changed functions;
- 14 numeric PASS and 7 NOT_EVALUATED;
- zero WARN in the original rerun;
- human review of eight sampled numeric PASS findings;
- all eight accepted as `EXPECTED_PASS`;
- evidence-quality correction passes completed before classification;
- two supplemental real-world h3 cases;
- SUP-A CRAP=36: WARN at 30 and 15; `EXPECTED_WARN`;
- SUP-B CRAP≈28.9439: PASS at 30 and WARN at 15; `EXPECTED_PASS` at 30 and `USEFUL_WARN` at 15;
- identical coverage evidence used across threshold comparisons.

### Conclusions Supported by Evidence
Record narrowly:
1. The deterministic pipeline can consume externally generated Istanbul-compatible coverage and produce changed-function CC, coverage, CRAP, and advisory outcomes.
2. Sampled low/moderate-CRAP PASS decisions survived human review.
3. A real high-complexity function produced a useful WARN at the default threshold despite high coverage.
4. Threshold configurability changes advisory sensitivity deterministically.
5. Threshold 15 produced useful additional signal in the tested supplemental case.
6. Evidence does **not** establish that 15 should replace 30 universally.
7. Retain **30 as the current default** unless future evidence justifies policy change.
8. Missing/unattributable coverage remains explicit rather than guessed.
9. Coverage/test generation remains outside the prototype.

### Known Limitations
Preserve at least:
- Apollo coverage generation did not produce usable artifacts for tested runtime cases; underlying Jest reporter failure remained unresolved.
- Some original cases were NOT_EVALUATED.
- Supplemental search was bounded and both supplemental cases came from h3.
- Current validation is for the TypeScript prototype, not cross-language generality.
- WP4R does not establish a universally optimal CRAP threshold.

### Architectural Boundaries Preserved
WP4R did not add:
- test orchestration;
- automatic coverage discovery;
- provider abstraction;
- LCOV support;
- target-project configuration mutation;
- LLM judgment in the deterministic evidence/rule pipeline.

Caller/CI remains responsible for evidence production.

### Final Decision
State:
- WP4R acceptance criteria are satisfied for current prototype scope.
- No further WP4R experiments are required before progression.
- Threshold 30 remains the current default.
- WP4R evidence is frozen after closure.
- Future findings become new work rather than silently modifying the closed record.
- WP5 may begin after this closure documentation pass is complete.

## 4. Create Evidence Manifest
Create `experiments/wp4r-final/WP4R_EVIDENCE_MANIFEST.md`.

List principal evidence and compute SHA-256 where practical:
- `experiments/wp4r-final/WP4R_FINAL_USEFULNESS_RESULTS.md`
- `experiments/wp4r-final/human-review-packet.md`
- `experiments/wp4r-final/human-review-diagnostics.md`
- `experiments/wp4r-supplemental/repository-selection.md`
- `experiments/wp4r-supplemental/human-review-packet.md`
- `experiments/wp4r-supplemental/WP4R_SUPPLEMENTAL_RESULTS.md`
- `experiments/wp4r-supplemental/sup-a/coverage-final.json`
- `experiments/wp4r-supplemental/sup-a/output-threshold-30.json`
- `experiments/wp4r-supplemental/sup-a/output-threshold-15.json`
- `experiments/wp4r-supplemental/sup-b/coverage-final.json`
- `experiments/wp4r-supplemental/sup-b/output-threshold-30.json`
- `experiments/wp4r-supplemental/sup-b/output-threshold-15.json`
- `experiments/wp4r-final/WP4R_CLOSURE.md`

If required evidence is missing, mark `MISSING` and STOP closure. Do not modify raw evidence to make checksums stable.

## Production-Code Freeze
Do not modify production source/tests, changed-function detection, complexity/CRAP calculation, coverage attribution, gate rules, CLI behavior, thresholds/defaults, or target repositories. No additional coverage/test runs are required.

## Acceptance Checklist
- [ ] Three human classifications and rationales recorded
- [ ] Supplemental results updated from PENDING
- [ ] `WP4R_CLOSURE.md` created
- [ ] threshold 30 retained as current default
- [ ] limitations and architectural boundaries preserved
- [ ] evidence manifest created
- [ ] referenced evidence exists and checksums recorded where practical
- [ ] production code untouched
- [ ] no new experiment executed
- [ ] WP5 not started

## Stop Condition
After closure documents and manifest are complete, **STOP**. Do not begin WP5 planning/implementation.

Return:
1. files created/updated;
2. classifications recorded;
3. manifest/checksum status;
4. missing/inconsistent evidence;
5. confirmation production code untouched;
6. confirmation no additional experiment run;
7. final WP4R status.
