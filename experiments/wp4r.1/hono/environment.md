# WP4R.1 Hono — Environment

## Q1: Vitest version
4.1.11 (confirmed in RUN banner: `v4.1.11`)

## Q2: Coverage provider
`v8` — `@vitest/coverage-v8` ^4.1.7

## Q3: Configured reporters
`['json', 'text', 'html']` — set in vitest.config.ts coverage block

## Q4: Configured output directory
`./coverage/raw/default` — set via `reportsDirectory` in vitest.config.ts

## Q5: WP4R command
`npx vitest --run --coverage` from repo root (`/tmp/wp4r1-hono`)

## Q6: Completion
Exit code 0. 147 test files, 4934 tests passed, 44 skipped. Coverage generated successfully.

## Q7: Tests ran
Yes — 147 test files, 4934 tests across main + subprojects (workerd, fastly, node, lambda, lambda-edge, jsx-runtime-default, jsx-runtime-dom)

## Q8: Stdout/stderr
stdout: vitest RUN banner, test results, coverage table (text reporter). stderr: jsdom warnings ("options are not supported yet", "Could not load script", "Not implemented: window.alert") — all from test assertions, not coverage tooling.

## Q9: Files created
```
coverage/raw/default/coverage-final.json   (1,593,373 bytes, 159 files)
coverage/raw/default/index.html
coverage/raw/default/src/**/*.html
coverage/raw/default/build/**/*.html
```
With `--coverage.reportsDirectory=coverage`:
```
coverage/coverage-final.json   (1,593,373 bytes, same content)
coverage/index.html
coverage/src/**/*.html
coverage/build/**/*.html
coverage/base.css, block-navigation.js, favicon.png, prettify.css, prettify.js, sort-arrow-sprite.png, sorter.js
```
