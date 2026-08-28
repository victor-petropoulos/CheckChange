# WP7 RESULTS — Productionization

Status: WP7 — Productionization — COMPLETE, awaiting human review per guardrail

Objective: Turn WP6 Evidence API + Minimal CI gate into dependable engineering component (predictable, installable, testable, observable, secure, documented).

## Tasks completed (plan 2026-08-28T15:51:18Z, approved:true)

T1 State reconstruct — 149/149 pass, tsc clean, run-proof PASS — done (researcher report)
T2 Version align — package.json 0.1.0 → 0.2.0 matching contract 0.2.0 — done, no schema break
T3 Packaging hardening — added "prepare": "npm run build", tsconfig declaration:true, bin code-risk→dist/cli.js, npm pack --dry-run PASS — done
T4 Config robustness — CLI --base --json --crap-threshold --coverage-file + exit codes per contract, evidence semantics unchanged — verified
T5 Security audit — path.relative boundary in src/coverage.ts:55-57 intact, git args sanitized via validateGitRepo/resolveBaseRef, malicious coverage → FAILED/malformed, no secrets, npm audit informational — done
T6 Observability — diagnostics map to analysisStatus/gate/completeness truthfully, added --verbose/--debug stderr diagnostics (no JSON mutation) — done, help updated
T7 Perf baseline — recorded in experiments/wp7/perf-baseline.md:
  - small vitest basic.test.ts 0.54s
  - small CLI check --base HEAD~1 --json 0.34s
  - medium vitest run --no-coverage 4.13s
  - large vitest run --coverage 4.96s, 696K artifact, 4 changed functions
  - build + pack verified
T8 Release readiness — clean install, reproducible build, regression, integration proof, docs — below

## Contract freeze

docs/contracts/evidence-contract.md frozen 0.2.0 (WP5.6 freeze at 21daa57, F-03 additive). Invariants INV-01 ZERO≠NULL, INV-02 MISSING≠MALFORMED, INV-03 GIT≠REPO, INV-04 ANALYZER TRUTHFUL preserved. Versioning: patch additive (F-03), minor additive field, major breaking. No silent methodology changes.

## Packaging chosen

CLI + library via npm. bin code-risk → ./dist/cli.js, prepare builds on install, types via declaration:true, src/index.ts barrel re-exports buildEvidenceOutput et al. Rejected: container/service/DB/dashboard/multi-language (violates minimality, no evidence). Reversibility HIGH: revert version + remove prepare + rm --verbose flag.

## Config

Evidence stable, policy configurable: crapThreshold, coverageFile, json, verbose. Config never mutates evidence semantics. Exit 0 = SUCCESS+PASS or UNSUPPORTED null/NOT_APPLICABLE. Exit 1 = FAILED or WARN/FAIL or git error.

## Security

Threat model per Roadmap WP7: untrusted repos, fs access, path traversal, malicious coverage, deps, CI perms, command injection, secrets. Fix: normalizeCoveragePaths boundary check via path.relative (src/coverage.ts:55-57, HIGH traversal fixed WP5.6, reverified). Git exec via execSync with validated base ref only. No secrets in repo. Coverage malformed → error:true reason malformed, no crash.

## Observability

Diagnostics explain what attempted/succeeded/failed/why/completeness, never contradict analytical status. --verbose prints [verbose] analysisStatus/gate/completeness/changedFunctions to stderr. JSON remains truthful.

## Release readiness checklist

- [x] clean install: npm ci --dry-run ok, prepare builds
- [x] reproducible build: npm run build → tsc clean, declaration:true
- [x] regression: 149/149 pass, 56 files, tsc clean
- [x] integration: experiments/wp6/minimal-ci-proof/run-proof.sh → gate PASS (real change → coverage → JSON → gate)
- [x] security review: boundary + git + deps checked, no secrets
- [x] perf baseline: recorded, no regressions vs WP6
- [x] docs: evidence-contract frozen, README install, perf-baseline, WP7 packet
- [x] installable: npm pack --dry-run 4.2MB tarball, bin works (code-risk --help, check --base HEAD~1 --json)
- [x] failure recovery: missing vs malformed vs zero vs unavailable distinct, exit codes per contract
- [x] compatibility: patch additive only, no breaking

Verification:
- npx tsc --noEmit → 0
- npx vitest run --no-coverage → 149/149
- node dist/cli.js check --help → shows --verbose
- node dist/cli.js check --base HEAD~1 --json → schemaVersion 0.2
- npm pack --dry-run → succeeds

Limitations (not failures): TypeScript/JS only, Istanbul/v8 only, monorepo untested, LCOV unsupported, caller owns coverage generation.

## Human-review gate
Possible outcomes: CONTINUE / CONTINUE WITH CONSTRAINTS / STOP
AWAITING HUMAN REVIEW
