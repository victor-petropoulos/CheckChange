import { describe, expect, test } from 'vitest';
import { readFileSync } from 'node:fs';
import { compareEvidenceOutputs, compareFromFiles } from '../src/delta.js';

// Fixture evidence files (frozen EvidenceOutput v0.5 shape) live INSIDE the
// repo under test/fixtures/ — compareFromFiles rejects any path escaping cwd.
const FIXTURES = 'test/fixtures';

function loadFixture(name: string): any {
  return JSON.parse(readFileSync(`${FIXTURES}/${name}`, 'utf8'));
}

const BASELINE_A = loadFixture('delta-baseline-a.json');
const CURRENT_B = loadFixture('delta-current-b.json');
const PRE05_BASELINE = loadFixture('delta-pre05-baseline.json');
const PRE05_CURRENT = loadFixture('delta-pre05-current.json');

describe('delta compareEvidenceOutputs', () => {
  test('added/removed/changed/unchanged classified by file:method:lineStart key', () => {
    const delta = compareEvidenceOutputs(BASELINE_A, CURRENT_B) as any;
    expect(delta.summary).toMatchObject({ added: 1, removed: 1, changed: 3, unchanged: 2 });
    expect(delta.functions.added.map((f: any) => f.key)).toEqual(['src/new.ts:webhook:300']);
    expect(delta.functions.removed.map((f: any) => f.key)).toEqual(['src/auth.ts:login:10']);
    // Output arrays sorted by key for byte-identical determinism
    expect(delta.functions.changed.map((f: any) => f.key)).toEqual([
      'src/app.ts:audit:200',
      'src/app.ts:handleRefund:120',
      'src/billing.ts:chargeCard:40',
    ]);
    expect(delta.functions.unchanged).toEqual([
      'src/app.ts:handleOrder:85',
      'src/legacy.ts:oldParser:200',
    ]);
  });

  test('fingerprint change detected even when crap delta is 0', () => {
    const delta = compareEvidenceOutputs(BASELINE_A, CURRENT_B) as any;
    const chargeCard = delta.functions.changed.find((f: any) => f.key === 'src/billing.ts:chargeCard:40');
    expect(chargeCard.fingerprintChanged).toBe(true);
    expect(chargeCard.deltas).toEqual({ cc: 0, crap: 0, coverage: null });
  });

  test('null vs 0 coverage deltas (INV-01): null→0 and 0→null produce null, not 0', () => {
    const delta = compareEvidenceOutputs(BASELINE_A, CURRENT_B) as any;
    // audit: baseline coverage null, current 0 -> delta null (INV-01)
    const audit = delta.functions.changed.find((f: any) => f.key === 'src/app.ts:audit:200');
    expect(audit.deltas.coverage).toBeNull();
    // chargeCard: baseline coverage 0, current null -> delta null
    const chargeCard = delta.functions.changed.find((f: any) => f.key === 'src/billing.ts:chargeCard:40');
    expect(chargeCard.deltas.coverage).toBeNull();
    // numeric delta preserved for real numbers
    const refund = delta.functions.changed.find((f: any) => f.key === 'src/app.ts:handleRefund:120');
    expect(refund.deltas.coverage).toBe(-0.5);
  });

  test('rule result transitions PASS<->WARN<->NOT_EVALUATED per function', () => {
    const delta = compareEvidenceOutputs(BASELINE_A, CURRENT_B) as any;
    const base = (k: string) => delta.functions.changed.find((f: any) => f.key === k).ruleTransition;
    expect(base('src/app.ts:handleRefund:120')).toBe('WARN->PASS');
    expect(base('src/billing.ts:chargeCard:40')).toBe('WARN->NOT_EVALUATED');
    // added: no baseline -> no transition, carries current ruleResult
    const added = delta.functions.added[0];
    expect(added.ruleResult).toMatchObject({ result: 'WARN', method: 'webhook' });
    // removed: carries baseline ruleResult
    const removed = delta.functions.removed[0];
    expect(removed.ruleResult).toMatchObject({ result: 'NOT_EVALUATED', method: 'login' });
  });

  test('aggregate gateTransition/completenessTransition informational only (Q6 mem:44649)', () => {
    const delta = compareEvidenceOutputs(BASELINE_A, CURRENT_B) as any;
    expect(delta.summary.gateTransition).toBe('WARN->PASS');
    expect(delta.summary.completenessTransition).toBe(
      'git+complexity+coverage+rules->git+complexity+coverage+rules+attribution'
    );
    // no gate mutation: DeltaOutput carries no top-level gate field
    expect('gate' in delta).toBe(false);
    expect('completeness' in delta).toBe(false);
    expect('coverageErrorReason' in delta).toBe(false);
    expect('schemaVersion' in delta).toBe(true);
    expect(delta.schemaVersion).toBe('0.5');
  });

  test('threshold mismatch surfaced via thresholds.equal, no normalization', () => {
    const delta = compareEvidenceOutputs(BASELINE_A, CURRENT_B) as any;
    expect(delta.inputs.thresholds).toEqual({ baseline: 30, current: 40, equal: false });
    // rule transitions still verbatim; no threshold re-derivation
    const refund = delta.functions.changed.find((f: any) => f.key === 'src/app.ts:handleRefund:120');
    expect(refund.deltas.crap).toBe(5);
    expect(refund.ruleTransition).toBe('WARN->PASS');
  });

  test('inputs echo baseline/current metadata', () => {
    const delta = compareEvidenceOutputs(BASELINE_A, CURRENT_B) as any;
    expect(delta.inputs.baseline).toEqual({
      base: 'HEAD',
      analysisStatus: 'complete',
      gate: 'WARN',
      changedFunctions: 6,
    });
    expect(delta.inputs.current).toEqual({
      base: 'HEAD',
      analysisStatus: 'complete',
      gate: 'PASS',
      changedFunctions: 6,
    });
  });

  test('pre-0.5 artifacts (missing diagnostics) degrade gracefully, still structural diff', () => {
    const delta = compareEvidenceOutputs(PRE05_BASELINE, PRE05_CURRENT) as any;
    expect(delta.provenance).toBeUndefined();
    expect(delta.functions.added.map((f: any) => f.key)).toEqual(['src/p.ts:e:200']);
    expect(delta.functions.removed.map((f: any) => f.key)).toEqual(['src/p.ts:d:100']);
    expect(delta.functions.changed.map((f: any) => f.key)).toEqual(['src/p.ts:b:10', 'src/p.ts:c:50']);
    expect(delta.functions.unchanged).toEqual(['src/p.ts:a:1']);
    const b = delta.functions.changed.find((f: any) => f.key === 'src/p.ts:b:10');
    // no fingerprints -> degrade to field comparison, fingerprintChanged false
    expect(b.fingerprintChanged).toBe(false);
    expect(b.deltas).toEqual({ cc: 1, crap: 10, coverage: -0.5 });
    // null->0 still null delta in degrade mode
    const c = delta.functions.changed.find((f: any) => f.key === 'src/p.ts:c:50');
    expect(c.deltas.coverage).toBeNull();
  });

  test('twin-run determinism: compare twice -> byte-identical JSON', () => {
    const r1 = compareEvidenceOutputs(BASELINE_A, CURRENT_B);
    const r2 = compareEvidenceOutputs(BASELINE_A, CURRENT_B);
    expect(JSON.stringify(r1)).toBe(JSON.stringify(r2));
  });

  test('compareFromFiles reads in-cwd fixtures, matches pure compare', async () => {
    const fromFiles = await compareFromFiles('test/fixtures/delta-baseline-a.json', 'test/fixtures/delta-current-b.json');
    const pure = compareEvidenceOutputs(BASELINE_A, CURRENT_B);
    expect(JSON.stringify(fromFiles)).toBe(JSON.stringify(pure));
  });

  test('compareFromFiles rejects paths escaping cwd', async () => {
    await expect(compareFromFiles('../outside-baseline.json', 'test/fixtures/delta-current-b.json'))
      .rejects.toThrow('delta: input path escapes cwd');
    await expect(compareFromFiles('test/fixtures/delta-baseline-a.json', '../outside-current.json'))
      .rejects.toThrow('delta: input path escapes cwd');
  });
});

// ---------------------------------------------------------------------------
// Regression: colon-path and overload rule mapping (Engram rev-1789271072469-3)
// Locks two reviewer-low fixes: colon-safe ruleKey derivation + positional
// consumption for overloaded methods. mem:44649 (Q6 — evidence diff, not score).
// ---------------------------------------------------------------------------

import type { EvidenceOutput } from '../src/delta.js';
import type { ChangedFunction } from '../src/evidence.js';
import type { RuleResult } from '../src/rules.js';

/** Minimal EvidenceOutput v0.5 with fingerprints for change detection. */
function evidence(
  fns: ChangedFunction[],
  rules: RuleResult[],
  fingerprints?: Record<string, string>,
): EvidenceOutput {
  return {
    schemaVersion: '0.5',
    analysis: { base: 'HEAD', target: 'HEAD~1' },
    changedFunctions: fns,
    policy: { crapThreshold: 30 },
    ruleResults: rules,
    analysisStatus: 'complete',
    gate: 'PASS',
    completeness: 'git+complexity+coverage+rules',
    diagnostics: {
      lineage: [],
      quality: { coverage: 'DIRECT', complexity: 'NATIVE', score: 80, stageComplete: {} as any },
      fingerprints,
    },
  };
}

function cf(file: string, method: string, lineStart: number, extra?: Partial<ChangedFunction>): ChangedFunction {
  return {
    file, method, lineStart,
    lineEnd: lineStart + 10,
    cc: 5, crap: 10, coverage: 0.8,
    coverageKind: 'line',
    analyzerStatus: 'passed',
    source: { tool: 'checkchange', version: '0.4.0' },
    ...extra,
  };
}

function rr(file: string, method: string, result: RuleResult['result'], extra?: Partial<RuleResult>): RuleResult {
  return {
    ruleId: 'changed-function-high-crap',
    result, file, method,
    crap: 10, threshold: 30, cc: 5, coverage: 0.8,
    ...extra,
  };
}

/** Identity key: file:method:lineStart (mirrors keyFor in src/delta.ts:71). */
function idKey(f: { file: string; method: string; lineStart: number }): string {
  return `${f.file}:${f.method}:${f.lineStart}`;
}

describe('regression: colon-path and overload rule mapping (Engram rev-1789271072469-3)', () => {
  test('colon in file path (a:b.ts) gets correct ruleTransition, not misattributed', () => {
    const fn = cf('a:b.ts', 'doStuff', 10);
    const base = evidence([fn], [rr('a:b.ts', 'doStuff', 'PASS')], { [idKey(fn)]: 'fp-base' });
    const cur = evidence([fn], [rr('a:b.ts', 'doStuff', 'WARN')], { [idKey(fn)]: 'fp-cur' });
    const delta = compareEvidenceOutputs(base, cur) as any;

    expect(delta.functions.changed).toHaveLength(1);
    expect(delta.functions.changed[0].key).toBe('a:b.ts:doStuff:10');
    expect(delta.functions.changed[0].ruleTransition).toBe('PASS->WARN');
  });

  test('two overloads same file+method get positional rules, not first-wins', () => {
    const fn1 = cf('x.ts', 'run', 10);
    const fn2 = cf('x.ts', 'run', 50);
    // Baseline rules: index 0 = PASS, index 1 = WARN
    const baseRules = [rr('x.ts', 'run', 'PASS'), rr('x.ts', 'run', 'WARN')];
    // Current rules: index 0 = NOT_EVALUATED, index 1 = PASS
    const curRules = [rr('x.ts', 'run', 'NOT_EVALUATED'), rr('x.ts', 'run', 'PASS')];
    const fpBase = { [idKey(fn1)]: 'fp1-b', [idKey(fn2)]: 'fp2-b' };
    const fpCur = { [idKey(fn1)]: 'fp1-c', [idKey(fn2)]: 'fp2-c' };
    const base = evidence([fn1, fn2], baseRules, fpBase);
    const cur = evidence([fn1, fn2], curRules, fpCur);
    const delta = compareEvidenceOutputs(base, cur) as any;

    expect(delta.functions.changed).toHaveLength(2);
    // Sorted by key: x.ts:run:10 < x.ts:run:50
    const r10 = delta.functions.changed.find((f: any) => f.key === 'x.ts:run:10');
    const r50 = delta.functions.changed.find((f: any) => f.key === 'x.ts:run:50');
    // Positional: lineStart=10 → rule[0] (PASS→NOT_EVALUATED), lineStart=50 → rule[1] (WARN→PASS)
    expect(r10.ruleTransition).toBe('PASS->NOT_EVALUATED');
    expect(r50.ruleTransition).toBe('WARN->PASS');
  });

  test('exhaustion: two overloads but one rule — second gets null transition, no crash', () => {
    const fn1 = cf('y.ts', 'go', 10);
    const fn2 = cf('y.ts', 'go', 50);
    // Only one rule for two overloads
    const baseRules = [rr('y.ts', 'go', 'PASS')];
    const curRules = [rr('y.ts', 'go', 'WARN')];
    const fpBase = { [idKey(fn1)]: 'a', [idKey(fn2)]: 'b' };
    const fpCur = { [idKey(fn1)]: 'a2', [idKey(fn2)]: 'b2' };
    const base = evidence([fn1, fn2], baseRules, fpBase);
    const cur = evidence([fn1, fn2], curRules, fpCur);
    const delta = compareEvidenceOutputs(base, cur) as any;

    expect(delta.functions.changed).toHaveLength(2);
    const r10 = delta.functions.changed.find((f: any) => f.key === 'y.ts:go:10');
    const r50 = delta.functions.changed.find((f: any) => f.key === 'y.ts:go:50');
    // First overload: rule[0] exists → PASS->WARN
    expect(r10.ruleTransition).toBe('PASS->WARN');
    // Second overload: rule[1] undefined → null transition (no crash)
    expect(r50.ruleTransition).toBeNull();
  });
});