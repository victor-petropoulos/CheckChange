# WP4R.1 Decision Summary

## Decision
**EXPLICIT ISTANBUL PATH STRONGLY SUPPORTED — ONE CONTRADICTION REMAINS**

WP4R.1 proved Hono's `@vitest/coverage-v8` 4.1.11 emits valid Istanbul JSON, but h3's identical provider emitted no artifact. Before implementing `--coverage-file`, resolve whether h3's behavior is caused by reporter configuration or failed-test suppression.

Current Vitest documentation states that v8 supports the JSON coverage reporter, JSON is among the default coverage reporters, and `coverage.reportOnFailure` defaults to false. h3's normal coverage run had one failed test, making report-on-failure behavior a material unresolved variable.

## Next
Run WP4R.1a. No production changes.
