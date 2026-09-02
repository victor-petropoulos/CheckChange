# Hardening B Perf/Sec (P1-5) — 2026-09-02

Measurements for real-repo coverage handling.

## Artifact sizes
- p-queue: 149,000 bytes (152219 earlier, now 149K), 3 entries, /tmp/p-queue/coverage/coverage-final.json
- zustand: 94,000 bytes (95950), 16 entries, /tmp/zustand/coverage/coverage-final.json
- next-sample: 1,400 bytes (1.4K), 2 entries, experiments/wp15-js/fixtures/next-sample/coverage/coverage-final.json (generated via vitest --coverage)

## Wall-clock / RSS (via `time` + CLI check)
- p-queue: 0.79s real, RSS 257 MB, analysisStatus SUCCESS, gate PASS
- zustand: 0.75s real, RSS 253 MB, SUCCESS PASS
- next-sample: 0.74s real, RSS 251 MB, SUCCESS PASS (synthetic null coverage also 0.74s)

Scale: artifact 94K-149K handled in <1s, memory <260 MB for changed 1-3 funcs. No scaling issue for tested sizes. Large monorepo (1M+ coverage) not measured — provisional.

## Security
- Malformed coverage JSON → coverageCapability failed, coverageErrorReason malformed, analysisStatus FAILED, gate null, completeness INCOMPLETE — verified via jsFault, nextFault, wp11 contract 4/4
- Missing coverage → missing, FAILED — same
- Path traversal: coverage keys are absolute paths, normalized via coverage.ts normalizeCoveragePaths (longest suffix under cwd), no traversal outside cwd, attribution declines ambiguous
- Malicious coverage artifact: large JSON (277K in wp9) handled, no exec, just JSON parse

No new code for sec, existing fault suite covers.
