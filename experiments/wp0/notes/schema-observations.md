# WP0 schema observations — @barney-media/crap-typescript v0.5.0

All observations cite preserved raw outputs under `experiments/wp0/raw/`.
CLI surface source: `npx crap-typescript --help` (captured in session transcript; flags listed below).

## Top-level JSON shape

```json
{ "status": "<passed|failed>", "threshold": <number>, "methods": [ ... ] }
```

Evidence: `raw/crap-full.json`, `raw/crap-changed.json`.

## Method entry shape

```json
{
  "status":   "<passed|failed|skipped>",
  "crap":     <number|null>,
  "cc":       <integer>,
  "cov":      <number|null>,        // percent 0..100
  "covKind":  "<stmt|N/A>",
  "method":   "<function name>",
  "src":      "<project-relative path, forward slashes>",
  "lineStart":<integer>,
  "lineEnd":  <integer>
}
```

Evidence: `raw/crap-full.json` (add: crap 7.06721536351166, cc 7, cov 88.88888888888889, covKind stmt, src "src/math.ts", lines 1–17; times/multiply: crap 5, cc 5, cov 100, lines 19–31).

## Field-by-field findings

- Function identifier: `method` = bare function name. No class/namespace qualification observed (evidence: `raw/crap-full.json`). Name collisions across files distinguishable only via `src`.
- Path representation: project-relative, POSIX separators (`"src/math.ts"`).
- Complexity: `cc` integer cyclomatic complexity (add cc=7 with 5 if-statements + base path — consistent).
- Coverage: `cov` percentage, `covKind:"stmt"` (statement coverage). Derived from the test run the tool performs itself (vitest detected automatically).
- CRAP: `crap` float; matches CRAP formula cc²·(1−cov/100)+cc (add: 7²·(1−0.8889)+7 ≈ 7.067 ✓ computed from captured fields).
- Threshold/result: top-level `status` + per-method `status`; default threshold **6.0**, overridable `--threshold <number>`. Method status "failed" ⇔ crap > threshold.
- Errors: threshold breach prints human-readable line to STDERR ("CRAP threshold exceeded: 7.1 > 6.0", `raw/crap-full.stderr.txt`) while STDOUT stays pure machine-readable JSON. Separation clean.
- Exit codes (from --help): 0 success/no breaches · 1 argument/IO/parse error · **2 threshold exceeded**. Observed: full run exit 2 (`raw/crap-full.exit.txt`).

## Unavailable-coverage representation (experiment A1)

Untested file probe (`src/orphan.ts`, since removed):

```json
{ "status": "skipped", "crap": null, "cc": 2, "cov": null, "covKind": "N/A", ... }
```

Evidence: `raw/crap-nocov.json` (+ `.stderr.txt` empty, `.exit.txt` exit=0).
Unavailability is EXPLICIT: `cov:null`, `covKind:"N/A"`, method `status:"skipped"`, `crap:null`. Complexity still computed. No silent zeros — satisfies "never use an empty result to mean unavailable".

## `--changed` semantics (experiment A2)

- Help text: "Analyze changed TypeScript files under src/" — FILE-level granularity.
- Empirical: comment-only uncommitted append to `src/math.ts` → `--changed` returned BOTH functions of that file (evidence: `raw/crap-changed-dirty.json`: add + times/multiply both present). Any modification marks whole file changed.
- Clean tree → `methods: []` (evidence: `raw/crap-changed.json`).
- NO base-ref / commit-range flag exists in CLI surface (verified against --help output). Change detection compares working tree against HEAD (observed behavior), not arbitrary refs.

## Other CLI facts (from --help)

- Formats: toon (default), json, text, junit, none.
- `--failures-only`, `--omit-redundancy`, `--agent` modes exist.
- Explicit path args supported: `crap-typescript [--flags] <path...>`.
- Exclusions by glob/regex/generated-marker; default exclusions toggleable.
