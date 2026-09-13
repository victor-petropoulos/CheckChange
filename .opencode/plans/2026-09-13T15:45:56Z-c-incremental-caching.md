---
task: "Implement incremental caching for checkchange with perf baseline measurement"
created: "2026-09-13T15:45:56Z"
approved: true
tasks:
  - id: "1"
    description: "Measure cold baseline performance via checkchange trace on small repo (this), large fixture, and with/without coverage; record per-stage durationMs in docs/perf-baseline.md (one-off exception: tester may write ONLY docs/perf-baseline.md for this measurement artifact)"
    agent: "tester"
    files: ["docs/perf-baseline.md"]
    acceptance: "File exists with table showing cold runs (3x) for: total, git, complexity, coverage, attribution, crapCalc, rules, evidence, exec stages; includes repo size and fixture details"
    depends_on: []
  - id: "2"
    description: "Plumb engine commit identity and coverage artifact hash into evidence lineage as additive inputs"
    agent: "implementer"
    files: ["src/evidence.ts", "src/git.ts", "src/coverage.ts"]
    acceptance: "engineCommit appears in diagnostics.lineage[evidence].inputs.engine; coverageArtifactHash appears in diagnostics.lineage[coverage].inputs.coverageHash; both are strings; no regression in tsc/test"
    depends_on: ["1"]
  - id: "3"
    description: "Create src/cache.ts with deterministic key generation, lookup, write-through, guards (isWithinCwd, size limit, atomic tmp+rename, 0600 perms), eviction (TTL 7 days + max total size 500MB, LRU prune on write-through)"
    agent: "implementer"
    files: ["src/cache.ts"]
    acceptance: "Module exports getOrCompute, clear; key is SHA256 of deterministic object; guards reject out-of-cwd paths and oversized files; entries older than TTL treated as miss and pruned; total size capped with LRU prune on write; tsclean passes"
    depends_on: ["2"]
  - id: "4"
    description: "Wire cache behind --cache opt-in flag and CHECKCHANGE_CACHE=1 env; honor CHECKCHANGE_CACHE_DIR override (validated with same isWithinCwd + size guards, rejected when escaping allowed root); add .checkchange/ to .gitignore; order: git intervals -> cache lookup -> (hit? reuse: compute) -> attribution -> crap/rules -> write-through"
    agent: "implementer"
    files: ["src/cli.ts", ".gitignore"]
    acceptance: "--cache flag enables caching; default off; cache dir is .checkchange/cache/; CHECKCHANGE_CACHE_DIR override validated and rejected when escaping; .gitignore includes .checkchange/; cache hit skips complexity/coverage computation; tsc/test pass"
    depends_on: ["3"]
  - id: "5"
    description: "Test cache hit/miss, per-input invalidation (cwd, base, threshold, engine commit, coverage hash), determinism (cold vs cached byte-identical output), corrupt-cache fallback, security guards (symlink, oversized, malformed JSON)"
    agent: "tester"
    files: ["test/cache.spec.ts"]
    acceptance: "All tests pass; negative tests confirm miss on each input change; determinism test shows identical JSON excluding timing; eviction tests confirm expired entries miss and over-cap writes prune LRU; security tests reject unsafe inputs; no new test failures"
    depends_on: ["4"]
  - id: "6"
    description: "Regression gate: run tsc, test, build, pack; verify speedup >20% median on fixtures; confirm schema frozen (no EvidenceOutput field changes); ensure no engine/gate semantic change"
    agent: "tester"
    files: []
    acceptance: "tsc exit 0; test exit 0; build exit 0; pack exit 0; speedup measurement shows >=20% median reduction in total time; EvidenceOutput schema unchanged; gate PASS/WARN/UNSUPPORTED/FAILED identical cold vs cached"
    depends_on: ["5"]
  - id: "7"
    description: "Security audit: review cache module for path traversal, timing sidechannels, improper permissions; confirm no secrets logged"
    agent: "security-auditor"
    files: ["src/cache.ts"]
    acceptance: "No high/medium severity findings; all inputs validated via isWithinCwd; file size guard; tmp files cleaned; permissions 0600; no console.log of sensitive data"
    depends_on: ["6"]
---