# Human Review Packet — Hardening B (WP13 Python + WP15 JS/React + WP16 Next) — 2026-09-02

Status: AWAITING HUMAN REVIEW — do not autonomously classify usefulness

Schema 0.4, thresholds 30/15 frozen, 224 pass (70 files) tsc0, commit 388d992 + addendum.

## P0-1 Parser persistence
- Patch pnpm persists, verified via reinstall, 224 pass. Reversible.

## P0-3 Registry
- Dispatch table for .ts/.tsx/.js/.jsx/.mjs/.cjs + .py, arrow delegation preserves mocks, 5 nextDispatcher pass.

## P1-4 CC bench
- 10 funcs correlation 0.626 <0.95, divergence table in contract, no correction. Requires human accept document divergence vs factor.

## P0-2 Real Istanbul
- p-queue: coverage-final.json 149K exists, language javascript verified via buildEvidenceOutput
- zustand: 94K exists, language javascript framework react verified
- next-sample: 1.4K exists, framework next verified via app/page.tsx
- All produce CRAP numeric deterministic when coverage present (synthetic null still valid for dispatch test)

Zustand verified via `pnpm run test:spec` 224 pass and coverage artifact exists. Full CLI check with HEAD~1 tested for p-queue/next-sample, zustand pending full CLI but artifact exists.

## P1-5 Perf
- See hardening-b-perf.md: <1s, <260 MB for 94-149K artifacts, SUCCESS.

## 4 Limitations resolved
1. Coverage format mismatch: c8 --reporter=json, path normalization, verified.
2. Temp malformed: skip-on-error, .gitignore temp/, verified via collect.test/jsFault.
3. Framework detection: .tsx needs react dep, .jsx auto, peerDeps, next>react, 5/5 pass.
4. Parser persistence: pnpm patch as P0-1.

Gate: P0-1+3 DONE, P0-2 zustand artifact exists but CLI not yet run with HEAD~1 for zustand (needs `npx tsx src/cli.ts check --base HEAD~1 --coverage-file /tmp/zustand/coverage/coverage-final.json --json` from zustand cwd). P1-5 measured but perf doc not yet linked to packet. Contract addendum done.

Next: Human must accept CC 0.626 divergence (no correction) and zustand CLI result, then Angular may proceed.

```
AWAITING HUMAN REVIEW — Hardening B completion
```
