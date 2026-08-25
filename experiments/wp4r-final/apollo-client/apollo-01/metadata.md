# Metadata for apollo-client/apollo-01

- Repository: apollo-client
- Case: apollo-01
- Base SHA: c34538e747f509d8da140e4128e25550f70b183b
- Target SHA: f6d0efac4d99375c67255aee6d9b2981753b6f55
- Subject: Fix cache.modify() mapping readonly arrays to singular reference (#12983)
- Coverage command: `node --expose-gc --experimental-import-meta-resolve --disable-warning=ExperimentalWarning ./node_modules/jest/bin/jest.js --config ./config/jest.config.ts --coverage --coverageReporters=json --coverageDirectory=/tmp/wp4r-repos/apollo-client/coverage --runInBand --watchAll=false --testPathPatterns="src/cache/core"`
- Artifact path: coverage/coverage-final.json
- Coverage generation exit: 1
- Prototype exit threshold 30: 1
- Prototype exit threshold 15: 1
- Threshold 30: analysisStatus=SUCCESS gate=PASS completeness=COMPLETE changed=0 PASS=0 WARN=0 NOT_EVALUATED=0 maxCRAP=None maxCC=None coverageAvail=0/0
- Threshold 15: analysisStatus=SUCCESS gate=PASS completeness=COMPLETE changed=0 PASS=0 WARN=0 NOT_EVALUATED=0 maxCRAP=None maxCC=None coverageAvail=0/0
- Classification (deterministic): Small (1 fn)
