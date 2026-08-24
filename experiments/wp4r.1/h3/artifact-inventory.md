# WP4R.1 h3 — Artifact Inventory

## Search Commands and Results

### Command 1: coverage directory existence
```
$ ls -la /tmp/wp4r1-h3/coverage 2>&1
ls: /tmp/wp4r1-h3/coverage: No such file or directory
```

### Command 2: coverage-named files/dirs (depth 4)
```
$ find /tmp/wp4r1-h3 -maxdepth 4 -name "coverage*" 2>&1
/tmp/wp4r1-h3/node_modules/@vitest/coverage-v8
```
Only the provider package itself — no output artifacts.

### Command 3: specific artifact filenames (depth 4)
```
$ find /tmp/wp4r1-h3 -maxdepth 4 \( -name "coverage-final.json" -o -name "coverage.json" -o -name "coverage-summary.json" -o -name "lcov.info" -o -name "lcov-report" -o -name "clover.xml" -o -name "cobertura*.xml" -o -name "*.lcov" \) 2>&1
# (empty — no matches)
```

### Command 4: all JSON files (depth 4, excluding node_modules)
```
$ find /tmp/wp4r1-h3 -maxdepth 4 -not -path "*/node_modules/*" -name "*.json" 2>&1
```
Only package.json files, tsconfig.json, typos.toml (not .json) — no coverage JSON.

## Results Summary

| Artifact | Found? | Path | Size | Format | Producer |
|----------|--------|------|------|--------|----------|
| coverage-final.json | NO | — | — | — | — |
| coverage.json | NO | — | — | — | — |
| coverage-summary.json | NO | — | — | — | — |
| lcov.info | NO | — | — | — | — |
| lcov-report/ | NO | — | — | — | — |
| clover.xml | NO | — | — | — | — |
| cobertura*.xml | NO | — | — | — | — |
| *.lcov | NO | — | — | — | — |

## Notes

- **Zero coverage artifacts produced** across all experiments (WP4R command, native test script, reporter override, explicit reportsDirectory, v8+clean=false).
- The v8 coverage provider (`@vitest/coverage-v8` 4.1.11) in this repo produces **no output files** despite coverage being enabled.
- The RUN banner prints "Coverage enabled with v8" but no file paths, no directory creation, no errors — completely silent.
- `--coverage.reporter=json` CLI flag is accepted without error but produces no output (unlike the ENOENT crash seen in earlier attempts; vitest v4.1.11 may have changed behavior to silently ignore reporters with v8).
- The only coverage-related path on disk is `node_modules/@vitest/coverage-v8` (the provider package itself).
- v8 provider uses V8's internal coverage format and does **not** produce Istanbul JSON (`coverage-final.json`). The `json` reporter is designed for Istanbul-compatible output, which requires `@vitest/coverage-istanbul` provider.
- h3 does **not** have `@vitest/coverage-istanbul` installed (confirmed in package.json devDependencies — only `@vitest/coverage-v8` present).

## Conclusion

No usable coverage artifact exists for h3 in any experiment. The v8 provider is silent. To produce Istanbul JSON, h3 would need `@vitest/coverage-istanbul` installed as a devDependency — a target dependency change.
