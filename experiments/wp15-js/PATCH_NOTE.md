# Task2 Parser Patch Note

Patched `node_modules/@barney-media/crap-typescript-core@0.5.0` via local edit (not git-tracked, node_modules ignored).

Changes:
- dist/fileSelection.js: ANALYZABLE_EXTENSIONS = [".ts",".tsx",".js",".jsx",".mjs",".cjs"]
- dist/utils.js: resolveScriptKind returns "jsx" for .jsx, "js" for .js/.mjs/.cjs, "tsx"/"ts" unchanged
- dist/parser.js: switch maps "jsx"->JSX, default->JS with ts.createSourceFile(filePath, text, Latest, true, scriptKind)

Verification: experiments/wp15-js/jsPatch.test.ts and jsxTest.test.ts both PASS (6ms each) with npx vitest.

Persistence: node_modules patched locally for demo. For permanent fix, fork core or use pnpm patch / patches/crap-typescript-core+0.5.0.patch. Fallback Approach 2 (jsComplexity via complexity-report) documented in plan if patch blocked.

tsc --noEmit 0 verified.
