# WP4R.1a Execution Playbook

1. Freeze prototype production code.
2. Use the same h3 revision/environment as WP4R.1.
3. Reproduce the original failed-suite/no-artifact behavior.
4. Repeat with JSON coverage plus `coverage.reportOnFailure`.
5. Run fully explicit v8/JSON/reportsDirectory/reportOnFailure coverage.
6. Run a passing existing h3 test subset with identical v8 JSON settings.
7. Inventory and validate generated artifacts.
8. Determine compatibility with the current Istanbul data model.
9. Write `docs/research/WP4R.1a_V8_REPORTER_RESOLUTION_RESULTS.md`.
10. End with exactly one authorized decision and stop.

No installs. No config/source/test edits. No prototype implementation.
