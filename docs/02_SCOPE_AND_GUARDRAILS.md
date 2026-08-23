# Scope and Guardrails

## Hard guardrail

**Do not build an analysis engine.**

If an established tool can produce a deterministic measurement, consume that result.

## Allowed

- Git change resolution
- tool detection
- safe process execution
- report reading
- minimal output parsing
- evidence correlation
- trivial deterministic arithmetic
- deterministic rule evaluation
- reporting
- explicit unavailable/failed states

## Forbidden in the prototype

- custom TypeScript quality AST analysis
- custom cyclomatic complexity
- custom coverage instrumentation
- custom lint/static/security analysis
- dependency vulnerability analysis
- duplication detection
- generic SARIF platform
- plugin architecture
- multi-language abstraction
- database/web UI/cloud service/accounts/telemetry
- IDE/MCP/LLM/Engram integration

## Scope-creep test

Ask: **Is this composing existing deterministic evidence, or becoming an analyzer?** If the latter, stop and find an existing tool.

## Architecture-creep test

Do not create an abstraction until two real implementations require it.
