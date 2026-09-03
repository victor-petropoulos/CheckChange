# Apollo-client Repositories for D-APOLLO Issue

This file documents the apollo-client repositories and specific commits used to reproduce and verify the D-APOLLO coverage generation issue.

## Repository Information
- **URL**: https://github.com/apollographql/apollo-client
- **Primary Language**: TypeScript
- **Package Manager**: npm
- **Test Framework**: Jest
- **Description**: A comprehensive GraphQL client for TypeScript & JavaScript

## Pinned Commits for D-APOLLO Verification

| Case | SHA | Subject | Jest Version Issue | Coverage Status with Jest 26 |
|------|-----|---------|-------------------|------------------------------|
| apollo-01 | f6d0efac4d99375c67255aee6d9b2981753b6f55 | Fix cache.modify() mapping readonly arrays to singular reference (#12983) | toBeCalled alias removed in Jest 27+ | ✅ Generates coverage with Jest 26 shim |
| apollo-02 | db8a04b193c157d57d6fe0f187b1892afdda1b7d | Prevent unhandled rejection for promise returned from mutate function (#12892) | None (environmental issue) | ✅ Generates coverage with Jest 26 |
| apollo-03 | 71f2517132a34563a14934f3971666b3691710f9 | Support `skipToken` with `useQuery` (#12895) | None (environmental issue) | ✅ Generates coverage with Jest 26 |

## Verification Notes
- **apollo-01**: Requires Jest 26 to maintain `toBeCalled` alias (removed in Jest 27+)
- **apollo-02/03**: Work correctly with Jest 26 when environmental factors are controlled
- **Coverage Artifact**: `coverage/coverage-final.json` (Istanbul format)
- **Path Normalization**: Generated artifacts contain absolute paths requiring normalization for cross-environment replay

## Usage with Shim Script
The `scripts/apollo-jest26-shim.sh` automates coverage generation for these commits:
```bash
# Generate coverage for apollo-01
./scripts/apollo-jest26-shim.sh f6d0efac4d99375c67255aee6d9b2981753b6f55 ./experiments/wp5/wp5.6/

# Generate coverage for apollo-02  
./scripts/apollo-jest26-shim.sh db8a04b193c157d57d6fe0f187b1892afdda1b7d ./experiments/wp5/wp5.6/

# Generate coverage for apollo-03
./scripts/apollo-jest26-shim.sh 71f2517132a34563a14934f3971666b3691710f9 ./experiments/wp5/wp5.6/
```

## Related Documentation
- Root cause analysis: `experiments/wp5/wp5.6/known-defects-rootcause.md` (D-APOLLO section)
- Re-verification report: `experiments/wp5/wp5.6/d-apollo-reverification.md`
- WP5.6 closure documents: `experiments/wp5/wp5.6/WP5_6_CLOSURE.md`, `WP5_6_REMEDIATION_CLOSURE.md`