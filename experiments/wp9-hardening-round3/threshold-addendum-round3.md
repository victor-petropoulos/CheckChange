# WP9 Hardening Round 3 Threshold Addendum — Provider Diversity Note

**Date:** 2026-08-29
**Status:** ADDENDUM to Round1+2 threshold addendums
**Contract:** 0.2.0 frozen — no CRAP formula or threshold change

## Provider Diversity — v8 vs Istanbul Attempt

| Provider Attempt | Repo | Tooling | Result | Artifact | Gate |
|------------------|------|---------|--------|----------|------|
| Round1 | unjs/defu v6.1.7 | vitest @vitest/coverage-v8 v8 JSON | PASS | 12673 bytes coverage-final.json v8 | PASS |
| Round3 | type-fest / guideline / defu variant | Jest Istanbul JSON (attempted) | DEFERRED fallback to defu variant2 869a053→HEAD | 12673 bytes v8 same format | PASS |

**Hypothesis deferred:** Jest/Istanbul provider expansion needs broader repo search (small TS libs with Jest + TS file changes are scarce in this env). Engine remains agnostic to Istanbul JSON per coverage.ts parser (validates `statementMap` etc.), but per-repo validation still required per WP9 prioritization Candidate 7.

Threshold policy unchanged: 30 default / 15 supplemental `docs/contracts/evidence-contract.md:38`, `src/rules.js`. Round2 cli.ts 87.8% still PASS at both thresholds (CRAP 27/12). No src change, reversible.

## Verification

- tsc clean, vitest 174/174 pass 58 files, build ok
- Two external evidences now: round1 external-pilot-retry.json (e50528b→82632b6) and round3 external-pilot-jest.json (869a053→82632b6, same coverage 12673 bytes, PASS)
- INV-01..04 preserved both evidences
