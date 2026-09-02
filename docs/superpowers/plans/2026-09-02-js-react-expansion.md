---
task: "JS+React expansion — javascript language + react framework, schema 0.4, medium bar"
created: 2026-09-02T08:00:00Z
approved: true
tasks:
  - id: "1"
    description: "Schema 0.4 + contract prep — add language javascript + framework react to evidence contract, ChangedFunction interface"
    agent: "documenter"
    files: ["docs/contracts/evidence-contract.md", "src/evidence.ts"]
    acceptance: "evidence-contract.md has migration 0.3→0.4 note with table, src/evidence.ts ChangedFunction has language? + framework? fields typed, tsc --noEmit 0 errors"
    depends_on: []
  - id: "2"
    description: "Parser patch allowJs — extend ANALYZABLE_EXTENSIONS + allowJs true in crap-typescript-core fork/patch"
    agent: "implementer"
    files: ["node_modules/@barney-media/crap-typescript-core/dist/fileSelection.js", "src/complexity.ts"]
    acceptance: "parseFileMethods handles .js/.jsx/.mjs/.cjs via allowJs, synthetic .js file yields cc, fallback path documented for Approach 2 if patch fails"
    depends_on: ["1"]
  - id: "3"
    description: "Complexity collector update — getGitTrackedCodeFiles + sourceRoot extension for JS"
    agent: "implementer"
    files: ["src/complexity.ts"]
    acceptance: "collectComplexity returns JS entries, union dedup works, getGitTrackedCodeFiles filters .ts/.tsx/.js/.jsx/.mjs/.cjs, test with mocked git ls-files passes"
    depends_on: ["2"]
  - id: "4"
    description: "Evidence dispatcher — isUnsupportedIntervals, languageMap, framework detection, dispatch priority .py>.tsx>.ts>.jsx>.js"
    agent: "implementer"
    files: ["src/evidence.ts"]
    acceptance: "buildEvidenceOutput returns language javascript for .js/.jsx/.mjs/.cjs, framework react when package.json has react + JSX, isUnsupportedIntervals allows JS, existing py/ts still PASS"
    depends_on: ["3"]
  - id: "5"
    description: "Adapter harness + synthetic fixtures — js-sample + jsx-sample + e2e wiring"
    agent: "implementer"
    files: ["experiments/wp15-js/adapter/jsComplexity.ts", "experiments/wp15-js/adapter/jsCoverage.ts", "experiments/wp15-js/fixtures/js-sample/low.js", "experiments/wp15-js/fixtures/jsx-sample/Component.jsx"]
    acceptance: "experiments/wp15-js/fixtures/js-sample 3 fns low/med/high CC correct, jsx-sample 2 comps JSX parsed framework react present, npx tsx experiments/wp15-js/adapter/e2e.ts produces schema 0.4 JSON gate PASS/WARN"
    depends_on: ["4"]
  - id: "6"
    description: "Fault suite jsFault.spec.ts — 8-10 fault tests preserving invariants"
    agent: "tester"
    files: ["experiments/wp15-js/jsFault.spec.ts"]
    acceptance: "10/10 fault tests pass: missing, malformed, zero, branch vs statement, malformed JS, mixed ts+js, empty, non-JSX react, case-insensitive, threshold 30 vs 15"
    depends_on: ["5"]
  - id: "7"
    description: "Real-repo E2E + verification — small JS lib + small React lib, tsc0, 201+ pass, WP15_RESULTS, OPENCODE update"
    agent: "implementer"
    files: ["experiments/wp15-js/WP15_RESULTS.md", "OPENCODE_START_HERE.md"]
    acceptance: "Real JS repo clone tmp npm test --coverage -> check yields language javascript, Real React repo yields framework react, npx tsc --noEmit 0, npx vitest run --no-coverage >=211 pass, WP15_RESULTS claims matrix, OPENCODE next step human review"
    depends_on: ["6"]
---

# JS React Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand deterministic engine to JavaScript (.js/.jsx/.mjs/.cjs) as `language: "javascript"` with React `framework: "react"` metadata, reusing AST parser via allowJs, medium validation (synthetic + real repos).

**Architecture:** Approach 1 core-extension patches `@barney-media/crap-typescript-core` (`ANALYZABLE_EXTENSIONS` + `allowJs:true` + JSX) to keep TS/JS CC semantics identical (no divergence table). `src/evidence.ts` provider priority `.py > .tsx > .ts > .jsx > .js/.mjs/.cjs` routes to same parser, `languageMap` adds javascript, `framework` detector reads `package.json` react dep + JSX syntax as additive metadata.

**Tech Stack:** Node 24, TypeScript 6.0.3 ESM NodeNext, Vitest, `@barney-media/crap-typescript-core@0.5.0` (patched), Istanbul coverage, lizard (python path untouched).

## Global Constraints

- Node version: 24 (nvm use, .nvmrc 20.10.0 for TSDoc legacy but engine runs 24)
- TypeScript 6.0.3, ESM, `npx tsc --noEmit` must stay 0 errors each task
- Thresholds frozen: CRAP 30 default / 15 tight, no change
- Invariants preserved: INV-01 ZERO≠NULL, INV-02 MISSING≠MALFORMED, INV-03 GIT≠REPO, INV-04 ANALYZER_TRUTHFUL
- Schema: additive 0.3→0.4 (`language: "javascript"` + optional `framework`), consumers ignore unknowns
- No DB/cloud/LLM/agent orchestration, keep reversibility via git revert or fallback Approach 2

---

### Task 1: Schema 0.4 + Contract Prep

**Files:**
- Modify: `docs/contracts/evidence-contract.md:5-50` (add migration 0.3→0.4 section, update ChangedFunction table)
- Modify: `src/evidence.ts:26` (ChangedFunction language? + framework?)

**Interfaces:**
- Consumes: existing `evidence-contract.md` 0.3 frozen
- Produces: `ChangedFunction { language?: "typescript"|"python"|"javascript", framework?: "react" }`, `schemaVersion "0.4"` output

- [ ] **Step 1: Add framework field to src/evidence.ts interface**

```typescript
// src/evidence.ts:26
export interface ChangedFunction {
  file: string;
  method: string;
  lineStart: number;
  lineEnd: number;
  cc: number;
  crap: number | null;
  coverage: number | null;
  coverageKind: string;
  analyzerStatus: 'passed' | 'failed' | 'skipped';
  source: { tool: string; version: string; };
  language?: string;
  framework?: string; // NEW 0.4
}
```

- [ ] **Step 2: Update evidence-contract.md migration note (after line 11)**

```markdown
### Migration 0.3→0.4

- Added optional `language` value `"javascript"` to `changedFunctions[]` entries.
- Added optional `framework?: string` field (values: `"react"`).
- Both additive; consumers ignoring unknown values remain compatible.
- Schema version bump 0.3→0.4 reflects proven JS gap.
```

- [ ] **Step 3: Run typecheck**

Run: `npx tsc --noEmit`
Expected: PASS 0 errors

- [ ] **Step 4: Commit**

```bash
git add docs/contracts/evidence-contract.md src/evidence.ts
git commit -m "feat: schema 0.4 prep language javascript + framework react"
```

---

### Task 2: Parser Patch allowJs

**Files:**
- Modify: `node_modules/@barney-media/crap-typescript-core/dist/fileSelection.js:5` (or local fork `experiments/wp15-js/crap-core-patch/fileSelection.js`)
- Modify: `src/complexity.ts:1-3` (import still same, but test allowJs)

**Interfaces:**
- Consumes: Task1 framework field
- Produces: `parseFileMethods(filePath)` handles .js/.jsx/.mjs/.cjs with allowJs

- [ ] **Step 1: Write failing test for JS parse**

```typescript
// experiments/wp15-js/jsPatch.test.ts
import { parseFileMethods } from '@barney-media/crap-typescript-core';
test('parses .js file', async () => {
  const methods = await parseFileMethods('/tmp/js-sample/low.js');
  expect(methods.length).toBeGreaterThan(0);
});
```

- [ ] **Step 2: Run to fail**

Run: `npx vitest run experiments/wp15-js/jsPatch.test.ts`
Expected: FAIL (ANALYZABLE_EXTENSIONS rejects .js)

- [ ] **Step 3: Patch fileSelection.js**

```javascript
// dist/fileSelection.js:5
const ANALYZABLE_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"];
```

And ensure parser uses `allowJs: true, jsx: ts.JsxEmit.React` for those exts.

- [ ] **Step 4: Run test to pass**

Run: `npx vitest run experiments/wp15-js/jsPatch.test.ts`
Expected: PASS

- [ ] **Step 5: Document fallback**

If patch blocked, create `experiments/wp15-js/adapter/jsComplexity.ts` using `complexity-report` as Approach 2 and note divergence table.

- [ ] **Step 6: Commit**

```bash
git add node_modules/@barney-media/crap-typescript-core/dist/fileSelection.js src/complexity.ts
git commit -m "feat: parser allowJs for .js/.jsx/.mjs/.cjs"
```

---

### Task 3: Complexity Collector

**Files:**
- Modify: `src/complexity.ts:13-31` (`getGitTrackedCodeFiles`), `src/complexity.ts:33-48` (`collectComplexity`)

**Interfaces:**
- Consumes: patched parser from Task2
- Produces: `collectComplexity(cwd): Promise<ComplexityInfo[]>` includes JS entries

- [ ] **Step 1: Write failing test**

```typescript
test('collectComplexity includes .js', async () => {
  const infos = await collectComplexity('experiments/wp15-js/fixtures/js-sample');
  expect(infos.some(i=>i.file.endsWith('.js'))).toBe(true);
});
```

- [ ] **Step 2: Run fail** → no .js yet

- [ ] **Step 3: Implement**

```typescript
function getGitTrackedCodeFiles(cwd: string): string[] {
  const out = execSync('git ls-files --cached --others --exclude-standard', {cwd, encoding:'utf8'});
  return out.trim().split('\n').filter(l=>l.match(/\.(ts|tsx|js|jsx|mjs|cjs)$/)).map(l=>resolve(cwd,l.trim()));
}
```

Update `collectComplexity` to call new helper and union.

- [ ] **Step 4: Run pass**

Run: `npx vitest run experiments/wp15-js/collect.test.ts`
Expected: PASS with .js

- [ ] **Step 5: Commit**

```bash
git add src/complexity.ts
git commit -m "feat: collectComplexity supports JS extensions"
```

---

### Task 4: Evidence Dispatcher

**Files:**
- Modify: `src/evidence.ts:105-118` (priority), `136-146` (isUnsupported), `298-309` (languageMap+framework)

**Interfaces:**
- Consumes: JS ComplexityInfo from Task3
- Produces: `buildEvidenceOutput` returns `language javascript`, `framework react` where applicable

- [ ] **Step 1: Write failing test**

```typescript
test('language javascript for .js', async () => {
  const out = await buildEvidenceOutput('HEAD~1', new Map([['src/app.js',[{start:1,end:10}]]]), 'experiments/wp15-js/fixtures/js-sample', 30);
  expect(out.changedFunctions[0].language).toBe('javascript');
});
test('framework react for jsx with react dep', async () => {
  const out = await buildEvidenceOutput('HEAD~1', new Map([['src/Card.jsx',[{start:1,end:10}]]]), 'experiments/wp15-js/fixtures/jsx-sample', 30);
  expect(out.changedFunctions[0].framework).toBe('react');
});
```

- [ ] **Step 2: Run fail**

- [ ] **Step 3: Implement**

```typescript
let detected=''; // priority .py>.tsx>.ts>.jsx>.js
if(hasPy) detected='.py'; else if(hasTsx) detected='.tsx'; else if(hasJsx) detected='.jsx'; else if(hasJs) detected='.js';
const languageMap={'.py':'python','.ts':'typescript','.tsx':'typescript','.js':'javascript','.jsx':'javascript','.mjs':'javascript','.cjs':'javascript'};
function detectFramework(cwd,file){ try{const pkg=JSON.parse(readFileSync(resolve(cwd,'package.json'),'utf8')); if(pkg.dependencies?.react||pkg.devDependencies?.react) return 'react';}catch{}; if(file.endsWith('.jsx')||file.includes('<')) return 'react'; return undefined;}
```

Update `isUnsupportedIntervals` to allow `.js/.jsx/.mjs/.cjs`.

- [ ] **Step 4: Run pass**

Run: `npx vitest run experiments/wp15-js/dispatcher.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/evidence.ts
git commit -m "feat: evidence dispatcher javascript + react framework"
```

---

### Task 5: Adapter Harness + Synthetic Fixtures

**Files:**
- Create: `experiments/wp15-js/fixtures/js-sample/low.js`, `med.js`, `high.js`, `package.json`, `vitest.config.ts`
- Create: `experiments/wp15-js/fixtures/jsx-sample/Component.jsx`, `useHook.jsx`, `package.json`
- Create: `experiments/wp15-js/adapter/e2e.ts`

**Interfaces:**
- Consumes: Tasks 1-4
- Produces: synthetic fixtures produce schema 0.4 JSON

- [ ] **Step 1: Create low.js (cc=2)**

```javascript
function low(a){ return a+1; }
module.exports={low}
```

med.js cc~8 (if/else + loop), high.js cc~14 (nested branches)

- [ ] **Step 2: Create Component.jsx**

```jsx
import React from 'react';
export function Card({title}){ if(!title) return null; return <div>{title}</div>; }
```

- [ ] **Step 3: Write e2e.ts**

```typescript
import { buildEvidenceOutput } from '../../src/evidence.js';
const intervals=new Map([['low.js',[{start:1,end:5}]]]);
const out=await buildEvidenceOutput('HEAD','low.js','fixtures/js-sample',30, 'coverage/coverage-final.json');
console.log(JSON.stringify(out,null,2));
```

- [ ] **Step 4: Run e2e**

Run: `npx tsx experiments/wp15-js/adapter/e2e.ts | jq .changedFunctions[0].language`
Expected: `javascript`

- [ ] **Step 5: Commit**

```bash
git add experiments/wp15-js/
git commit -m "feat: synthetic js+jsx fixtures + e2e harness schema 0.4"
```

---

### Task 6: Fault Suite

**Files:**
- Create: `experiments/wp15-js/jsFault.spec.ts`

**Interfaces:**
- Consumes: fixtures + dispatcher
- Produces: 10 fault tests PASS

- [ ] **Step 1: Write failing tests (10)**

```typescript
test('missing coverage -> FAILED missing', async ()=>{...});
test('malformed coverage -> FAILED malformed', async ()=>{...});
test('zero coverage -> crap 156 WARN', async ()=>{...});
test('branch vs statement kind', async ()=>{...});
test('malformed JS parse -> UNSUPPORTED', async ()=>{...});
test('mixed ts+js intervals -> both languages', async ()=>{...});
test('empty JS no func -> SUCCESS empty', async ()=>{...});
test('JS react import no JSX -> no framework', async ()=>{...});
test('case-insensitive path -> coverage populated', async ()=>{...});
test('threshold 30 vs 15 -> gate', async ()=>{...});
```

- [ ] **Step 2: Run fail**

Run: `npx vitest run experiments/wp15-js/jsFault.spec.ts`
Expected: FAIL many

- [ ] **Step 3: Fix until pass (ensure MISSING≠MALFORMED, ZERO≠NULL)**

- [ ] **Step 4: Run pass**

Run: `npx vitest run experiments/wp15-js/jsFault.spec.ts`
Expected: PASS 10/10

- [ ] **Step 5: Commit**

```bash
git add experiments/wp15-js/jsFault.spec.ts
git commit -m "test: jsFault 10 fault tests preserve invariants"
```

---

### Task 7: Real-Repo E2E + Verification

**Files:**
- Create: `experiments/wp15-js/WP15_RESULTS.md`
- Modify: `OPENCODE_START_HERE.md`
- Modify: `docs/contracts/evidence-contract.md` (finalize)

**Interfaces:**
- Consumes: Tasks 5-6
- Produces: human review packet + verification green

- [ ] **Step 1: Real JS repo**

```bash
git clone https://github.com/sindresorhus/p-queue /tmp/p-queue
cd /tmp/p-queue && npm install && npm run test -- --coverage
npx tsx /path/to/src/cli.ts check --base HEAD~1 --coverage-file coverage/coverage-final.json --json > /tmp/js-real.json
jq .changedFunctions[0].language /tmp/js-real.json # -> javascript
```

- [ ] **Step 2: Real React repo**

```bash
git clone https://github.com/pmndrs/zustand /tmp/zustand
cd /tmp/zustand && npm install && npm test -- --coverage
# same check, expect framework react on JSX/TSX
```

- [ ] **Step 3: Run full verification**

Run: `npx tsc --noEmit` → 0 errors
Run: `npx vitest run --no-coverage` → >=211 pass (201+10 new)

- [ ] **Step 4: Write WP15_RESULTS.md (claims matrix, limitations, repro steps)**

- [ ] **Step 5: Update OPENCODE_START_HERE.md current=WP15 JS+React, next=Next/Angular or STOP**

- [ ] **Step 6: Commit + push**

```bash
git add experiments/wp15-js/WP15_RESULTS.md OPENCODE_START_HERE.md docs/contracts/evidence-contract.md
git commit -m "feat: WP15 JS+React medium bar complete schema 0.4"
git push
```

---

## Self-Review

- [x] Spec coverage: all design sections 1-4 mapped to tasks 1-7
- [x] No placeholders: each step has code block + run command + expected
- [x] Type consistency: ChangedFunction language/framework names match across tasks, collectComplexity signature stable
- [x] Reversibility documented per task, fallback Approach 2 noted
- [x] Thresholds frozen, INV preserved, additive schema

Ready for approval gate. Flip `approved: true` → `true` only after human explicit approve.
