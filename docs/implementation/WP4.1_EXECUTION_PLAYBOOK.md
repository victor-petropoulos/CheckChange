# WP4.1 Execution Playbook

## Phase 1 — Freeze Production

Before starting, confirm no production files under `src/` will be modified.

Record the current commit.

## Phase 2 — Inspect the Current Provider

Investigate `@barney-media/crap-typescript@0.5.0` from documentation/source and controlled execution.

Answer every Track A question in `WP4.1_EVIDENCE_ACQUISITION_INVESTIGATION.md`.

Preserve commands and raw outputs.

## Phase 3 — Investigate Existing Coverage Artifacts

Determine what coverage artifacts zod, zustand, and/or a controlled TypeScript fixture can produce using their own native commands.

Inspect whether those artifacts contain enough deterministic information to associate coverage with function source ranges.

Do not write a coverage analyzer.

## Phase 4 — Survey Complexity Providers

Find existing deterministic TypeScript/JavaScript complexity tools or libraries that can emit machine-readable function-level:

```text
file
function/method
start/end range
cyclomatic complexity
```

Prefer tools that do not own test execution.

Document versions, licenses, maintenance status, output formats, and integration burden.

## Phase 5 — Run Minimal Compatibility Experiments

For credible approaches, run the smallest experiment needed to prove or disprove the required data is available.

Do not build production adapters.

## Phase 6 — Define Failure Semantics

Using the actual WP4 failure modes, design the state transitions for:

- provider available + findings;
- provider available + no relevant functions;
- partial evidence;
- unsupported source;
- provider execution failure.

Show example JSON for each.

## Phase 7 — Compare

Complete the comparative matrix.

Do not choose based only on elegance. Include:

- portability;
- dependency/install burden;
- target-repo assumptions;
- custom code required;
- failure behavior;
- maintenance risk.

## Phase 8 — Decide and Stop

Produce the three required research documents.

End `WP4.1_EVIDENCE_BOUNDARY_DECISION.md` with exactly one:

```text
RETAIN CURRENT PROVIDER
ADAPT PROVIDER BOUNDARY
COMPOSE EXISTING PROVIDERS
STOP
```

Then stop.

Do not implement the selected design.
