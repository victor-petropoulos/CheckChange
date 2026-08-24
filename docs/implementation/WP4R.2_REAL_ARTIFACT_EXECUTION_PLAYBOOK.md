# WP4R.2 Real Artifact Verification Playbook

1. Freeze prototype; run full tests and typecheck.
2. h3: regenerate real V8 JSON externally, use pinned real change, invoke `--coverage-file`, prove numeric coverage + CRAP.
3. Hono: generate native real artifact at `coverage/raw/default/coverage-final.json`, use pinned real change, invoke exact path, prove numeric coverage + CRAP.
4. If either fails, diagnose/document only. No production fix.
5. Create `docs/research/WP4R.2_REAL_ARTIFACT_VERIFICATION_RESULTS.md`.
6. End with `VERIFIED — READY FOR WP4R RERUN`, `VERIFIED WITH CONSTRAINTS`, or `STOP`, then stop.
