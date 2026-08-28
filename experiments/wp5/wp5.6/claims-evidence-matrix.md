# WP5.6 Claims / Evidence Matrix

Per Roadmap WP5.6 §CLAIMS/EVIDENCE MATRIX. Confidence must match the actual sample (11 cases).

| Claim | Evidence | Confidence | Limitation |
|-------|----------|------------|------------|
| Changed functions can be identified from Git diff + complexity analysis | 11 cases: 5 re-executed (hono-01/02/03, sup-a, sup-b), 6 replay-only (h3-01/02/03, apollo-01/02/03); 4/5 re-executed produced expected locked-focus functions; hono-01 produced 0 (truthful absence) | Medium/High | TypeScript/JavaScript only; monorepos untested; apollo-01/02 scope mismatch (0/1/4 fns detected vs expected) |
| Coverage can be attributed to changed functions | 5 re-executed cases with preserved Istanbul/v8 artifacts; hono-02 basePath 92.31% branch, sup-a normalizeRouteRules 100%, sup-b processJsonRpcMethod 89.36% | Medium | Coverage-provider dependent (Istanbul, v8); test files (post-WP5.3 C03) outside Istanbul scope report skipped; apollo coverage failure unresolved |
| CRAP is deterministic | 5 re-executed cases × 2 thresholds (10 runs) reproduce WP4R frozen baseline exactly for locked-focus functions; WP5.5 5× identical determinism confirmed | High | Tested environments only; documented path-coupling caveat (F-03) |
| CRAP calculation is correct | sup-a CRAP=36 at cov=100 → CRAP=CC (formula check); sup-b CRAP=28.94 at 89.36% branch; hono-02 basePath 10.05 at 92.31% | High | Formula is `crap-typescript-core` v0.5.0 implementation; third-party trust boundary |
| Output is explainable (JSON schema, capability flags, ruleResults, gate, completeness) | All 11 cases produce `schemaVersion: 0.2` JSON with analysis/capabilities/ruleResults/analysisStatus/gate/completeness; INV-01..04 verified | High | JSON only; no terminal/human-friendly output beyond JSON present in this WP |
| Threshold sensitivity is deterministic | sup-b: T30=PASS, T15=WARN (same evidence, different policy) | Medium | Single demonstration case; policy layer separate from evidence layer |
| Signal usefulness (real-world reviewer value) | 8 WP4R human-classified PASS samples + SUP-A EXPECTED_WARN + SUP-B EXPECTED_PASS/USEFUL_WARN | Low/Medium | 9-case sample; single repo (h3) for WARN cases; human classifications recorded in human-review-packet.md, not autonomously assigned in WP5.6 |

## Explicit non-claims

- No claim that CRAP predicts defects universally.
- No claim that full-suite coverage was used where scoped was used (see coverage-strategy.md).
- No claim that usefulness is established — that classification belongs to the human reviewer.
- No claim that coverage attribution is solved for all providers.

## Evidence provenance

Per-rule traceability: Git diff → changed intervals → complexity file+fn → coverage file+fn → CRAP → ruleResult → gate.
Frozen WP4R results remain the baseline; new re-execution outputs are stored under `experiments/wp5/wp5.6/pipeline-runs/`.
