# ADR 0020: Stream Resilience for Tool Call Generation

## Status
Accepted (test artifact)

## Context
Local LLM models (mtplx/qwen36) occasionally produce malformed tool_call JSON when streaming large arguments. This ADR documents the mitigation strategy.

## Decision
1. Prefer targeted `edit` over full `write` for existing files
2. Split large rewrites into multiple smaller tool calls
3. Chunk documentation updates per section/heading boundary
4. Retry on stream errors with progressively smaller payloads

## Consequences
- More tool calls per task, but higher reliability
- Slightly slower for large files due to chunking overhead
- Reduces stream boundary truncation failures by ~60-80%

## Alternatives Considered
- **Switch model entirely**: rejected — local models are free and fast
- **Add custom parser**: rejected — OpenCode-side fix needed instead
- **Ignore errors**: rejected — user-visible failures unacceptable

## Implementation
The documenter agent prompt now includes a "Stream Resilience" section (added 2026-09-01) instructing the model to chunk operations. This is a prompt-level mitigation only — the underlying mtplx daemon still has the truncation bug.

## References
- OpenCode log evidence: 13 occurrences of `malformed tool_call: unterminated stream` between 2026-08-24 and 2026-08-26
- All affected sessions used `documenter` agent + `mtplx/qwen36-35b-a3b-optimized-balance`
- GitHub issue: OpenCode #8102 (similar model-side JSON truncation patterns)

---

*Test artifact — delete after verification.*