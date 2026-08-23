# Deterministic Code-Risk Prototype v0.2

**Status:** research/prototype planning. No production implementation yet.

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
