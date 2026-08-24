# WP4.1 Failure Semantics Decision

## Cases

### Case A — Successful Analysis, No Relevant Changed Functions
Scenario: valid TypeScript analysis succeeds, but Git change touches no analyzable current functions (e.g., JS/docs only, or TS change outside src/ functions).

**Decision:**
- `analysisStatus: SUCCESS`
- `gate: PASS` (preferred over null, because no rule was violated; alternative `gate: null` also considered but PASS is more intuitive for "no relevant functions, nothing to warn")
- `completeness: COMPLETE`
- Process exit: 0
- JSON: `{"analysisStatus":"SUCCESS","gate":"PASS","completeness":"COMPLETE","changedFunctions":[],"ruleResults":[]}`

Rationale: Successful analysis with no relevant functions is still successful; gate PASS indicates no policy violation.

### Case B — Unsupported Source Type
Scenario: implementation change is JavaScript while prototype supports TypeScript only (p-limit case).

**Decision:**
- `analysisStatus: UNSUPPORTED`
- `gate: null`
- `completeness: COMPLETE` (or N/A)
- Process exit: 0 (or 2 for visibility, but 0 with status UNSUPPORTED is acceptable; non-zero would conflate with failure)
- Capability detail: `{"crapTypescript":"available","detail":"No analyzable TypeScript functions in change"}`
- JSON: `{"analysisStatus":"UNSUPPORTED","gate":null,"completeness":"COMPLETE","changedFunctions":[]}`

Must not masquerade as `SUCCESS/PASS/COMPLETE` without qualification. Use `UNSUPPORTED` to distinguish.

### Case C — Evidence Provider Fails
Scenario: crap-typescript coverage command exits unsuccessfully (zod/zustand 6 cases).

**Decision:**
- `analysisStatus: FAILED`
- `gate: null`
- `completeness: INCOMPLETE`
- Process exit: non-zero (1) + preserve provider stderr
- JSON: `{"analysisStatus":"FAILED","gate":null,"completeness":"INCOMPLETE","capabilities":{"crapTypescript":"failed"},"error":"Coverage command failed with exit 1 for pnpm/vitest ..."}`

Must not produce `gate:PASS/completeness:COMPLETE` (current bug where 6 failed cases still showed PASS/COMPLETE). This is the critical fix.

### Case D — Function Exists but CRAP Is Unavailable
Scenario: provider succeeded but method has `crap:null` (skipped). Already modeled.

**Decision:**
- `analysisStatus: SUCCESS` (provider succeeded and explicitly reported unavailable)
- `gate: PASS` (or WARN if other functions warn) — gate based on evaluated results only
- `completeness: INCOMPLETE`
- Process exit: 0
- Rule result: `{"result":"NOT_EVALUATED","crap":null}`
- Overall: `{"analysisStatus":"SUCCESS","gate":"PASS","completeness":"INCOMPLETE"}`

Counts as successful analysis with partial evidence, not provider failure.

### Case E — Partial Provider Output
Scenario: some changed functions have complete evidence (measured coverage) and others do not (null).

**Decision:**
- `analysisStatus: SUCCESS` (provider succeeded)
- `gate: WARN` or `PASS` based on evaluated PASS/WARN (e.g., if any WARN → WARN else PASS)
- `completeness: INCOMPLETE`
- Process exit: 0
- JSON includes both evaluated and NOT_EVALUATED ruleResults.

Gate may still be WARN/PASS, but completeness INCOMPLETE signals partial.

## Separation to Preserve

Three-axis model:

- `analysisStatus` → did evidence acquisition execute meaningfully? (SUCCESS, UNSUPPORTED, FAILED)
- `gate` → what did evaluated policy rules conclude? (PASS, WARN, null when not applicable)
- `completeness` → how much required evidence was available? (COMPLETE, INCOMPLETE)

Do not collapse into one status. Current envelope collapsed FAILED into PASS/COMPLETE; must be fixed.

## Preferred Shape When Analyzer Did Not Run Successfully

```
{
  "analysisStatus": "FAILED",
  "gate": null,
  "completeness": "INCOMPLETE"
}
```

rather than

```
{
  "gate": "PASS",
  "completeness": "COMPLETE"
}
```

when provider failed. Compatibility: add `analysisStatus` as new field, allow `gate` to be nullable, keep existing `policy`, `ruleResults`, `changedFunctions` (empty on failure). This is backward compatible if consumers check `analysisStatus` first.

## Process Exit Guidance

- SUCCESS/COMPLETE or SUCCESS/INCOMPLETE (partial) → exit 0
- UNSUPPORTED → exit 0 (or 2 if wanting visibility, but 0 with status is sufficient)
- FAILED → exit 1 (or 2), preserve stderr

Tool/runtime failure must not silently become PASS.

## Questions Answered

1. When is gate PASS legitimate? Only when `analysisStatus` is SUCCESS and no WARN results (even if 0 changedFunctions).
2. When may completeness be COMPLETE? Only when all required evidence for evaluated functions was available (no NOT_EVALUATED and no provider failure).
3. What when provider fails? FAILED/null/INCOMPLETE + non-zero exit + error.
4. What when changed TS exists but no functions emitted? SUCCESS/PASS/COMPLETE with 0 functions (if analysis truly found no functions), or UNSUPPORTED if JS-only.
5. What for unsupported JS? UNSUPPORTED/null/COMPLETE.
6. Should provider failure produce JSON plus non-zero exit? Yes, JSON with FAILED plus stderr, exit 1.
7. Should run have separate analysisStatus independent of gate/completeness? Yes.

## Compatibility with Current Envelope

Current envelope has `schemaVersion:"0.1", analysis:{base,target}, capabilities, changedFunctions, policy, ruleResults, gate, completeness`. Adding `analysisStatus` and allowing `gate:null` is minimal and backward compatible. No existing field needs removal.

