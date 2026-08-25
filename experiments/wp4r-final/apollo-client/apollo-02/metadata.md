# Metadata for apollo-client/apollo-02

- Repository: apollo-client
- Case: apollo-02
- Base SHA: 4d3fb77421a7394028b788c1bf64e522155eeda6
- Target SHA: db8a04b193c157d57d6fe0f187b1892afdda1b7d
- Subject: Prevent unhandled rejection for promise returned from mutate function (#12892)
- Coverage command: `node --expose-gc --experimental-import-meta-resolve --disable-warning=ExperimentalWarning ./node_modules/jest/bin/jest.js --config ./config/jest.config.ts --coverage --coverageReporters=json --coverageDirectory=/tmp/wp4r-repos/apollo-client/coverage --runInBand --watchAll=false --testPathPatterns="src/react/hooks/__tests__/useMutation"`
- Artifact path: coverage/coverage-final.json
- Coverage generation exit: 1
- Prototype exit threshold 30: 1
- Prototype exit threshold 15: 1
- Threshold 30: analysisStatus=SUCCESS gate=PASS completeness=INCOMPLETE changed=1 PASS=0 WARN=0 NOT_EVALUATED=1 maxCRAP=None maxCC=None coverageAvail=0/1
- Threshold 15: analysisStatus=SUCCESS gate=PASS completeness=INCOMPLETE changed=1 PASS=0 WARN=0 NOT_EVALUATED=1 maxCRAP=None maxCC=None coverageAvail=0/1
- Classification (deterministic): Moderate (2-3 fn)
