/**
 * Generated-file policy module (plan task 3).
 *
 * Single policy seam: `isGenerated()` decides whether a changed file is
 * machine-generated / minified / bundled and therefore excluded from CRAP
 * analysis. Core heuristics are delegated to crap-typescript-core
 * `isAnalyzableFile()`; thin additions cover what the core's SYNC API lacks
 * (task-2 empirical finding: core scans @generated markers / *.generated globs
 * only in the async filterSourceFiles, never in isAnalyzableFile).
 *
 * Config escape hatch: `generatedIgnorePatterns` force re-includes a file
 * (Q4 safety valve). Patterns are matched as normalized path substrings.
 */
import * as fs from 'node:fs';
import { isAnalyzableFile } from '@barney-media/crap-typescript-core';

export interface GeneratedFilterConfig {
  /** Re-include patterns: force a generated-looking file back into analysis. */
  // `| undefined`: callers pass a possibly-absent loaded config under exactOptionalPropertyTypes.
  generatedIgnorePatterns?: string[] | undefined;
}

export interface ExcludedGeneratedFile {
  file: string;
  reason: string;
}

export interface DiffInterval {
  start: number;
  end: number;
}

// Same analyzable-extension set as core ANALYZABLE_EXTENSIONS
// (crap-typescript-core/dist/fileSelection.js:5). Guard keeps non-code diffs
// (e.g. README.md) out of the generated bucket: they are already unsupported.
const CODE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'];

// Fix unit 8: test files are excluded under their OWN reason ('test file'),
// never the core-segment fallthrough label.
const TEST_FILE_MARKERS = ['.test.', '.spec.'];

// Mirror of core DEFAULT_GENERATED_MARKERS (sourceExclusions.js:19-27), applied
// synchronously because isAnalyzableFile() does not scan file headers.
const GENERATED_MARKERS = [
  '@generated',
  '@auto-generated',
  'AUTO-GENERATED',
  'This file was generated',
  'Do not edit',
  'DO NOT EDIT',
];

const HEADER_BYTES = 8192;

function normalized(filePath: string): string {
  return filePath.split('\\').join('/');
}

function hasCodeExtension(filePath: string): boolean {
  const lower = normalized(filePath).toLowerCase();
  return CODE_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

function isReIncluded(filePath: string, config?: GeneratedFilterConfig): boolean {
  const rel = normalized(filePath);
  return (config?.generatedIgnorePatterns ?? []).some((pattern) => rel.includes(normalized(pattern)));
}

function hasTestFileMarker(filePath: string): boolean {
  const base = normalized(filePath).split('/').pop() ?? '';
  return TEST_FILE_MARKERS.some((marker) => base.includes(marker));
}

function hasSourceMapExtension(filePath: string): boolean {
  return normalized(filePath).toLowerCase().endsWith('.map');
}

function hasMinJsSuffix(filePath: string): boolean {
  return normalized(filePath).toLowerCase().endsWith('.min.js');
}

function hasSourceMapSidecar(filePath: string): boolean {
  return fs.existsSync(`${filePath}.map`);
}

/** First 8KB only: minified bundles are huge, never read whole file. */
function hasGeneratedHeader(filePath: string): boolean {
  try {
    const fd = fs.openSync(filePath, 'r');
    try {
      const buffer = Buffer.alloc(HEADER_BYTES);
      const bytesRead = fs.readSync(fd, buffer, 0, HEADER_BYTES, 0);
      const header = buffer.subarray(0, bytesRead).toString('utf8');
      return GENERATED_MARKERS.some((marker) => header.includes(marker));
    } finally {
      fs.closeSync(fd);
    }
  } catch {
    return false;
  }
}

/** Returns the exclusion reason, or null when the file should be analyzed. */
function classify(filePath: string, config?: GeneratedFilterConfig): string | null {
  if (isReIncluded(filePath, config)) return null;
  // Fix unit 8: raw *.js.map diffed files are source maps themselves -> generated,
  // before the code-extension guard would drop them into the unsupported bucket.
  if (hasSourceMapExtension(filePath)) return 'source map file (.map)';
  if (!hasCodeExtension(filePath)) return null;
  // Fix unit 8: own classification reason for test files (M1).
  if (hasTestFileMarker(filePath)) return 'test file';
  if (hasMinJsSuffix(filePath)) return 'minified filename (.min.js)';
  if (hasSourceMapSidecar(filePath)) return 'source map sidecar (.js.map)';
  if (hasGeneratedHeader(filePath)) return 'generated header marker';
  // Core owns the excluded-path-segment list (/dist/, /node_modules/, ...).
  if (!isAnalyzableFile(filePath)) return 'excluded path segment (core isAnalyzableFile)';
  return null;
}

export function isGenerated(filePath: string, config?: GeneratedFilterConfig): boolean {
  return classify(filePath, config) !== null;
}

/**
 * Partitions diffed intervals into analyzable files vs generated exclusions.
 * Input map is never mutated; key order of kept files is preserved.
 */
export function filterDiffedFiles(
  intervals: Map<string, DiffInterval[]>,
  config?: GeneratedFilterConfig,
): { filtered: Map<string, DiffInterval[]>; excluded: ExcludedGeneratedFile[] } {
  const filtered = new Map<string, DiffInterval[]>();
  const excluded: ExcludedGeneratedFile[] = [];
  for (const [file, value] of intervals) {
    const reason = classify(file, config);
    if (reason !== null) {
      excluded.push({ file, reason });
    } else {
      filtered.set(file, value);
    }
  }
  return { filtered, excluded };
}
