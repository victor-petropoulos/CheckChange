# WP5.1 Brief D — WP5_1_FINDINGS.md

Implementer instruction: create `/Users/victorpetropoulos/Cursor Projects/code-risk-prototype-v0.3-opencode/experiments/wp5/wp5.1/WP5_1_FINDINGS.md` with EXACTLY the markdown body below the `=====` marker. No other file.

=====

# WP5.1 — Findings Summary

Date: 2026-08-25. Pipeline inspected at WP4R closure commit `a41d25f`.
No production code was changed. All observations backed by `path:line`
evidence (see `current-behavior-inventory.md` for full map).

## 1. Deliverables produced

| File | Purpose |
|---|---|
| `current-behavior-inventory.md` | Module map, pipeline walkthrough, schemas, confirmed behaviors, test coverage map |
| `failure-mode-matrix.md` | 37 stable-ID failure modes across 5 layers, with evidence, test status, and desired-behavior proposals |
| `fixture-requirements.md` | 23 synthetic fixtures across 3 priority tiers, traceable to failure-mode IDs |
| `WP5_1_FINDINGS.md` | This file — executive summary, defects, gaps, unresolved questions, WP4R reconciliation |
| `repo-documentation-audit.md` | Authoritative doc candidates, dispositions, proposed updates |

## 2. Counts

- **Failure modes catalogued:** 37 (DET 10, CPX 4, COV 8, ATT 10, GEX 5)
- **Apparent defect candidates:** 6 (see §3)
- **Genuine gaps (missing diagnostics/truthfulness):** 12 (see §4)
- **Confirmed contracts to preserve:** ≥8 (see §5)
- **Unresolved questions:** 7 (see §6)
- **Proposed fixtures:** 23 (4 P0, 9 P1, 10 P2)
- **Production files touched:** 0 (verified by intent; no edits authorized in WP5.1)

## 3. Apparent defects (ranked by severity)

### FM-A07 — Container-method attribution key mismatch [CRITICAL]

**Location:** `src/attribution.ts:95-104` × `src/complexity.ts:22-24`
**Evidence:** `complexity.ts` builds `info.method` as
`containerName.functionName` (e.g. `Foo.bar`). `attribution.ts:97`
builds descriptorMap key as `descriptor.functionName:startLine` (raw
name, no container). Lookup at `:103` uses `info.method:startLine`
(qualified). For any function where `containerName !== null`, the key
never matches → coverage null → NOT_EVALUATED.
**Impact:** ALL class methods, object-literal methods, and some nested
functions systematically lose coverage attribution. CRAP = null → rule
NOT_EVALUATED → completeness INCOMPLETE despite valid artifact.
**Why hidden in WP4R:** h3 uses top-level const arrows (containerName
null); apollo-client's Jest coverage reporter failed silently, so no
Istanbul artifact was available for class-heavy code.
**Confidence:** HIGH (code path traced; key mismatch structural).
**Severity:** CRITICAL (silent data loss; real warnings suppressed).
**Fixture:** FR-A6 (P0).
**Fix direction:** Align keys (e.g. use `info.method` for descriptorMap
key, or use lib's `displayName`). Requires WP5.3 adversarial proof.

### FM-C03 — Source-root blind spot [HIGH]

**Location:** `node_modules/@barney-media/crap-typescript-core/dist/fileSelection.js:106,146,185`
**Evidence:** `findAllTypeScriptFilesUnderSourceRoots` only accepts paths
containing a `src` segment. TS files under `tools/`, `scripts/`, `lib/`,
`config/` etc. are never enumerated. Changed functions in those paths
silently produce no signal.
**Impact:** Real risk in projects with non-`src` TS (monorepo tooling,
build scripts, config files). Gate can PASS while unexamined changed
functions exist.
**Confidence:** HIGH (confirmed by fileSelection.js code; no counter-test).
**Severity:** HIGH (silent blind spot).
**Fixture:** FR-C3 (P2, pins current behavior for design decision).
**Fix direction:** Detect changed intervals referencing TS paths outside
any scanned root; emit diagnostic or extend root detection.

### FM-A08 — Suffix-collision path attribution [MEDIUM]

**Location:** `src/attribution.ts:59-70`
**Evidence:** Coverage map keys (absolute normalized) matched against
complexity keys (cwd-relative) via bidirectional `endsWith`. Two files
sharing suffix (e.g. `packages/core/src/index.ts` and
`packages/util/src/index.ts`) → first-entry-wins → wrong-file attribution.
**Impact:** Wrong function gets another function's coverage → incorrect
CRAP. Low probability in practice (requires monorepo with identical
relative paths under different packages).
**Confidence:** MEDIUM (structural; no real-world trigger observed).
**Severity:** MEDIUM (wrong data, but rare).
**Fixture:** FR-A7 (P0).
**Fix direction:** Full normalized path comparison, or require exact match.

### FM-V01 — Coverage capability mislabel [LOW]

**Location:** `src/evidence.ts:145-156` + `src/coverage.ts:28-31`
**Evidence:** Default coverage absent → `coverageResult.available=false`
but `coverageCapability` stays `'available'` (error false). Output
envelope says `coverageArtifact: 'available'` when no artifact exists.
**Impact:** Consumer misleads; incomplete diagnostic signal.
**Confidence:** HIGH (pinned by wp4r2 test 6, which documents the oddity).
**Severity:** LOW (advisory label only; actual behavior correct).
**Fixture:** FR-V1 (P0).
**Fix direction:** Map `available=false` to a distinct capability value.

### FM-D10 / FM-G06 — CLI message inaccuracies [LOW]

**Location:** `src/cli.ts:125` ("coverage artifact malformed" for missing
file); `src/git.ts:15-17` ("Not a git repository" when git binary absent)
**Evidence:** Both cases produce misleading stderr.
**Impact:** User confusion during diagnosis; no functional impact.
**Confidence:** HIGH.
**Severity:** LOW.
**Fix direction:** Include file path and cause in messages.

### FM-G07 — analyzerStatus hardcoded 'passed' [LOW]

**Location:** `src/evidence.ts:216`
**Evidence:** Composed path sets `analyzerStatus: 'passed'` for every
function regardless of coverage availability. Legacy `runCrap` path
respects `method.status` from the lib (passed/failed/skipped).
**Impact:** Schema field dishonest; consumer cannot distinguish analyzed
vs unaugmented functions.
**Confidence:** HIGH (code traced).
**Severity:** LOW (label only; crap=null already signals unevaluated).
**Fix direction:** Deprecate or make truthful in schema docs; fix in
WP5.4 if schema evolves.

## 4. Genuine gaps (missing diagnostics / under-surfaced information)

| Gap | FM IDs | Description | Priority |
|---|---|---|---|
| No unmatched-interval diagnostic | D02, D04, D07, D09 | Changed lines outside any function body are silently ignored; deletions invisible; non-TS silently dropped; malformed headers tolerated | Medium |
| No source-root restriction signal | C02, C03 | Changed TS outside `src` segment never flagged | High |
| No ingestion-skip diagnostics | V04, V05, V06 | Non-Istanbul entries silently skipped; empty artifact indistinguishable from absent; per-file absence untracked | Medium |
| No per-function unknown reason | A03, A04, A10, G01 | fnMap conflict, parse error, file unmatched — all produce null coverage with no reason string | Medium |
| No CLI-level status matrix pin | G05 | No test spawns CLI and asserts exit-code × analysisStatus × gate × completeness | Medium |
| analyzerStatus dishonesty | G07 | Always 'passed' regardless of actual status | Low |

## 5. Confirmed contracts (must not break in WP5.2+)

| Contract | Evidence |
|---|---|
| `crap <= threshold` → PASS (equality PASS) | rules.ts:33; rules.test.ts:40-47 |
| Gate ∈ {PASS, WARN}; null only FAILED/UNSUPPORTED | evidence.ts:244; rules.ts:20-57 |
| Completeness = INCOMPLETE iff any NOT_EVALUATED | evidence.ts:246; rules.test.ts:99-108 |
| Explicit coverage missing → FAILED, exit 1, gate null | wp4r2 tests 4,5,10 |
| Default coverage missing → SUCCESS, gate PASS, INCOMPLETE | wp4r2 test 6 |
| Non-TS-only → UNSUPPORTED, gate null, NOT_APPLICABLE | wp4.2.test.ts:306 |
| No-TS-functions → SUCCESS, gate PASS, COMPLETE | wp4.2.test.ts:355 |
| Schema version 0.2 envelope shape | evidence.ts:261-280; sup-a/output JSON re-parsed |
| Legacy v0.1 buildOutput preserved | evidence.test.ts:172-231; rules.test.ts:88-116 |
| Threshold 30 remains default | cli.ts:13; WP4R_CLOSURE.md:28,54 |
| Output deterministic (sorted walk order) | fileSelection.js:26,41 |
| Coverage dedup deterministic (max hits, merged branches) | istanbul.js:191-227 |

## 6. Unresolved questions

| ID | Question | Source | Impact |
|---|---|---|---|
| OQ-1 | Does lib's `parseFileMethods` intend `functionName` to include container prefix? What does lib's own `crap-typescript` CLI output as `method` for class methods? | attribution.ts:97 vs complexity.ts:22 | Determines fix direction for FM-A07 |
| OQ-2 | What names does the parser assign to anonymous arrows, IIFEs, and unnamed default exports? | parser.js functionDeclarationName (partially read) | Affects FM-C04 taxonomy item; fixture FR-A2 will reveal |
| OQ-3 | Should UNSUPPORTED (no TS changes or complexity failure) exit 0 or non-zero? | evidence.ts:121-142; cli.ts:124-128 | Design decision for FM-G05; currently exits 0 |
| OQ-4 | Should unmatched intervals, missing root files, or ingestion skips produce per-function diagnostics? | FM-D02/D04 gap | Diagnostic policy; affects schema surface |
| OQ-5 | Apollo run showed "exit 1 with analysisStatus SUCCESS gate PASS" (human-review-diagnostics.md:151). Contradicts current cli.ts (exit 1 ⇔ FAILED only). Was this an earlier pipeline era, or a log inaccuracy? | human-review-diagnostics.md:151 | Reconciliation of historical record |
| OQ-6 | Is `coverageArtifact: 'available'` when default is missing intentional contract, or mislabel? | coverage.ts:28-31; evidence.ts:145 | Schema semantic decision |
| OQ-7 | Does `findAllTypeScriptFilesUnderSourceRoots` respect tsconfig `include`, or only `src`-segment heuristic? Test comment says "per tsconfig" (wp4r2-coverage-file.test.ts:15) but code shows hardcoded `src` check. | fileSelection.js:106,146,185 vs test:15 | Determines fixture root for C03/C02 |

## 7. WP4R reconciliation table

| WP4R observation | Source | Matrix link | Status |
|---|---|---|---|
| 7/21 functions NOT_EVALUATED; 2 cases zero detected functions | WP4R_CLOSURE.md:35 | FM-D02, FM-V01, FM-C02 | Consistent with current behavior; fixtures will pin |
| SUP-A: CC=36, 100% stmt cov, CRAP=36, WARN at 30+15 | WP4R_CLOSURE.md:16; SUPPLEMENTAL_RESULTS.md:14 | FM-G03 (CB-16) | Confirmed by-design; FR-G2 regression anchor |
| SUP-B: CC=28.94, 89.4% branch cov, CRAP≈28.94, PASS at 30 / WARN at 15 | WP4R_CLOSURE.md:17; SUPPLEMENTAL_RESULTS.md:15 | FM-G02/G03 | Threshold sensitivity confirmed; no fixture needed (covered by FR-G1 + FR-G2) |
| Apollo Jest reporter produced no usable artifacts | WP4R_CLOSURE.md:34; human-review-diagnostics.md:146-221 | Explains why FM-A07 was invisible | External failure, not prototype defect |
| Threshold 15 useful signal in 1 case; not universal default | WP4R_CLOSURE.md:26-28; SUPPLEMENTAL_RESULTS.md:67 | No code change; threshold stays 30 | Respected |
| Gate evaluates ALL changed functions per commit | SUPPLEMENTAL_RESULTS.md:52,55 | Scoping constraint | Carried into fixture design |
| Prototype exit 1 with SUCCESS/PASS (apollo) | human-review-diagnostics.md:151 | OQ-5 | Unresolved; likely historical era |
| 14 numeric PASS, 7 NOT_EVALUATED in original rerun | WP4R_CLOSURE.md:12 | Combination of FM-V01, FM-A07, FM-C02 | All consistent with current code paths |

## 8. Recommendation for WP5.2 scope

1. Build all 23 fixtures per `fixture-requirements.md`.
2. Mark P0 fixtures (FR-A6, FR-A7, FR-V1, FR-G3) with `test.skip` + defect annotation — these are expected to fail against unfixed code.
3. Run full suite; record baseline pass/fail.
4. All P1 + P2 fixtures should pass against current code (they pin existing behavior).
5. Present baseline results at WP5.2 approval gate.
6. Do NOT fix any production code in WP5.2 — fixes belong in WP5.3 (attribution) and WP5.4 (diagnostics/exit semantics).

## 9. Production code status

**Confirmed untouched.** WP5.1 was a read-only discovery exercise.
All `src/*.ts` files remain at commit `a41d25f`. No `edit` or `bash`
commands modified production files. `git status` will show only new
untracked files under `experiments/wp5/wp5.1/`.
