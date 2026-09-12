# Diagnostics Schema Design

**Date**: 2026-09-12  
**Component**: Evidence Layer  
**Decision**: ADR-0002  

## Context

This document defines the optional top-level `diagnostics` object for EvidenceOutput schema version 0.5, as proposed in the CheckChange Candidate Improvements Plan Experiment A (Trust Layer). The diagnostics object captures lineage, quality metrics, and fingerprints while preserving determinism by excluding timing-dependent fields from the main output (they may appear in sidecar outputs only).

## Design Goals

1. **Additive Only**: The `diagnostics` field is optional; existing consumers remain compatible.
2. **Determinism Preserved**: No timestamps, durations, or PIDs in the main EvidenceOutput JSON.
3. **Canonical Vocabulary**: Quality fields use the reconciled terminology from ADR-0001.
4. **Sidecar Allowance**: Timing/provenance details may appear in separate diagnostic sidecars (not EvidenceOutput).

## Diagnostics Object Structure

```typescript
interface EvidenceOutput {
  // ... existing fields (schema 0.4) ...
  diagnostics?: {
    lineage?: DiagnosticLineageEntry[];
    quality?: DiagnosticQuality;
    fingerprints?: Record<string, string>; // file:method:lineStart → SHA-256 hash
  };
};

interface DiagnosticLineageEntry {
  stage: 'git' | 'intervals' | 'complexity' | 'coverage' | 'attribution' | 'crapCalc' | 'rules' | 'evidence';
  tool: string; // e.g., '@barney-media/crap-typescript-core', 'lizard', 'coverage.py'
  version: string; // e.g., '0.5.0', '1.24.0'
  inputs: Record<string, unknown>; // stage-specific inputs (e.g., git args, complexity options)
  // Note: timestamps, durations, PIDs excluded from main output per determinism guarantee
};

interface DiagnosticQuality {
  // Coverage evidence quality (per canonical vocabulary)
  coverage?: 'DIRECT' | 'ATTRIBUTED' | 'HISTORICAL' | 'UNAVAILABLE';
  // Complexity evidence quality (per canonical vocabulary)
  complexity?: 'NATIVE' | 'PROVIDER' | 'FALLBACK' | 'UNAVAILABLE';
  // Numeric quality score (0-100) when coverage available
  score?: number; // 0-100, null if unavailable
  // Per-stage completeness booleans
  stageComplete?: {
    git?: boolean;
    intervals?: boolean;
    complexity?: boolean;
    coverage?: boolean;
    attribution?: boolean;
    crapCalc?: boolean;
    rules?: boolean;
    evidence?: boolean;
  };
  // Uncovered functions list (when coverage available)
  uncoveredFunctions?: {
    file: string;
    method: string;
    lineStart: number;
    lineEnd: number;
  }[];
};
```

## JSON Examples

### Minimal EvidenceOutput (no diagnostics)
```json
{
  "schemaVersion": "0.4",
  "analysis": { "base": "abc123", "target": "def456" },
  "capabilities": { "git": "available", "complexity": "available", "coverageArtifact": "available" },
  "changedFunctions": [{ /* ... */ }],
  "policy": { "crapThreshold": 30 },
  "ruleResults": [{ /* ... */ }],
  "analysisStatus": "SUCCESS",
  "gate": "PASS",
  "completeness": "COMPLETE"
}
```

### EvidenceOutput with Diagnostics (schema 0.5)
```json
{
  "schemaVersion": "0.5",
  "analysis": { "base": "abc123", "target": "def456" },
  "capabilities": { "git": "available", "complexity": "available", "coverageArtifact": "available" },
  "changedFunctions": [{ /* ... */ }],
  "policy": { "crapThreshold": 30 },
  "ruleResults": [{ /* ... */ }],
  "analysisStatus": "SUCCESS",
  "gate": "PASS",
  "completeness": "COMPLETE",
  "diagnostics": {
    "lineage": [
      {
        "stage": "git",
        "tool": "node:child_process",
        "version": "v24.18.1",
        "inputs": { "command": "git diff --raw abc123..def456" }
      },
      {
        "stage": "complexity",
        "tool": "@barney-media/crap-typescript-core",
        "version": "0.5.0",
        "inputs": { "fileExtensions": [".ts", ".tsx"] }
      }
    ],
    "quality": {
      "coverage": "DIRECT",
      "complexity": "NATIVE",
      "score": 85,
      "stageComplete": {
        "git": true,
        "intervals": true,
        "complexity": true,
        "coverage": true,
        "attribution": true,
        "crapCalc": true,
        "rules": true,
        "evidence": true
      },
      "uncoveredFunctions": [
        { "file": "src/foo.ts", "method": "unusedFunc", "lineStart": 30, "lineEnd": 35 }
      ]
    },
    "fingerprints": {
      "src/foo.ts:calculateRisk:10": "a1b2c3d4e5f6...",
      "src/foo.ts:unusedFunc:30": "f6e5d4c3b2a1..."
    }
  }
}
```

## Determinism Rule

- The `diagnostics` object itself is part of the deterministic EvidenceOutput.
- However, any field within `diagnostics` that could introduce non-determinism (timestamps, durations, PIDs, environment-specific paths) **must be excluded** from the main output.
- Such details may be included in sidecar diagnostic outputs (e.g., `checkchange trace --json`) but never in the primary EvidenceOutput JSON.
- Example: `lineage.inputs` may contain non-deterministic elements like absolute paths; these must be normalized to relative paths or hashed before inclusion.

## Versioning Note

- The `diagnostics` field is additive and optional; schema version bump from 0.4 → 0.5 is minor (per WP11) when the additive fields stabilize.
- Required-field changes (e.g., making `zboi` required) would still constitute a major version bump.

## Rationale

- Supports Experiment A (Trust Layer) by providing lineage for auditability, quality metrics for risk assessment, and fingerprints for change detection.
- Maintains backward compatibility: existing tools ignore unknown `diagnostics` field.
- Aligns with canonical vocabulary from ADR-0001 for quality fields.
- Preserves determinism guarantee by restricting `diagnostics` content to deterministic values only.

## Implementation Note

This is a documentation decision. No code changes are required for this ADR; implementation will follow in subsequent tasks.

## Acceptance Criteria

- [x] File exists: docs/decisions/diagnostics-schema-design.md
- [x] Defines optional top-level `diagnostics` object with `lineage[]`, `quality{}`, `fingerprints{}`
- [x] Each field is optional
- [x] Includes JSON examples
- [x] States determinism rule (timestamps/durations/pids excluded from main output)
- [x] References canonical vocabulary for quality fields
- [x] Notes versioning policy (additive optional → minor bump)

**Path**: /Users/victorpetropoulos/Cursor Projects/code-risk-prototype-v0.3-opencode/docs/decisions/diagnostics-schema-design.md  
**Status**: Ready for review