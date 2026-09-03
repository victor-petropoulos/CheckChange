# Work Packages

Each package answers one research question.

## WP0 — Evidence feasibility spike
Can existing TypeScript tools give us the minimum reliable facts without writing an analyzer?

Run `crap-typescript`, project tests/coverage, `tsc`, and ESLint against a controlled fixture. Inspect machine-readable outputs and document limitations. **No generalized architecture.**

## WP1 — Change correlation
Can analyzer output be associated reliably with changed code? Test modified, new, renamed, and deleted functions. Expose ambiguity.

## WP2 — Minimal evidence object
What is the smallest JSON representation needed to explain findings? Include tool/version/source and unavailable/failed states.

## WP3 — Three rules
Implement only test failure, changed high-CRAP function, and changed high-risk function with inadequate coverage.

## WP4 — CLI
One simple command: `checkchange check [--base <ref>] [--json] [--verbose]`. `--base` auto-detects fallback chain (origin/HEAD → origin/master/main → master/main). WARN gate blocks merge (exit 1). Human output + JSON option, sensible exit codes.

## WP5 — Reality check
Try a small set of ordinary TypeScript repos: npm, pnpm/yarn, Jest, Vitest, coverage present/absent, ESLint present/absent, perhaps a monorepo, and tool failures.

## WP6 — Decide
Stop and document; keep as personal utility; harden for casual public use; or expand one justified capability.
