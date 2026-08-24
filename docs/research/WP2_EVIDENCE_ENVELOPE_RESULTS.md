# WP2 Evidence Envelope Results

## Frozen Envelope JSON Example

```json
{
  "schemaVersion": "0.1",
  "analysis": {
    "base": "main",
    "target": "current"
  },
  "capabilities": {
    "git": "available",
    "crapTypescript": "available"
  },
  "changedFunctions": [
    {
      "file": "src/math.ts",
      "method": "add",
      "lineStart": 1,
      "lineEnd": 17,
      "cc": 5,
      "crap": 0,
      "coverage": null,
      "coverageKind": "N/A",
      "analyzerStatus": "passed",
      "source": {
        "tool": "@barney-media/crap-typescript",
        "version": "0.5.0"
      }
    }
  ]
}
```

## Field Table

| Field | Type | Source |
|-------|------|--------|
| schemaVersion | string literal "0.1" | Fixed |
| analysis.base | string | Git base reference |
| analysis.target | string literal "current" | Fixed |
| capabilities.git | string ("available"|"unavailable"|"failed") | Git availability |
| capabilities.crapTypescript | string ("available"|"unavailable"|"failed") | Analyzer availability |
| changedFunctions[] | Array | Correlated changes |
| └─ file | string | Method source file |
| └─ method | string | Method name |
| └─ lineStart | number | Method start line (1-based, inclusive) |
| └─ lineEnd | number | Method end line (1-based, inclusive) |
| └─ cc | number | Cyclomatic complexity |
| └─ crap | number | null | CRAP score |
| └─ coverage | number | null | Line coverage percentage |
| └─ coverageKind | string ("stmt"|"N/A"|...) | Coverage kind |
| └─ analyzerStatus | string ("passed"|"failed"|"skipped") | Analysis status |
| └─ source.tool | string | Analyzer tool identifier |
| └─ source.version | string | Analyzer tool version |

## Semantics

- Unavailable evidence is explicit: when crapTypescript is "unavailable" or "failed", changedFunctions is empty and analyzer evidence is absent; when analyzer runs but fails on a method, analyzerStatus is "failed", crap and coverage are null, coverageKind is "N/A".
- Empty changedFunctions means no correlated current functions (no overlap with git intervals), not analyzer failure.
- Analyzer failure is distinct: capabilities crapTypescript "failed" vs empty changedFunctions with available analyzer.
- Deleted functions receive no invented historical metrics: when gitDeletionDetected is true and currentAnalyzerEvidence is absent, we do not invent cc, crap, coverage, etc.; the method is not included in changedFunctions.
- Provenance stays attached: each changedFunction includes source tool and version from the analyzer invocation.

## Verification

WP1 demonstrated the envelope by:
- Using the evidence.typescript module to build JSON output matching the above schema.
- Correlating git diff intervals with method-level analyzer output via integer overlap.
- Showing that changedFunctions contains only methods with non-empty intersection.
- Refer to experiments/wp1.1 verification in docs/research/WP1.1_CORRELATION_VERIFICATION_RESULTS.md for the correlation verification that underpins the envelope.

## Forbidden Compliance Checklist

- [x] No JSON-schema tooling
- [x] No runtime validation libraries
- [x] No providers
- [x] No SARIF
- [x] No rules
- [x] No test/lint/typecheck evidence (test files are prototype test suite, not envelope content)
- [x] No multi-language concepts

VERIFIED