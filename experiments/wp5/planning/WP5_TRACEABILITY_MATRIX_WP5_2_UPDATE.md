# WP5 Traceability Matrix — WP5.2 Update

This matrix traces each WP5.1 failure-mode (FM) through WP5.2 fixtures, tests, and characterizations.

## FR → FM → Test → Status Traceability (All 23 FRs)

| FR ID | Priority | Linked FMs | Test File | FM Classification | Current Behavior Asserted | Desired Behavior Recorded | Disposition | Routing |
|-------|----------|------------|-----------|-------------------|---------------------------|---------------------------|-------------|---------|
| FR-A6 | P0 | FM-A07, FM-A10 | fr-a6.ts | FM-A07: CONFIRMED; FM-A10: *not in defect list but implied by schema* | Class method coverage returns null (NOT_EVALUATED) due to container-method attribution key mismatch | Class method coverage returns numeric values, CRAP computed, gate PASS/WARN per threshold | CONFIRMED (via FM-A07) | WP5.3 |
| FR-A7 | P0 | FM-A08 | fr-a7.ts | FM-A08: CONFIRMED | Both functions' coverage returns null (due to empty coverage map) | Each function gets coverage from its own file, not the other's | CONFIRMED | WP5.3 |
| FR-V1 | P0 | FM-V01 | fr-v1.ts | FM-V01: CONFIRMED | coverageArtifact='available' when default coverage is missing, all changed NOT_EVALUATED | coverageArtifact='absent' or equivalent when default coverage is missing | CONFIRMED | WP5.3 |
| FR-G3 | P0 | FM-G05, FM-D06 | fr-g3.ts | FM-G05: *not in defect list*; FM-D06: *part of FM-D10/FM-G06 (CONFIRMED; see precondition)* | CLI invocation with non-TS changes exits 0 with analysisStatus UNSUPPORTED | TBD at approval gate (requires human policy decision) | FM-D06: CONFIRMED (via FM-D10/FM-G06); FM-G05: BY_DESIGN? | WP5.4 (for policy TBD) |
| FR-D2 | P1 | FM-D02 | fr-d2.ts | FM-D02: *not in defect list* | Changed functions list excludes unmatched intervals (imports, type declarations, etc.) | Same as current (no diagnostic currently signals the gap) | BY_DESIGN | neither |
| FR-D4 | P1 | FM-D04 | fr-d4.ts | FM-D04: *not in defect list* | Deleted file with empty intervals [] is absent from changedFunctions; other files with changes are present | Same as current | BY_DESIGN | neither |
| FR-D6 | P1 | FM-D07 | fr-d6.ts | FM-D07: *not in defect list* | Only .ts-derived functions appear in changedFunctions; .json changes are silently ignored | Same as current | BY_DESIGN | neither |
| FR-V4 | P1 | FM-V04, FM-V05 | fr-v4.ts | FM-V04, FM-V05: *not in defect list* | analysisStatus SUCCESS, gate PASS, completeness INCOMPLETE (indistinguishable from no artifact) | Same as current | BY_DESIGN | neither |
| FR-V6 | P1 | FM-V06 | fr-v6.ts | FM-V06: *not in defect list* | Function in file present in coverage map gets null coverage; function in file absent from coverage map gets null → both NOT_EVALUATED | Same as current | BY_DESIGN | neither |
| FR-A3 | P1 | FM-A03, FM-A04 | fr-a3.ts | FM-A03, FM-A04: *not in defect list* | Attribution returns null coverage for method with ambiguous fnMap entries → NOT_EVALUATED (fnmap_conflict) | Same as current | BY_DESIGN | neither |
| FR-A4 | P1 | FM-A05 | fr-a4.ts | FM-A05: *not in defect list* | Inner function exclusively owns inner statements; outer function gets remaining statements | Same as current | BY_DESIGN | neither |
| FR-A5 | P1 | FM-A06 | fr-a5.ts | FM-A06: *not in defect list* | function A gets null coverage due to overlap handling complications; function B's presence varies | Same as current | BY_DESIGN | neither |
| FR-V7 | P1 | FM-V07 | fr-v7.ts | FM-V07: *not in defect list* | Duplicate Istanbul entries normalized to same path are merged to one entry; coverage is null despite having coverage data (defect in duplicate path normalization) | Same as current | CONFIRMED (via systemic null observation) | WP5.3 |
| FR-D1 | P2 | FM-D01 | fr-d1.ts | FM-D01: *not in defect list* | Despite having coverage data and full line coverage, coverage is null (systemic issue); analysisStatus SUCCESS, gate PASS, completeness INCOMPLETE | Same as current | CONFIRMED (via systemic null observation) | WP5.3 |
| FR-D3 | P2 | FM-D03 | fr-d3.ts | FM-D03: *not in defect list* | Both functions in newly added file are evaluated, but have null coverage (systemic issue); gate PASS, completeness INCOMPLETE | Same as current | CONFIRMED (via systemic null observation) | WP5.3 |
| FR-D5 | P2 | FM-D05 | fr-d5.ts | FM-D05: *not in defect list* | Function evaluated under renamed path but coverage is null (systemic issue); analysisStatus SUCCESS, gate PASS, completeness INCOMPLETE | Same as current | CONFIRMED (via systemic null observation) | WP5.3 |
| FR-C1 | P2 | FM-C01 | fr-c1.ts | FM-C01: *not in defect list* | analysisStatus SUCCESS, gate PASS, completeness INCOMPLETE (single file parse failure does NOT cause whole-run UNSUPPORTED; contrary to expected all-or-nothing behavior) | Same as current | BY_DESIGN | neither |
| FR-C2 | P2 | FM-C02 | fr-c2.ts | FM-C02: *not in defect list* | SUCCESS, gate PASS, completeness COMPLETE, changedFunctions [] | Same as current | BY_DESIGN | neither |
| FR-C3 | P2 | FM-C03 | fr-c3.ts | FM-C03: CONFIRMED | Function in file outside src root (e.g. tools/check.ts) is absent from changedFunctions (blind spot); function in src root is present | Same as current | CONFIRMED | WP5.3 |
| FR-G1 | P2 | FM-G02 | fr-g1.ts | FM-G02: *not in defect list* | Despite having coverage data, coverage is null (systemic issue); analysisStatus SUCCESS, gate PASS, completeness INCOMPLETE | Same as current | CONFIRMED (via systemic null observation) | WP5.3 |
| FR-G2 | P2 | FM-G03 | fr-g2.ts | FM-G03: *not in defect list* | Despite having coverage data and full line coverage, coverage is null (systemic issue); analysisStatus SUCCESS, gate PASS, completeness INCOMPLETE | Same as current | CONFIRMED (via systemic null observation) | WP5.3 |
| FR-G4 | P2 | FM-G06 | fr-g4.ts | FM-G06: *part of FM-D10/FM-G06 (CONFIRMED; see precondition)* | Threshold argument correctly reflected in output; despite coverage data, coverage is null (systemic issue) leading to NOT_EVALUATED rule results; gate PASS, completeness INCOMPLETE | Same as current | CONFIRMED (via FM-G06) | neither (verify CLI) |
| FR-G5 | P2 | FM-G10 | fr-g5.ts | FM-G10: *not in defect list* | Byte-identical JSON output when running the same fixture twice | Same as current | BY_DESIGN | neither |

## OQ and Defect Coverage Traceability

| Item | Resolution Mode | Evidence Source | Status | Notes |
|------|-----------------|-----------------|--------|-------|
| OQ-1 | Empirical evidence | src/attribution.ts:97, src/complexity.ts:22-24, fr-a6 behavior | RESOLVED | functionName is raw (no container prefix) |
| OQ-2 | Empirical evidence | src/evidence.ts, parser library outputs | RESOLVED | Parser skips unnamed declarations |
| OQ-3 | Human policy decision | src/evidence.ts:121-142, src/cli.ts:124-128 | PENDING | Human must decide exit code for UNSUPPORTED |
| OQ-4 | Human policy decision | failure-mode-matrix.md (gaps D02, V04) | PENDING | Human must decide on per-function diagnostics |
| OQ-5 | Preserved evidence only | experiments/wp4r-final/human-review-diagnostics.md:151 | RESOLVED | Apollo exit-1 anomaly distinct from current mapping |
| OQ-6 | Human policy decision | src/coverage.ts:28-31, src/evidence.ts:145 | PENDING | Human must decide on coverageArtifact intent |
| OQ-7 | Human policy decision | node_modules/.../fileSelection.js:106,146,185, test/wp4r2-coverage-file.test.ts:15 | PENDING | Human must decide on tsconfig include respect |
| FM-A07 | EXECUTABLE EVIDENCE | defect-repro.spec.ts: FM-A07 test | CONFIRMED | Container-method attribution key mismatch |
| FM-C03 | EXECUTABLE EVIDENCE | defect-repro.spec.ts: FM-C03 test | CONFIRMED | Source-root blind spot |
| FM-A08 | EXECUTABLE EVIDENCE | defect-repro.spec.ts: FM-A08 test | CONFIRMED | Suffix-collision path attribution |
| FM-V01 | EXECUTABLE EVIDENCE | defect-repro.spec.ts: FM-V01 test | CONFIRMED | Coverage capability mislabel |
| FM-D10/FM-G06 | EXECUTABLE EVIDENCE | cli-diagnostics/fm-d10-evidence.md and cli-diagnostics/fm-g06-evidence.md | CONFIRMED | CLI message inaccuracies |
| FM-G07 | EXECUTABLE EVIDENCE | defect-repro.spec.ts: FM-G07 test | CONFIRMED | analyzerStatus hardcoded 'passed' |

## Disposition Key
- CONFIRMED: WP5.2 executable evidence supports the defect
- REFUTED: WP5.2 executable evidence refutes the defect
- UNRESOLVED: Insufficient evidence to confirm or refute
- BY_DESIGN: Behavior is intentional and not a defect

## Routing Key
- WP5.3: Fix prioritized for next capability window
- WP5.4: Fix requires policy/schema decision or deeper redesign
- neither: No fix needed (verify behavior) or out of scope