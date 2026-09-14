# Cache Default-On Criteria

**Date**: 2026-09-13  
**Component**: Incremental Cache (Experiment C)  
**Decision**: ADR-0003  
**Status**: GATED — no flip without field data + human approval

## Context

Experiment C (Incremental Cache) introduces an opt-in cache controlled by `--cache` flag or `CHECKCHANGE_CACHE=1` env var (cli.ts:37, :142, :195-197). The cache is currently **default OFF**. This document defines the field-data criteria required before any decision to flip the default to ON.

**No src/ changes are made by this document.** The flip decision remains a manual, gated process.

## Metrics to Collect

| Metric | Definition | Collection Point |
|--------|------------|------------------|
| **Hit Rate %** | `(cache hits) / (cache hits + cache misses) × 100` across file-complexity + coverage entries | Per-run; aggregate over ≥50 runs per project |
| **Warm/Cold Latency Ratio** | `p50(warm run duration) / p50(cold run duration)` where warm = cache populated, cold = empty cache | Per-project; measure end-to-end `check --cache` latency |
| **Determinism Diff Bytes** | Byte difference between `--cache` and `--no-cache` EvidenceOutput JSON (canonicalized: keys sorted, no timing) | Per-run; aggregate over field sample |
| **Cache Size Growth** | Total cache directory size over time (entries + runs) | Continuous; alert if >400MB (80% of 500MB cap) |
| **Miss Reason Distribution** | Count of `absent` / `expired` / `corrupt` / `oversized` / `guard` per run | Per-run; identify systemic guard misses |

## Flip Thresholds (Proposed)

A default-ON flip requires **ALL** of the following to be satisfied across a representative field sample (≥5 projects, ≥10 runs each, mixed repo sizes):

| Criterion | Threshold | Rationale |
|-----------|-----------|-----------|
| Hit Rate | >80% (p50 across projects) | Below 80% means cold path dominates; cache adds overhead without benefit |
| Warm/Cold Latency Ratio (p50) | <0.8× (warm at least 20% faster) | Must demonstrate measurable speedup; <0.8× ensures clear user-visible gain |
| Determinism Diff | 0 bytes (exact match) over 100% of field sample | Any diff breaks EvidenceOutput contract determinism guarantee (docs/contracts/evidence-contract.md) |
| Cache Size | <400MB steady-state (80% of 500MB cap) | Prevents unbounded growth; LRU prune must be effective |
| Miss Reason | `guard` <1% of misses | High `guard` = containment/symlink issues; indicates environment fragility |

**These thresholds are proposals.** Final thresholds are set at flip time based on observed field data.

## Data Collection Method

1. **Instrumentation**: Add `--cache-stats` flag to `check` subcommand (new, additive) that emits a JSON sidecar with per-run metrics:
   ```json
   {
     "runId": "sha256-12chars",
     "hitRate": 0.87,
     "warmLatencyMs": 1240,
     "coldLatencyMs": 2100,
     "latencyRatio": 0.59,
     "determinismDiffBytes": 0,
     "cacheSizeBytes": 42000000,
     "missReasons": { "absent": 12, "expired": 3, "corrupt": 0, "oversized": 0, "guard": 0 }
   }
   ```
   This sidecar is **not** part of EvidenceOutput; it goes to stderr under `--verbose` or a dedicated `--cache-stats` file.

2. **Field Sample**: Operators opt-in by running with `--cache --cache-stats=stats.jsonl` over multiple repos/PRs. Data is local; no telemetry leaves the machine.

3. **Aggregation**: A separate analysis script (not in repo) reads `stats.jsonl` and computes per-project + cross-project p50/p95.

4. **Review Gate**: Flip proposal includes aggregated data + operator sign-off. No automated flip.

## Rollback Trigger

If **ANY** of the following occurs post-flip, immediate rollback to default-OFF:

| Trigger | Action |
|---------|--------|
| Determinism diff ≠ 0 on any run | Rollback; investigate cache key collision or provider version drift |
| Hit rate drops below 60% sustained over 10 runs | Rollback; cache ineffective, adds overhead |
| Cache size exceeds 500MB cap (prune failure) | Rollback; disk pressure risk |
| `guard` miss reason >5% of misses | Rollback; environment-specific containment issues |
| User reports incorrect analysis output with cache ON | Rollback; correctness regression |

Rollback = revert default to OFF, keep `--cache` flag functional. Document incident in this file's appendix.

## GATED Decision Process

```
Field data collected (stats.jsonl from ≥5 projects)
        ↓
Aggregation + threshold evaluation (manual, documented)
        ↓
Human approval: maintainer + one reviewer sign-off
        ↓
PR: flip cli.ts:195 default (cache=false → cache=true)
        ↓
Gate: tsc + test pass + manual smoke on 3 repos
        ↓
Merge → default ON
```

**At no point does this document cause a flip.** It only defines the criteria. The flip is a separate, explicit, human-gated decision with full rollback path.

## Appendix: Current State (2026-09-13)

- Cache default: **OFF** (cli.ts:195 `let cache = false`)
- Opt-in: `--cache` flag or `CHECKCHANGE_CACHE=1`
- Cache root: `.checkchange/cache` (repo-local) or `CHECKCHANGE_CACHE_DIR` absolute override
- TTL: 7 days (mtime-based)
- Size cap: 500MB total, 10MB per entry
- Providers registered: TS/JS complexity + coverage; Python coverage only
- Warnings buffer: `cache.ts` `cacheWarnings[]` drained under `--verbose` (cli.ts:204-206)

## Acceptance Criteria

- [x] File exists: docs/decisions/cache-default-on-criteria.md
- [x] Defines metrics (hit rate, warm/cold latency ratio, determinism diff, cache size, miss reasons)
- [x] Proposes flip thresholds (hit rate >80%, warm p50 <0.8x cold, diff=0)
- [x] Describes data collection method (--cache-stats sidecar, local opt-in)
- [x] Defines rollback triggers (determinism diff, hit rate drop, size cap, guard misses, correctness)
- [x] Explicitly states GATED: no flip without field data + human approval
- [x] No src/ changes; npx tsc --noEmit passes; npm test passes
