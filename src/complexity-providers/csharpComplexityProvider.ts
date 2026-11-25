/**
 * C# complexity provider — the dispatcher registered as a ProviderFactory in
 * Task 4. Mirrors src/complexity-providers/pythonASTComplexityProvider.ts:
 * the interface at :6-11, the exported singleton at :13, and the readCoverage
 * delegation at :169 (this adapter calls `readCoverage(cwd, file)` from
 * src/coverage.ts rather than re-reading artifacts).
 *
 * It does NOT re-implement parsing or probing — those live in
 * ./csharpDescriptorProvider.ts (probe + rich/fallback dispatch) and
 * ./csharpFallbackParser.ts (pure-TS approximation). This module's whole job is
 * the repo walk plus the ComplexityInfo projection attribution consumes.
 *
 * There is deliberately NO diagnostic channel here. ProviderFactory
 * (src/evidence.ts:252-255) exposes only `collectComplexity` + `readCoverage`,
 * and src/evidence.ts reads neither `describe()` nor any diagnostic surface, so
 * inventing one would be dead weight. Degradation is instead observable three
 * ways that already exist: `probeDotnetSdk()` / `analyzeCsharpFile()` return the
 * diagnostic object directly, and `describe()` carries the human-readable
 * degraded-mode note with its fix proposal.
 *
 * `collectComplexity` consumes BOTH halves of the diagnostic, at two different
 * sinks. The machine-readable half rides as `ComplexityInfo.provenance`
 * (`provenanceForMode(mode)` plus `diagnostic.code` as `degradation`) — no new
 * channel on ProviderFactory is needed, and `measurementQuality` /
 * `measurementDegradations` in src/complexity.ts read it without ever learning a
 * csharp vehicle id. The human-readable half stays in `describe()`. So the two
 * sinks answer two different questions and neither duplicates the other.
 *
 * SECURITY POSTURE: the file walk is `spawnSync('find', [...])` — argv-only,
 * no `sh -c`, no shell string — copied from the Python provider for parity.
 */
import { spawnSync } from 'node:child_process';
import { relative } from 'node:path';
import type { ComplexityInfo } from '../complexity.ts';
import { readCoverage, type CoverageResult } from '../coverage.js';
import { analyzeCsharpFile, probeDotnetSdk, provenanceForMode, vehicleRejection } from './csharpDescriptorProvider.js';

export interface CSharpComplexityProvider {
  extensions: string[];
  collectComplexity: (cwd: string) => Promise<ComplexityInfo[]>;
  describe(): string;
  readCoverage: (cwd: string, file?: string) => Promise<CoverageResult>;
}

/**
 * Locate `.cs` files under cwd, pruning node_modules and .git. Same `find`
 * argv-only invocation as pythonASTComplexityProvider.ts:18.
 *
 * No filename-guard copy is made here: `./csharpFallbackParser.ts` already owns
 * the byte-for-byte `isValidFileName` guard (pythonDescriptorProvider.ts:21-24
 * parity) and THROWS on a traversal or shell-metacharacter payload. The
 * per-file catch below turns that throw into a skip, which is the same outcome a
 * pre-filter would give without duplicating the predicate a fourth time.
 */
function findCsharpFiles(cwd: string): string[] {
  const res = spawnSync(
    'find',
    [
      cwd,
      '-path',
      `${cwd}/node_modules`,
      '-prune',
      '-o',
      '-path',
      `${cwd}/.git`,
      '-prune',
      '-o',
      '-name',
      '*.cs',
      '-type',
      'f',
      '-print',
    ],
    { encoding: 'utf8' }
  );
  if (res.status !== 0) return [];
  return String(res.stdout ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

export const csharpComplexityProvider: CSharpComplexityProvider = {
  extensions: ['.cs'],

  collectComplexity: async (cwd: string): Promise<ComplexityInfo[]> => {
    const info: ComplexityInfo[] = [];
    for (const file of findCsharpFiles(cwd)) {
      try {
        const { descriptors, mode, diagnostic } = await analyzeCsharpFile(file);
        // ponytail: ONE provenance value for the whole file — `mode` is per-file,
        // so a repo measured half rich and half fallback reports BOTH tools
        // truthfully per function rather than one averaged lie.
        const provenance = provenanceForMode(mode);
        // The CSharpDiagnostic's machine code rides along so the complexity
        // LINEAGE entry can name WHY the stage fell back. It had no sink at all
        // before: `describe()` is never called from src/, so `csharp-analysis-failed`
        // reached no consumer, and `doctor` cannot reach it either — nothing has
        // invoked the vehicle in a doctor run.
        const measured = diagnostic === null ? provenance : { ...provenance, degradation: diagnostic.code };
        for (const d of descriptors) {
          info.push({
            // Repo-relative, verbatim in spirit from pythonASTComplexityProvider.ts:149
            // ("Convert to relative path for consistency with other providers").
            // Mandatory, not cosmetic: `find` prints ABSOLUTE paths, but
            // correlate() looks the file up in the changed-interval Map whose keys
            // come from `git diff` (repo-relative). Absolute ⇒ lookup miss ⇒
            // changedFunctions empty for every .cs repo, with analysisStatus still
            // SUCCESS — a silent nothing. Backslash normalisation matches python so a
            // Windows-generated Coverlet `filename` key lines up too.
            file: relative(cwd, file).replace(/\\/g, '/'),
            // displayName is already `Container.Name` (or bare `Name` at top
            // level), which is exactly the `info.method` form attribution keys
            // against at src/attribution.ts:144.
            method: d.displayName,
            lineStart: d.startLine,
            lineEnd: d.endLine,
            cc: d.complexity,
            // GAP 8: which analyzer produced THIS value, and whether it was an
            // approximation. Consumed by measurementProvenance (source.tool) and
            // measurementQuality (diagnostics.quality.complexity === 'FALLBACK').
            provenance: measured,
          });
        }
      } catch {
        // An unreadable path is a caller bug and the fallback parser THROWS on
        // it. One bad file must not abort the batch, so it is skipped — the same
        // non-aborting posture as the Python provider.
      }
    }
    return info;
  },

  describe(): string {
    const probe = probeDotnetSdk();
    if (!probe.available) {
      const d = probe.diagnostic!;
      return `C# complexity provider — DEGRADED [${d.code}]: ${d.message} Fix: ${d.fix} (probe: ${d.detail})`;
    }
    // An SDK on PATH is NOT healthy on its own. If the vehicle was ever rejected,
    // every C# file measured so far used the fallback approximation — so say that,
    // rather than reporting a healthy provider over approximate CC.
    const rejected = vehicleRejection();
    if (rejected) {
      return `C# complexity provider — DEGRADED [${rejected.code}]: ${rejected.message} Fix: ${rejected.fix} (vehicle: ${rejected.detail})`;
    }
    return (
      // `||` not `??`: a healthy SDK that prints nothing yields '', not null, and
      // `??` would render a blank version in the note.
      `C# complexity provider — dotnet ${probe.version || 'unknown'} detected; the Roslyn vehicle is probed per ` +
      'file and degrades to the pure-TypeScript approximation with a csharp-analysis-failed diagnostic when unusable.'
    );
  },

  // Delegation verbatim in spirit from pythonASTComplexityProvider.ts:169 —
  // reuse src/coverage.ts, never re-read the artifact.
  readCoverage: (cwd: string, file?: string) => readCoverage(cwd, file),
};