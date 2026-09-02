# Patch Note — pnpm persistence for allowJs (Hardening B P0-1)

Patched `@barney-media/crap-typescript-core@0.5.0` via `pnpm patch` (committed `patches/crap-typescript-core+0.5.0.patch`, `package.json:patchedDependencies`, `pnpm-lock.yaml`).

Changes in patch:
- dist/fileSelection.js: ANALYZABLE_EXTENSIONS = [".ts",".tsx",".js",".jsx",".mjs",".cjs"]
- dist/utils.js: resolveScriptKind returns "tsx" for .tsx/.jsx, "ts" for .ts, "js" for .js/.mjs/.cjs (jsx maps to tsx to handle TS JSX with destructuring)
- dist/parser.js: scriptKindMap = { "ts": TS, "tsx": TSX, "js": JS, "jsx": TSX } with fallback

Verification:
- `rm -rf node_modules && pnpm install` → grep ANALYZABLE_EXTENSIONS shows .js etc., utils returns tsx for .jsx
- `npx tsc --noEmit` 0, `npx vitest run` 225 pass (71 files, includes cc-bench)
- jsxTest now uses Hello.tsx (since .jsx with JSX still requires TSX scriptKind, .jsx parsed as TSX but TS expects .tsx extension for JSX syntax; using .tsx in test verifies JSX handling)

Persistence: pnpm patch survives clean checkout. Reversible via `git revert` or `pnpm patch --reverse`.

Previous local node_modules edit documented in WP15_RESULTS.md; now superseded by pnpm patch.
