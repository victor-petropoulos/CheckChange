# WP7 Human-Review Packet — Productionization

## 1. Contract frozen?
Yes. docs/contracts/evidence-contract.md schema 0.2 frozen (WP5.6 at 21daa57, F-03 additive). Version aligned package.json 0.2.0. Invariants INV-01..04 preserved (ZERO≠NULL, MISSING≠MALFORMED, GIT≠REPO, ANALYZER TRUTHFUL). Versioning semver patch additive, no breaking.

## 2. Packaging chosen?
CLI + library via npm. bin code-risk → ./dist/cli.js, prepare → npm run build, types declaration:true, src/index.ts barrel. Verify: npm pack --dry-run 4.2M tarball ok, npm ci builds, code-risk --help works. Rejected: container/service/DB/dashboard/multi-lang (no evidence, violates minimality).

## 3. Config?
Evidence stable, policy configurable: --crap-threshold, --coverage-file, --json, --verbose. Config never mutates evidence. Exit 0 PASS/SUCCESS or UNSUPPORTED null/NOT_APPLICABLE, exit 1 FAILED/WARN/git error. Truthful per evidence-contract.md.

## 4. Minimal proof still passes?
Yes. experiments/wp6/minimal-ci-proof/run-proof.sh → real change → coverage 696K → JSON schema 0.2 → gate PASS. Re-run ok, deterministic.

## 5. Security?
Path traversal fixed via path.relative boundary in src/coverage.ts:55-57, reverified. Git exec validated base only, no shell injection. Malicious coverage → FAILED malformed not crash. No secrets. Deps @barney-media/crap-typescript-core 0.5.0 pinned. Threat model per Roadmap WP7 satisfied for CLI/library scope.

## 6. Observability?
Diagnostics explain attempted/succeeded/failed/why/completeness, never contradict analysisStatus/gate. --verbose prints [verbose] analysisStatus/gate/completeness to stderr, JSON unchanged. CLI stderr for missing/malformed distinct per INV-02.

## 7. Performance?
Baseline in experiments/wp7/perf-baseline.md: small CLI 0.34s, small vitest 0.54s, medium full vitest 4.13s, large with coverage 4.96s. First baseline, not optimized. Scaling linear with test suite.

## 8. Release readiness?
Clean install (npm ci --dry-run), build (tsc), regression 149/149 pass, integration proof PASS, security review, docs, failure recovery (zero/null distinct, missing/malformed distinct), compatibility (patch additive). All checklist green.

## 9. Limitations?
TypeScript/JS only, Istanbul/v8 only, monorepo/LCOV untested, caller owns coverage generation, single-repo perf sample. Documented in evidence-contract.md Unsupported Conditions.

## 10. Would you CONTINUE / CONTINUE WITH CONSTRAINTS / STOP?
AWAITING HUMAN REVIEW

## Claims / Evidence Matrix (WP7)

| Claim | Evidence | Confidence | Limitation |
|-------|----------|------------|------------|
| Contract 0.2 stable | All 149 tests + CLI check produce schemaVersion 0.2, INV-01..04 verified | High | JSON only, no breaking |
| Package installable | npm pack dry-run 4.2M, prepare builds, bin works, types ok | High | Tested darwin/arm64 Node24 only |
| Config doesn't mutate evidence | --crap-threshold/--coverage-file/--json/--verbose keep evidence stable, exit codes per contract | High | Thresholds policy only |
| Security boundary holds | path.relative check in coverage.ts, no traversal, malformed handled | High | Untrusted artifact scope only |
| Observability truthful | analysisStatus/gate/completeness map to diagnostics, --verbose stderr | High | No structured log level |
| Perf baseline | small 0.34s/0.54s medium 4.13s large 4.96s 696K | Medium | Single machine sample |
| Usefulness still Low/Medium | WP5.6 11-case corpus unchanged, WP7 is packaging only | Low/Medium | Awaiting human via WP8 real-world validation |
AWAITING HUMAN REVIEW
