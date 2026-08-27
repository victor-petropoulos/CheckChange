# OpenCode Prompt — WP5.3 Documentation Correction & Reconciliation

## Mission
Perform a documentation-only reconciliation of WP5.3 after implementation PASS.

Do not modify production code. Do not begin WP5.4.

## Read first
1. Current `experiments/wp5/wp5.3/WP5_3_RESULTS.md`
2. Current WP5.3 planning/spec documents
3. Authoritative WP5.2 defect-reproduction/results
4. WP5.2 decision log and traceability records
5. Active WP5 decision log and traceability matrix

The repository's authoritative WP5.2 records determine FM-ID meanings.

## Step 1 — Build reconciliation table
Before editing, record:

| FM ID | Current WP5.3 meaning | Authoritative WP5.2 meaning | Action |
|---|---|---|---|

Do not guess when evidence is missing.

## Step 2 — Correct date
Change the WP5.3 result date from 2025-08-26 to 2026-08-26.

## Step 3 — Correct taxonomy
The current result appears to have incorrectly mapped FM-V01, FM-D10, FM-G06, and FM-G07.

Reconcile each against the authoritative WP5.2 record. Restore the authoritative meanings if supported. Do not invent IDs.

## Step 4 — Correct WP5.4 routing
Rewrite affected routing descriptions to match the authoritative taxonomy. Do not design WP5.4.

## Step 5 — Correct C03 limitation language
The hybrid implementation combines source-root TS discovery with tracked `.ts` files from `git ls-files`.

The result currently calls untracked-file exclusion acceptable. Replace that with an explicit unresolved contract/question: new or untracked TS files may remain undiscovered by the Git-based expansion.

Do not prescribe `git add` as a product requirement unless an authoritative record supports it.

## Step 6 — Preserve valid evidence
Keep all A08/A07/C03 before/after evidence, test results, production scope, and WP5.4 untouched confirmation.

## Step 7 — Update records
Update:
- `WP5_3_RESULTS.md`
- `defect-fix-record.md`
- `source-discovery-decision.md`
- `adversarial-case-matrix.md`
- `attribution-invariants.md`
- active WP5 decision log
- active WP5 traceability matrix

Create:
`experiments/wp5/wp5.3/WP5_3_DOCUMENTATION_RECONCILIATION.md`

That file must identify the repository artifact used to establish each FM-ID meaning.

## Constraints
Documentation only. No source changes, no test behavior changes, no WP5.4 implementation, no taxonomy invention.

## Stop
Return:
1. authoritative FM mapping
2. documents corrected
3. C03 contract wording
4. confirmation production code unchanged
5. WP5.3 closure recommendation
