---
task: "WP5.2 CLI correction pass — FM-D10 + FM-G06 deterministic reproduction, evidence capture, documentation correction"
created: "2026-08-26T10:00:00Z"
approved: true
tasks:
  - id: "1"
    description: "Capture CLI diagnostics for FM-D10 and FM-G06 by exercising the actual CLI binary (dist/cli.js) in deterministic environments. Create cli-diagnostics/ directory with per-defect .md + .json evidence files. FM-D10: invoke CLI with git unavailable (override PATH to empty dir, or use `env -i` without git) and capture exit code, stderr, stdout. FM-G06: invoke CLI with --coverage-file pointing to nonexistent path and capture exit code, stderr, stdout, JSON output. All evidence must be verbatim — no paraphrasing."
    agent: "implementer"
    files:
      - "experiments/wp5/wp5.2/cli-diagnostics/fm-d10-evidence.md"
      - "experiments/wp5/wp5.2/cli-diagnostics/fm-d10-evidence.json"
      - "experiments/wp5/wp5.2/cli-diagnostics/fm-g06-evidence.md"
      - "experiments/wp5/wp5.2/cli-diagnostics/fm-g06-evidence.json"
    acceptance:
      - "experiments/wp5/wp5.2/cli-diagnostics/ directory exists with 4 files (2 .md + 2 .json)"
      - "fm-d10-evidence.md contains: command used, exit code, stderr verbatim, stdout verbatim, classification (CONFIRMED/REFUTED/UNRESOLVED)"
      - "fm-g06-evidence.md contains: command used, exit code, stderr verbatim, stdout verbatim, classification (CONFIRMED/REFUTED/UNRESOLVED)"
      - "fm-d10-evidence.json and fm-g06-evidence.json contain structured JSON: {fmId, command, exitCode, stderr, stdout, classification, notes}"
      - "No files under src/ modified (production freeze verified via git diff src/)"
      - "fm-d10 reproduction: `env -i PATH=/usr/bin HOME=$HOME node dist/cli.js check --base main` (or equivalent) exits non-zero with stderr containing 'Not a git repository' or equivalent"
      - "fm-g06 reproduction: `node dist/cli.js check --base main --coverage-file /tmp/nonexistent-coverage.json` exits non-zero with stderr containing the actual error message"
    depends_on: []

  - id: "2"
    description: "Update defect-reproduction-results.md and WP5_2_RESULTS.md with corrected FM-D10/FM-G06 classifications based on CLI evidence. Update the FM-D10/FM-G06 row in the defect summary table with actual CLI evidence quotes and corrected classification. Update defect counts (CONFIRMED/REFUTED/UNRESOLVED) to reflect corrected totals. Update Recommendations section to reflect corrected status."
    agent: "implementer"
    files:
      - "experiments/wp5/wp5.2/defect-reproduction-results.md"
      - "experiments/wp5/wp5.2/WP5_2_RESULTS.md"
    acceptance:
      - "defect-reproduction-results.md FM-D10/FM-G06 row updated with CLI verbatim output quotes from cli-diagnostics/"
      - "Classification updated (CONFIRMED/REFUTED/UNRESOLVED) based on actual CLI evidence, not lower-level function behavior"
      - "Total confirmed defects count corrected — no longer claims 6/6 unless CLI evidence confirms both"
      - "WP5_2_RESULTS.md Defect Classifications table updated with corrected FM-D10/FM-G06 classification"
      - "WP5_2_RESULTS.md Recommended WP5.3/WP5.4 section updated to reflect corrected FM-D10/FM-G06 status"
      - "No files under src/ modified"
    depends_on: ["1"]

  - id: "3"
    description: "Update WP5 traceability matrix and decision log with corrected FM-D10/FM-G06 status. Update WP5_TRACEABILITY_MATRIX_WP5_2_UPDATE.md: correct FM-D10/FM-G06 row classification and routing disposition. Update WP5_DECISION_LOG_WP5_2_CORRECTION_UPDATE.md: add decision entry documenting CLI correction pass findings, evidence sources, and corrected classifications. Correct any references to '6/6 confirmed' in decision log."
    agent: "implementer"
    files:
      - "experiments/wp5/planning/WP5_TRACEABILITY_MATRIX_WP5_2_UPDATE.md"
      - "experiments/wp5/planning/WP5_DECISION_LOG_WP5_2_CORRECTION_UPDATE.md"
    acceptance:
      - "WP5_TRACEABILITY_MATRIX_WP5_2_UPDATE.md FM-D10/FM-G06 row updated with corrected classification and routing"
      - "WP5_DECISION_LOG_WP5_2_CORRECTION_UPDATE.md contains decision entry with timestamp, FM IDs, evidence source (cli-diagnostics/), and corrected classification"
      - "No references to '6/6 confirmed' remain in updated documents unless CLI evidence supports it"
      - "No files under src/ modified"
    depends_on: ["2"]

  - id: "4"
    description: "Run verification: execute `pnpm test` (or `npm test`) to confirm all existing tests still pass. Run `pnpm build` to confirm TypeScript compilation succeeds. Run `git diff --stat` to confirm no src/ files were modified. Produce final summary: FM-D10 classification, FM-G06 classification, corrected defect counts, files updated, production-code status, WP5.2 readiness assessment."
    agent: "tester"
    files: []
    acceptance:
      - "`pnpm test` passes — all existing tests green, zero failures"
      - "`pnpm build` succeeds — TypeScript compilation clean"
      - "`git diff --stat` shows zero changes in src/ directory"
      - "Final summary produced with: FM-D10 classification, FM-G06 classification, corrected defect counts (X/Y confirmed, Z refuted, W unresolved), list of updated files, production-code untouched confirmation, WP5.2 readiness verdict"
    depends_on: ["3"]
---

# WP5.2 CLI Correction Pass — Plan

## Scope
Narrow correction pass for WP5.2 only. Two failure modes:
- **FM-D10**: CLI reports "Not a git repository" when git binary is missing (ENOENT) — claim is misleading because root cause is missing binary, not repo state.
- **FM-G06**: CLI reports "coverage artifact malformed" when explicit `--coverage-file` points to nonexistent file — claim is misleading because file is missing, not malformed.

## Constraints
- **Production freeze**: Zero edits to `src/**`. No changes to CLI implementation, evidence builder, schema, thresholds, or any production code.
- **Evidence-first**: All corrections must be backed by verbatim CLI output captured in `experiments/wp5/wp5.2/cli-diagnostics/`.
- **No WP5.3**: This pass does not implement fixes. Only characterizes and documents.

## Reproduction Strategy

### FM-D10
- **Approach**: Invoke CLI with `git` removed from PATH. Use `env -i` or a wrapper script that sets `PATH` to a directory without `git`.
- **Expected commands**:
  ```bash
  # Option A: env -i (cleanest, strips all env)
  env -i PATH=/usr/bin HOME="$HOME" USER="$(whoami)" node dist/cli.js check --base main
  
  # Option B: wrapper script
  echo '#!/bin/sh' > /tmp/no-git
  echo 'exec /bin/true' >> /tmp/no-git
  chmod +x /tmp/no-git
  PATH="/tmp:$(echo $PATH | sed 's|:.*||')" node dist/cli.js check --base main
  ```
- **Capture**: exit code, stderr (exact), stdout (exact), JSON if --json flag present.

### FM-G06
- **Approach**: Invoke CLI with `--coverage-file /tmp/nonexistent-coverage-xyz.json` (path that definitely does not exist).
- **Expected command**:
  ```bash
  node dist/cli.js check --base main --coverage-file /tmp/nonexistent-coverage-xyz.json 2>&1
  echo "EXIT: $?"
  ```
- **Capture**: exit code, stderr (exact), stdout (exact), JSON output if --json flag present.

## Evidence Format
Each `cli-diagnostics/<fm-id>-evidence.md`:
```markdown
# <FM-ID> CLI Diagnostic Evidence

## Command
```bash
<exact command>
```

## Exit Code
`<number or null>`

## Stdout
```
<verbatim output>
```

## Stderr
```
<verbatim output>
```

## Classification
`CONFIRMED` / `REFUTED` / `UNRESOLVED`

## Notes
- Why this classification was chosen
- How CLI output maps (or doesn't map) to the defect claim
```

Each `cli-diagnostics/<fm-id>-evidence.json`:
```json
{
  "fmId": "FM-D10",
  "command": "env -i PATH=/usr/bin ...",
  "exitCode": 1,
  "stderr": "Error: Not a git repository",
  "stdout": "",
  "classification": "CONFIRMED",
  "notes": "..."
}
```

## Task Dependencies
```
1 (CLI diagnostics capture) → 2 (docs update) → 3 (traceability + decision log) → 4 (verification)
```

## Verification Commands
- `pnpm test` — all existing tests must pass
- `pnpm build` — TypeScript compilation must succeed
- `git diff --stat -- src/` — must show zero changes
- `ls -la experiments/wp5/wp5.2/cli-diagnostics/` — must contain 4 files
