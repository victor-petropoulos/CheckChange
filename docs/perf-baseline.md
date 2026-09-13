# Performance Baseline — Cold Run Measurements

> **Date:** 2026-09-13
> **Engine commit:** `be5e725821c135e65e555099e95c7d610ab50f06`
> **Node version:** v24.18.1
> **Platform:** macOS (darwin), Apple Silicon
> **Method:** `node dist/cli.js trace --json` (emits `spans[{stage,durationMs}]`), `time` for wall clock
> **Memory ref:** mem:44542 (10-improvement candidate #5: Repository→Changed functions→changed→analyze / unchanged→reuse)

---

## Fixture: A — This repo (small)

| Attribute | Value |
|-----------|-------|
| **Repo** | `code-risk-prototype-v0.3-opencode` (commit `be5e725`) |
| **TS files (tracked)** | 51 |
| **Changed files** | 30 (vs `origin/main` @ `8185c30`) |
| **Coverage artifact** | None (coverage stage skipped) |

### Run A1 — cold, no coverage

| Stage | durationMs |
|-------|-----------|
| git | 42 |
| complexity | 139 |
| coverage | 0 (skipped) |
| attribution | 0 |
| crapCalc | 0 |
| rules | 0 |
| evidence | 1 |
| **span total** | **182** |
| **wall time** | **0.398s** |

### Run A2 — cold, no coverage

| Stage | durationMs |
|-------|-----------|
| git | 51 |
| complexity | 144 |
| coverage | 1 (skipped) |
| attribution | 0 |
| crapCalc | 0 |
| rules | 0 |
| evidence | 2 |
| **span total** | **198** |
| **wall time** | **0.428s** |

### Run A3 — cold, no coverage

| Stage | durationMs |
|-------|-----------|
| git | 37 |
| complexity | 135 |
| coverage | 1 (skipped) |
| attribution | 0 |
| crapCalc | 0 |
| rules | 0 |
| evidence | 2 |
| **span total** | **175** |
| **wall time** | **0.375s** |

### Median — Fixture A (no coverage)

| Stage | median (ms) | % of span total |
|-------|-------------|----------------|
| git | 42 | 24% |
| complexity | 139 | 77% |
| coverage | 1 | <1% |
| attribution | 0 | 0% |
| crapCalc | 0 | 0% |
| rules | 0 | 0% |
| evidence | 2 | 1% |
| **span total** | **182** | — |
| **wall time** | **0.400s** | — |

---

## Fixture: B — This repo (small) + coverage file

| Attribute | Value |
|-----------|-------|
| **Repo** | same as Fixture A |
| **Coverage artifact** | `experiments/wp0/fixture/coverage/coverage-final.json` (5 KB, Istanbul format, paths not matching repo src/) |

### Run B1 — cold, with coverage

| Stage | durationMs |
|-------|-----------|
| git | 35 |
| complexity | 128 |
| coverage | 2 |
| attribution | 1 |
| crapCalc | 0 |
| rules | 0 |
| evidence | 1 |
| **span total** | **167** |
| **wall time** | **0.374s** |

### Run B2 — cold, with coverage

| Stage | durationMs |
|-------|-----------|
| git | 38 |
| complexity | 133 |
| coverage | 1 |
| attribution | 1 |
| crapCalc | 0 |
| rules | 0 |
| evidence | 2 |
| **span total** | **175** |
| **wall time** | **0.378s** |

### Run B3 — cold, with coverage

| Stage | durationMs |
|-------|-----------|
| git | 36 |
| complexity | 130 |
| coverage | 1 |
| attribution | 1 |
| crapCalc | 0 |
| rules | 0 |
| evidence | 1 |
| **span total** | **169** |
| **wall time** | **0.377s** |

### Median — Fixture B (with coverage)

| Stage | median (ms) | % of span total |
|-------|-------------|----------------|
| git | 36 | 21% |
| complexity | 130 | 76% |
| coverage | 1 | <1% |
| attribution | 1 | <1% |
| crapCalc | 0 | 0% |
| rules | 0 | 0% |
| evidence | 1 | 1% |
| **span total** | **169** | — |
| **wall time** | **0.377s** | — |

**Note:** Coverage file was 5 KB with paths not matching repo src — coverage overhead negligible. Real-world coverage (multi-MB, matching paths) would add 50–200ms depending on artifact size.

---

## Fixture: C — Engram repo (largest available real target)

| Attribute | Value |
|-----------|-------|
| **Repo** | `engram` (commit `49719a5`) at `/Users/victorpetropoulos/Cursor Projects/engram` |
| **TS/JS files (tracked)** | 248 |
| **Changed files** | 52 (vs `main` @ `b2c61cf`) |
| **Coverage artifact** | None provided; coverage stage runs auto-detection (~14ms) |

### Run C1 — cold, no coverage file

| Stage | durationMs |
|-------|-----------|
| git | 64 |
| complexity | 165 |
| coverage | 14 |
| attribution | 27 |
| crapCalc | 0 |
| rules | 0 |
| evidence | 1 |
| **span total** | **271** |
| **wall time** | **0.457s** |

### Run C2 — cold, no coverage file

| Stage | durationMs |
|-------|-----------|
| git | 57 |
| complexity | 159 |
| coverage | 14 |
| attribution | 26 |
| crapCalc | 0 |
| rules | 0 |
| evidence | 1 |
| **span total** | **257** |
| **wall time** | **0.451s** |

### Run C3 — cold, no coverage file

| Stage | durationMs |
|-------|-----------|
| git | 68 |
| complexity | 157 |
| coverage | 14 |
| attribution | 26 |
| crapCalc | 0 |
| rules | 0 |
| evidence | 1 |
| **span total** | **266** |
| **wall time** | **0.460s** |

### Median — Fixture C (Engram)

| Stage | median (ms) | % of span total |
|-------|-------------|----------------|
| git | 64 | 24% |
| complexity | 159 | 59% |
| coverage | 14 | 5% |
| attribution | 26 | 10% |
| crapCalc | 0 | 0% |
| rules | 0 | 0% |
| evidence | 1 | <1% |
| **span total** | **266** | — |
| **wall time** | **0.456s** | — |

**Note:** Engram coverage stage runs auto-detection (no file provided) — 14ms overhead from disk probes. Attribution 26ms is non-negligible on larger codebase with more changed functions.

---

## Cross-fixture summary

| Fixture | TS files | Changed files | Coverage | median span total | median wall time |
|---------|----------|---------------|----------|-------------------|-----------------|
| A (this repo) | 51 | 30 | none | 182 ms | 0.400s |
| B (this repo + cov) | 51 | 30 | 5 KB | 169 ms | 0.377s |
| C (engram) | 248 | 52 | auto-detect | 266 ms | 0.456s |

---

## Stage dominance analysis

**Complexity dominates** across all fixtures: 59–77% of total span time.

| Stage | Median (A) | Median (B) | Median (C) | Notes |
|-------|-----------|-----------|-----------|-------|
| **complexity** | 139 ms (77%) | 130 ms (77%) | 159 ms (59%) | Full-scan: `findAllTypeScriptFilesUnderSourceRoots` + `getGitTrackedCodeFiles` + `parseFileMethods` per file. **Primary cache target.** |
| **git** | 42 ms (24%) | 36 ms (21%) | 64 ms (24%) | 3–4 `execFile` calls (rev-parse, diff) + interval parsing. Cheap, must re-run. |
| **attribution** | 0 ms (<1%) | 1 ms (<1%) | 26 ms (10%) | `attachCoverage` suffix match + fnMap iteration. Scales with changed fns. |
| **coverage** | 0 ms (skip) | 1 ms (<1%) | 14 ms (5%) | Auto-detect probes in Engram (14ms); actual conversion is 1–2ms for 5KB artifact. Multi-MB artifacts likely 50–200ms. **Secondary cache target.** |
| **crapCalc/rules/evidence** | 0–2 ms (<1%) | 0–2 ms (<1%) | 0–1 ms (<1%) | Negligible — threshold comparison, no IO. |

**One-line summary:** Complexity full-scan dominates at ~70% of total time; git is distant second at ~24%. Attribution scales with changed-function count (10% at 52 changed files). Coverage is negligible with small artifacts but auto-detection probes add 14ms.

---

## Implications for P10 incremental caching (mem:44542)

1. **Complexity is the primary cache target** — at 130–159ms and 59–77% of total, caching per-file complexity results would deliver the largest speedup. Even on this 51-file repo, it's the bottleneck.

2. **Coverage is secondary** — the 5 KB test artifact adds <2ms. Real-world coverage (multi-MB) will add 50–200ms. Cache when coverage artifact is present and stable.

3. **Attribution scales with changed-function count** — 0ms at 30 changed files (A), 26ms at 52 changed files (C). Not worth standalone cache; benefits trivially from upstream complexity cache.

4. **Git must re-run always** — cheap (37–68ms) and input-dependent (base ref may move). No cache value.

5. **Wall time includes ~0.2–0.25s Node.js startup** — cold-start overhead is constant and non-cacheable. Real speedup target is span time, not wall time.

6. **>20% median speedup target** — achievable by caching complexity alone (130–159ms → near-zero on cache hit). Coverage cache adds marginal benefit for small artifacts but significant for multi-MB real-world coverage.

---

## Commands run

```bash
# Fixture A (this repo, no coverage, 3x cold)
cd "/Users/victorpetropoulos/Cursor Projects/code-risk-prototype-v0.3-opencode"
rm -rf .checkchange && time node dist/cli.js trace --json 2>/dev/null  # A1
rm -rf .checkchange && time node dist/cli.js trace --json 2>/dev/null  # A2
rm -rf .checkchange && time node dist/cli.js trace --json 2>/dev/null  # A3

# Fixture B (this repo, with coverage, 3x cold)
rm -rf .checkchange && time node dist/cli.js trace --json --coverage-file experiments/wp0/fixture/coverage/coverage-final.json 2>/dev/null  # B1
rm -rf .checkchange && time node dist/cli.js trace --json --coverage-file experiments/wp0/fixture/coverage/coverage-final.json 2>/dev/null  # B2
rm -rf .checkchange && time node dist/cli.js trace --json --coverage-file experiments/wp0/fixture/coverage/coverage-final.json 2>/dev/null  # B3

# Fixture C (engram, no coverage file, 3x cold)
cd "/Users/victorpetropoulos/Cursor Projects/engram"
rm -rf .checkchange && time node "/Users/victorpetropoulos/Cursor Projects/code-risk-prototype-v0.3-opencode/dist/cli.js" trace --base main --json 2>/dev/null  # C1
rm -rf .checkchange && time node "/Users/victorpetropoulos/Cursor Projects/code-risk-prototype-v0.3-opencode/dist/cli.js" trace --base main --json 2>/dev/null  # C2
rm -rf .checkchange && time node "/Users/victorpetropoulos/Cursor Projects/code-risk-prototype-v0.3-opencode/dist/cli.js" trace --base main --json 2>/dev/null  # C3
```

## Fixture notes

- **No ≥1k-file repo available** — Engram (248 TS/JS files) is the largest real target on this machine. Other repos checked: ApplyMate (0 TS), Code-Index-MCP (0 TS), RAG (0 TS), OICP-MCP (0 TS).
- Coverage fixture (`experiments/wp0/fixture/coverage/coverage-final.json`, 5 KB) has paths not matching repo src — coverage stage reports "ok" but attribution finds no matches. Real multi-MB coverage artifact would show larger coverage-stage cost.
- Engram coverage stage runs auto-detection (14ms) even without `--coverage-file` — probes disk for `.checkchange-coverage-temp-*` files.
