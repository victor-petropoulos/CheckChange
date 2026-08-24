# WP4 Usefulness Validation Results

## Repository Selection and Rationale

Selected before any tool runs per experiments/wp4/repository-selection.md:

| Repository | URL | License | Primary Language | Package Manager | Test Framework | Rationale |
|------------|-----|---------|------------------|-----------------|----------------|-----------|
| sindresorhus/p-limit | https://github.com/sindresorhus/p-limit | MIT | TypeScript (declarations) / JS source | npm | Ava | Small utility, ~200 lines, focused promise concurrency. Represents small library. |
| colinhacks/zod | https://github.com/colinhacks/zod | MIT | TypeScript | pnpm (npm compatible) | Vitest | Medium schema validation, ~5k lines, complex types. Represents medium library with non-trivial functions. |
| pmndrs/zustand | https://github.com/pmndrs/zustand | MIT | TypeScript | npm | Vitest | State management, ~1.5k lines, different structure from zod. |

Diversity: small JS/TS hybrid, medium validation, medium state management. Not cherry-picked for high CRAP. Selection done 2026-08-24 before observing outputs.

## Exact Pinned Revisions

| Repo | Case | Base | Target | Changed TS files | Rationale |
|------|------|------|--------|------------------|-----------|
| p-limit | case-01 | 9f52583119f0cb0d85c6fec600c94a21fd89d060 | 42599eb Fix typo | - | Small typo fix (JS/TS) |
| p-limit | case-02 | ce9d71cf1391edf2897cbb9e00b8bc4f091df8b1 | 8907801 Add rejectOnClear | index.d.ts, index.js | Moderate: new option |
| p-limit | case-03 | 9da5934aaf15c22fceca470ad28ed5720b3c7340 | d76231b Make .map() accept iterable | index.d.ts, index.js | Non-trivial: iterable support |
| zod | case-01 | 937b5d01a143c36bb53591fffb29c44412ac9fef | 6574e78 fix catch resurrecting | - | Small: catch fix |
| zod | case-02 | 28e1ebd89d26147bacb164af988da6ed6de738d4 | 6c77d02 compact anyOf unions | - | Moderate: type array compaction |
| zod | case-03 | 49507f34f05109e3e5fa8585eaf5d40d3ee681d4 | 555e5f4 Add z.toZod helper | packages/zod/src/v4/classic/external.ts, core/index.ts, etc. | Non-trivial: new helper across APIs |
| zustand | case-01 | 6213fc11bdf096301a82ae5c236b5a666a4ee3ca | 5561e9bc2555b6e98ac2c6292219f3f9cd7e9bcc | src/middleware/persist.ts | Small: persist fix |
| zustand | case-02 | 1f531ba45f7494f3fcd1de002c44fe55f786172b | 3febf8c6d4f6670f886cc6b628b01a128d2888bd | src/middleware/devtools.ts, immer.ts | Moderate: persist concurrent fix |
| zustand | case-03 | f44cecc72a8ec39fbd270fc29e2058806932bf2a | ad77bd3bb6f7bbd12fea8b458ed5c0673df0793a | src/middleware/devtools.ts | Non-trivial: type inference improvement |

All SHAs pinned before execution, reproduced via `git checkout <target>` and `tool check --base <base> --json`.

## Case-Selection Methodology

Per WP4 spec: 1 small, 1 moderate, 1 non-trivial per repo, preferring real historical commits, not synthetic mutations, without altering change to provoke warnings.

## Execution Success/Failure Table

Threshold 30 results (threshold 15 identical for WARN counts):

| Repo | Case | Capabilities | Changed Functions | PASS | WARN | NOT_EVALUATED | Gate | Completeness | Errors |
|------|------|--------------|-------------------|------|------|---------------|------|--------------|--------|
| p-limit | 01 | available | 0 | 0 | 0 | 0 | PASS | COMPLETE | JS source, no TS functions in diff |
| p-limit | 02 | available | 0 | 0 | 0 | 0 | PASS | COMPLETE | JS source |
| p-limit | 03 | available | 0 | 0 | 0 | 0 | PASS | COMPLETE | JS source |
| zod | 01 | failed | 0 | 0 | 0 | 0 | PASS | COMPLETE | Coverage command failed (pnpm vitest --coverage) |
| zod | 02 | failed | 0 | 0 | 0 | 0 | PASS | COMPLETE | Coverage command failed |
| zod | 03 | failed | 0 | 0 | 0 | 0 | PASS | COMPLETE | Coverage command failed |
| zustand | 01 | failed | 0 | 0 | 0 | 0 | PASS | COMPLETE | Coverage command failed (npm vitest) |
| zustand | 02 | failed | 0 | 0 | 0 | 0 | PASS | COMPLETE | Coverage command failed |
| zustand | 03 | failed | 0 | 0 | 0 | 0 | PASS | COMPLETE | Coverage command failed |

Raw JSON preserved in experiments/wp4/<repo>/case-*/output-threshold-{30,15}.json (18 runs). Runtime per case ~0.5-2s after deps installed. Setup friction: p-limit required `npm install @barney-media/crap-typescript@0.5.0` to become available; zod required `pnpm add -D` (workspace protocol); zustand required npm install; all required correct cwd for --base resolution.

Threshold 15 runs produced identical 0 WARNs.

## Aggregate PASS/WARN/NOT_EVALUATED Counts

- Repositories: 3
- Cases: 9
- Threshold runs: 18 (9 at 30, 9 at 15)
- Successes at 30 (crapTypescript available): 3 (p-limit only)
- Failures at 30 (crapTypescript failed): 6 (zod 3 + zustand 3)
- Total changedFunctions at 30: 0
- Total PASS: 0
- Total WARN at 30: 0
- Total WARN at 15: 0
- Total NOT_EVALUATED: 0

## Evaluation/Completeness Rates

```
evaluated = PASS + WARN = 0
total = PASS + WARN + NOT_EVALUATED = 0
evaluationRate = N/A (no changedFunctions to evaluate)
completeness = COMPLETE for all 9 cases (no NOT_EVALUATED, but also no evaluated)
```

If total is zero, rate is N/A per spec.

## Warning Usefulness Classifications

No WARN findings in any of the 9 cases at either threshold, so human usefulness classification is N/A:

- USEFUL: 0
- PLAUSIBLE: 0
- NOISY: 0
- UNDETERMINED: 0

Review questions per warning are N/A (no warnings to review). For completeness, the 6 review questions would have asked about expected function, CRAP explainability, inspection intent, diff novelty, annoyance, and coverage-related NOT_EVALUATED, but none apply.

Human evaluator did not autonomously classify usefulness; there were no warnings to classify, so no LLM judgment was made.

## Threshold 15 vs 30 Comparison

- Threshold 30: 0 WARNs
- Threshold 15: 0 WARNs
- Sensitivity: No difference. Both thresholds produced zero signal because no changedFunctions were emitted (p-limit JS) or analyzer failed (zod/zustand). Lowering threshold did not create signal.

Threshold 15 is experimental comparison only, not a proposed new default.

## Operational Friction Observed

1. **Installation friction:** Target repos do not have @barney-media/crap-typescript installed; `npx --no-install` fails with "failed" unless manually installed via npm/pnpm. Prototype does not bundle or auto-install for target.
2. **Correct cwd required:** `tool check --base <base>` must be run with cwd = target repo; running from prototype dir fails to resolve base SHA that exists only in target.
3. **Coverage command incompatible:** crap-typescript internally runs `vitest run --coverage.enabled=true --coverage.reporter=json ...` which fails on repos where vitest config or pnpm workspace setup is incompatible (zod monorepo, zustand). Error: "Coverage command failed with exit 1 for pnpm/vitest".
4. **JS vs TS mismatch:** p-limit's source is index.js, not TS; analyzer (TS-only) finds no methods for JS changes, so even when available, 0 changedFunctions.
5. **Package manager diversity:** p-limit uses npm, zod uses pnpm with workspace: protocol (npm install fails, requires pnpm), zustand uses npm. Requires per-repo install command.
6. **Shallow clone depth:** Initial depth 50 missed some bases? Not in final runs (used full 40-char SHAs after deepening).
7. **No setup automation:** No docs for how to make tool work on arbitrary TS repo without manually installing analyzer.

## Limitations

- Tool is TypeScript-only; JS changes produce no signal.
- Analyzer requires vitest with coverage enabled; many TS repos use different test setups or require coverage config, causing "failed" even when TS files changed.
- Tool requires @barney-media/crap-typescript available in target; current `--no-install` policy makes it unavailable without manual install.
- No baseline/delta; absolute CRAP only.
- No test/lint/typecheck evidence.
- Single threshold (30) produced zero signal here due to above, not due to threshold choice.

## Unexpected Findings

- p-limit, though listed as TypeScript in selection, is primarily JS source with TS declarations; the analyzer correctly ignores JS, yielding 0 changedFunctions even when tool succeeds. Selection should have verified TS source files, not just declarations.
- Even after installing analyzer, zod/zustand still failed due to coverage command, indicating the analyzer's test-runner integration is fragile across real repos.
- All 9 cases resulted in gate PASS, completeness COMPLETE, but with 0 evaluated functions — a "successful" run that provides no information. This is not a failure per tool, but is a usefulness failure per WP4 question.

## Recommendation for Next Experiment

The current prototype in its WP3 form does not produce useful signal on the tested real repositories without addressing setup friction and TS-only scope.

However, the core correlation (WP1/WP1.1) is verified, and the advisory rule logic is correct. The failure is operational, not conceptual.

**CONTINUE WITH CONSTRAINTS**

Constraints for next step:

- Bundle or auto-provide @barney-media/crap-typescript so target need not have it installed (or use `npx --yes` with pinned version).
- Make coverage invocation robust: detect project's coverage setup or allow running without coverage (already preserves null as NOT_EVALUATED, but analyzer currently fails instead of returning null).
- Select repositories that are confirmed TS-source (not JS) and have vitest-compatible coverage or are known to work with crap-typescript.
- Document setup steps and expected prerequisites clearly.
- Consider baseline/delta as leading next experiment, but only after fixing applicability so signal can be observed.

Do not change threshold defaults, do not add test/lint/security evidence, do not add multi-language support, do not fix compatibility beyond explicitly approved scope.

CONTINUE WITH CONSTRAINTS
