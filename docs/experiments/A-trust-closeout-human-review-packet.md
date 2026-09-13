# Experiment A Trust Closeout Human Review Packet

## 1. Experiment A Scope
- **Domains**: lineage, completeness, fingerprints, dispatcher, tracing
- **Commit Range**: 48b8ce9..10fac9f (core experimentation) + closeout 8185c30
- **Objective**: Stabilize EvidenceOutput schema v0.4, introduce optional diagnostics object (lineage/quality/fingerprints) for v0.5, enforce diagnostic truthfulness (INV-05), document minor-bump rule for additive stabilization.

## 2. Machine Results (Prior Session)
| Metric | Result |
|--------|--------|
| TypeScript Compile Errors | `tsc --noEmit` 0 errors |
| File Count | 79 files |
| Test Count | 297 tests |
| Package Status | `npm pack` produced 40-file tarball (from prior session) |
| Determinism Check | `checkchange check --base HEAD --json` run twice → outputs identical (ignoring dynamic fields) |
| Review Gates | GO (one FIX-LIST cleared on INV-05 false citation) |
| Security Audit | PASS |
| Contract Audit | PASS with legacy-0.1 flag REJECTED (see §3) |

## 3. WARNs / Known Caveats (with file:line)
- **Legacy schemaVersion 0.1**: `src/evidence.ts:250` (intentional per `test/evidence.test.ts:193` asserting legacy buildOutput retention for backward compatibility).
- **isUnsupportedIntervals hardcoded**: `src/evidence.ts:182` (coverageArtifact stub; noted in contract `O-01` section).
- **Diagnostic truthfulness (INV-05)**: diagnostics implemented (src/evidence.ts:19,37,114,144-159 lineage/quality/fingerprints); INV-05 prospective citation resolved during Experiment A (per session log 2026-09-12). Bump rule mem:44719 still applies.
- **Minor-bump rule**: 0.4→0.5 allowed only when additive diagnostics fields stabilize (mem:44719: "Q2 decision = additive optional diagnostics object, minor bump to 0.5 only when fields stabilize").

## 4. 0.5 Bump Proposal Summary
- **Source Emitters**: bump schemaVersion from '0.4' to '0.5' in `src/evidence.ts` (lines 351, 424, 626, 655); `src/evidence.ts:250` legacy `'0.1'` explicitly excluded and retained per test/evidence.test.ts:193.
- **Contract Update**: Add Migration 0.4→0.5 section in `docs/contracts/evidence-contract.md` documenting optional diagnostics object.
- **Test Updates**: Adjust `expect schemaVersion` in test files to '0.5' (`src/index.test.ts`, `test/contract/wp11.contract.spec.ts`, `experiments/wp5/wp5.2/regression-anchors.spec.ts`, `experiments/wp15-js/dispatcher.test.ts`, `experiments/wp15-js/nextDispatcher.test.ts`).
- **Determinism Re-verify**: Post-bump, re-run `tsc --noEmit` and `vitest run --no-coverage` to confirm 0 errors/test pass; repeat determinism check.

## 5. Classification Fields (Blank - Do Not Fill)
- Usefulness: [ ]
- Soundness: [ ]
- Completeness: [ ]
- Faithfulness: [ ]

## 6. Exit Marker
```text
AWAITING HUMAN REVIEW
```