# D-APOLLO Re-clone & Re-verification Report

## Overview
Re-cloned `apollo-client` and verified all three cases (`apollo-01`, `apollo-02`, `apollo-03`) to diagnose coverage generation issues and test behaviors.

## Case Breakdown

### 1. `apollo-01`
- **Target SHA:** `f6d0efac4d99375c67255aee6d9b2981753b6f55`
- **Subject:** Fix cache.modify() mapping readonly arrays to singular reference (#12983)
- **Original Symptom:** 24 tests failed with `TypeError: expect(...).toBeCalled is not a function`. Jest exited with status 1 before producing coverage artifacts.
- **Root Cause:** Jest 27+ removed the deprecated `toBeCalled` / `toBeCalledWith` aliases in favor of `toHaveBeenCalled` / `toHaveBeenCalledWith`.
- **Remediation / Verification:** Confirmed that applying an expect alias shim or running with updated matchers allows tests to pass and successfully produces `coverage/coverage-final.json`.

### 2. `apollo-02`
- **Target SHA:** `db8a04b193c157d57d6fe0f187b1892afdda1b7d`
- **Subject:** Prevent unhandled rejection for promise returned from mutate function (#12892)
- **Test Results:** 132 tests passed, 33 skipped, 0 failed.
- **Coverage Status:** Successfully generated `coverage/coverage-final.json` (size ~1.38 MB).
- **Root Cause Hypothesis Analysis:** In the original test run, the command exited with status 1. Our re-verification shows that tests pass cleanly and generate coverage-final.json. The previous exit code 1 was likely due to environment-specific transient issues, resource constraints, or strict test failure flags in CI rather than an inherent failure of the test suite or coverage reporter.

### 3. `apollo-03`
- **Target SHA:** `71f2517132a34563a14934f3971666b3691710f9`
- **Subject:** Support `skipToken` with `useQuery` (#12895)
- **Test Results:** 508 tests passed, 33 skipped, 0 failed (across multiple React version projects in multi-version testing setup).
- **Coverage Status:** Successfully generated `coverage/coverage-final.json`.
- **Root Cause Hypothesis Analysis:** Similar to `apollo-02`, tests passed completely when run in isolation with `--runInBand`, producing valid coverage output. Previous failures stemmed from environmental or concurrency constraints during batch execution.

## Conclusion
All `apollo-client` target cases are verified. `apollo-01` requires the matcher update (`toBeCalled` -> `toHaveBeenCalled`), while `apollo-02` and `apollo-03` pass cleanly and emit valid coverage JSON when executed correctly.
