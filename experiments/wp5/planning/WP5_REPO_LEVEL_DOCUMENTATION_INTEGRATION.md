# WP5 Repository-Level Documentation Integration

## Purpose
WP5 working evidence belongs under `experiments/wp5/`, while durable repository documentation should reflect the transition from accepted WP4R to active WP5.

## Required WP5.1 audit
Inspect the repository and identify authoritative files for:
- roadmap/milestone status;
- architecture/design boundaries;
- experiment/research navigation;
- durable decisions/ADRs;
- `AGENTS.md` or equivalent execution guidance;
- root `README.md` only if it tracks development status.

Create `experiments/wp5/wp5.1/repo-documentation-audit.md`.

For each candidate record its path, purpose, whether WP4R/WP5 information belongs there, proposed change, rationale, and disposition: update now / defer / no change.

## Facts to propagate where appropriate
- `WP4R: COMPLETE / ACCEPTED`; its evidence is frozen.
- WP5 is the active robustness phase: WP5.1 inventory/specification; WP5.2 deterministic fixtures; WP5.3 attribution correctness; WP5.4 failure semantics/diagnostics; WP5 Final integrated verification/closure.
- Caller/CI produces coverage evidence; the prototype consumes it.
- No automatic test orchestration, coverage discovery, provider abstraction, LCOV, target-project configuration mutation, or LLM judgment in deterministic decisions.
- Default CRAP advisory threshold remains 30.
- Threshold 15 produced useful additional signal in one supplemental case but was not established as a universally better default.
- Experiment chronology should be navigable: WP4R final → correction/human review → supplemental → closure → WP5.

## Rules
Do not blindly edit README, AGENTS, roadmap, architecture docs, or ADRs. Establish ownership first. Prefer one authoritative update over duplicate status text.

Straightforward documentation-only transition updates may be made when ownership is unambiguous. If ambiguous, propose the exact update and stop for approval.

No production behavior changes are authorized by this audit.
