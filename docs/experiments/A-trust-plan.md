# Experiment A — Evidence Trust Layer
## 1. Hypothesis
We hypothesize that attaching deterministic evidence fingerprints and quality scores to diagnostic outputs increases trust in automated conclusions by enabling verifiable provenance and rejecting tampered data. Fingerprints (SHA-256 of file:method:lineStart) allow exact detection of code changes, while quality scores (weighted 0.7 completeness + 0.3 stage) quantify diagnostic reliability, together forming a trust layer that can be checked without re-executing the full analysis.

## 2. Scope (tasks 1-8 done: name each + commit hash)
1. Terminology reconciliation — 48b8ce9: docs(terms): establish canonical evidence vocabulary.
2. INV-05 truthful + schema design — 0248b31: docs(contract): add prospective invariant INV-05 and design diagnostics schema.
3. Lineage collection (7 stages) — 18975ce: feat(evidence): implement optional diagnostics.lineage array covering seven stages.
4. Deterministic quality score — c78cc50: feat(evidence): compute quality as 0.7*stageCompleteness + 0.3*otherMetrics, deterministic across runs.
5. SHA-256 fingerprints per function — a318c4c: feat(evidence): generate fingerprint = SHA-256(filePath:methodName:lineStart) for each diagnostic.
6. CLI subcommand dispatcher — 5171853: feat(cli): add dispatcher for subcommands check|doctor|explain|trace|delta.
7. Tracing seam with TraceRun — 6ed428a: feat(trace): introduce TraceRun struct, correlation IDs, and real trace sidecar file.
8. Master plan and trust-layer phase plan — 7d76127: docs(plans): create master plan, trust-layer phase plan, bridge rewire, and DOC-LOCATION in-repo rule.

## 3. Success criteria (measurable: gates GO, suite counts, determinism method, contract invariants)
Success requires: (a) all review gates GO (Engram review passes Critical/High findings); (b) tsc reports zero errors across 79 source files; (c) test suite passes 297 tests; (d) determinism verified by diff-identical output of packaged artifacts (40 files) across two runs; (e) contract invariants INV-01 through INV-05 hold, checked via `check --json`. These criteria are observable and quantitative.

## 4. Risks + mitigations
Risk: Fingerprint collision due to SHA-256 weakness — mitigated by using cryptographic SHA-256, collision probability negligible. Risk: Performance overhead from fingerprint computation — mitigated by caching file contents and computing only on changed files; fingerprint addition is O(1) per diagnostic. Risk: Quality score manipulation — mitigated by deterministic formula and sidecar storage; any change in inputs alters score. Risk: Schema evolution breaking consumers — mitigated by keeping schema at version 0.4 for this experiment; version 0.5 changes will be minor and backward‑compatible.

## 5. Contract impact (schema stays 0.4; 0.5 minor later)
The diagnostics contract remains at schemaVersion "0.4"; no existing fields are altered or removed. New optional fields fingerprints (string) and quality (number) are added to the diagnostics object. A future 0.5 release may add observability traces and performance metrics, but will keep 0.4 fields intact and adopt semantic versioning for additive changes only.

## 6. Test strategy
Unit tests validate fingerprint generation (file:method:lineStart → SHA-256) and quality score calculation across edge cases. Integration tests run the CLI dispatcher through all subcommands and verify that emitted diagnostics include fingerprints and quality scores. Determinism is tested by executing the full pipeline twice and asserting diff-identical output of the 40‑file release package. The `check --json` command is exercised to confirm timing‑free output and invariant coverage. Snapshot testing ensures that trace sidecar files contain expected TraceRun and correlation IDs.

## 7. Rollback (per-commit git revert list, newest-first + commands)
To roll back the experiment in reverse chronological order:
- git revert 6ed428a --no-edit   # revert tracing seam
- git revert 5171853 --no-edit   # revert CLI dispatcher
- git revert a318c4c --no-edit   # revert fingerprints
- git revert c78cc50 --no-edit   # revert quality score
- git revert 18975ce --no-edit   # revert lineage collection
- git revert 0248b31 --no-edit   # revert INV-05 + schema design
- git revert 48b8ce9 --no-edit   # revert terminology reconciliation
- git revert 7d76127 --no-edit   # revert master plan
Each revert creates a new commit that undoes the changes; after the sequence the repository state matches the pre‑experiment baseline.

## 8. Deferred: B Observability, C Performance, D Reviewer UX with ordering A→B→C, D1 with A, D2 after A, D3 anytime + why
Observability (B), Performance (C), and Reviewer UX (D) are deferred to keep Experiment A focused on the trust core. Ordering A→B→C ensures trust foundations are laid before adding observability that depends on trustworthy data, then performance optimizations that can be measured against a stable trust baseline. D1 (reviewer UX hooks) is done with A because lightweight UX improvements (e.g., better error messages) aid immediate feedback on trust checks. D2 (advanced visualisations) follows A to avoid building UX on unstable contracts. D3 (automated review escalation) can occur anytime as it operates on the trust layer’s output. Deferral prevents scope creep and allows clear measurement of each layer’s impact.