# Next.js Expansion Results (WP16 Slice)

## Scope
Next.js metadata via config+app detection (Approach1), pure metadata, next>react priority, no parser change, synthetic next-sample + dispatcher + faults.

## Fixture
- `experiments/wp15-js/fixtures/next-sample/` with `app/page.tsx`, `app/layout.tsx`, `next.config.js`, `package.json` next 14 + react 18
- Check: `app/page.tsx` → language typescript, framework next (verified via buildEvidenceOutput)
- `npx tsx adapter/e2e.ts` not needed for Next (direct buildEvidenceOutput used)

## Tests
- nextDispatcher.test.ts 5 PASS (next dep, next.config, next+react priority, react only, app/page marker)
- nextFault.test.ts 2 PASS (missing package fallback, unreadable app no throw)
- Total: 216 → 223 (+7), 69 files, tsc0

## Verification
- `npx tsc --noEmit` → 0
- `npx vitest run --no-coverage` → 69 passed 223 passed
- Real repo provisional: not run in this slice (c8 format mismatch documented in WP15), synthetic proves detection

## Gate
PASS — Next.js framework metadata works, additive, reversible 5-line revert, no threshold/schema bump.
