# WP5.2 Fixture Manifest

This manifest maps each fixture requirement (FR) to its priority, linked failure modes (FM), test file, and characterizes the current vs desired behavior.

| FR ID | Priority | Linked FMs | Test File | Current Behavior Asserted | Desired Behavior Recorded |
|-------|----------|------------|-----------|---------------------------|---------------------------|
| FR-A6 | P0 | FM-A07, FM-A10 | fr-a6.ts | Class method coverage returns null (NOT_EVALUATED) due to container-method attribution key mismatch | Class method coverage returns numeric values, CRAP computed, gate PASS/WARN per threshold |
| FR-A7 | P0 | FM-A08 | fr-a7.ts | Both functions' coverage returns null (due to empty coverage map) | Each function gets coverage from its own file, not the other's |
| FR-V1 | P0 | FM-V01 | fr-v1.ts | coverageArtifact='available' when default coverage is missing, all changed NOT_EVALUATED | coverageArtifact='absent' or equivalent when default coverage is missing |
| FR-G3 | P0 | FM-G05, FM-D06 | fr-g3.ts | CLI invocation with non-TS changes exits 0 with analysisStatus UNSUPPORTED | TBD at approval gate (requires human policy decision) |
| FR-D2 | P1 | FM-D02 | fr-d2.ts | Changed functions list excludes unmatched intervals (imports, type declarations, etc.) | Same as current (no diagnostic currently signals the gap) |
| FR-D4 | P1 | FM-D04 | fr-d4.ts | Deleted file with empty intervals [] is absent from changedFunctions; other files with changes are present | Same as current |
| FR-D6 | P1 | FM-D07 | fr-d6.ts | Only .ts-derived functions appear in changedFunctions; .json changes are silently ignored | Same as current |
| FR-V4 | P1 | FM-V04, FM-V05 | fr-v4.ts | analysisStatus SUCCESS, gate PASS, completeness INCOMPLETE (indistinguishable from no artifact) | Same as current |
| FR-V6 | P1 | FM-V06 | fr-v6.ts | Function in file present in coverage map gets null coverage; function in file absent from coverage map gets null → both NOT_EVALUATED | Same as current |
| FR-A3 | P1 | FM-A03, FM-A04 | fr-a3.ts | Attribution returns null coverage for method with ambiguous fnMap entries → NOT_EVALUATED (fnmap_conflict) | Same as current |
| FR-A4 | P1 | FM-A05 | fr-a4.ts | Inner function exclusively owns inner statements; outer function gets remaining statements | Same as current |
| FR-A5 | P1 | FM-A06 | fr-a5.ts | function A gets null coverage due to overlap handling complications; function B's presence varies | Same as current |
| FR-V7 | P1 | FM-V07 | fr-v7.ts | Duplicate Istanbul entries normalized to same path are merged to one entry; coverage is null despite having coverage data (defect in duplicate path normalization) | Same as current |
| FR-D1 | P2 | FM-D01 | fr-d1.ts | Despite having coverage data and full line coverage, coverage is null (systemic issue); analysisStatus SUCCESS, gate PASS, completeness INCOMPLETE | Same as current |
| FR-D3 | P2 | FM-D03 | fr-d3.ts | Both functions in newly added file are evaluated, but have null coverage (systemic issue); gate PASS, completeness INCOMPLETE | Same as current |
| FR-D5 | P2 | FM-D05 | fr-d5.ts | Function evaluated under renamed path but coverage is null (systemic issue); analysisStatus SUCCESS, gate PASS, completeness INCOMPLETE | Same as current |
| FR-C1 | P2 | FM-C01 | fr-c1.ts | analysisStatus SUCCESS, gate PASS, completeness INCOMPLETE (single file parse failure does NOT cause whole-run UNSUPPORTED; contrary to expected all-or-nothing behavior) | Same as current |
| FR-C2 | P2 | FM-C02 | fr-c2.ts | SUCCESS, gate PASS, completeness COMPLETE, changedFunctions [] | Same as current |
| FR-C3 | P2 | FM-C03 | fr-c3.ts | Function in file outside src root (e.g. tools/check.ts) is absent from changedFunctions (blind spot); function in src root is present | Same as current |
| FR-G1 | P2 | FM-G02 | fr-g1.ts | Despite having coverage data, coverage is null (systemic issue); analysisStatus SUCCESS, gate PASS, completeness INCOMPLETE | Same as current |
| FR-G2 | P2 | FM-G03 | fr-g2.ts | Despite having coverage data and full line coverage, coverage is null (systemic issue); analysisStatus SUCCESS, gate PASS, completeness INCOMPLETE | Same as current |
| FR-G4 | P2 | FM-G06 | fr-g4.ts | Threshold argument correctly reflected in output; despite coverage data, coverage is null (systemic issue) leading to NOT_EVALUATED rule results; gate PASS, completeness INCOMPLETE | Same as current |
| FR-G5 | P2 | FM-G10 | fr-g5.ts | Byte-identical JSON output when running the same fixture twice | Same as current |

## Notes on Current vs Desired Behavior

For P0 fixtures (apparent defects), the "Current Behavior Asserted" column reflects the defective behavior that currently exists in the codebase. The "Desired Behavior Recorded" column reflects what the behavior should be after the defect is fixed.

For P1 and P2 fixtures, the current and desired behaviors are typically the same, as these fixtures are designed to pin existing behavior or validate regression anchors.

All fixtures execute and assert the current observed behavior. No fixtures are skipped with test.skip.