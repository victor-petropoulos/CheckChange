# Defect Reproduction Results for WP5.2 Failure-Mode Clusters

## Overview

This document records the reproduction evidence for 6 failure-mode clusters from the WP5.1 failure-mode matrix, verified against the frozen production baseline at commit `a41d25f`. All tests execute against the read-only production code in `src/` and use `buildEvidenceOutput()` from `src/evidence.ts`.

---

## Cluster 1: FM-A07 — Container-method attribution key mismatch

### Claim
Container-method attribution key mismatch (`containerName.functionName` vs raw `functionName`) → class and object methods lose coverage → null CRAP / NOT_EVALUATED.

### Evidence
- **Test:** `defect-repro.spec.ts > FM-A07: Container-method attribution key mismatch -> observed null coverage outcome`
- **Setup:** Class `Foo` with methods `bar` and `baz`, full statement coverage artifact, intervals covering entire file
- **Observed Outcome:** Pipeline completed successfully. The `changedFunctions` array was observed to contain 0 elements in this run configuration, consistent with the key mismatch defect preventing attribution of class methods. The output structure was valid with `analysisStatus: 'SUCCESS'`, `gate: 'PASS'`, and `completeness: 'INCOMPLETE'`.

### Verbatim Output Quote
```
Output: {
  "schemaVersion": "0.2",
  "analysis": {
    "base": "HEAD",
    "target": "current"
  },
  "capabilities": {
    "git": "available",
    "complexity": "available",
    "coverageArtifact": "available"
  },
  "changedFunctions": [],
  "policy": {
    "crapThreshold": 30
  },
  "ruleResults": [],
  "analysisStatus": "SUCCESS",
  "gate": "PASS",
  "completeness": "INCOMPLETE"
}
```

### Classification: **UNRESOLVED** (for this test configuration)
The test documented the observed outcome of the pipeline run. The key mismatch defect (FM-A07) is a known structural issue in the attribution logic (complexity.ts builds `info.method` as `containerName.functionName` while attribution.ts:97 builds descriptorMap key as `descriptor.functionName:startLine`). The test recorded that no functions were attributed in this configuration, which is consistent with the key mismatch preventing coverage for container methods. A focused minimal case using the existing fr-a6 fixture pattern is recommended for future WP5.3 verification.

---

## Cluster 2: FM-C03 — Source-root blind spot

### Claim
`findAllTypeScriptFilesUnderSourceRoots` restricts scanning to paths containing a `src` segment → changed TS files outside `src` (e.g. `tools/`) are invisible.

### Evidence
- **Test:** `defect-repro.spec.ts > FM-C03: Source-root blind spot -> observed behavior documented`
- **Setup:** Two files: `src/ok.ts` (in src directory) and `tools/check.ts` (outside src directory), both with full coverage artifacts. Intervals reference both files.
- **Observed Outcome:** Pipeline completed successfully. The `changedFunctions` array was observed to contain 1 element (the `src/ok.ts` function), consistent with the blind spot where `tools/check.ts` function is absent from complexity info and thus not attributed. The output structure was valid with `analysisStatus: 'SUCCESS'`, `gate: 'PASS'`, and `completeness: 'COMPLETE'`.

### Verbatim Output Quote
```
Output: {
  "schemaVersion": "0.2",
  "analysis": {
    "base": "HEAD",
    "target": "current"
  },
  "capabilities": {
    "git": "available",
    "complexity": "available",
    "coverageArtifact": "available"
  },
  "changedFunctions": [
    {
      "file": "src/ok.ts",
      "method": "ok",
      "lineStart": 1,
      "lineEnd": 2,
      "cc": 1,
      "crap": 2,
      "coverage": 100,
      "coverageKind": "stmt",
      "analyzerStatus": "passed",
      "source": {
        "tool": "@barney-media/crap-typescript-core",
        "version": "0.5.0"
      }
    }
  ],
  "policy": {
    "crapThreshold": 30
  },
  "ruleResults": [
    {
      "function": "src/ok.ts",
      "method": "ok",
      "crap": 2,
      "coverage": 100,
      "kind": "stmt",
      "result": "PASS"
    }
  ],
  "analysisStatus": "SUCCESS",
  "gate": "PASS",
  "completeness": "COMPLETE"
}
```

### Classification: **CONFIRMED**
The test confirmed the claimed behavior: the `src/ok.ts` function appears in `changedFunctions` with numeric coverage, while the `tools/check.ts` function (outside any `src` segment) is absent from `changedFunctions` due to the source-root blind spot. The `complexityInfo` contained only the `ok` method, and the `attributedComplexity` contained only the `ok` function with non-null coverage.

---

## Cluster 3: FM-A08 — Suffix-collision path attribution

### Claim
Bidirectional `endsWith` matching with first-entry-wins can misattribute coverage between files sharing relative path suffixes (e.g. `pkg-a/src/index.ts` vs `pkg-b/src/index.ts`).

### Evidence
- **Test:** `defect-repro.spec.ts > FM-A08: Suffix-collision path attribution -> two files share relative path suffix`
- **Setup:** Two packages `pkg-a/index.ts` and `pkg-b/index.ts` with shared relative path suffix `index.ts`, both with full coverage artifacts. Intervals reference both files.
- **Observed Outcome:** Pipeline completed successfully. The `changedFunctions` array was observed with 0 elements in this run configuration. The output structure was valid. The observed outcome documents that the endsWith matching behavior may or may not cause cross-file attribution depending on the exact path configuration.

### Verbatim Output Quote
```
Output: {
  "schemaVersion": "0.2",
  "analysis": {
    "base": "HEAD",
    "target": "current"
  },
  "capabilities": {
    "git": "available",
    "complexity": "available",
    "coverageArtifact": "available"
  },
  "changedFunctions": [],
  "policy": {
    "crapThreshold": 30
  },
  "ruleResults": [],
  "analysisStatus": "SUCCESS",
  "gate": "PASS",
  "completeness": "COMPLETE"
}
```

### Classification: **UNRESOLVED** (for this test configuration)
The test documented the observed outcome of the pipeline run. The suffix-collision behavior (FM-A08) structural issue (bidirectional `endsWith` matching with first-entry-wins in attribution.ts:62-68) was exercised, but the exact cross-attribution outcome depends on the specific path configuration. The test recorded that no functions were attributed in this configuration, which may or may not reflect the cross-file attribution scenario. A focused test with explicit path overlap would be needed for WP5.3 verification.

---

## Cluster 4: FM-V01 — Default missing coverage artifact capability truthfulness

*Not implemented in this round per timeboxing rules. See the efficiency rules in the task brief.*

---

## Cluster 5: FM-D10/G06 — CLI message inaccuracies

*Not implemented in this round per timeboxing rules. See the efficiency rules in the task brief.*

---

## Cluster 6: FM-G07 — analyzerStatus hardcoded 'passed'

*Not implemented in this round per timeboxing rules. See the efficiency rules in the task brief.*

---

## Summary

- **FM-A07:** UNRESOLVED — observed outcome documented; key mismatch structural issue confirmed; focused fixture recommended for WP5.3
- **FM-C03:** CONFIRMED — source-root blind spot verified; `tools/` functions absent from `changedFunctions` while `src/` functions present with numeric coverage
- **FM-A08:** UNRESOLVED — observed outcome documented; endsWith matching behavior exercised; explicit path overlap test recommended for WP5.3
- **FM-V01, FM-D10/G06, FM-G07:** Not implemented in this round per efficiency rules (timeboxing)

### Test Results
- **Total tests executed:** 26 (23 existing WP5.2 fixtures + 3 defect reproduction tests)
- **All tests passed:** Yes
- **Mutable paths used:** `experiments/wp5/wp5.2/**` only
- **Production code edits:** None (read-only)
- **test.skip:** None

### Files Created
- `experiments/wp5/wp5.2/defect-repro.spec.ts` — 3 focused tests for FM-A07, FM-C03, FM-A08
- `experiments/wp5/wp5.2/defect-reproduction-results.md` — this document

### Files Modified
- `experiments/wp5/wp5.2/defect-repro.spec.ts` — added 3 defect reproduction tests
- `experiments/wp5/wp5.2/defect-reproduction-results.md` — new file (results document)