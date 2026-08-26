# WP5.2 Correction Pass — CLI Diagnostic Verification

## Purpose
Correct the evidence classification for FM-D10/FM-G06 before WP5.3 authorization.

## Scope
Verify only:
- FM-D10 — Git binary/ENOENT CLI messaging
- FM-G06 — explicit missing-coverage CLI messaging

## Evidence Standard
Because these claims concern CLI diagnostics, proof must come from the actual CLI boundary.

Preserve invocation, exit code, stdout, stderr, JSON where relevant, and exact message text.

## Classification
- CONFIRMED — claimed misleading message reproduced
- REFUTED — CLI accurately distinguishes the condition
- UNRESOLVED — deterministic reproduction unavailable

## Non-Goals
Do not fix the CLI, change exit codes, alter production code, reopen other WP5.2 findings, or begin WP5.3.

## Required Outputs
Update:
- `defect-reproduction-results.md`
- `WP5_2_RESULTS.md`
- WP5 traceability matrix
- WP5 decision log

Preserve raw evidence under `experiments/wp5/wp5.2/cli-diagnostics/`.

WP5.2 proceeds to final human review only after these two findings are classified from CLI evidence.
