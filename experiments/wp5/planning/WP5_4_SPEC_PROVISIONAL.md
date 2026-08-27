# WP5.4 — Diagnostic and Result-Truthfulness Correctness
## Provisional planning specification

### Status

**PLANNING ONLY — NOT AUTHORIZED FOR EXECUTION**

WP5.4 is the next work package after WP5.3 closure.

This document must be reconciled with the final WP5.3 documentation before execution.

---

## 1. Purpose

WP5.4 addresses defects where the analysis engine may produce technically valid lower-level results but communicate an inaccurate capability, diagnostic, or status to the caller.

The goal is **truthfulness of the externally observable contract**, not cosmetic message improvement.

The deterministic evidence/rule architecture remains unchanged:

> The analysis pipeline consumes evidence and applies deterministic rules. It does not delegate classification or truthfulness decisions to an LLM.

---

## 2. Scope

### 2.1 Coverage capability truthfulness

Verify that the result accurately distinguishes:

- coverage available and successfully attached;
- coverage unavailable;
- coverage provider unsupported;
- coverage artifact unavailable/missing;
- coverage artifact malformed;
- coverage requested but not actually evaluated.

A capability/result must never claim successful coverage analysis when coverage was not actually obtained and attributed.

### 2.2 Git / ENOENT diagnostic truthfulness

Verify the actual CLI boundary when the Git executable or required Git invocation is unavailable.

Required behavior:

- preserve the underlying cause;
- avoid reporting a more specific failure than the evidence supports;
- use consistent exit/status semantics;
- distinguish environmental/tooling failure from analysis failure where the contract requires it.

The exact expected message must be derived from the authoritative WP5.2 CLI evidence.

### 2.3 Missing explicit coverage diagnostic

Verify the actual CLI boundary when the caller supplies a coverage path that does not exist.

Required behavior:

- distinguish missing artifact from malformed artifact;
- preserve deterministic failure classification;
- do not claim coverage analysis was performed;
- ensure CLI text/JSON agrees with the internal result.

Again, expected wording must come from the reconciled WP5.2 contract, not from this planning document.

### 2.4 Analyzer-status semantics

Determine and enforce the semantic contract of analyzer status fields.

At minimum distinguish:

- analysis completed successfully;
- analysis completed with warnings;
- analysis incomplete because required evidence was unavailable;
- analysis failed;
- analysis capability unsupported.

Do not change status names merely for consistency. First establish the intended semantic contract from existing callers, schema, tests, and WP5.2 evidence.

---

## 3. Core Invariants

1. User-visible diagnostics must describe the condition actually observed.
2. Internal status and external status/JSON must not contradict each other.
3. A failed or incomplete analysis must not be represented as successful completion.
4. Missing evidence must not be represented as zero-valued evidence unless zero is the explicitly defined semantic.
5. Unsupported capability must not be represented as a successful capability.
6. CLI text and machine-readable output must describe the same underlying state.
7. Exit code, analysis status, and diagnostic message must be mutually consistent.
8. Deterministic behavior must not depend on message ordering, filesystem ordering, or incidental exception wording.
9. Existing WP4R and WP5.1–WP5.3 contracts must not regress.
10. No LLM judgment belongs in this truthfulness layer.

---

## 4. Required Investigation Before Coding

For every finding:

1. Identify the lowest-level observed behavior.
2. Identify the public/CLI boundary.
3. Identify the documented or existing contract.
4. Reproduce the discrepancy.
5. Add a characterization test.
6. Define the invariant.
7. Implement the smallest correction.
8. Add regression coverage.
9. Verify backward compatibility.

Do not fix a message without determining whether the underlying status/exit semantics are also wrong.

---

## 5. Required Test Matrix

At minimum characterize:

| Condition | Internal status | CLI/JSON status | Exit code | Diagnostic |
|---|---|---|---|---|
| valid coverage | expected success | expected success | expected success | none/success |
| missing coverage | explicit missing/unavailable | same condition | deterministic | accurate |
| malformed coverage | explicit malformed | same condition | deterministic | accurate |
| unsupported provider | unsupported | same condition | deterministic | accurate |
| Git executable unavailable | environment/tool failure | same condition | deterministic | accurate |
| analyzer failure | failure | failure | deterministic | accurate |
| analyzer incomplete | incomplete | incomplete | deterministic | accurate |
| analyzer warning | warning | warning | deterministic | accurate |

The exact status names and exit codes must be taken from the existing contract and reconciled artifacts. Do not invent new ones during test planning.

---

## 6. Compatibility Requirements

The WP5.4 implementation must preserve:

- WP4R frozen behavior;
- WP5.1 baseline behavior;
- WP5.2 regression suite;
- WP5.3 attribution fixes;
- deterministic output ordering;
- existing supported coverage formats/providers unless a finding explicitly requires otherwise.

No scope expansion into:
- new languages;
- new coverage providers;
- new coverage schemas;
- threshold changes;
- CRAP arithmetic;
- source attribution;
- source discovery;
- LLM-based classification.

---

## 7. Acceptance Criteria

WP5.4 can be accepted only when:

- each authorized finding has executable reproduction evidence;
- each correction has an explicit invariant;
- CLI diagnostics accurately represent the observed condition;
- machine-readable and human-readable results agree;
- analyzer status semantics are explicit and tested;
- exit codes are deterministic and contractually justified;
- all WP5.1–WP5.3 regression anchors remain green;
- production changes are minimal and traceable;
- no unrelated behavior was changed.

---

## 8. Stop Gate

WP5.4 execution must stop after implementation and verification.

Do not automatically proceed to WP6 or another implementation phase.
