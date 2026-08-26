# WP5 Decision Log — WP5.1 Approval Update

Append these to the active decision log; preserve existing entries.

| ID | Decision | Impact |
|---|---|---|
| WP5-D002 | Accept WP5.1 as authoritative discovery baseline. | WP5.2 proceeds with 37-mode taxonomy and approved fixture requirements. |
| WP5-D003 | Execute P0 fixtures; do not `test.skip` them. | FR-A6, FR-A7, FR-V1, FR-G3 characterize frozen behavior. |
| WP5-D004 | Characterization tests may assert defective current behavior while recording desired behavior separately. | Creates before/after evidence for later fixes. |
| WP5-D005 | No production fixes in WP5.2. | Confirm/refute first; authorize repairs at later gates. |
| WP5-D006 | OQ-1/OQ-2/OQ-7 are empirical questions. | Resolve with deterministic evidence where possible. |
| WP5-D007 | OQ-3/OQ-4/OQ-6 remain human policy/schema decisions. | No unilateral semantic/schema changes. |
| WP5-D008 | OQ-5 does not block WP5.2 and must not reopen WP4R. | Carry unresolved if preserved evidence cannot settle it. |
| WP5-D009 | WP5.2 amendment overrides WP5.1 recommendation to `test.skip` on FR-A6/A7/V1/G3; all 23 fixtures must EXECUTE as characterization tests asserting current behavior + recording desired behavior separately. | Governing authority: WP5.2 amendment. Not material to scope. |
| WP5-D010 | Characterization approach: WP5.2 uses defective current behavior assertion with separate desired behavior record for all P0 fixtures; P1/P2 fixtures assert current=desired. | Enables before/after evidence for fix authorization. |
| WP5-D011 | Systemic coverage null observation: Multiple fixtures (FR-D1, D3, D5, G1, G2, V7, etc.) show coverage=null despite coverage data present — indicates cross-cutting issue in coverage ingestion pipeline. | Prioritize investigation in WP5.3/WP5.4. |
| WP5-D012 | Anchor pinning: All 7 regression anchors (threshold equality, explicit/default missing, UNSUPPORTED, schema, threshold 30, ordering, dedup) are pinned (PASS) and serve as behavioral invariants for future changes. | Treat as breaking-change detectors. |
| WP5-D013 | OQ resolutions: OQ-1,2,7 resolved via deterministic evidence; OQ-3,4,6 require human policy decisions; OQ-5 resolved from preserved evidence only (no Apollo rerun). | Closes empirical questions; forwards policy questions to governance. |