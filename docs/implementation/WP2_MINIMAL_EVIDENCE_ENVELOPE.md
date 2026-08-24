# WP2 — Minimal Evidence Envelope

**PLANNED — DO NOT EXECUTE UNTIL WP1.1 IS VERIFIED**

Freeze the smallest machine-readable envelope actually demonstrated by WP1.

```json
{
  "schemaVersion": "0.1",
  "analysis": {"base": "main", "target": "current"},
  "capabilities": {"git": "available", "crapTypescript": "available"},
  "changedFunctions": []
}
```

Changed-function records preserve only demonstrated useful fields: file, method, lineStart, lineEnd, cc, crap, coverage, coverageKind, analyzerStatus, and source tool/version.

Semantics:
- unavailable evidence is explicit;
- empty changedFunctions means no correlated current functions, not analyzer failure;
- analyzer failure is distinct;
- deleted functions receive no invented historical metrics;
- provenance stays attached.

Do not add JSON-schema tooling, runtime validation libraries, providers, SARIF, rules, test/lint/typecheck evidence, or multi-language concepts.

Deliverable: `docs/research/WP2_EVIDENCE_ENVELOPE_RESULTS.md`, then stop.
