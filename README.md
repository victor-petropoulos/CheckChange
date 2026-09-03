# CheckChange
Independent, deterministic evidence for AI-assisted software development.
AI writes. We check the change.

CheckChange provides deterministic evidence around code changes: it analyzes changed functions, their complexity, test coverage, deterministic CRAP scores, evidence completeness and status, and provenance of the evidence.

## Direction

> **This project consumes analysis. It does not perform analysis.**

This is a completely separate project from Engram. Established tools already know how to measure tests, coverage, complexity, CRAP, lint, type errors, security findings, duplication, and similar signals. This project should not recreate them.

Its deliberately small job is to discover or invoke a few supported existing tools, consume their deterministic outputs, correlate facts about the current code change, apply a few deterministic rules, and report PASS / WARN / FAIL.

## Prototype hypothesis

Can a small, free, local-first glue layer over existing developer tools produce a more useful deterministic assessment of a code change than any one tool provides by itself?

If not, stop.

## v0 scope

TypeScript/JavaScript only.

Initial sources:
- Git
- `crap-typescript`
- existing project test/coverage tooling
- `tsc` when configured
- ESLint when configured

Initial rules:
1. Tests fail.
2. A changed function has high CRAP.
3. A changed high-risk function has inadequate coverage.

## Non-goals

No custom analysis engine, AST quality analysis, coverage instrumentation, security scanner, plugin framework, multi-language framework, dashboard, SaaS, LLM, MCP, IDE extension, or Engram integration.

The project is primarily a research and learning project. It only needs to be useful, understandable, free to run, and clean enough that another developer could use it if desired.

Additionally, CheckChange does NOT claim to prove correctness, predict defects, replace human review, or certify production readiness. CRAP is one signal, not the entire product.

Because "trust me, I tested it" isn't evidence.

## Status

**Current state (2026-09-03):** v3.1 full close pre-Angular COMPLETE (schema 0.4, 233/233 pass 72 files, LCOV+Python, CI both SUCCESS).

- Tests: 233/233 pass (72 files)
- Typecheck: `npx tsc --noEmit` → 0 errors
- Build: `npm run build` → ok, `dist/cli.js` 6K
- WP9/WP11/WP13/WP15 contract: schema 0.4, thresholds 30/15 frozen, INV-01..04 preserved, explicit language + framework fields
- WP12 Fix 8885796: attribution case-insensitive suffix match (src/attribution.ts:62)
- WP12 Hardening e354048: vitest.config.ts guard + case-insensitive regression anchor
- WP13 deliverables: `src/complexity-providers.ts` (language registry), `experiments/wp13/adapter/` (Python adapters, shell:true fixed), e2e schema 0.4 PASS
- WP15 deliverables: `experiments/wp15-js/` (JS/React dispatcher, framework detection, nextDispatcher 5/5), `experiments/wp9-r8/` (LCOV provider, historical fixtures p-queue/zustand/next-sample)
- Evidence contract: `docs/contracts/evidence-contract.md` (schema 0.4, Security Addendum 2026-09-03 CLOSED — 5 High/Medium fixes)
- Hardening B perf: LCOV synthetic E2E 0.78s/255 MB SUCCESS PASS, Istanbul synthetic 0.81s/260 MB SUCCESS PASS
- Human review packet: `docs/closure/WP12_HUMAN_REVIEW_PACKET.md` (APPROVED 2026-09-01), Engram rev-1788397101053-2 approved
- Corpus: 17 fixtures (WP15 corpus expansion)
- Tag: v0.3.0-compatible (schema 0.3), schema 0.4 unreleased

## Next

Angular integration awaiting spec (Hardening B human review 2026-09-02 authorized fork).