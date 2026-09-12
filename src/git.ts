import { execute } from './execute.js';

// Provenance for the git lineage stage. git runs via node:child_process, so the
// node version is the driver identifier (per diagnostics-schema-design.md example).
export const gitProvenance = { tool: 'node:child_process', version: process.version } as const;

export interface GitChangeIntervals {
  intervals: Map<string, Array<{ start: number; end: number }>>;
  rawDiff: string;
}

/**
 * Validates that the current directory is a git repository.
 * @param cwd The current working directory (defaults to process.cwd())
 * @throws If not a git repository or if git executable is not found
 */
export async function validateGitRepo(cwd: string = process.cwd()): Promise<void> {
  const result = await execute('git', ['rev-parse', '--git-dir'], { cwd });
  if (result.errorCode === 'ENOENT') {
    throw new Error('Git executable not found');
  }
  if (result.exitCode !== 0) {
    throw new Error('Not a git repository');
  }
}

/**
 * Resolves a base reference to a commit hash.
 * @param base The base reference (e.g., branch name, tag, commit hash)
 * @param cwd The current working directory (defaults to process.cwd())
 * @returns The resolved commit hash
 * @throws If the base reference cannot be resolved or if git executable is not found
 */
export async function resolveBaseRef(base: string, cwd: string = process.cwd()): Promise<string> {
  const result = await execute('git', ['rev-parse', '--verify', `${base}^{commit}`], { cwd });
  if (result.errorCode === 'ENOENT') {
    throw new Error('Git executable not found');
  }
  if (result.exitCode !== 0) {
    throw new Error(`Cannot resolve base reference: ${base}`);
  }
  return result.stdout.trim();
}

/**
 * Attempts to auto-detect the default base branch.
 * @param verbose If true, logs the detected base to stderr
 * @param cwd The current working directory (defaults to process.cwd())
 * @returns The detected base reference (e.g., 'origin/master') or null if undetectable
 */
export async function detectDefaultBase(verbose: boolean = false, cwd: string = process.cwd()): Promise<string | null> {
// Helper to run a git command and return stdout if successful, null otherwise
   const tryGitRevParse = async (ref: string): Promise<boolean> => {
     const result = await execute('git', ['rev-parse', '--verify', `${ref}^{commit}`], { cwd });
     return result.exitCode === 0;
   };

  // 1. Try `git symbolic-ref refs/remotes/origin/HEAD`
  const symRefResult = await execute('git', ['symbolic-ref', 'refs/remotes/origin/HEAD'], { cwd });
  if (symRefResult.exitCode === 0) {
    // Output is like "refs/remotes/origin/master"
    let ref = symRefResult.stdout.trim();
    // Remove the "refs/remotes/" prefix to get "origin/master"
    if (ref.startsWith('refs/remotes/')) {
      ref = ref.substring('refs/remotes/'.length);
    }
    // Verify the ref is resolvable
    if (await tryGitRevParse(ref)) {
      if (verbose) {
        process.stderr.write(`[verbose] auto-detected base: ${ref}\n`);
      }
      return ref;
    }
  }

  // 2. Fallback candidates
  const candidates = ['origin/master', 'origin/main', 'master', 'main'];
  for (const candidate of candidates) {
    if (await tryGitRevParse(candidate)) {
      if (verbose) {
        process.stderr.write(`[verbose] auto-detected base: ${candidate}\n`);
      }
      return candidate;
    }
  }

  // Nothing worked
  return null;
}

/**
 * Parses the output of `git diff --unified=0` to extract changed line intervals per file.
 * @param diffText The output of `git diff --unified=0`
 * @returns A map from file path to an array of {start, end} intervals (1-based, inclusive)
 */
export function parseChangedIntervals(diffText: string): Map<string, Array<{ start: number; end: number }>> {
  const intervals = new Map<string, Array<{ start: number; end: number }>>();
  let currentFile = '';

  for (const line of diffText.split('\n')) {
    // Detect file header: diff --git a/<old> b/<new>
    if (line.startsWith('diff --git ')) {
      const match = line.match(/diff --git .* b\/(.*)/);
      if (match) {
        currentFile = match[1]!;
        // Initialize the intervals array for this file if not present
        if (!intervals.has(currentFile)) {
          intervals.set(currentFile, []);
        }
      }
      continue;
    }

    // Parse hunk header: @@ -<oldStart>,<oldLen> +<newStart>,<newLen> @@
    const hunkMatch = line.match(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);
    if (hunkMatch) {
      const newStart = parseInt(hunkMatch[3]!, 10);
      const newLen = hunkMatch[4] ? parseInt(hunkMatch[4]!, 10) : 1;
      // If newLen is 0, then there are no new lines (deletion)
      if (newLen > 0) {
        const newEnd = newStart + newLen - 1;
        const fileIntervals = intervals.get(currentFile);
        if (fileIntervals) {
          fileIntervals.push({ start: newStart, end: newEnd });
        }
      }
      // If newLen === 0, we skip because there is no new interval (it's a deletion)
      continue;
    }
  }

  return intervals;
}

/**
 * Gets the changed intervals for the given base reference.
 * @param base The base reference to compare against (e.g., branch name, tag, commit hash)
 * @param cwd The current working directory (defaults to process.cwd())
 * @returns An object containing the intervals map and the raw diff output
 * @throws If the git commands fail
 */
export async function getChangedIntervals(base: string, cwd: string = process.cwd()): Promise<GitChangeIntervals> {
  await validateGitRepo(cwd);
  const resolvedBase = await resolveBaseRef(base, cwd);
  const diffResult = await execute('git', ['diff', '--unified=0', resolvedBase], { cwd });
  if (diffResult.errorCode === 'ENOENT') {
    throw new Error('Git executable not found');
  }
  if (diffResult.exitCode !== 0) {
    throw new Error(`Git diff failed: ${diffResult.stderr}`);
  }
  const intervals = parseChangedIntervals(diffResult.stdout);
  return { intervals, rawDiff: diffResult.stdout };
}