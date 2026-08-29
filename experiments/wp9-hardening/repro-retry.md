# WP9 Reproducibility Log — External Validation Pilot (Retry)

## Environment
- Node version: v24.18.1
- Engine (@barney-media/crap-typescript) version: 0.5.0 (commit c6cd39fe0eccd0435a36c9ee29192c53f03291c1)
- Package manager: pnpm 10.33.4
- Engine commit: c6cd39fe0eccd0435a36c9ee29192c53f03291c1
- Coverage artifact: 12673 bytes (coverage/coverage-final.json via `npx vitest run --coverage --coverage.provider=v8 --coverage.reporter=json --coverage.reportsDirectory=coverage`)
- Evidence contract: 0.2.0 frozen

## Attempted External Repo
- URL: https://github.com/unjs/defu
- Base: tag v6.0.0 (e50528bc4f531fbbe98d4aef31ceac79d5d49ee2)
- Target: HEAD (82632b66f5914e9946edce300e10633a3d5c0cb7)
- Coverage command: npx vitest run --coverage --coverage.provider=v8 --coverage.reporter=json --coverage.reportsDirectory=coverage
- Artifact size: 12673 bytes
- Analysis command: node dist/cli.js check --base e50528bc4f531fbbe98d4aef31ceac79d5d49ee2 --json --coverage-file coverage/coverage-final.json
- Threshold (crapThreshold): 30
- Changed functions: 
  - src/_utils.ts:isPlainObject (cc=8, crap=8, coverage=100%)
  - src/defu.ts:_defu (cc=14, crap=14, coverage=100%)
  - src/defu.ts:createDefu (cc=1, crap=1, coverage=100%)
  - test/defu.test.ts:Test.constructor (cc=1, crap=null, coverage=null)
  - test/defu.test.ts:fn (cc=1, crap=null, coverage=null)
  - test/defu.test.ts:num (cc=1, crap=null, coverage=null)
  - test/defu.test.ts:ignore (cc=1, crap=null, coverage=null)
  - test/defu.test.ts:num (cc=1, crap=null, coverage=null)
  - test/defu.test.ts:arr (cc=1, crap=null, coverage=null)
- Result: gate=PASS, analysisStatus=SUCCESS, completeness=INCOMPLETE, exit code 0
- Invariants: 
  - INV-01 ZERO≠NULL preserved (cc and crap use 0 for measured zero, null for unmeasured; coverage 100% measured, null for test files)
  - INV-02 MISSING≠MALFORMED preserved (coverage artifact is valid JSON)
  - INV-03 GIT≠REPO preserved (Git capability available)
  - INV-04 ANALYZER TRUTHFUL preserved (analyzerStatus truthful per function)

## Summary
- External pilot succeeded with defu@v6.1.7 (TS library using vitest + @vitest/coverage-v8)
- Coverage artifact generated successfully and consumed by engine
- Engine produced valid evidence per contract 0.2.0
- All invariants preserved
- Gate PASS due to low CRAP scores (<30) in changed source functions
- Evidence file written to experiments/wp9-hardening/evidence/external-pilot-retry.json

## References
- Evidence JSON: experiments/wp9-hardening/evidence/external-pilot-retry.json
- Prior repro: experiments/wp9/repro.md
- Evidence contract: docs/contracts/evidence-contract.md
