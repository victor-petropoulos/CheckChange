# Auto-Coverage Runner Detection

Runner detection is **provider-driven**: `testRunners` in provider entries from `./checkchange.providers.json` (or `.checkchange/providers.json`) or builtin defaults `src/providers/config.ts:builtinConfig()` (L71-97).

## Provider Entry
```ts
{ language: string; extensions: string[]; testRunners?: TestRunner[] } // first match wins
```

## TestRunner
```ts
{ name, configFiles: string[], binaryProbes: string[], command: string[], artifact: string }
```

## Builtin Runners (config.ts:47-69)
- JS/TS: vitest → jest
- Python: pytest (venv-aware)

## Resolution Order (runner-detection.ts)
1. Source files exist for provider extensions
2. Config file glob match at repo root
3. Binary probes in order: path exists → `VIRTUAL_ENV` env → `--version` succeeds → `npx <runner>` via package.json
4. First hit per language wins

## Python venv Probe
`.venv/bin/pytest` → `VIRTUAL_ENV` → `python3 -m pytest` (config.ts:66)

## CLI Integration (cli.ts:392-400)
`resolveRunner(cwd, registry)` appends detected runners to missing-coverage remediation.

## Run
```bash
npx tsx src/cli.ts doctor [--provider-config <path>] [--json]
```
Never read `dist/` — build output only.