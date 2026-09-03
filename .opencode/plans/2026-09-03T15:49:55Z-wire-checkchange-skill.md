---
task: "Wire using-checkchange skill to reviewer/tester/orchestrator"
created: "${TIMESTAMP}"
approved: true
tasks:
  - id: "1"
    description: "Add `using-checkchange` to reviewer.md superpowers list (after line 73) and note invocation at pre-commit review_changes and unit review_delta"
    agent: "implementer"
    files: ["~/.config/opencode/agents/reviewer.md"]
    acceptance: "grep -q 'using-checkchange' ~/.config/opencode/agents/reviewer.md && python3 -m json.tool ~/.config/opencode/opencode.json >/dev/null 2>&1"
    depends_on: []
  - id: "2"
    description: "Add `using-checkchange` to tester.md superpowers list (alongside verification-before-completion, at coverage gate step)"
    agent: "implementer"
    files: ["~/.config/opencode/agents/tester.md"]
    acceptance: "grep -q 'using-checkchange' ~/.config/opencode/agents/tester.md && python3 -m json.tool ~/.config/opencode/opencode.json >/dev/null 2>&1"
    depends_on: []
  - id: "3"
    description: "Add `using-checkchange` to orchestrator.md superpowers list and delegation protocol step 5 (after line 40 in superpowers block and in delegation protocol)"
    agent: "implementer"
    files: ["~/.config/opencode/agents/orchestrator.md"]
    acceptance: "grep -q 'using-checkchange' ~/.config/opencode/agents/orchestrator.md && python3 -m json.tool ~/.config/opencode/opencode.json >/dev/null 2>&1"
    depends_on: ["1", "2"]
---
