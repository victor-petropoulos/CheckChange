# WP4R.1 h3 — Environment

## Q1: Vitest version
4.1.11 (confirmed in RUN banner: `v4.1.11`)

## Q2: Coverage provider
`v8` — `@vitest/coverage-v8` ^4.1.11 (devDependency in package.json)

## Q3: Configured reporters
Not configured. vitest.config.mjs coverage block has no `reporter` or `reportsDirectory` field. Vitest v4 defaults apply (`["text", "html", "clover", "json"]`), but no output files are produced.

## Q4: Configured output directory
Not configured. vitest.config.mjs coverage block contains only `include` and `exclude`:
```js
coverage: {
  include: ["src/**/*.ts"],
  exclude: ["src/types/**", "src/_deprecated.ts", "src/_entries/**"],
}
```
No `provider`, `reporter`, or `reportsDirectory` specified.

## Q5: WP4R command
`npx vitest --run --coverage` from `/tmp/wp4r1-h3` (repo root)

## Q6: Completion
Exit code 1. One test failure in `test/utils.test.ts` (`getRequestFingerprint` — expected `::ffff:127.0.0.1` to match `/^0\.0\.0\.0|::1$/`). Tests ran to completion despite failure.

## Q7: Tests ran
Yes — 2732 tests across 73 test files. 1 failure in `test/utils.test.ts` (node target, `getRequestFingerprint`). All other tests passed.

## Q8: Stdout/stderr
stdout: vitest RUN banner (`v4.1.11`), "Coverage enabled with v8" (partial, color-coded), test summary (2732 tests, 1 failed), duration ~3s. stderr: undici PATCH warnings, h3 CORS rule warnings, one assertion failure in test/utils.test.ts — no coverage file paths or errors reported.

## Q9: Files created
NONE. filesystem-before.txt and filesystem-after-wp4r-command.txt are identical (same file list, no new entries). No `coverage/` directory created.

Reporter-override experiment (`npx vitest --run --coverage --coverage.reporter=json`):
- Exit code 0 (no test failures with this invocation)
- No `coverage/` directory created
- filesystem-after-reporter-override.txt shows same file list as before — no new files
- v8 provider silently accepts `--coverage.reporter=json` but produces no output
