# WP0 Decision Summary

Decision: **GO WITH CONSTRAINTS**

WP0 established that:

- `@barney-media/crap-typescript@0.5.0` emits sufficient per-function JSON.
- Useful fields include method, source path, line range, CC, coverage, coverage kind, CRAP, and status.
- Coverage unavailability is explicit rather than silently represented as zero.
- `--changed` is file-granular and is not sufficient for function-level attribution.
- Full analyzer output plus Git zero-context hunk intersection is sufficient for modified/new/renamed-function correlation without AST parsing.
- Deleted functions require Git-side handling because they disappear from fresh analyzer output.
- The analyzer's default CRAP threshold is not adopted as product policy.

The project remains inside its intended boundary: small deterministic glue over existing analysis.
