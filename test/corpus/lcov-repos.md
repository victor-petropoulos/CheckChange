# LCOV Repositories for Corpus

This file documents repositories that use LCOV for coverage generation.

## Repository Information

These are synthetic on-the-fly fixtures, not cloned repos -- validated via test/lcov-provider.test.ts

### 1. LCOV Sample Fixture
- **Path**: test/fixtures/lcov-sample (synthetic fixture, generated on-the-fly via parseLcovContent unit tests)
- **Primary Language**: JavaScript
- **Package Manager**: npm
- **Test Framework**: Jest
- **Description**: A sample JavaScript project with LCOV coverage.

### 2. LCOV Sample Fixture 2
- **Path**: test/fixtures/lcov-ts-sample (synthetic fixture, generated on-the-fly via parseLcovContent unit tests)
- **Primary Language**: TypeScript
- **Package Manager**: npm
- **Test Framework**: Vitest
- **Description**: A sample TypeScript project with LCOV coverage.

### 3. Real Repository: example-lcov-repo
- **URL**: https://github.com/example/example-lcov-repo.git
- **Primary Language**: Python
- **Package Manager**: pip
- **Test Framework**: pytest
- **Description**: A real Python repository that uses coverage.py to generate LCOV.
- **Note**: This is a placeholder URL for documentation purposes. The actual LCOV fixtures are generated synthetically in unit tests.

## Pinned Commits for Verification

| Case | SHA | Subject | Coverage Status |
|------|-----|---------|-----------------|
| lcov-01 | SYNTHETIC | Fix bug in parser | ✅ Generates LCOV coverage (synthetic fixture) |
| lcov-02 | SYNTHETIC | Add feature X | ✅ Generates LCOV coverage (synthetic fixture) |
| lcov-03 | SYNTHETIC | Update dependencies | ✅ Generates LCOV coverage (synthetic fixture) |

## Verification Notes

### lcov-01
- **Coverage Artifact**: `coverage/lcov.info` (LCOV format)
- **Path Normalization**: Paths are relative to the project root.
- **Note**: This is a synthetic fixture generated on-the-fly in test/lcov-provider.test.ts, not a cloned repository.

### lcov-02
- **Coverage Artifact**: `coverage/lcov.info` (LCOV format)
- **Path Normalization**: Paths are relative to the project root.
- **Note**: This is a synthetic fixture generated on-the-fly in test/lcov-provider.test.ts, not a cloned repository.

### lcov-03
- **Coverage Artifact**: `coverage/lcov.info` (LCOV format)
- **Path Normalization**: Paths are relative to the project root.
- **Note**: This is a synthetic fixture generated on-the-fly in test/lcov-provider.test.ts, not a cloned repository.

## Usage with LCOV Corpus Script
The `scripts/run-lcov-corpus.sh` automates coverage and evidence generation for these commits:
```
# Generate coverage and evidence for lcov-01
./scripts/run-lcov-corpus.sh SYNTHETIC ./experiments/wp5/wp5.6/

# Generate coverage and evidence for lcov-02
./scripts/run-lcov-corpus.sh SYNTHETIC ./experiments/wp5/wp5.6/

# Generate coverage and evidence for lcov-03
./scripts/run-lcov-corpus.sh SYNTHETIC ./experiments/wp5/wp5.6/
```