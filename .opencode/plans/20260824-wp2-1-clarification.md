---
task: "WP2.1 — Envelope Clarification"
created: 2026-08-24T01:00:00.000Z
approved: true
tasks:
  - id: "1"
    description: "Mechanically verify serialization preserves crap 0, crap null, coverage 0, coverage null"
    agent: "implementer"
    files: ["experiments/wp2.1/serialization-verification.json", "experiments/wp2.1/verify.mjs", "test/serialization.test.ts"]
    acceptance: "JSON preserves 4 values exactly (0 stays 0, null stays null); tests green; tsc clean"
    depends_on: []
  - id: "2"
    description: "Verify field table states number|null and compliance checklist marked [x]"
    agent: "implementer"
    files: ["src/evidence.ts", "src/crap.ts", "docs/research/WP2_EVIDENCE_ENVELOPE_RESULTS.md"]
    acceptance: "Field table shows crap number|null and coverage number|null unambiguously; compliance items marked [x] if absent"
    depends_on: ["1"]
  - id: "3"
    description: "Create docs/research/WP2.1_ENVELOPE_CLARIFICATION_RESULTS.md with verification, defects, compliance, ending VERIFIED/DEFECT FOUND AND FIXED/STOP"
    agent: "implementer"
    files: ["docs/research/WP2.1_ENVELOPE_CLARIFICATION_RESULTS.md"]
    acceptance: "Results doc contains required verification, field table check, compliance clarification, ends with exactly one decision"
    depends_on: ["2"]
---

# WP2.1 — Envelope Clarification — Plan

## Required Semantic Contract
```
number -> measured value
0      -> valid measured value of zero
null   -> measurement unavailable
Never use zero as sentinel for unavailable.
```

## Required Verification
Mechanically verify serialization of:
1. crap: 0
2. crap: null
3. coverage: 0
4. coverage: null
JSON must preserve all four exactly. If already does, prove with tests, do not rewrite.

Field table must state:
```
crap      number | null
coverage  number | null
```

## Compliance Clarification
Inspect impl and confirm absent:
- JSON Schema tooling
- runtime validation libs
- provider abstractions
- SARIF
- risk rules
- test/lint/typecheck evidence
- multi-language concepts
Mark [x] if absent, document deviation if present.

## Deliverables
- experiments/wp2.1/
- docs/research/WP2.1_ENVELOPE_CLARIFICATION_RESULTS.md
Update WP2 results only where necessary.
End with VERIFIED / DEFECT FOUND AND FIXED / STOP
Do not implement WP3.
