# CheckChange

**Independent, deterministic evidence for AI-assisted software development.**

AI coding tools can make a lot of software changes very quickly. That's useful, but it also creates a new question:

**How do we independently check the change without simply asking another AI what it thinks?**

That's what CheckChange is for.

CheckChange looks at the functions changed in a Git repository and uses measurable evidence such as complexity, test coverage, coverage attribution, and deterministic CRAP calculations to produce evidence about the change.

It is not trying to decide whether the code is correct. It is not another AI code reviewer. It gives developers, CI systems, and other tools something concrete to look at.


---

## What it does

At a high level:

```text
Git change
    ↓
Changed functions
    ↓
Complexity + coverage
    ↓
Coverage attribution
    ↓
CRAP calculation
    ↓
Deterministic rules
    ↓
Evidence
```

The result tells you what CheckChange was able to establish about the change, rather than pretending that missing evidence is the same thing as good evidence.

For example, a changed function might produce:

```text
Complexity
  12 → 17

Coverage
  84% → 61%

CRAP
  increased

Result
  WARN
```

That does **not** mean the function is defective. It means there is evidence worth looking at.

CheckChange is intended to be used as:

- a developer-side check
- a CI step
- a pull-request signal
- an input to another automated system
- an independent verification step after an AI coding agent makes a change

The important part is the separation:

```text
AI coding agent
       |
       | makes a change
       v
   CheckChange
       |
       | produces evidence
       v
Human / CI / downstream system
       |
       v
     decision
```

The system that made the change does not get to decide whether the evidence is sufficient.

---

## What CheckChange is not

CheckChange does **not** claim to:

- prove that code is correct
- predict defects
- replace human code review
- replace testing
- certify production readiness
- provide a universal software-quality score

A `PASS` means the available evidence satisfied the applicable deterministic rules.

A `WARN` means the evidence crossed a condition worth investigating.

An `INCOMPLETE` or `NOT_EVALUATED` result means CheckChange could not establish everything needed for a meaningful evaluation.

Those are evidence states, not judgments about whether the software is ultimately good or bad.

---

# Install

The package is published on npm as `checkchange`. Check the current published
version with `npm view checkchange version`.

### npm

```bash
npm install -g checkchange
checkchange --help
```

Or use it without installing globally:

```bash
npx checkchange check --base main --json
```

### pnpm

```bash
pnpm add -g checkchange
```

Or:

```bash
pnpm dlx checkchange check --base main --json
```

### From source

```bash
git clone https://github.com/victor-petropoulos/CheckChange.git
cd CheckChange

corepack enable
pnpm install --frozen-lockfile
pnpm run build

node dist/cli.js check --base main --json
```

### Updating an existing npm install

To get the latest released version:

```bash
npm install -g checkchange@latest   # global install
npm install checkchange@latest      # project-local dependency
```

Check what you have and what is available:

```bash
checkchange --version
npm view checkchange version
```

If you need a pinned version for reproducibility, use `checkchange@<version>`
with the version you want (list available versions with
`npm view checkchange versions`).

---

# Requirements

- Node **24**
- pnpm **11.17.0**
- Git

The repository includes an `.nvmrc` and the required pnpm version is specified in `package.json`.

For repositories using the Python analysis path, Python 3 plus the relevant testing/coverage tooling may also be required. For C# repositories, the .NET SDK is optional — without it, CheckChange analyses `.cs` files via a pure-TypeScript fallback parser in degraded mode rather than failing.

---

# Quickstart

If you are working from a source checkout:

```bash
pnpm install
pnpm run build
```

Then run:

```bash
node dist/cli.js check --base main --json
```

If CheckChange is installed globally:

```bash
checkchange check --base main --json
```

You can also run the project's own test suite with:

```bash
pnpm exec vitest run --coverage
```

For Bun test projects:

```bash
bun test --coverage --coverage-reporter=lcov
```

This writes `coverage/lcov.info`, which CheckChange reads directly (it can also
run this command for you via `--auto-coverage`). Bare `bun test --coverage`
prints a coverage table but writes **no** artifact on disk; the
`--coverage-reporter=lcov` flag is required.

---

# Basic usage

The three most common starting points are:

```bash
checkchange check --base main --json
```

Analyze the changes relative to `main` and produce machine-readable evidence.

```bash
checkchange check --crap-threshold 25 --format github
```

Run the analysis with a custom CRAP threshold and GitHub-oriented output.

```bash
checkchange check --auto-coverage --verbose
```

Allow CheckChange to detect/configure the appropriate coverage path and show additional diagnostic information.

---

# Commands

| Command | Purpose |
|---|---|
| `check` | Analyze changed functions and produce evidence |
| `doctor` | Check runtime and repository prerequisites |
| `prepare-repo` | Detect, plan, approve, install, and verify test/coverage tooling |
| `explain` | Explain the rationale behind a result |
| `trace` | Show the evidence trace for a function |
| `delta` | Compare evidence between two states |

Run:

```bash
checkchange --help
```

for the current command and option list.

---

# Configuration

Some of the most useful options are:

| Option | Description | Default |
|---|---|---|
| `--base <ref>` | Git base reference for the change | auto-detect |
| `--crap-threshold <n>` | CRAP warning threshold | `30` |
| `--coverage-file <path>` | Explicit coverage file | auto-detect |
| `--format <github\|junit\|sarif>` | CI output format | none |
| `--json` | Produce machine-readable evidence | off |
| `--verbose` | Show additional diagnostics | off |
| `--auto-coverage` | Attempt automatic coverage setup (vitest, jest, pytest, dotnet, or bun) | off |

Flags are per-command: `checkchange check --help` lists `--format`, `--base`,
`--json`; every subcommand lists its own flags. Unknown flags are rejected
with `Error: Unknown option <arg>` (exit 1) rather than silently ignored.

The base reference is automatically detected when `--base` is not supplied.

Provider configuration can be supplied explicitly or discovered from the repository.

---

# Supported languages and coverage

The current implementation supports analysis for:

- TypeScript
- JavaScript
- Python
- C#

Coverage can be supplied through the supported coverage paths, including Istanbul-compatible coverage, LCOV, and Coverlet Cobertura XML.

CheckChange also supports CI-oriented output formats:

```text
github
junit
sarif
```

The supported provider/configuration surface is intentionally narrower than "anything that can produce a coverage report." Check the current documentation before assuming a particular repository or coverage setup is supported.

---

# How the analysis works

The current pipeline is roughly:

1. **Git diff**  
   Determine what changed relative to the selected base.

2. **Changed functions**  
   Identify the functions affected by the change.

3. **Complexity**  
   Measure complexity using the appropriate provider.

4. **Coverage**  
   Find available test-coverage evidence.

5. **Attribution**  
   Associate coverage evidence with the changed functions.

6. **CRAP calculation**  
   Combine complexity and coverage into the deterministic CRAP signal.

7. **Rules**  
   Apply the project's deterministic rules and thresholds.

8. **Evidence**  
   Produce the structured evidence result.

9. **Output**  
   Present the result for a developer, CI system, or another machine.

The evidence output includes information about completeness and provenance so that a number is not presented without context.

---

# Example

A typical machine-readable result looks roughly like:

```json
{
  "schemaVersion": "0.5",
  "analysis": {
    "base": "<resolved-base-sha>",
    "target": "current"
  },
  "changedFunctions": [],
  "ruleResults": [],
  "policy": {
    "crapThreshold": 30
  },
  "analysisStatus": "UNSUPPORTED",
  "gate": "NOT_EVALUATED",
  "completeness": "INCOMPLETE"
}
```

The exact output depends on the repository and evidence available.

For example, a clean checkout may have no changed functions. In that case there is nothing to evaluate and `NOT_EVALUATED` is a valid result.

You can use:

```bash
checkchange doctor
```

to see why a repository is or is not ready for analysis.

Example:

```text
gitExecutable: ok
gitRepo: ok
defaultBase: ok (origin/main)

providerAvailability: no-changed-files
  ↳ no changed files detected against the base

coverageArtifact: present
```

---

# Gate contract

The `gate` field of the evidence output is never null (as of 0.5.0). It is one
of four values:

| `gate` | Meaning |
|---|---|
| `PASS` | No rule violations and coverage sufficient. |
| `WARN` | At least one rule violated (e.g. CRAP above threshold). |
| `NOT_EVALUATED` | Nothing to evaluate (unsupported source, empty intervals, absent coverage). |
| `FAILED` | Analysis could not complete (coverage missing/malformed, complexity failed). |

`gateReason` (optional) explains why a non-PASS gate was emitted, e.g.
`no-supported-file-extensions`, `complexity-analysis-failed`, or the coverage
error reason (`missing` / `malformed` / `failed`).

**Explicit-file malformed taxonomy.** When `--coverage-file <path>` points to
an extension-gated LCOV artifact (`*.info` or `*.lcov`) that parses to an empty
map and carries neither `SF:` nor `DA:` tokens anywhere in the file, the guard
classifies it as malformed → `analysisStatus FAILED`, `gate FAILED`,
`completeness INCOMPLETE`, `coverageErrorReason: "malformed"`, stderr
`Error: coverage artifact malformed`, exit 1. This catches garbage or
JSON-renamed-.info/.lcov inputs up front rather than silently treating them as
valid zero-record artifacts. Lenient boundary preserved: a valid LCOV artifact
that contains `SF:` (even when it has zero `DA:` lines) continues through as
lenient SUCCESS/NOT_EVALUATED, since the token proves the artifact originated
from a real LCOV-producing toolchain. Invalid JSON (all explicit paths), size
breaches (>100 MB), and unconvertible Python-binary lanes still return `malformed`
via the existing throw/catch path.

Exit codes:

| Condition | Exit code |
|---|---|
| `FAILED` analysisStatus or `gate === 'FAILED'` | 1 |
| `gate === 'WARN'` | 1 |
| `PASS` / `NOT_EVALUATED` | 0 |

---

# Diagnostics output

`--json` may include an optional top-level `diagnostics` object. Existing fields
(`lineage`, `quality`, `fingerprints`) carry provenance, quality scores, and
per-function hashes. A fourth field, `functionCoverage`, is emitted only when
the coverage artifact is LCOV and contains FN/FNDA records.

## `diagnostics.functionCoverage`

**What it is:** For each changed function that has an LCOV FN record whose
declaration line matches the function's `lineStart`, one entry carrying the
function-hit count observed in the coverage artifact:

```json
{
  "file": "src/adapters/typescript/collector.ts",
  "method": "visit",
  "line": 488,
  "hits": 4166
}
```

**When present:** `coverageArtifact` is LCOV (`--coverage-file *.info`) AND
at least one changed function's declaration line appears in an FN record. The
field is omitted entirely for Istanbul JSON or Cobertura XML — those formats
carry no per-function hit counts.

**When absent:** No LCOV FN data matched any attributed method (including cases
where only anonymous `(anonymous_N)` FN entries exist — see below), or the
artifact is not LCOV.

**Does NOT affect gate decisions.** Function-hit counts are diagnostic-only.
CRAP derives from statement + branch coverage only (`coverageNormalization.js:1-9`);
`changedFunctions` shape (`{file, method, lineStart, ..., crap, coverage, coverageKind}`)
is unchanged; gate, threshold, and completeness are unaffected. This is a
YAGNI-boundary decision recorded in the
[coverage-path-normalization spike](.opencode/scratch/coverage-path-normalization/notes.md
"Task 7 spike B"): Option A (parallel side-channel, zero gate impact) was chosen
over Option B (injecting FN spans into attribution, which would break statement
coverage via single-line synthesized spans).

**Anonymous functions.** Bun-produced LCOV emits FN entries named
`(anonymous_0)`, `(anonymous_1)`, etc. for unnamed arrow/expression functions.
The core `parseFileMethods` skips these descriptors, so anonymous FN entries
cannot be matched to changed methods and surface as orphan hits in the raw
`CoverageResult.functionCoverage` map but do NOT appear in the diagnostics
array (matching is keyed by `info.file` + `info.lineStart` against attributed
methods only).

---

# Why the evidence matters

One of the design goals of CheckChange is to distinguish **"we measured it"** from **"we don't have enough evidence."**

For example:

```text
Coverage: 72%
```

is less useful than:

```text
Coverage: 72%
Evidence: ATTRIBUTED
Provider: LCOV
```

And that is still different from:

```text
Coverage: unavailable
Completeness: INCOMPLETE
```

The goal is to make those distinctions visible rather than hide them behind a single score.

---

# Deterministic by design

The core evidence pipeline does not use an LLM to decide whether a change looks risky.

Given the same relevant inputs and CheckChange version, the goal is reproducible evidence.

That makes the output suitable for:

- CI
- automated workflows
- comparison between runs
- downstream AI systems
- human review

An AI system can consume the evidence if that's useful. CheckChange itself does not need to become another AI reviewer.

---

# CI

CheckChange can produce output intended for CI systems, including:

```bash
checkchange check --format github
```

```bash
checkchange check --format junit
```

```bash
checkchange check --format sarif
```

Machine-readable JSON is also available:

```bash
checkchange check --json
```

This makes it possible to use the same evidence both for human-facing development workflows and automated pipelines.

---

# Delta input paths

`checkchange delta --baseline <path> --current <path>` reads both evidence
artifacts through a fail-closed containment seam (`src/fs-safety.ts`): the
resolved (realpath-expanded) file must be inside the current working
directory. Absolute paths outside the cwd — and symlink targets that escape
it — are rejected with `delta: input path escapes cwd: <path>` and exit 1.

Run `delta` from the directory that contains the artifacts, or pass paths
relative to it:

```bash
checkchange delta --baseline evidence-a.json --current evidence-b.json --json
```

Note the deliberate asymmetry: an explicit `check --coverage-file <path>`
*is* allowed outside the cwd (user-provided artifacts are trusted), while
delta inputs are not. Auto-detected coverage files use the same containment
seam as delta.

---

# Dependencies and external tools

CheckChange uses a small number of external packages and tools for its analysis.

The main runtime requirements are:

- Node 24
- pnpm 11.17.0
- Git

The supported analysis paths also use packages for TypeScript/JavaScript complexity and coverage processing, along with Python tooling where the Python analysis path is used. For C# analysis, the .NET SDK is optional — when present, CheckChange probes for a Roslyn-based vehicle (`dotnet-crap`, the Crap4DotNet 0.1.1 tool); if the SDK is available and the tool is installed, it serves rich cyclomatic complexity with a fallback bodySpan hybrid join when the vehicle succeeds; `csharp-analysis-failed` is emitted only when the vehicle itself fails (spawn error, no coverage artifact, unparseable payload, or no span join). When the SDK is absent, a `csharp-sdk-missing` diagnostic and fix proposal are emitted with the fallback parser.

For the authoritative dependency versions and provider details, see `package.json` and the project documentation.

---

# Development

Install dependencies:

```bash
pnpm install
```

Run tests:

```bash
pnpm test
```

Run the TypeScript compiler:

```bash
npx tsc --noEmit
```

Build:

```bash
pnpm run build
```

Before making changes, check the repository's development documentation and current project status. CheckChange has a fairly deliberate evidence contract, and changes to evidence semantics should not be treated like ordinary refactoring.

---

# Contributing

Issues and pull requests are welcome.

If you want to contribute, please keep the project's core ideas in mind:

- evidence should be deterministic where practical
- provenance should remain visible
- incomplete evidence should not be disguised as complete evidence
- technical behavior should be reproducible
- evidence and interpretation should remain separate
- new capabilities should be justified by actual use cases

The repository contains additional architecture, contract, testing, experiment, and development documentation.

---

# Where this is going

The immediate goal is not to turn CheckChange into a giant platform.

The more interesting question is whether an independent evidence layer becomes genuinely useful as AI-assisted development becomes more common.

The basic model is:

```text
AI writes
    ↓
CheckChange checks the change
    ↓
Evidence
    ↓
Human / CI / another system decides what to do
```

If that turns out to be useful, there is plenty more we can build around it.

---

# License

MIT — see [`LICENSE`](LICENSE).

# Changelog

See [`CHANGELOG.md`](CHANGELOG.md).
