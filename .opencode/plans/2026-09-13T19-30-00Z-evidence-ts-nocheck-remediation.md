---
task: "Remove @ts-nocheck from src/evidence.ts and fix all type errors"
created: "2026-09-13T19:30:00Z"
approved: true
repo_conventions:
  gate: "npx tsc --noEmit && npm test"
  entry_points: ["src/cli.ts"]
  review_hook: "engram_review_changes"
  graph_tool: "graphify query"
risks:
  - { risk: "Changing internal types may alter runtime shape of EvidenceOutput, violating FROZEN 0.5.0 contract", mitigation: "Run diff-identical check on golden JSON outputs before/after", signal: "gate output" }
  - { risk: "Incorrect typing may cause false positives/negatives", mitigation: "Ensure unit tests pass", signal: "test suite" }
guardrails: ["No change to behavior determinism", "All type fixes must preserve runtime values"]
max_rounds: 3
tasks:
  - id: "1"
    description: "Add explicit types to function parameters to eliminate implicit-any errors"
    agent: "implementer"
    files: ["src/evidence.ts"]
    seam: "src/evidence.ts correlate() — rejected: adding types in separate utils (reason: would not fix root cause)"
    acceptance: "TS errors TS7006 for parameters eliminated; tsc --noEmit reports 0 new implicit-any errors"
    impact: "consumers: all callers of correlate, buildOutput, buildEvidenceOutput; interface diff: +param types; migration: none"
    open_questions: "none"
    depends_on: []
  - id: "2"
    description: "Define proper Capabilities interface and use it throughout"
    agent: "implementer"
    files: ["src/evidence.ts"]
    seam: "src/evidence.ts capabilities variable — rejected: using any (reason: loses safety)"
    acceptance: "TS errors TS2339 for missing properties on capabilities eliminated; capabilities typed as interface"
    impact: "consumers: functions that set capabilities; interface diff: +Capabilities type; migration: none"
    open_questions: "none"
    depends_on: ["1"]
  - id: "3"
    description: "Fix languageMap index signature to allow string indexing"
    agent: "implementer"
    files: ["src/evidence.ts"]
    seam: "src/evidence.ts languageMap declaration — rejected: using Record<string,string> with const assertion? (reason: need exact keys for exhaustiveness? but we can keep as const and add satisfies)"
    acceptance: "TS error TS7053 for languageMap[ext] eliminated; languageMap typed as Record<string,string> or with index signature"
    impact: "consumers: getLanguageForFile; interface diff: +index signature; migration: none"
    open_questions: "whether to keep as const with satisfies Record<string,string>"
    depends_on: ["2"]
  - id: "4"
    description: "Fix fingerprints optional/required mismatch in generic intersection"
    agent: "implementer"
    files: ["src/evidence.ts"]
    seam: "src/evidence.ts Diagnostics type intersection — rejected: making fingerprints required everywhere (reason: would break optional semantics)"
    acceptance: "TS error regarding fingerprints optional vs required resolved; type checks clean"
    impact: "consumers: withDiagnostics; interface diff: +/- optional marker; migration: none"
    open_questions: "none"
    depends_on: ["3"]
  - id: "5"
    description: "Narrow provenance-object property types to prevent narrowing gaps (lines 274-281)"
    agent: "implementer"
    files: ["src/evidence.ts"]
    seam: "src/evidence.ts correlate() source handling — rejected: using any for source (reason: loses precision)"
    acceptance: "TS errors TS2339 for missing tool/properties on source eliminated; source typed appropriately"
    impact: "consumers: correlate; interface diff: +source type guard; migration: none"
    open_questions: "none"
    depends_on: ["4"]
  - id: "6"
    description: "Remove @ts-nocheck line and verify zero type errors"
    agent: "implementer"
    files: ["src/evidence.ts"]
    seam: "src/evidence.ts top-level comment — rejected: keeping nocheck (reason: defeats purpose)"
    acceptance: "File header has no // @ts-nocheck; tsc --noEmit reports 0 errors; test suite passes"
    impact: "consumers: module users; interface diff: none; migration: none"
    open_questions: "none"
    depends_on: ["5"]
  - id: "7"
    description: "Run determinism check: ensure JSON output unchanged for sample fixtures"
    agent: "tester"
    files: ["src/evidence.ts", "test/fixtures/**"]
    seam: "src/evidence.ts buildEvidenceOutput — rejected: skipping determinism check (reason: risk of silent behavior change)"
    acceptance: "determinism diff-identical check --json before/after shows no change; snapshot tests pass"
    impact: "consumers: downstream users of EvidenceOutput; interface diff: none"
    open_questions: "none"
    depends_on: ["6"]
  - id: "8"
    description: "Update documentation if any typing changes affect public contracts"
  "agent": "documenter",
    "files": ["docs/contracts/evidence-contract.md"],
    "seam": "none",
    "acceptance": "docs reflect any changes to EvidenceOutput shape; no missing sections",
    "impact": "consumers: API users",
    "open_questions": "none",
    "depends_on": ["7"]
---
## Error Inventory Table

| Line | Code Snippet | Error Class | Fix Approach |
|------|--------------|-------------|--------------|
| 241 | `export function correlate(methodEvidence, intervals) {` | TS7006: Parameter 'methodEvidence' implicitly has an 'any' type.<br>TS7006: Parameter 'intervals' implicitly has an 'any' type. | Add explicit types: `methodEvidence: MethodEvidence[]`, `intervals: Map<string, {start:number,end:number}[]>` (or appropriate). |
| 279 | `export function buildOutput(base, changed, threshold = 30, capabilities = {}) {` | TS7006: Parameter 'base' implicitly has an 'any' type.<br>TS7006: Parameter 'changed' implicitly has an 'any' type. | Add types: `base:string`, `changed:ChangedFunction[]`. |
| 281 | `const gate = ruleResults.some((r) => r.result === 'WARN') ? 'WARN' : 'PASS';` | TS7006: Parameter 'r' implicitly has an 'any' type. | Provide type for `r`: `typeof ruleResults[0]` or `RuleResult`. |
| 282 | `const completeness = ruleResults.some((r) => r.result === 'NOT_EVALUATED') ? 'INCOMPLETE' : 'COMPLETE';` | TS7006: Parameter 'r' implicitly has an 'any' type. | Same as above. |
| 284 | `analysis: { base, target: 'current' },`<br/>`capabilities: { git: gitCapability, ... }` | TS2339: Property 'git' does not exist on type '{}'. | Define `interface Capabilities { git:string; complexity:string; coverageArtifact:string; }` and use it for `capabilities` variable. |
| 285 | `capabilities: { git: gitCapability, crapTypescript: capabilities.crapTypescript ?? 'available' },` | TS2339: Property 'crapTypescript' does not exist on type '{}'. | Same as above; add `crapTypescript` to Capabilities if needed (or adjust). |
| 288 | `if (capabilities.complexity) caps.complexity = capabilities.complexity;` | TS2339: Property 'complexity' does not exist on type '{}'. | Same as above. |
| 289 (x2) | `caps.complexity = capabilities.complexity;` (inside if blocks) | TS2339: Property 'complexity' does not exist on type '{ git: any; crapTypescript: any; }' and on type '{}'. | Same as above. |
| 290 | `if (capabilities.coverageArtifact) caps.coverageArtifact = capabilities.coverageArtifact;` | TS2339: Property 'coverageArtifact' does not exist on type '{}'. | Same as above. |
| 291 (x2) | `caps.coverageArtifact = capabilities.coverageArtifact;` (inside if blocks) | TS2339: Property 'coverageArtifact' does not exist on type '{ git: any; crapTypescript: any; }' and on type '{}'. | Same as above. |
| 311 | `export async function buildEvidenceOutput(base, intervals, cwd, threshold = 30, coverageFile?, trace?: TraceRun) {` | TS7006: Parameter 'base' implicitly has an 'any' type.<br>TS7006: Parameter 'intervals' implicitly has an 'any' type.<br>TS7006: Parameter 'cwd' implicitly has an 'any' type.<br>TS7006: Parameter 'coverageFile' implicitly has an 'any' type. | Add types: `base:string`, `intervals:Map<string, {start:number,end:number}[]>`, `cwd:string`, `coverageFile:string | undefined`. |
| 380 | `intervalsSha256: sha256Hex(JSON.stringify(Array.from(intervals.entries())))` | TS7006: Parameter 'intervals' implicitly has an 'any' type. | Same as line 311 fix. |
| 524 | `const crappedComplexity = attributedComplexity.map(ac => ({ ... }))` | TS7006: Parameter 'ac' implicitly has an 'any' type. | Provide type for `ac`: `AttributedComplexity` (or appropriate). |
| 562 | `const gateValue = ruleResults.some((r) => r.result === "WARN") ? "WARN" : "PASS";` | TS7006: Parameter 'r' implicitly has an 'any' type. | Same as line 281 fix. |
| 564 | `const completenessValue = ruleResults.some((r) => r.result === "NOT_EVALUATED") ? "INCOMPLETE" : "COMPLETE";` | TS7006: Parameter 'r' implicitly has an 'any' type. | Same as above. |
| 589 | `const getLanguageForFile = (filePath) => {` | TS7006: Parameter 'filePath' implicitly has an 'any' type. | Add type: `filePath:string`. |
| 591 | `return ext ? languageMap[ext] : undefined;` | TS7053: Element implicitly has an 'any' type because expression of type 'string' can't be used to index type '{ '.py': string; '.ts': string; '.tsx': string; '.js': string; '.jsx': string; '.mjs': string; '.cjs': string; }'. | Change `languageMap` to `Record<string,string>` or add index signature `[string]: string`. |
| 593 | `const detectNextFramework = (cwd, filePath) => {` | TS7006: Parameter 'cwd' implicitly has an 'any' type.<br>TS7006: Parameter 'filePath' implicitly has an 'any' type. | Add types: `cwd:string`, `filePath:string`. |
| 611 | `const walkDir = (dir, depth) => {` | TS7023: 'walkDir' implicitly has return type 'any' because it does not have a return type annotation and is referenced directly or indirectly in one of its return expressions.<br>TS7006: Parameter 'dir' implicitly has an 'any' type.<br>TS7006: Parameter 'depth' implicitly has an 'any' type. | Add return type `string[]` and types for `dir:string`, `depth:number`. |
| 614 | `let files = [];` | TS7034: Variable 'files' implicitly has type 'any[]' in some locations where its type cannot be determined. | Add explicit type: `let files:string[] = [];`. |
| 618 | `files = files.concat(walkDir(fullPath, depth + 1));` | TS7005: Variable 'files' implicitly has an 'any[]' type. | Same as above; ensures consistent typing. |
| 629 | `.filter(f => f.endsWith('route.ts') || f.endsWith('route.tsx'));` | TS7006: Parameter 'f' implicitly has an 'any' type. | Add type for `f`: `string`. |
| 636 | `.filter(f => f.endsWith('.tsx') || f.endsWith('.ts'));` | TS7006: Parameter 'f' implicitly has an 'any' type. | Same as above. |
| 701 | `function buildFailedOutput(base, gitCapability, complexityCapability, coverageCapability, threshold, coverageErrorReason) {` | TS7006: Parameter 'base' implicitly has an 'any' type.<br>TS7006: Parameter 'gitCapability' implicitly has an 'any' type.<br>TS7006: Parameter 'complexityCapability' implicitly has an 'any' type.<br>TS7006: Parameter 'coverageCapability' implicitly has an 'any' type.<br>TS7006: Parameter 'threshold' implicitly has an 'any' type.<br>TS7006: Parameter 'coverageErrorReason' implicitly has an 'any' type. | Add appropriate types: all `string` except maybe `threshold:number`. |
| 274-281 | `source: evidence.source ? { tool: evidence.source.tool, version: evidence.source.version } : { tool: '@barney-media/crap-typescript', version: '0.5.0' },` | Provenance-object property narrowing gaps: accessing `evidence.source.tool`/`version` on `any` type. | Narrow `evidence.source` type: define `interface Source { tool:string; version:string; }` and type `evidence.source: Source | undefined`. |
| Various | fingerprints optional/required mismatch in generic intersection | TS23?? (exact code varies) | Ensure `fingerprints?: Record<string,string>` is correctly placed in `?name: T & { diagnostics?: { lineage: DiagnosticLineageEntry[]; quality: DiagnosticQuality; fingerprints?: Record<string,string> } }` and that generic intersections respect optionality. |

## File‑by‑File Touch List

- src/evidence.ts – all modifications; no other files touched.

## Risk Assessment vs FROZEN 0.5.0 Contract

- **Runtime‑shape risk**: The EvidenceOutput shape is defined in `docs/contracts/evidence-contract.md` (frozen at v0.5.0). All typing changes are *internal* to the builder; they do not alter the public JSON schema because the shape of the returned object is unchanged (only internal parameter/value types are tightened).  
- **Determinism risk**: No new nondeterministic code is introduced; all changes are type‑only.  
- **Mitigation**: Run the determinism check (`npm run determinism` or equivalent) that compares golden JSON outputs before/after the fix; also run the full test suite to ensure no behavioral drift.

## Phased Task Breakdown

See the `tasks` array in the frontmatter for the ordered, bite‑sized increments. Each task ends in a runnable increment (type‑check passes, tests green) and depends only on prior tasks.

## Go/No‑Go Recommendation

**GO** – provided that:

1. All tasks in the plan are completed and accepted.
2. The gate (`npx tsc --noEmit && npm test`) passes with zero new failures.
3. The determinism check shows byte‑identical EvidenceOutput for a representative set of fixtures.
4. No test regressions are observed.

If any of the above conditions fail, the plan should be **NO‑GO** and the specific failing task(s) reopened for analysis.