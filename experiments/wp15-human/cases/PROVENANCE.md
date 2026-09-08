# Provenance

## Engine Commit
`27cb67d49daac30dabdfb1230ea1bdac194ee1b4`

## Thresholds
- CRAP threshold: 30 (WARN)
- CRAP threshold: 15 (INFO)

Frozen per WP15 guardrails — no changes to `src/crapCalc.ts` or config.

## Schema Version
`0.4` (frozen)

## Source Files Copied

### WP14 (from experiments/wp14/)
- `commit-A.json` — WARN CRAP 54.67, CC 12, coverage 33%
- `commit-B.json` — WARN CRAP 116.98, CC 12, coverage 10%
- `WP14_RESULTS.md` — Summary of WP14 findings

### WP5.6 Pipeline Runs (from experiments/wp5/wp5.6/pipeline-runs/)
Selected 3 cases covering WARN, PASS, zero-coverage:

| Case | Threshold | File |
|------|-----------|------|
| sup-a | 15 | sup-a-threshold-15.json |
| sup-a | 30 | sup-a-threshold-30.json |
| hono-03 | 15 | hono-03-threshold-15.json |
| hono-03 | 30 | hono-03-threshold-30.json |
| hono-01 | 15 | hono-01-threshold-15.json |
| hono-01 | 30 | hono-01-threshold-30.json |

**Case Notes:**
- `sup-a`: WARN at T15 & T30, CC=36, full coverage on focus fn (`normalizeRouteRules`)
- `hono-03`: PASS at T30, INCOMPLETE (2 test-file fns skipped per INV-04), CC=1-3
- `hono-01`: PASS at T30, zero changed fns detected (edge case: cors test/data only)

## Guardrails Enforced
- No changes to `src/crapCalc.ts`
- Thresholds 30/15 frozen
- INV-01..04 preserved
- No composite scores
- No CRAP-as-probability interpretation
- Schema 0.4 frozen

## Copy Method
Files copied (not moved) — originals preserved in source locations.