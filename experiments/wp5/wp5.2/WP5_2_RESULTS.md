# WP5.2 Results

## Fixture Counts/Status
- Total fixtures: 23 (4 P0, 9 P1, 10 P2)
- 36 tests green, zero skip

## P0 Status Table
| FR ID | Priority | Executes | Current Behavior Asserted | Desired Behavior Recorded | Linked FM ID |
|-------|----------|----------|---------------------------|---------------------------|--------------|
| FR-A6 | P0 | Yes | Class method coverage returns null (NOT_EVALUATED) due to container-method attribution key mismatch | Class method coverage returns numeric values, CRAP computed, gate PASS/WARN per threshold | FM-A07, FM-A10 |
| FR-A7 | P0 | Yes | Both functions' coverage returns null (due to empty coverage map) | Each function gets coverage from its own file, not the other's | FM-A08 |
| FR-V1 | P0 | Yes | coverageArtifact='available' when default coverage is missing, all changed NOT_EVALUATED | coverageArtifact='absent' or equivalent when default coverage is missing | FM-V01 |
| FR-G3 | P0 | Yes | CLI invocation with non-TS changes exits 0 with analysisStatus UNSUPPORTED | TBD at approval gate (requires human policy decision) | FM-G05, FM-D06 |

## Defect Classifications
| FM ID | Classification | Verbatim Output Quote Reference |
|-------|----------------|---------------------------------|
| FM-A07 | CONFIRMED | `expect(func.coverage).toBeNull()` |
| FM-C03 | CONFIRMED | `expect(changedCount).toBe(1);` |
| FM-A08 | CONFIRMED | `expect(funcNames).toContain('alpha'); expect(funcNames).toContain('beta');` |
| FM-V01 | CONFIRMED | `expect(output.capabilities.coverageArtifact).toBe('available');` |
| FM-D10 / FM-G06 | CONFIRMED | `expect(output.analysisStatus).toBe('FAILED');` |
| FM-G07 | CONFIRMED | `expect(func.analyzerStatus).toBe('passed');` |

## OQ Results Summary
- OQ-1: Deterministic evidence resolved (functionName is raw, no container prefix) → mismatch causes FM-A07
- OQ-2: Deterministic evidence resolved (parser skips unnamed declarations) → FM-C04 (not in FM list but noted)
- OQ-3: Human policy decision required (HUMAN_DECISION_REQUIRED)
- OQ-4: Human policy decision required (HUMAN_DECISION_REQUIRED)
- OQ-5: Resolved from preserved evidence only (Apollo exit-1 anomaly vs current CLI mapping)
- OQ-6: Human policy decision required (HUMAN_DECISION_REQUIRED)
- OQ-7: Human policy decision required (HUMAN_DECISION_REQUIRED)

## Contract Contradictions (Pinned)
- Threshold equality (Anchor 1): PASS
- Explicit/default missing coverage (Anchor 2): PASS
- UNSUPPORTED / No-Function (Anchor 3): PASS
- Schema Compatibility (Anchor 4): PASS
- Threshold 30 Default (Anchor 5): PASS
- Deterministic Ordering (Anchor 6): PASS
- Coverage Dedup (Anchor 7): PASS

## Files Changed List
```
experiments/wp5/wp5.2/WP5_2_RESULTS.md | 1 +
experiments/wp5/planning/WP5_DECISION_LOG_WP5_1_UPDATE.md | 6 +
experiments/wp5/planning/WP5_TRACEABILITY_MATRIX_WP5_2_UPDATE.md | 20 +
```
(After creation and updates)

## Confirmation Production Untouched
- src/** clean: verified via `git status` (no modifications in src/)

## Recommended WP5.3/WP5.4 Authorization Scope
Based on confirmed defects, fix:
1. FM-A07: Change attribution key from `functionName` to `containerName.functionName`
2. FM-C03: Modify source root scanner to respect tsconfig `include` patterns
3. FM-A08: Implement more precise path matching (full path comparison, not suffix-only)
4. FM-V01: Correct capabilities.coverageArtifact to reflect actual availability
5. FM-G07: Set analyzerStatus based on actual evaluation success/coverage validity
(FM-D10/FM-G06: No fix needed if underlying function is correct; verify CLI behavior separately)