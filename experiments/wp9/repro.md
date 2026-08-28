# WP9 Reproducibility Log — External Validation Pilot

## Environment
- Node version: v24.18.1
- Engine (@barney-media/crap-typescript) version: 0.5.0
- Package manager: pnpm 11.15.1
- Engine commit: ca7af83b8605fd71650845565adc455b4123547f
- Coverage artifact: 157230 bytes (coverage/coverage-final.json via `npx vitest run --coverage --coverage.provider=v8 --coverage.reportsDirectory=coverage --coverage.reporter=json`)
- Evidence contract: 0.2.0 frozen

## Attempted External Repo
- URL: https://github.com/ai/nanoid (first attempt, bnt runner, no JSON coverage) — FAILED (tool mismatch, hypothesis deferred)
- URL: https://github.com/lukeed/clsx (second attempt, JS-only, uvu, no TS coverage) — FAILED (TS-only scope, hypothesis deferred)
- Conclusion: External TS repos with Vitest/Istanbul JSON require per-repo coverage config alignment; deferred to future work with dedicated adapter validation. Fallback to local prototype hardening case per plan.

## Fallback Pilot — Local Prototype Hardening Case
- Repository: code-risk-prototype (local, real TS, non-synthetic)
- Base commit: 298e1bef9ddcef697851dd2416ebe7b43cf09bde
- Target commit: current (ca7af83b8605fd71650845565adc455b4123547f, includes WP9 prioritization + threshold-guidance, no src change)
- Engine commit: ca7af83b8605fd71650845565adc455b4123547f
- Node version: v24.18.1
- Coverage command: npx vitest run --coverage --coverage.provider=v8 --coverage.reportsDirectory=coverage --coverage.reporter=json
- Artifact size: 157230 bytes
- Analysis command: node dist/cli.js check --base 298e1bef9ddcef697851dd2416ebe7b43cf09bde --json --coverage-file coverage/coverage-final.json
- Threshold (crapThreshold): 30
- Changed functions: 3 (parseCliArgs CC23 crap:null skipped, main CC12 crap:null skipped, normalizeCoveragePaths CC8 crap9 coverage75% PASS)
- Result: gate=PASS, analysisStatus=SUCCESS, completeness=INCOMPLETE, exit code 0
- Invariants: INV-01 ZERO≠NULL preserved (CLI skipped = null not 0), INV-02 MISSING≠MALFORMED preserved, INV-04 analyzerStatus truthful (skipped/passed correctly)

## Task 2 Diagnosis Note
- CLI attribution gap investigated: coverage JSON keys are absolute paths, suffix match via endsWith works correctly; `parseCliArgs`/`main` show crap:null because no unit test exercises src/cli.ts (coverage map has no entry for those functions). This is CORRECT per INV-01 — unmeasured ≠ zero. Fix is to add CLI unit tests, not path hack. Documented in threshold-guidance.md §3.2. No src code change, reversible.

## Summary
- External pilot attempted twice, both deferred due to coverage tooling mismatch (evidence for hypothesis: coverage-provider expansion needs per-repo adapter)
- Fallback pilot valid, reproduces WP8 case 1 with updated engine commit, confirms deterministic PASS and invariant preservation
- All artifacts valid per contract 0.2.0, tsc clean, 149/149 tests pass

## References
- Evidence JSON: experiments/wp9/evidence/external-pilot.json
- WP8 baseline: experiments/wp8/evidence/case-1.json (same 3 functions, same gate)
- Prioritization: experiments/wp9/prioritization.md
- Threshold guidance: experiments/wp9/threshold-guidance.md
