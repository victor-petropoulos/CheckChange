import * as path from 'node:path';
import { readFile, stat, realpath } from 'node:fs/promises';
import type { ChangedFunction, DiagnosticLineageEntry, DiagnosticQuality } from './evidence.js';
import type { RuleResult } from './rules.js';

/**
 * D2 baseline/delta sidecar: pure comparator over two EvidenceOutput runs
 * (schema 0.5). Emits DeltaOutput — an evidence diff, not a score diff.
 * Additive only: gate semantics frozen (Q6, mem:44649), schema 0.5 frozen,
 * no engine files touched. Same inputs -> byte-identical JSON (arrays sorted
 * by key, object keys in fixed literal order).
 */

// Structural view of EvidenceOutput v0.5 (buildEvidenceOutput is untyped in
// evidence.ts; shape per docs/contracts/evidence-contract.md).
export interface EvidenceOutput {
  schemaVersion: string;
  analysis: { base: string; target: string };
  changedFunctions: ChangedFunction[];
  policy: { crapThreshold: number };
  ruleResults: RuleResult[];
  analysisStatus: string;
  gate: string | null;
  completeness: string;
  coverageErrorReason?: string;
  diagnostics?: {
    lineage: DiagnosticLineageEntry[];
    quality: DiagnosticQuality;
    fingerprints?: Record<string, string>;
  };
}

export interface DeltaOutput {
  command: 'delta';
  schemaVersion: '0.5';
  inputs: {
    baseline: { base: string; analysisStatus: string; gate: string | null; changedFunctions: number };
    current: { base: string; analysisStatus: string; gate: string | null; changedFunctions: number };
    thresholds: { baseline: number; current: number; equal: boolean };
  };
  summary: {
    added: number;
    removed: number;
    changed: number;
    unchanged: number;
    gateTransition: string | null;
    completenessTransition: string | null;
  };
  functions: {
    added: Array<{ key: string; current: ChangedFunction; ruleResult?: RuleResult }>;
    removed: Array<{ key: string; baseline: ChangedFunction; ruleResult?: RuleResult }>;
    changed: Array<{
      key: string;
      baseline: ChangedFunction;
      current: ChangedFunction;
      fingerprintChanged: boolean;
      deltas: { cc: number | null; crap: number | null; coverage: number | null };
      ruleTransition: string | null;
    }>;
    unchanged: string[];
  };
  provenance?: {
    baseline: { lineage: DiagnosticLineageEntry[] | null; quality: DiagnosticQuality | null };
    current: { lineage: DiagnosticLineageEntry[] | null; quality: DiagnosticQuality | null };
  };
}

const MAX_SIZE = 100 * 1024 * 1024; // 100MB, mirrors lcovProvider.ts:11

/** Identity key: file:method:lineStart (src/evidence.ts:138 buildFingerprints). */
function keyFor(f: ChangedFunction): string {
  return `${f.file}:${f.method}:${f.lineStart}`;
}

function deltaOf(base: number | null, cur: number | null): number | null {
  // null vs 0 distinguished (INV-01, evidence-contract.md:159-161):
  // null on either side means "no evidence", not zero -> delta is null.
  if (base === null || cur === null) return null;
  return cur - base;
}

/**
 * Rule results keyed by file:method (RuleResult has no lineStart). Stores
 * ordered arrays per key, pushed in input order. Overloaded methods (same
 * file+method, different lineStart) collide on the key; positional
 * alignment resolves them: the i-th function visited in a group
 * (sorted-key order) is assigned the i-th rule (input order). Single
 * ruleId today (src/rules.ts:7), so within a group rules share ruleId
 * and differ only by result. Deterministic because input order is
 * deterministic per evidence contract. If rules run out for a group,
 * ruleResult is undefined (transition null).
 */
function ruleResultMap(results: RuleResult[]): Map<string, RuleResult[]> {
  const m = new Map<string, RuleResult[]>();
  for (const r of results) {
    const k = `${r.file}:${r.method}`;
    const arr = m.get(k);
    if (arr) arr.push(r);
    else m.set(k, [r]);
  }
  return m;
}

function transitionOf(base: string | undefined, cur: string | undefined): string | null {
  if (base === undefined || cur === undefined || base === cur) return null;
  return `${base}->${cur}`;
}

/** Trim lineage inputs: replace absolute-path string values with basename. */
function trimLineage(lineage: DiagnosticLineageEntry[] | undefined): DiagnosticLineageEntry[] | null {
  if (!lineage) return null;
  return lineage.map((e) => ({
    stage: e.stage,
    tool: e.tool,
    version: e.version,
    inputs: Object.fromEntries(
      Object.entries(e.inputs ?? {}).map(([k, v]) => [
        k,
        typeof v === 'string' && path.isAbsolute(v) ? path.basename(v) : v,
      ])
    ),
  }));
}

/** Pure comparator: no I/O, deterministic (all output arrays sorted by key). */
export function compareEvidenceOutputs(baseline: EvidenceOutput, current: EvidenceOutput): DeltaOutput {
  const baseByKey = new Map<string, ChangedFunction>();
  for (const f of baseline.changedFunctions ?? []) baseByKey.set(keyFor(f), f);
  const curByKey = new Map<string, ChangedFunction>();
  for (const f of current.changedFunctions ?? []) curByKey.set(keyFor(f), f);

  const baseRules = ruleResultMap(baseline.ruleResults ?? []);
  const curRules = ruleResultMap(current.ruleResults ?? []);
  const baseFp = baseline.diagnostics?.fingerprints;
  const curFp = current.diagnostics?.fingerprints;

  const added: DeltaOutput['functions']['added'] = [];
  const removed: DeltaOutput['functions']['removed'] = [];
  const changed: DeltaOutput['functions']['changed'] = [];
  const unchanged: string[] = [];

  // Positional rule consumption counters: within each file:method group,
  // the i-th function visited (sorted-key order) gets the i-th rule
  // (input order). See ruleResultMap doc comment.
  const baseRuleIdx = new Map<string, number>();
  const curRuleIdx = new Map<string, number>();

  const allKeys = [...new Set([...baseByKey.keys(), ...curByKey.keys()])].sort();
  for (const key of allKeys) {
    const b = baseByKey.get(key);
    const c = curByKey.get(key);
    // Derive ruleKey from object fields, not string split — file paths or
    // methods containing ':' (e.g. 'a:b.ts') would mis-split the identity key.
    const f = b ?? c;
    const ruleKey = f ? `${f.file}:${f.method}` : '';

    // Consume rule positionally. Counters increment for every function in
    // the group (including unchanged) to preserve alignment.
    const bi = b ? (baseRuleIdx.get(ruleKey) ?? 0) : 0;
    if (b) baseRuleIdx.set(ruleKey, bi + 1);
    const ci = c ? (curRuleIdx.get(ruleKey) ?? 0) : 0;
    if (c) curRuleIdx.set(ruleKey, ci + 1);

    const baseRR = b ? baseRules.get(ruleKey)?.[bi] : undefined;
    const curRR = c ? curRules.get(ruleKey)?.[ci] : undefined;

    if (!b && c) {
      added.push({ key, current: c, ...(curRR ? { ruleResult: curRR } : {}) });
      continue;
    }
    if (b && !c) {
      removed.push({ key, baseline: b, ...(baseRR ? { ruleResult: baseRR } : {}) });
      continue;
    }
    if (!b || !c) continue;

    const fpB = baseFp?.[key];
    const fpC = curFp?.[key];
    let fingerprintChanged = false;
    let isChanged: boolean;
    if (fpB !== undefined && fpC !== undefined) {
      fingerprintChanged = fpB !== fpC;
      isChanged = fingerprintChanged;
    } else {
      // Pre-0.5 artifacts lack fingerprints: degrade to field comparison.
      isChanged =
        b.cc !== c.cc || b.crap !== c.crap || b.coverage !== c.coverage || b.lineEnd !== c.lineEnd;
    }
    if (!isChanged) {
      unchanged.push(key);
      continue;
    }
    changed.push({
      key,
      baseline: b,
      current: c,
      fingerprintChanged,
      deltas: {
        cc: deltaOf(b.cc, c.cc),
        crap: deltaOf(b.crap, c.crap),
        coverage: deltaOf(b.coverage, c.coverage),
      },
      ruleTransition: transitionOf(baseRR?.result, curRR?.result),
    });
  }

  const gateTransition =
    baseline.gate === current.gate ? null : `${baseline.gate}->${current.gate}`;
  const completenessTransition =
    baseline.completeness === current.completeness
      ? null
      : `${baseline.completeness}->${current.completeness}`;

  const hasProvenance = baseline.diagnostics !== undefined || current.diagnostics !== undefined;

  return {
    command: 'delta',
    schemaVersion: '0.5',
    inputs: {
      baseline: {
        base: baseline.analysis.base,
        analysisStatus: baseline.analysisStatus,
        gate: baseline.gate,
        changedFunctions: baseByKey.size,
      },
      current: {
        base: current.analysis.base,
        analysisStatus: current.analysisStatus,
        gate: current.gate,
        changedFunctions: curByKey.size,
      },
      thresholds: {
        baseline: baseline.policy.crapThreshold,
        current: current.policy.crapThreshold,
        equal: baseline.policy.crapThreshold === current.policy.crapThreshold,
      },
    },
    summary: {
      added: added.length,
      removed: removed.length,
      changed: changed.length,
      unchanged: unchanged.length,
      gateTransition,
      completenessTransition,
    },
    functions: { added, removed, changed, unchanged },
    ...(hasProvenance
      ? {
          provenance: {
            baseline: {
              lineage: trimLineage(baseline.diagnostics?.lineage),
              quality: baseline.diagnostics?.quality ?? null,
            },
            current: {
              lineage: trimLineage(current.diagnostics?.lineage),
              quality: current.diagnostics?.quality ?? null,
            },
          },
        }
      : {}),
  };
}

/**
 * Path containment check (prevents traversal). Replicated from
 * src/coverage.ts:25 — that copy is module-private (not exported).
 * Handles macOS /tmp -> /private/tmp symlink via realpath.
 */
async function isWithinCwd(filePath: string, cwd: string): Promise<boolean> {
  if (!path.isAbsolute(filePath)) {
    filePath = path.resolve(cwd, filePath);
  }
  try {
    const realFilePath = await realpath(filePath);
    const realCwd = await realpath(cwd);
    const rel = path.relative(realCwd, realFilePath);
    return !rel.startsWith('..') && !path.isAbsolute(rel);
  } catch {
    const rel = path.relative(cwd, filePath);
    return !rel.startsWith('..') && !path.isAbsolute(rel);
  }
}

async function readEvidenceFile(filePath: string, cwd: string): Promise<EvidenceOutput> {
  if (!(await isWithinCwd(filePath, cwd))) {
    throw new Error(`delta: input path escapes cwd: ${filePath}`);
  }
  const stats = await stat(filePath);
  if (stats.size > MAX_SIZE) {
    throw new Error(`delta: input exceeds maximum allowed size of ${MAX_SIZE} bytes: ${filePath}`);
  }
  return JSON.parse(await readFile(filePath, 'utf8')) as EvidenceOutput;
}

/** File-pair mode: read two EvidenceOutput JSON files with guards, compare. */
export async function compareFromFiles(
  baselinePath: string,
  currentPath: string,
  cwd: string = process.cwd()
): Promise<DeltaOutput> {
  const [baseline, current] = await Promise.all([
    readEvidenceFile(baselinePath, cwd),
    readEvidenceFile(currentPath, cwd),
  ]);
  return compareEvidenceOutputs(baseline, current);
}
