# WP0 Correlation Matrix — git changes ∩ crap-typescript line ranges

Hypothesis under test: function-level change attribution WITHOUT AST parsing =
overlap of git changed-line ranges (from `git diff <range> -U0`) with `methods[].lineStart..lineEnd`.

Fixture: `experiments/wp0/fixture` (own git repo).
Reference JSON for current-state line ranges: `raw/crap-full.json`
(add = 1–17, multiply/times = 19–31).

## Matrix

| Case | Git evidence (command + hunks) | crap-typescript evidence (raw file) | Overlap result | Verdict |
|------|-------------------------------|-------------------------------------|----------------|---------|
| Modified function (`add`) | `git diff 5977cae..bdc7e0e -U0 -- src/math.ts` → added lines 2–15, 17–30 | `raw/crap-full.json`: add spans 1–17 | hunks ∩ 1–17 = YES | **CORRELATED** |
| New function (`multiply`) | same diff, hunk `@@ -2,0 +17,14 @@` covers new lines 17–30 incl. signature at 19 | `raw/crap-full.json`: multiply spans 19–31 | 19–30 ⊂ hunk = YES | **CORRELATED** |
| Renamed function (`multiply`→`times`, commit 5cd166e) | `git diff HEAD~1..HEAD -U0 -- src/math.ts` → single-line hunk `@@ -19 +19 @@` (signature only) | `raw/crap-rename.json`: methods = add, times; old name absent | line 19 ∈ times(19–31) = YES | **CORRELATED via line overlap. Name-matching alone would FAIL — old identifier no longer exists in fresh JSON** |
| Deleted function (`halve`, commit 2355b84) | `git diff HEAD~1..HEAD -U0 -- src/math.ts` → pure-removal hunk `@@ -33,6 +32,0 @@` (old lines 33–38) | `raw/crap-delete.json`: halve absent from methods (add, times remain) vs `raw/crap-add-helper.json` where halve present | removal block maps to vanished entry | **CORRELATED (detection by absence + deletion hunk)** |

## Edge cases observed

1. Rename manifests as a one-line modification at the signature. Git does not surface semantic rename in `-U0`; correlation survives because we match LINES, not names.
2. New-function detection and modified-function detection use the identical rule (hunk ∩ range). No special-casing needed.
3. Deletion requires comparing fresh JSON against previous run's JSON (or simply flagging the removed region). The tool cannot report deleted functions (nothing to analyze); this is inherent, not a defect of our approach.
4. `-U0` hunks give exact inserted/deleted line ranges — sufficient input; no context lines needed.

## Conclusion

All four cases correlate using only:
- `git diff <base>..<head> -U0 --name-only` / hunk ranges
- `crap-typescript --format json` per-method `src`, `lineStart`, `lineEnd`

Pure integer-interval arithmetic. NO AST parsing performed or required.
