# Future Engram Boundary

Engram is not part of this prototype.

No Engram code, packages, session model, prompts, MCP integration, or other dependencies belong here.

If the prototype eventually emits useful stable JSON, Engram may later consume that output as one deterministic gate:

```text
existing analyzers
  ↓
small deterministic correlator
  ↓
JSON findings / gate
  ├─ human CLI
  ├─ CI
  └─ future Engram adapter
```

The dependency remains one-way. If Engram disappeared, this project would remain useful.
