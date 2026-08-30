# WP9 Hardening Round 4 Threshold Addendum — Provider Diversity (Genuine)

**Date:** 2026-08-29  
**Status:** ADDENDUM to Round 1 + 2 + 3  
**Contract:** 0.2.0 frozen — no CRAP formula or threshold change

---

## Provider Diversity

| Round | Repo | Provider | Tooling | Result | Artifact Size | Gate |
|-------|------|----------|---------|--------|---------------|------|
| 1 | defu | vitest v8 | @vitest/coverage-v8 | PASS | 12,673 bytes | PASS |
| 3 | defu (variant2) | vitest v8 fallback | @vitest/coverage-v8 (fallback mode) | PASS | 12,673 bytes | PASS |
| 4 | kulshekhar/ts-jest | Jest + babel Istanbul | Jest with babel provider (Istanbul JSON) | PASS | 277,177 bytes | PASS |

- Round 1: https://github.com/unjs/defu
- Round 4: https://github.com/kulshekhar/ts-jest

---

## Hypothesis Result

**Per-repo validation holds** — engine is agnostic to Istanbul JSON provider (v8 vs babel both valid) but requires per-repo TypeScript interval discovery; not agnostic across repos without coverage. External diversity now **n=2 providers** (v8 + Istanbul/babel) across 2 repos, up from n=1 v8 + fallback variant.

---

## Threshold Policy — Unchanged

- Default `crapThreshold: 30` per `docs/contracts/evidence-contract.md:38`, `src/rules.js`
- Round 2 `cli.ts` 87.8% still PASS at both thresholds (CRAP 27/12)
- No source changes; reversible via `git revert`

---

## Verification

- `tsc` clean
- `vitest` 174/174 pass (58 files)
- Build OK
- Two+ evidences PASS (defu v8 + ts-jest genuine Istanbul)
- INV-01..04 preserved: ZERO≠NULL, MISSING≠MALFORMED, GIT≠REPO, ANALYZER TRUTHFUL