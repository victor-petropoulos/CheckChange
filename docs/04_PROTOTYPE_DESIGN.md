# Deliberately Ugly Prototype Design

Keep the implementation obvious:

```text
src/
  cli.ts
  git.ts
  tools.ts
  evidence.ts
  rules.ts
  report.ts
```

## Flow

```text
Git repository
  ↓
resolve baseline/current change
  ↓
detect existing supported tools
  ↓
crap-typescript + tests/coverage + tsc + ESLint
  ↓
read deterministic outputs
  ↓
minimal evidence representation
  ↓
correlate change + measurements
  ↓
three rules
  ↓
human output + JSON
  ↓
PASS / WARN / FAIL
```

Conceptual CLI:

```bash
tool check --base main
tool check --base main --json
```

Do not create `IEvidenceProvider`, `ProviderRegistry`, a rule DSL, plugin manager, generalized language adapters, or factories for single implementations.
