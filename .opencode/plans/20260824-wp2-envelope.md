---
task: "WP2 — Minimal Evidence Envelope"
created: 2026-08-24T00:00:00.000Z
approved: true
tasks:
  - id: "1"
    description: "Freeze envelope: verify src/evidence.ts OutputJson matches WP2 spec exactly, no extra fields, no invented metrics"
    agent: "implementer"
    files: ["src/evidence.ts", "src/crap.ts"]
    acceptance: "Output shape is {schemaVersion:0.1, analysis:{base,target}, capabilities:{git,crapTypescript}, changedFunctions:[{file,method,lineStart,lineEnd,cc,crap,coverage,coverageKind,analyzerStatus,source}]}; tsc+vitest green"
    depends_on: []
  - id: "2"
    description: "Create docs/research/WP2_EVIDENCE_ENVELOPE_RESULTS.md documenting frozen envelope, semantics, and stop decision"
    agent: "implementer"
    files: ["docs/research/WP2_EVIDENCE_ENVELOPE_RESULTS.md"]
    acceptance: "Doc contains frozen JSON example, field table, semantics (unavailable explicit, empty vs failure, deleted no invented metrics, provenance), verification vs WP1, forbidden list compliance, ends VERIFIED or STOP"
    depends_on: ["1"]
---

# WP2 — Minimal Evidence Envelope — Plan

## Overview
Freeze smallest envelope demonstrated by WP1. No new features, no schema libraries, no providers, no rules.

## WP2 Spec Envelope
```json
{
  "schemaVersion": "0.1",
  "analysis": {"base": "main", "target": "current"},
  "capabilities": {"git": "available", "crapTypescript": "available"},
  "changedFunctions": []
}
```
Records preserve: file, method, lineStart, lineEnd, cc, crap, coverage, coverageKind, analyzerStatus, source {tool,version} — 10 fields only.

## Semantics to freeze
- unavailable explicit: crap null, coverage null, coverageKind "N/A", analyzerStatus "skipped" — not silent 0
- empty changedFunctions = no correlated current functions, not analyzer failure
- analyzer failure distinct: capabilities crapTypescript "failed" or "unavailable" vs empty array
- deleted functions receive no invented historical metrics (gitDeletionDetected / evidence absent)
- provenance stays attached: source tool="@barney-media/crap-typescript" version="0.5.0"

## Forbidden
- JSON-schema tooling, runtime validation libs, providers, SARIF, rules, test/lint/typecheck evidence, multi-language

## Deliverable
docs/research/WP2_EVIDENCE_ENVELOPE_RESULTS.md then stop.

## Verification
- npx tsc --noEmit clean
- npx vitest run 38 green
- cat docs/research/WP2_EVIDENCE_ENVELOPE_RESULTS.md ends VERIFIED
