import * as path from 'node:path';
import * as fs from 'node:fs';
import type { coverageForMethods } from '@barney-media/crap-typescript-core';

// FileCoverage is not re-exported from the package root, so derive it from the
// signature of the only consumer — same idiom as lcovProvider.ts:7.
type FileCoverage = NonNullable<Parameters<typeof coverageForMethods>[1]>;

/**
 * Typed parse failure. `reason` carries the EXISTING CoverageResult.reason
 * value ('malformed', src/coverage.ts:487) so a caller maps a Cobertura refusal
 * onto the current taxonomy without inventing a reason string.
 * The size/line guards throw this too, so a single `instanceof` catch covers
 * every provider-side refusal.
 */
export class CoberturaParseError extends Error {
  readonly reason = 'malformed' as const;
  constructor(message: string) {
    super(message);
    this.name = 'CoberturaParseError';
  }
}

/**
 * Parse Cobertura XML content and convert it to the same Map shape the core
 * package's parseCoverageReport produces, so coverageForMethods can attribute
 * methods.
 * @param coberturaContent The Cobertura XML file content as string
 * @param cwd Current working directory for path normalization
 * @returns Map<filePath, { statements: Array<{ span: { startLine: number, startColumn: number, endLine: number, endColumn: number }, hits: number }>, branches: [], functions: [] }>
 *   Branches and functions are always empty: a `<line branch="true">` element
 *   does NOT fabricate a branches array (same precedent as LCOV BRDA being
 *   ignored at lcovProvider.ts:70-71). Merge Cobertura with LCOV via
 *   mergeCoverageMaps rather than by concatenating raw maps.
 * @throws {CoberturaParseError} on an oversized / over-long / malformed document
 */
export function parseCoberturaContent(coberturaContent: string, cwd: string): Map<string, FileCoverage> {
  // Security: limit Cobertura size to prevent OOM — same cap as lcovProvider.ts:19
  const MAX_SIZE = 100 * 1024 * 1024; // 100MB
  if (coberturaContent.length > MAX_SIZE) {
    throw new CoberturaParseError(`Cobertura content exceeds maximum allowed size of ${MAX_SIZE} bytes`);
  }
  const lines = coberturaContent.split('\n');
  if (lines.length > 1_000_000) {
    throw new CoberturaParseError('Cobertura contains too many lines (over 1,000,000)');
  }
  // Empty artifact yields an empty map, mirroring parseLcovContent's empty input.
  if (coberturaContent.trim() === '') {
    return new Map();
  }
  if (!/<coverage[\s/>]/.test(coberturaContent)) {
    throw new CoberturaParseError('Cobertura document has no <coverage> root element');
  }
  if (!coberturaContent.includes('</coverage>')) {
    throw new CoberturaParseError('Cobertura document is truncated: no closing </coverage>');
  }

  const result = new Map<string, FileCoverage>();
  // <class filename> is relative to <sources><source> (Coverlet writes an
  // absolute source root), so the base is needed to resolve the real file.
  let sourceBase = '';
  let currentFile = '';
  // Keyed by line number so a repeated <line number="N"> overwrites, as in LCOV.
  const statements: Record<string, FileCoverage['statements'][number]> = {};

  const flush = (): void => {
    if (currentFile && Object.keys(statements).length > 0) {
      const joined = sourceBase ? path.join(sourceBase, currentFile) : currentFile;
      const normalized = normalizePath(joined, cwd);
      if (normalized !== null) {
        const incoming = Object.values(statements);
        const existing = result.get(normalized);
        if (existing === undefined) {
          // Single-class path: plain set, unchanged from before the merge.
          result.set(normalized, { statements: incoming, branches: [], functions: [] });
        } else {
          // One file can host several <class> elements (Coverlet emits one per
          // type, all sharing filename="Foo.cs"), so flush() is called again
          // for the same key. Overwriting here dropped the earlier classes'
          // lines and left only the last <class> covered. Merge instead,
          // deduped by start line with MAX hits — a line shared by two types is
          // covered if EITHER type executed it.
          for (const unit of incoming) {
            const at = existing.statements.findIndex(s => s.span.startLine === unit.span.startLine);
            if (at === -1) existing.statements.push(unit);
            else if (unit.hits > existing.statements[at]!.hits) existing.statements[at] = unit;
          }
        }
      }
    }
    Object.keys(statements).forEach(k => delete statements[k]);
    currentFile = '';
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (line === '') continue;
    const source = line.match(/<source>([^<]*)<\/source>/);
    if (source) {
      sourceBase = decodeXml(source[1]!);
      continue;
    }
    // The \b keeps these from also matching <sources>, <classes> and <lines>.
    const openClass = line.match(/<class\b([^>]*)>/);
    if (openClass) {
      flush(); // finalize the previous class before starting a new one
      currentFile = decodeXml(attr(openClass[1]!, 'filename') ?? '');
    }
    // No `continue` after either match: <class>, <lines>, <line> and </class>
    // are commonly emitted on ONE line, and each must still be seen.
    // Scan EVERY <line> occurrence — a compact document packs several per line.
    for (const lineTag of line.matchAll(/<line\b([^>]*?)\/?>/g)) {
      if (!currentFile) continue;
      const numberStr = attr(lineTag[1]!, 'number');
      const hitsStr = attr(lineTag[1]!, 'hits');
      const lineNum = numberStr === null ? NaN : Number(numberStr);
      const hits = hitsStr === null ? NaN : Number(hitsStr);
      // Record-level garbage is skipped, not fatal — same as a bad `DA:` line.
      if (Number.isInteger(lineNum) && Number.isFinite(hits)) {
        statements[numberStr!] = {
          // Cobertura reports no column info, assume 0
          span: { startLine: lineNum, startColumn: 0, endLine: lineNum, endColumn: 0 },
          hits
        };
      }
    }
    if (/<\/class>/.test(line)) {
      flush();
    }
  }
  flush(); // handle the last class

  return result;
}

/** Read a `name="value"` attribute out of a captured start tag. */
function attr(attrs: string, name: string): string | null {
  const match = attrs.match(new RegExp(`\\b${name}="([^"]*)"`));
  return match ? match[1]! : null;
}

function decodeXml(value: string): string {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

/**
 * Check if an absolute file path is within the given cwd.
 * ponytail: duplicated from lcovProvider.ts:94-132 instead of exported from
 * there — this task's file scope is coberturaProvider.ts + coverage.ts + 2 test
 * files, and widening lcovProvider.ts is out of scope. Collapse both copies into
 * a shared module when a third format provider lands.
 */
function isWithinCwd(filePath: string, cwd: string): boolean {
  if (!path.isAbsolute(filePath)) {
    filePath = path.resolve(cwd, filePath);
  }
  const rel = path.relative(cwd, filePath);
  return !rel.startsWith('..') && !path.isAbsolute(rel);
}

/**
 * Normalize a Cobertura filename to be relative to cwd if possible, using the
 * same suffix-rebase idea as normalizeCoveragePaths (src/coverage.ts:302-336):
 * an absolute path from another checkout is re-based onto cwd by longest
 * existing suffix.
 * @returns normalized path within cwd, or null if the path escapes cwd and cannot be rebased
 */
function normalizePath(filePath: string, cwd: string): string | null {
  if (!path.isAbsolute(filePath)) {
    const resolved = path.resolve(cwd, filePath);
    return isWithinCwd(resolved, cwd) ? resolved : null;
  }
  // If absolute, first check if it's already within cwd
  if (isWithinCwd(filePath, cwd)) {
    return filePath;
  }
  // Try to rebase to cwd by suffix
  const segments = filePath.split(path.sep);
  for (let i = 1; i < segments.length; i++) {
    const candidate = path.join(cwd, ...segments.slice(i));
    if (!isWithinCwd(candidate, cwd)) continue;
    try {
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    } catch {
      // ignore
    }
  }
  return null;
}