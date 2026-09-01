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

**Current state (2026-09-01):** WP12 CI Integration Validation complete + Fix + Hardening (doc-only, no src change, schema 0.2 frozen, 191/191 pass).

- Tests: 191/191 pass (61 files)
- Typecheck: `npx tsc --noEmit` → 0 errors
- Build: `npm run build` → ok, `dist/cli.js` 6K
- WP12 contract: schema 0.2 frozen, thresholds 30/15 frozen, INV-01..04 preserved
- WP12 Fix 8885796: attribution case-insensitive suffix match (src/attribution.ts:62)
- WP12 Hardening e354048: vitest.config.ts guard + case-insensitive regression anchor
- Evidence contract: `docs/contracts/evidence-contract.md`
- Human review packet: `docs/closure/WP12_HUMAN_REVIEW_PACKET.md` (APPROVED 2026-09-01)