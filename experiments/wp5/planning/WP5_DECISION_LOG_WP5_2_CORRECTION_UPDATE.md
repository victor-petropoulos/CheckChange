# WP5 Decision Log — WP5.2 Correction Pass

Append these entries to the active decision log.

| ID | Work Package | Decision | Basis | Impact |
|---|---|---|---|---|
| WP5-D009 | WP5.2 | FM-D10/FM-G06 require CLI-boundary evidence. | Lower-level analysisStatus does not prove user-facing message defects. | Reproduce both via actual CLI. |
| WP5-D010 | WP5.2 | Classify as CONFIRMED / REFUTED / UNRESOLVED strictly from captured CLI output. | Prevent overclaiming. | Correct defect counts and downstream scope. |
| WP5-D011 | WP5.2 | No production fix authorized in this pass. | WP5.2 remains characterization-only. | Confirmed CLI defects route to WP5.4 after approval.
| WP5-D012 | WP5.2 | FM-D10 confirmed: CLI reports 'Not a git repository' when git binary missing; FM-G06 confirmed: CLI reports 'coverage artifact malformed' when coverage file missing, requires TS change to activate coverage path. | experiments/wp5/wp5.2/cli-diagnostics/fm-d10-evidence.md/.json, fm-g06-evidence.md/.json | Defect counts corrected: FM-D10 and FM-G06 confirmed; WP5.2 characterization complete; fixes route to WP5.4. |
