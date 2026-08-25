# WP4R Supplemental Human Review Template

## Status
**Stage:** WP4R supplemental human-review gate. **WP5:** Not started.

Review source, diff, complexity, coverage attribution, CRAP, and both threshold outcomes. Do not classify from CRAP alone.

## SUP-A — CRAP >30
### Evidence
- Repository:
- Base SHA:
- Target SHA:
- Commit:
- File:
- Function:
- CC:
- Coverage:
- CRAP:
- Threshold 30: expected WARN
- Threshold 15: expected WARN
- Completeness:

### Source
_OpenCode inserts target source._

### Diff
_OpenCode inserts exact relevant diff._

### Coverage Attribution
_OpenCode inserts Istanbul evidence._

### Human Review
Does the threshold-30 WARN identify a changed function that merits advisory attention?

- [ ] EXPECTED_WARN
- [ ] QUESTIONABLE_WARN
- [ ] UNDETERMINED

**Rationale:**

---

## SUP-B — 15 < CRAP <=30
### Evidence
- Repository:
- Base SHA:
- Target SHA:
- Commit:
- File:
- Function:
- CC:
- Coverage:
- CRAP:
- Threshold 30: expected PASS
- Threshold 15: expected WARN
- Completeness:

### Source
_OpenCode inserts target source._

### Diff
_OpenCode inserts exact relevant diff._

### Coverage Attribution
_OpenCode inserts Istanbul evidence._

### Threshold-30 Review
Does passing at threshold 30 appear reasonable?

- [ ] EXPECTED_PASS
- [ ] QUESTIONABLE_PASS
- [ ] UNDETERMINED

**Rationale:**

### Threshold-15 Review
Does lowering the threshold to 15 add useful signal or primarily noise?

- [ ] USEFUL_WARN
- [ ] NOISY_WARN
- [ ] UNDETERMINED

**Rationale:**

---

## Evidence Integrity
- [ ] Real historical runtime changes
- [ ] Immutable base/target SHAs
- [ ] Real externally generated Istanbul-compatible coverage
- [ ] Coverage not manually modified
- [ ] Existing production complexity/CRAP/attribution logic unchanged
- [ ] Same evidence used at thresholds 30 and 15
- [ ] Raw evidence preserved
- [ ] No production code changed

## Reviewer Conclusion
- [ ] Supplemental evidence supports closing WP4R.
- [ ] A specific issue requires resolution before closure.
- [ ] Evidence remains insufficient; further action requires explicit approval.

**Rationale:**

This review does not begin WP5.
