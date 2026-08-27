# WP5.3 — Coverage Attribution Correctness
## Revised after WP5.2 acceptance

**WP5.1:** ACCEPTED  
**WP5.2:** ACCEPTED  
**WP5.3:** READY FOR EXECUTION

## Authorized defects
- FM-A08 — suffix-collision wrong-file attribution — highest priority
- FM-A07 — container-method attribution mismatch
- FM-C03 — silent source-root blind spot

Deferred to WP5.4:
- FM-V01
- FM-D10
- FM-G06
- FM-G07

## Invariants
1. Complexity and coverage must identify the same logical function.
2. Wrong-file coverage must never be selected because paths share suffixes.
3. Container-method identity must be deterministic.
4. Ambiguity must not silently choose an arbitrary candidate.
5. Missing attribution stays explicit.
6. Coverage-map order cannot change attribution.
7. Source-file identity is resolved before function attribution.
8. Known changed TS outside analyzed roots must not silently yield trustworthy COMPLETE/PASS.
9. WP5.2 regression anchors and WP4R boundaries remain intact.

## FM-A08
Before fixing:
- reproduce FR-A7;
- reverse coverage-map order;
- use distinct files with identical suffixes;
- prove wrong/first-entry attribution.

Desired: exact/unambiguous source identity; if not possible, decline attribution.

Do not prescribe “full path comparison” in advance.

## FM-A07
Before fixing, cover:
- class method;
- object method;
- same raw method name in two containers;
- top-level control.

Use resolved OQ-1 naming evidence. Do not blindly concatenate container/function names unless tests prove the identity model.

## FM-C03
Compare:
- A: expand source discovery;
- B: detect/surface unanalyzed changed TS;
- C: hybrid.

Do not assume tsconfig include is automatically correct. Document the chosen contract in `source-discovery-decision.md` before implementation.

## Required adversarial cases
Exact-path control; suffix collision; reversed map order; class method; object method; same-name methods in different containers; top-level control; ambiguous candidate; TS under `src`; changed TS outside `src`; multi-package case where practical.

## Production changes authorized
Only FM-A08, FM-A07, FM-C03.

Do not change threshold/defaults, CRAP arithmetic, CLI messages, capability/analyzerStatus semantics, coverage formats/providers, orchestration, language support, or LLM behavior.

## Deliverables
Create under `experiments/wp5/wp5.3/`:
- `attribution-invariants.md`
- `adversarial-case-matrix.md`
- `source-discovery-decision.md`
- `defect-fix-record.md`
- `WP5_3_RESULTS.md`

Update tests, decision log, and traceability matrix.

## Acceptance
FM-A08 wrong-file attribution eliminated; map order irrelevant; FM-A07 supported container methods get correct numeric attribution; same-name containers stay distinct; top-level behavior preserved; FM-C03 no longer silently disappears without signal; WP5.2 anchors remain green; WP5.4-only behavior untouched.

STOP before WP5.4.
