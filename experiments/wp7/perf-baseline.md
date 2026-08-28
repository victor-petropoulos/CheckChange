# WP7 Performance Baseline

| Scenario | wall-clock | memory approx | coverage file size | changed functions | notes |
|----------|------------|---------------|--------------------|-------------------|-------|
| Small (vitest basic.test.ts) | 0.54s | N/A | N/A | N/A | Single test file |
| Small (cli check --base HEAD~1 --json) | 0.34s | N/A | N/A | N/A | CLI check for changes |
| Medium (vitest run --no-coverage) | 4.13s | N/A | N/A | N/A | Full test suite without coverage |
| Large (vitest run --coverage) | 4.96s | N/A | 696K | 4 | Full test suite with coverage; changed functions from CLI check |

## Verification
- Build: `npm run build` succeeded
- Pack: `npm pack --dry-run` succeeded (no publish)
- Test suite: `npx vitest run --no-coverage` passes 149 tests
