# WP4R Closure

## Status
**WP4R: COMPLETE / ACCEPTED**

## Objective
WP4R validated the real-world usefulness and operational behavior of the deterministic changed-function CRAP pipeline and its advisory gate rule, using externally produced Istanbul-compatible coverage evidence against real commits in real open-source TypeScript repositories. The prototype itself never generates coverage or tests; callers supply evidence, and the pipeline deterministically attributes changed-function CC, coverage, CRAP, and PASS/WARN/NOT_EVALUATED outcomes per configured threshold.

## Evidence Completed
From preserved evidence only:
- Original nine-case rerun across h3, Hono, and apollo-client (three cases each), with base/target SHAs pinned before prototype execution.
- 21 reported changed functions at each of thresholds 30 and 15: 14 numeric PASS and 7 NOT_EVALUATED; zero WARN in the original rerun (all observed CRAP ≤ ~11).
- Human review sampled eight numeric PASS findings across the five cases that produced changed functions; all eight were accepted as `EXPECTED_PASS`.
- Evidence-quality correction passes were completed before classification (pinned SHAs, artifact-path fixes, Apollo Jest reporter diagnostics, hono-03 fnMap correction, stderr/stdout byte-level confirmation).
- Two supplemental real-world h3 cases closed the high-CRAP gap the original rerun could not fill:
  - SUP-A `normalizeRouteRules`: CC=36, 100% statement coverage, CRAP=36 → WARN at threshold 30 and WARN at 15; classified `EXPECTED_WARN`.
  - SUP-B `processJsonRpcMethod` (isolated commit): CC=28, branch coverage 89.36170212765957%, CRAP≈28.9439 → PASS at threshold 30 (`EXPECTED_PASS`) and WARN at threshold 15 (`USEFUL_WARN`).
- Identical coverage artifacts were used for both threshold runs within each case (checksum-verified), so threshold comparisons differ only by the configured boundary.

## Conclusions Supported by Evidence
Recorded narrowly:
1. The deterministic pipeline can consume externally generated Istanbul-compatible coverage and produce changed-function CC, coverage, CRAP, and advisory outcomes.
2. Sampled low/moderate-CRAP PASS decisions survived human review.
3. A real high-complexity function produced a useful WARN at the default threshold despite high coverage.
4. Threshold configurability changes advisory sensitivity deterministically.
5. Threshold 15 produced useful additional signal in the tested supplemental case.
6. This evidence does **not** establish that 15 should replace 30 universally.
7. Threshold 30 remains the current default unless future evidence justifies a policy change.
8. Missing/unattributable coverage remains explicit rather than guessed (NOT_EVALUATED outcomes, INCOMPLETE completeness).
9. Coverage/test generation remains outside the prototype; caller/CI owns it.

## Known Limitations
Preserved from the record:
- Apollo coverage generation did not produce usable artifacts for the tested runtime cases; the underlying Jest reporter failure remained unresolved.
- Some original-rerun cases were NOT_EVALUATED (7 of 21 functions at both thresholds); two small cases produced zero detected changed functions.
- Supplemental search was bounded (h3 only, last 50 commits) and both supplemental cases came from h3.
- Current validation covers the TypeScript prototype only; no cross-language generality is established.
- WP4R does not establish a universally optimal CRAP threshold.

## Architectural Boundaries Preserved
WP4R did not add:
- test orchestration;
- automatic coverage discovery;
- provider abstraction;
- LCOV support;
- target-project configuration mutation;
- LLM judgment inside the deterministic evidence/rule pipeline.

Caller/CI remains responsible for evidence production.

## Final Decision
- WP4R acceptance criteria are satisfied for the current prototype scope.
- No further WP4R experiments are required before progression.
- Threshold 30 remains the current default.
- WP4R evidence is frozen after closure; future findings become new work rather than silently modifying the closed record.
- WP5 may begin now that this closure documentation pass is complete.

## Evidence Reference
See `WP4R_EVIDENCE_MANIFEST.md`.