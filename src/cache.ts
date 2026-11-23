// Incremental analysis cache (Experiment C, task C-3).
// Deterministic two-tier key cache: per-file complexity entries, per-run
// coverage entries, whole-run shard records. Never stale: ANY uncertainty
// (missing file, parse failure, key mismatch, oversized entry, guard failure,
// expired TTL) is a miss and the caller recomputes. Failures fall back to
// fresh computation; cache IO never throws and never logs. (mem:44542 §8)

import * as path from 'node:path';
import * as fsSync from 'node:fs';
import { createHash } from 'node:crypto';
import { access, constants, mkdir, readFile, readdir, rename, rm, stat, unlink, utimes, writeFile, realpath, chmod } from 'node:fs/promises';
import { openWithinRoot } from './fs-safety.js';
import { findAllTypeScriptFilesUnderSourceRoots, parseFileMethods } from '@barney-media/crap-typescript-core';
import { getGitTrackedCodeFiles, complexityProvenance } from './complexity.js';
import type { ComplexityInfo } from './complexity.js';
import { readCoverage, coverageProvenance, scanCoberturaUnderTestResults, mergeCoverageMaps, type CoverageResult } from './coverage.js';
import type { TraceRun } from './execute.js';
import { registerProvider, providerRegistry, getProvider } from './evidence.js';

// Value type of the coverage Map, derived from CoverageResult rather than
// exported from coverage.ts (same idiom as coverage.ts:10).
type CoverageMap = NonNullable<CoverageResult['coverageMap']>;

export const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days, mtime-based (no clock in key)
export const MAX_CACHE_TOTAL_BYTES = 500 * 1024 * 1024; // 500MB total, LRU-pruned on write-through
export const MAX_CACHE_ENTRY_BYTES = 10 * 1024 * 1024; // 10MB per entry file; larger reads are misses
const TMP_STALE_MS = 24 * 60 * 60 * 1000; // tmp.<pid> leftovers older than this are swept

export type MissReason = 'absent' | 'expired' | 'corrupt' | 'oversized' | 'guard';

export type CacheLookup<T> =
  | { hit: true; value: T }
  | { hit: false; value: T; reason: MissReason };

/** Run-shard key inputs (all values from the current run — deterministic). */
export interface RunKeyInputs {
  fileKeys: string[];
  coverageHash: string; // C-2 semantics: hex | 'absent' | 'malformed:<reason>'
  threshold: number;
  engine: string; // C-2 engineIdentity(): own-repo HEAD or version fallback
  base: string;
  intervalsSha256: string;
}

export type CacheKeyInput =
  | { kind: 'file'; fileContent: string; providerVersion: string; changedFilesHash?: string }
  | { kind: 'coverage'; coverageHash: string; providerVersion: string }
  | ({ kind: 'run' } & RunKeyInputs);

function sha256Hex(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

/**
 * Containment guard: candidate must resolve (realpath) inside root. Handles
 * symlinked roots (macOS /tmp -> /private/tmp); realpath failure falls back to a
 * lexical check, which is also what makes the check usable BEFORE the path
 * exists (a not-yet-created cache `entries/` dir still passes).
 *
 * Best-effort, not a proof: the realpath arm and the caller's subsequent
 * mkdir/chmod/write are separate operations, so a swap between them is not
 * covered here. Callers must still validate every path they are about to use.
 */
async function isWithin(candidate: string, root: string): Promise<boolean> {
  try {
    const realCandidate = await realpath(candidate);
    const realRoot = await realpath(root);
    const rel = path.relative(realRoot, realCandidate);
    return !rel.startsWith('..') && !path.isAbsolute(rel);
  } catch {
    const rel = path.relative(root, candidate);
    return !rel.startsWith('..') && !path.isAbsolute(rel);
  }
}

/**
 * Cache root resolution and the allowed-root rule:
 * - Default: realpath(cwd)/.checkchange/cache — always inside the analyzed repo.
 * - CHECKCHANGE_CACHE_DIR override: must be an ABSOLUTE path whose realpath
 *   resolves. It MAY live outside cwd (operator explicitly opts in, e.g. a CI
 *   shared cache dir); "escaping the allowed root" therefore means an ENTRY
 *   escaping the resolved root — every cache path is isWithin-checked against
 *   the resolved root on read and write, so symlinked or swapped entries that
 *   resolve outside it are rejected as misses ('guard'). Relative overrides and
 *   unresolvable paths are rejected outright (null => caching disabled).
 */
export function resolveCacheRoot(cwd: string, env: NodeJS.ProcessEnv = process.env): string | null {
  const override = env.CHECKCHANGE_CACHE_DIR;
  try {
    if (override !== undefined && override !== '') {
      if (!path.isAbsolute(override)) return null;
      return fsSync.realpathSync(override);
    }
    return path.join(fsSync.realpathSync(cwd), '.checkchange', 'cache');
  } catch {
    return null;
  }
}

// ---- Key derivation (deterministic; fixed property order in all templates) ----

/** Tier (a): per-file complexity entry key = sha256(fileContent) + provider version, plus optional changed-file scope. */
export function complexityFileKey(fileContent: string, providerVersion: string, changedFilesHash?: string): string {
  const base = `${sha256Hex(fileContent)}:${providerVersion}`;
  return changedFilesHash === undefined ? base : `${base}:changed:${changedFilesHash}`;
}

/** Tier (b): per-run coverage entry key = coverage artifact hash + ':' + provider version. */
export function coverageEntryKey(coverageHash: string, providerVersion: string): string {
  return `${coverageHash}:${providerVersion}`;
}

/** Whole-run shard: sha256 over canonical JSON, sliced to 12 hex chars for the filename. */
export function runShardKey(inputs: RunKeyInputs): string {
  const canonical = JSON.stringify({
    base: inputs.base,
    coverageHash: inputs.coverageHash,
    engine: inputs.engine,
    fileKeys: [...inputs.fileKeys].sort(),
    intervalsSha256: inputs.intervalsSha256,
    threshold: String(inputs.threshold),
  });
  return sha256Hex(canonical).slice(0, 12);
}

function describeKey(root: string, key: CacheKeyInput): { filePath: string; keyString: string } {
  if (key.kind === 'file') {
    const keyString = complexityFileKey(key.fileContent, key.providerVersion, key.changedFilesHash);
    return { filePath: path.join(root, 'entries', `${sha256Hex(keyString)}.json`), keyString };
  }
  if (key.kind === 'coverage') {
    const keyString = coverageEntryKey(key.coverageHash, key.providerVersion);
    return { filePath: path.join(root, 'entries', `${sha256Hex(keyString)}.json`), keyString };
  }
  const shard = runShardKey(key);
  return { filePath: path.join(root, 'runs', `${shard}.json`), keyString: `run:${shard}` };
}

// ---- Storage ----

async function bestEffortUnlink(p: string): Promise<boolean> {
  try {
    await unlink(p);
    return true;
  } catch {
    return false;
  }
}

async function readEntry<T>(filePath: string, keyString: string, root: string):
  Promise<{ ok: true; value: T } | { ok: false; reason: MissReason }> {
  let handle;
  try {
    handle = await openWithinRoot(root, filePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT' || (error as NodeJS.ErrnoException).code === 'ENOTDIR') {
      return { ok: false, reason: 'absent' };
    }
    if (error instanceof Error && error.message.startsWith('openWithinRoot: candidate')) {
      return { ok: false, reason: 'guard' };
    }
    return { ok: false, reason: 'corrupt' };
  }

  let raw: string;
  try {
    const st = await handle.stat();
    if (st.size > MAX_CACHE_ENTRY_BYTES) {
      await bestEffortUnlink(filePath);
      return { ok: false, reason: 'oversized' };
    }
    if (Date.now() - st.mtimeMs > CACHE_TTL_MS) {
      await bestEffortUnlink(filePath);
      return { ok: false, reason: 'expired' };
    }
    raw = await handle.readFile('utf8');
  } catch {
    return { ok: false, reason: 'corrupt' };
  } finally {
    await handle.close().catch(() => undefined);
  }

  let parsed: { key: string; value: T } | null = null;
  try {
    const p: unknown = JSON.parse(raw);
    if (typeof p === 'object' && p !== null && 'key' in p && 'value' in p) {
      const rec = p as { key: unknown; value: unknown };
      if (typeof rec.key === 'string') parsed = { key: rec.key, value: rec.value as T };
    }
  } catch {
    // fall through to corrupt
  }
  if (parsed === null || parsed.key !== keyString) {
    await bestEffortUnlink(filePath);
    return { ok: false, reason: 'corrupt' };
  }
  return { ok: true, value: parsed.value };
}

/**
 * Atomic write: tmp.<pid> (0600) + rename; containment-checked; never throws.
 *
 * Order matters: containment of the parent dir is settled BEFORE the first
 * mutating op, so a `filePath` whose parent resolves outside `root` returns
 * false having created nothing (no mkdir, no chmod, no tmp file). Both rename
 * endpoints are re-checked after the write because either can be swapped
 * between the precheck and the rename. The guard is best-effort — see isWithin.
 *
 * `flag: 'wx'` is the other half of that ordering: O_EXCL fails the tmp create
 * with EEXIST when anything already holds that name, so a symlink planted at
 * tmp is never written THROUGH — the link target is untouched. The catch arm
 * unlinks the name (unlink never follows a symlink), so a later write retries
 * on a clean slot. A stale tmp left by a crashed run costs one skipped write.
 */
async function writeEntry(filePath: string, root: string, payload: { key: string; value: unknown }): Promise<boolean> {
  const tmp = `${filePath}.tmp.${process.pid}`;
  const dir = path.dirname(filePath);
  try {
    if (!(await isWithin(dir, root))) return false;
    await mkdir(dir, { recursive: true, mode: 0o700 });
    // Strict perms regardless of umask: mkdir mode is masked by umask, chmod is not.
    await chmod(dir, 0o700);
    await chmod(root, 0o700); // cache root itself — root passed explicitly, no dirname guessing
    await writeFile(tmp, JSON.stringify(payload), { mode: 0o600, flag: 'wx' });
    await chmod(tmp, 0o600);
    if (!(await isWithin(tmp, root)) || !(await isWithin(filePath, root))) {
      await bestEffortUnlink(tmp);
      return false;
    }
    await rename(tmp, filePath);
    return true;
  } catch {
    await bestEffortUnlink(tmp);
    return false;
  }
}

/** Bump atime AND mtime on hit: LRU ordering + TTL refresh. Best effort. */
async function bumpTimes(filePath: string): Promise<void> {
  const now = new Date();
  try {
    await utimes(filePath, now, now);
  } catch {
    // best effort
  }
}

/** TTL sweep + stale-tmp sweep + 500MB LRU prune. Runs on write-through; never throws. */
async function prune(root: string): Promise<void> {
  const files: { p: string; atimeMs: number; size: number }[] = [];
  const now = Date.now();
  for (const dir of [path.join(root, 'entries'), path.join(root, 'runs')]) {
    let names: string[];
    try {
      names = await readdir(dir);
    } catch {
      continue;
    }
    for (const name of names) {
      const p = path.join(dir, name);
      try {
        if (!(await isWithin(p, root))) continue; // defense in depth: skip paths escaping root
        const st = await stat(p);
        if (!st.isFile()) continue;
        if (name.includes('.tmp.') && now - st.mtimeMs > TMP_STALE_MS) {
          await bestEffortUnlink(p);
          continue;
        }
        if (now - st.mtimeMs > CACHE_TTL_MS) {
          await bestEffortUnlink(p);
          continue;
        }
        files.push({ p, atimeMs: st.atimeMs, size: st.size });
      } catch {
        continue;
      }
    }
  }
  let total = 0;
  for (const f of files) total += f.size;
  if (total <= MAX_CACHE_TOTAL_BYTES) return;
  files.sort((a, b) => a.atimeMs - b.atimeMs); // least-recently-accessed first
  for (const f of files) {
    if (total <= MAX_CACHE_TOTAL_BYTES) break;
    if (await bestEffortUnlink(f.p)) total -= f.size;
  }
}

// ---- Public API ----

/**
 * Lookup `key` in the cache; on miss (or any uncertainty) run `compute`,
 * write through, and return the computed value with `hit: false`.
 * Value must be JSON-serializable (the cache stores `{key, value}` as JSON).
 * Never throws on cache IO; `compute` errors propagate to the caller.
 */
export async function getOrCompute<T>(
  cwd: string,
  key: CacheKeyInput,
  compute: () => T | Promise<T>,
): Promise<CacheLookup<T>> {
  const root = resolveCacheRoot(cwd);
  if (root === null) {
    const value = await compute();
    return { hit: false, value, reason: 'guard' };
  }
  const { filePath, keyString } = describeKey(root, key);
  const read = await readEntry<T>(filePath, keyString, root);
  if (read.ok) {
    await bumpTimes(filePath);
    return { hit: true, value: read.value };
  }
  const value = await compute();
  const wrote = await writeEntry(filePath, root, { key: keyString, value });
  if (wrote) await prune(root);
  return { hit: false, value, reason: read.reason };
}

/** Wipe the resolved cache dir. Returns false when the root is unusable. */
export async function clear(cwd: string, env: NodeJS.ProcessEnv = process.env): Promise<boolean> {
  const root = resolveCacheRoot(cwd, env);
  if (root === null) return false;
  try {
    await rm(root, { recursive: true, force: true });
    return true;
  } catch {
    return false;
  }
}

// ---- cached providers (Experiment C, C-4 seam moved from cli.ts) ----
// Re-registers JS/TS extensions (per-file complexity cache via parseFileMethods)
// and .py (coverage cache only). Parse/conversion failures collect into a
// warnings buffer instead of console output — the CLI decides routing.

type CoverageMapValue = NonNullable<CoverageResult['coverageMap']> extends Map<string, infer V> ? V : never;

/** Coverage cache payload: CoverageResult with the Map serialized to entries. */
export interface CachedCoverageValue extends Omit<CoverageResult, 'coverageMap'> {
  coverageEntries: [string, CoverageMapValue][] | null;
}

const cacheWarnings: string[] = [];
export function getCacheWarnings(): readonly string[] {
  return cacheWarnings;
}
export function clearCacheWarnings(): void {
  cacheWarnings.length = 0;
}

async function cachedTsCollectComplexity(
  cwd: string,
  _trace?: TraceRun,
  changedFiles?: ReadonlySet<string>,
): Promise<ComplexityInfo[]> {
  const sourceRoots = await findAllTypeScriptFilesUnderSourceRoots(cwd);
  const fileSet = new Set<string>([...sourceRoots, ...getGitTrackedCodeFiles(cwd)]);
  const changedFilesHash = changedFiles
    ? sha256Hex(JSON.stringify([...changedFiles].sort()))
    : undefined;
  const results: ComplexityInfo[] = [];
  for (const filePath of fileSet) {
    const rel = path.relative(cwd, filePath).replace(/\\/g, '/');
    if (changedFiles && !changedFiles.has(rel)) continue;
    try {
      const content = await readFile(filePath, 'utf8');
      const key: CacheKeyInput = {
        kind: 'file',
        fileContent: content,
        providerVersion: complexityProvenance.version,
        ...(changedFilesHash === undefined ? {} : { changedFilesHash }),
      };
      const lookup = await getOrCompute(cwd, key, async () => {
        const methods = await parseFileMethods(filePath);
        return methods.map((d) => ({
          file: rel,
          method: d.containerName ? `${d.containerName}.${d.functionName}` : d.functionName,
          lineStart: d.startLine,
          lineEnd: d.endLine,
          cc: d.complexity,
        }));
      });
      results.push(...lookup.value);
    } catch (err) {
      cacheWarnings.push(`Warning: failed to parse ${filePath}, skipping: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  return results;
}

async function cachedReadCoveragePath(coveragePath: string, cwd: string): Promise<CoverageResult> {
  try {
    const content = await readFile(coveragePath);
    const coverageHash = createHash('sha256').update(content).digest('hex');
    const key: CacheKeyInput = { kind: 'coverage', coverageHash, providerVersion: coverageProvenance.version };
    const lookup = await getOrCompute<CachedCoverageValue>(cwd, key, async () => {
      const result = await readCoverage(cwd, coveragePath);
      const value: CachedCoverageValue = {
        available: result.available,
        coverageEntries: result.coverageMap ? [...result.coverageMap.entries()] : null,
        error: result.error,
      };
      if (result.reason !== undefined) value.reason = result.reason;
      if (result.contentSha256 !== undefined) value.contentSha256 = result.contentSha256;
      return value;
    });
    const out: CoverageResult = {
      available: lookup.value.available,
      coverageMap: lookup.value.coverageEntries ? new Map(lookup.value.coverageEntries) : null,
      error: lookup.value.error,
    };
    if (lookup.value.reason !== undefined) out.reason = lookup.value.reason;
    if (lookup.value.contentSha256 !== undefined) out.contentSha256 = lookup.value.contentSha256;
    return out;
  } catch (err) {
    // ponytail: never throw out of the cached path — degrade to the error shape
    // readCoverageFile uses; the cache simply misses.
    return { available: false, coverageMap: null, error: true, reason: err instanceof Error ? err.message : String(err) };
  }
}

// ponytail: extracted candidate-search loop from cachedReadCoverage to reduce CRAP.
// Iterates coverageCandidates; ACCUMULATES every accessible, non-error result and
// reduces them with mergeCoverageMaps in scan order — the same accumulate-then-reduce
// seam the uncached readCoverage applies (src/coverage.ts, WS2.1). A repo emitting
// more than one coverage format (Coverlet Cobertura + an Istanbul coverage.json) had
// every artifact after the first silently dropped on this path too.
//
// Symmetry is trivial here because the cache is keyed PER ARTIFACT
// (`{kind:'coverage', coverageHash}` over one file's bytes, :390-391): each component
// is cached and invalidated independently by its own artifact hash, and the merge
// happens in memory after the per-artifact lookup — so merging cannot serve a stale
// union that no single artifact's hash would have invalidated.
//
// @lineage mirrors readCoverage: the returned `contentSha256` is the FIRST artifact
// that produced a map (scan order), not a digest of the merged map.
//
// Returns null when no candidate produced a map, which is what leaves the
// TestResults scan (and its documented residual limit below) reachable.
async function findCoverageCandidate(candidates: string[], cwd: string): Promise<CoverageResult | null> {
  let mergedMap: CoverageMap | null = null;
  let mergedSha256: string | undefined;
  for (const candidate of candidates) {
    const filePath = path.join(cwd, candidate);
    try {
      await access(filePath, constants.R_OK);
      const result = await cachedReadCoveragePath(filePath, cwd);
      if (!result.error) {
        if (result.coverageMap) {
          mergedMap = mergedMap === null ? result.coverageMap : mergeCoverageMaps(mergedMap, result.coverageMap);
          if (mergedSha256 === undefined) mergedSha256 = result.contentSha256;
        }
        continue;
      }
      cacheWarnings.push(`Coverage conversion failed for ${filePath}: ${result.reason}`);
    } catch {
      // not accessible, continue
    }
  }
  if (mergedMap === null) return null;
  const out: CoverageResult = { available: true, coverageMap: mergedMap, error: false };
  if (mergedSha256 !== undefined) out.contentSha256 = mergedSha256;
  return out;
}

async function cachedReadCoverage(cwd: string, coverageFile?: string): Promise<CoverageResult> {
  if (coverageFile !== undefined && coverageFile !== null && coverageFile !== '') {
    const coveragePath = path.isAbsolute(coverageFile) ? coverageFile : path.resolve(cwd, coverageFile);
    try {
      await access(coveragePath, constants.R_OK);
    } catch {
      return { available: true, coverageMap: null, error: true, reason: 'missing' };
    }
    return cachedReadCoveragePath(coveragePath, cwd);
  }
  // Config-driven: collect coverageFiles from all providers in registry
  const registry = providerRegistry();
  const coverageCandidates = registry
    ? [...new Set([...registry.values()].flatMap((r) => r.coverageFiles))]
    : ['.coverage', 'coverage.xml', 'coverage.json', 'coverage/coverage-final.json']; // builtin defaults
  // Coverlet parity (GAP: cached C# runs reported "no coverage"). `dotnet test
  // --collect:"XPlat Code Coverage"` writes TestResults/<GUID>/coverage.cobertura.xml,
  // a per-run GUID no literal config candidate can name — so this scan is the ONLY
  // way a cached C# run reaches that artifact. It runs LAST, after every literal
  // candidate failed to produce a map, which is the same precedence the uncached
  // path applies (`if (mergedMap !== null) return` before its scan): a readable or
  // convertible literal candidate still wins, and `--coverage-file` still
  // short-circuits everything above. WS2.2 made the literal side merge rather than
  // take the first hit, so both paths now agree on the accumulated result.
  //
  // RESIDUAL LIMIT (deliberate, not an oversight): when the scan FINDS an artifact
  // that then fails conversion, this returns `{ available: false }` where the
  // uncached path returns `{ available: true, error: true, reason: 'malformed' }`.
  // The cached path has always warned-and-continued for an unconvertible literal
  // candidate instead of failing hard; changing that taxonomy here would alter
  // behaviour for every language, which is a separate change with its own blast
  // radius. The case that was actually broken — a GOOD artifact invisible to the
  // cache — is closed.
  const found = await findCoverageCandidate(coverageCandidates, cwd);
  if (found) return found;
  const scanned = scanCoberturaUnderTestResults(cwd);
  if (scanned !== null) {
    const result = await cachedReadCoveragePath(scanned, cwd);
    if (!result.error) return result;
    cacheWarnings.push(`Coverage conversion failed for ${scanned}: ${result.reason}`);
  }
  return { available: false, coverageMap: null, error: false };
}

export function registerCachedProviders(): void {
  cacheWarnings.length = 0; // reset per registration — in-process re-invocations must not accumulate stale warnings
  const registry = providerRegistry();
  if (!registry) return; // no config loaded yet
  // Collect unique providers to avoid double-registration
  const seen = new Set<string>();
  for (const [ext, resolved] of registry) {
    const key = resolved.language;
    // ponytail: snapshot original BEFORE registerProvider overwrites same ext
    const orig = getProvider(ext);
    if (seen.has(key)) {
      // Same language, different ext — register same cached factory
      registerProvider(ext, seen.has(`cached:${key}`) ? {
        collectComplexity: cachedTsCollectComplexity,
        readCoverage: cachedReadCoverage,
      } : {
        // Use snapshot: resolved is ResolvedProvider (no collectComplexity method)
        collectComplexity: (cwd: string, trace?: TraceRun, changedFiles?: ReadonlySet<string>) => orig ? orig.collectComplexity(cwd, trace, changedFiles) : Promise.resolve([]),
        readCoverage: cachedReadCoverage,
      });
      continue;
    }
    seen.add(key);
    if (resolved.language === 'typescript') {
      registerProvider(ext, {
        collectComplexity: cachedTsCollectComplexity,
        readCoverage: cachedReadCoverage,
      });
      seen.add(`cached:${key}`);
    } else {
      // Non-TS: cache coverage only; complexity passes through unchanged
      registerProvider(ext, {
        // Lazy-load original provider's collectComplexity to avoid circular deps
        collectComplexity: async (cwd: string, trace?: TraceRun, changedFiles?: ReadonlySet<string>) => {
          return orig ? orig.collectComplexity(cwd, trace, changedFiles) : [];
        },
        readCoverage: cachedReadCoverage,
      });
    }
  }
}
