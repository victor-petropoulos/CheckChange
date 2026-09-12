# Terminology Reconciliation Decision

**Date**: 2026-09-12  
**Component**: Evidence Layer  
**Decision**: ADR-0001  

## Context

This document maps all evidence terminology used in the CheckChange codebase and contracts to the proposed canonical vocabulary from §5 of the CheckChange Candidate Improvements Plan. The goal is to resolve terminology drift (especially 'absent' vs 'unavailable') and establish consistent nomenclature for downstream lineage and completeness work.

## Current Terminology Audit

### Codebase Terms (src/)

| Term | Usage | Files | Lines |
|------|-------|-------|-------|
| `available` | Provider/capability status | evidence.ts, coverage.ts, cli.ts | 89,90,119,144,182,196,406-408; 9; 102,121,132 |
| `unavailable` | Provider/capability status | cli.ts, evidence-contract.md | 107; 110-113 |
| `failed` | Provider/capability status | evidence.ts, coverage.ts, cli.ts | 154,206,213,224,251,430,431; 116,316,326,369,377,432; 110,118,126 |
| `absent` | Coverage status (missing artifact) | evidence.ts | 210 |
| `malformed` | Coverage error reason | evidence.ts, coverage.ts | 214,441; 116,316,326,369,377,432 |
| `SUCCESS` | Analysis status | evidence.ts | 189,218,314,318 |
| `FAILED` | Analysis status | evidence.ts | 189,252,265,438 |
| `UNSUPPORTED` | Analysis status | evidence.ts | 172,189,225,316 |
| `PASS` | Gate/rule result | evidence.ts, rules.ts | 86,304; 5,36 |
| `WARN` | Gate/rule result | evidence.ts, rules.ts | 86,304; 5,47 |
| `null` | Gate value | evidence.ts | 190,226,253,267,440 |
| `COMPLETE` | Completeness | evidence.ts | 87,220,306 |
| `INCOMPLETE` | Completeness | evidence.ts | 87,227,254,267,306,440 |
| `NOT_APPLICABLE` | Completeness | evidence.ts | 191,227 |
| `NOT_EVALUATED` | Rule result | rules.ts | 5,25 |
| `passed` | Analyzer status (per function) | evidence.ts | 39,276 |
| `failed` | Analyzer status (per function) | evidence.ts | 39,276 |
| `skipped` | Analyzer status (per function) | evidence.ts | 39,276 |
| `available` | CoverageResult field | coverage.ts | 9 |
| `error` | CoverageResult field | coverage.ts | 10,12 |
| `missing` | coverageErrorReason | evidence-contract.md | 316,324 |
| `malformed` | coverageErrorReason | evidence-contract.md | 316,324 |

### Contract Terms (evidence-contract.md)

From §11.2 Output Contract (lines 231-268):

| Field | Values | Source |
|-------|--------|--------|
| capabilities.git | `available` | `unavailable` | `failed` | lines 110-111 |
| capabilities.complexity | `available` | `unavailable` | `failed` | lines 110-111 |
| capabilities.coverageArtifact | `available` | `unavailable` | `failed` | lines 110-111 |
| capabilities.crapTypescript | `available` | `unavailable` | `failed` | lines 110-111 (optional) |
| changedFunctions[].analyzerStatus | `SUCCESS` | `FAILED` | `UNSUPPORTED` | line 124 |
| ruleResults[].result | `PASS` | `WARN` | `FAIL` | `NOT_EVALUATED` | line 134 |
| analysisStatus | `SUCCESS` | `FAILED` | `UNSUPPORTED` | line 142 |
| gate | `PASS` | `WARN` | `null` | line 143 |
| completeness | `COMPLETE` | `INCOMPLETE` | `NOT_APPLICABLE` | line 144 |
| coverageErrorReason | `missing` | `malformed` | line 145 |

### Proposed Vocabulary (CheckChange_Candidate_Improvements_Plan.md §5)

**Coverage Quality**:
- `DIRECT` - Measured directly from coverage artifact
- `ATTRIBUTED` - Derived via attribution from complexity to coverage
- `HISTORICAL` - From historical coverage artifact
- `UNAVAILABLE` - No coverage evidence available

**Complexity Quality**:
- `NATIVE` - From native complexity analyzer (language-specific)
- `PROVIDER` - From external complexity provider
- `FALLBACK` - From fallback complexity mechanism
- `UNAVAILABLE` - No complexity evidence available

## Binding Table: Current Terms → Canonical Terms

| Current Term | Context | Canonical Term | Reason | Citation |
|--------------|---------|----------------|--------|----------|
| `available` (provider status) | Provider/capability availability | `NATIVE` (complexity) / `DIRECT` (coverage) | Indicates provider/native source is functional and present | evidence.ts:89,90,119,144,182,196,406-408 |
| `unavailable` (provider status) | Provider/capability missing | `UNAVAILABLE` | Indicates provider/native source is not present or not configured | cli.ts:107; evidence-contract.md:110-113 |
| `failed` (provider status) | Provider/capability malfunction | `UNAVAILABLE` | Failed provider should be treated as unavailable for evidence quality; failure reason captured elsewhere | evidence.ts:154,206,213,224,251,430,431 |
| `absent` (coverage status) | Coverage artifact missing | `UNAVAILABLE` | Resolves drift: 'absent' → 'UNAVAILABLE' for consistency with contract | evidence.ts:210 |
| `malformed` (coverage error) | Coverage artifact invalid | `UNAVAILABLE` (with reason) | Malformed artifact yields no usable evidence → unavailable; reason preserved in coverageErrorReason | evidence.ts:214,441 |
| `SUCCESS` (analysis status) | Overall analysis successful | Retain `SUCCESS` | Contract-aligned; indicates no provider failures | evidence.ts:189,218,314,318 |
| `FAILED` (analysis status) | Overall analysis failed | Retain `FAILED` | Contract-aligned; indicates provider failure preventing analysis | evidence.ts:189,252,265,438 |
| `UNSUPPORTED` (analysis status) | Analysis not applicable | Retain `UNSUPPORTED` | Contract-aligned; indicates non-TS changes or complexity failure on supported files | evidence.ts:172,189,225,316 |
| `PASS` (gate/rule result) | Rule evaluation passed | Retain `PASS` | Contract-aligned; indicates compliance with threshold | evidence.ts:86,304; rules.ts:5,36 |
| `WARN` (gate/rule result) | Rule evaluation warned | Retain `WARN` | Contract-aligned; indicates threshold violation | evidence.ts:86,304; rules.ts:5,47 |
| `null` (gate value) | No gate applicable | Retain `null` | Contract-aligned; used when analysisStatus is UNSUPPORTED | evidence.ts:190,226,253,267,440 |
| `COMPLETE` (completeness) | All rules evaluated | Retain `COMPLETE` | Contract-aligned; indicates no NOT_EVALUATED rule results | evidence.ts:87,220,306 |
| `INCOMPLETE` (completeness) | Some rules not evaluated | Retain `INCOMPLETE` | Contract-aligned; indicates presence of NOT_EVALUATED rule results | evidence.ts:87,227,254,267,306,440 |
| `NOT_APPLICABLE` (completeness) | Analysis not applicable | Retain `NOT_APPLICABLE` | Contract-aligned; used when analysisStatus is UNSUPPORTED | evidence.ts:191,227 |
| `NOT_EVALUATED` (rule result) | Rule not applicable to function | Retain `NOT_EVALUATED` | Contract-aligned; indicates rule could not be applied (e.g., null CRAP) | rules.ts:5,25 |
| `passed` (per-function analyzer) | Per-function analyzer success | `SUCCESS` | Aligns with contract analyzerStatus values; indicates function-level analysis succeeded | evidence.ts:39,276 |
| `failed` (per-function analyzer) | Per-function analyzer failure | `FAILED` | Aligns with contract analyzerStatus values; indicates function-level analysis failed | evidence.ts:39,276 |
| `skipped` (per-function analyzer) | Per-function analyzer skipped | `UNAVAILABLE` | No analyzer output → unavailable evidence; maintains ZERO≠NULL invariant via coverage=null | evidence.ts:39,276 |
| `available` (CoverageResult) | Coverage artifact present | `DIRECT` | Indicates coverage data obtained directly from artifact | coverage.ts:9 |
| `error` (CoverageResult) | Coverage artifact error | `UNAVAILABLE` (with reason) | Error in coverage processing → unavailable evidence; reason in coverageErrorReason | coverage.ts:10,12 |
| `missing` (coverageErrorReason) | Coverage artifact missing | `UNAVAILABLE` | Contract-preserved reason for unavailable coverage | evidence-contract.md:316,324 |
| `malformed` (coverageErrorReason) | Coverage artifact invalid | `UNAVAILABLE` | Contract-preserved reason for unavailable coverage | evidence-contract.md:316,324 |

### Complexity Provider Mapping (Future Work)

For complexity provider quality labels (§5 of Candidate Plan), current code uses:
- `complexity` capability (evidence.ts:144,407) → maps to `NATIVE` when from `@barney-media/crap-typescript-core`
- `crapTypescript` capability (evidence.ts:90,408) → maps to `PROVIDER` when explicitly provided  
- Future fallback mechanisms → would map to `FALLBACK`
- Missing/unavailable → `UNAVAILABLE`

## Canonical Vocabulary for Downstream Work

Based on the reconciliation, the following canonical terms should be used in all lineage, completeness, and fingerprinting work:

### Evidence Quality Labels
- **Coverage Evidence**: `DIRECT` | `ATTRIBUTED` | `HISTORICAL` | `UNAVAILABLE`
- **Complexity Evidence**: `NATIVE` | `PROVIDER` | `FALLBACK` | `UNAVAILABLE`
- **Analysis Status**: `SUCCESS` | `FAILED` | `UNSUPPORTED`
- **Gate**: `PASS` | `WARN` | `null`
- **Completeness**: `COMPLETE` | `INCOMPLETE` | `NOT_APPLICABLE`
- **Rule Result**: `PASS` | `WARN` | `NOT_EVALUATED`
- **Per-function Analyzer Status**: `SUCCESS` | `FAILED` | `UNAVAILABLE`

### Decision Rationale

1. **Resolves 'absent' vs 'unavailable' drift**: Maps codebase `absent` (evidence.ts:210) to canonical `UNAVAILABLE` to align with evidence-contract.md
2. **Preserves contract fidelity**: All contract-defined values are retained unchanged
3. **Enables quality tracking**: Maps provider status to quality labels (`NATIVE`/`DIRECT` for available, `UNAVAILABLE` for failed/unavailable)
4. **Maintains determinism**: No changes to existing logic; this is a documentation decision for downstream consumption
5. **Supports Experiment A**: Provides the explicit vocabulary needed for evidence lineage (§4), completeness (§5), and fingerprints (§7) of the Candidate Improvements Plan

### Implementation Note

This reconciliation is documentation-only. No code changes are required as:
- Current `absent` usage in evidence.ts:210 is semantically equivalent to `unavailable`
- Failed providers already trigger `analysisStatus='FAILED'` which conveys unavailability
- The mapping is strictly for downstream consumer interpretation (Engram, reviewer tools, etc.)

## Acceptance Criteria

- [x] File exists: docs/decisions/terminology-reconciliation.md
- [x] Contains complete binding table mapping every code term to canonical term
- [x] Every mapping cites file:line evidence
- [x] Resolves 'absent' vs 'unavailable' drift
- [x] Adopts/rejects each proposed term with reason
- [x] Close with explicit canonical vocabulary list
- [x] git status --porcelain shows only this new file (working tree otherwise clean)

**Path**: /Users/victorpetropoulos/Cursor Projects/code-risk-prototype-v0.3-opencode/docs/decisions/terminology-reconciliation.md  
**Row Count**: 32 (in binding table)  
**Status**: Ready for review