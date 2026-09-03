# Tsdoc Rush Monorepo Case for Corpus

This file documents the tsdoc repository and specific commit used to verify the engine works with a Rush monorepo structure.

## Repository Information
- **URL**: https://github.com/microsoft/tsdoc.git
- **Primary Language**: TypeScript
- **Package Manager**: Rush (via @microsoft/rush)
- **Test Framework**: Jest (via Heft)
- **Description**: A tool for generating standardized TypeScript doc comments

## Pinned Commit for Verification

| Case | SHA | Subject | Coverage Status |
|------|-----|---------|-----------------|
| tsdoc-monorepo-01 | 98644d0192b82c5a5b0b48adadc48c4796456d85 | Update README.md to reflect latest changes | ✅ Generates coverage with Rush and Heft |

## Verification Notes
- **tsdoc-monorepo-01**: Represents a typical commit in the tsdoc monorepo.
- **Coverage Artifact**: Generated at `eslint-plugin/coverage/coverage-final.json` (Istanbul JSON format) when running `npx heft test --config ./eslint-plugin/config/jest.coverage.config.json` from the worktree.
- **Path Normalization**: Generated artifacts contain absolute paths requiring normalization for cross-environment replay.

## Usage with Monorepo Corpus Script
The `scripts/run-monorepo-corpus.sh` automates coverage and evidence generation for this commit:
```bash
# Generate coverage and evidence for tsdoc-monorepo-01
./scripts/run-monorepo-corpus.sh 98644d0192b82c5a5b0b48adadc48c4796456d85 ./experiments/wp5/wp5.6/
```

## Related Documentation
- Tsdoc Rush monorepo structure: https://github.com/microsoft/tsdoc/tree/main/rush.json
- Heft documentation: https://rushstack.io/pages/heft/