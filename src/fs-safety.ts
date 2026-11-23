/**
 * Filesystem read seam with a deliberately bounded security contract.
 *
 * CLOSED: the lexical-fallback class. Errors never trigger an alternate-path
 * read; post-open operations use one descriptor; containment is verified before
 * open; and the descriptor remains stable after open if path names change.
 *
 * OUT OF SCOPE: pre-open ancestor-directory substitution by a privileged local
 * attacker racing realpath() to open(). Portable Node has no openat equivalent;
 * O_NOFOLLOW guards only the final path component (platform-dependent).
 */
import { constants } from 'node:fs';
import { open, realpath, type FileHandle } from 'node:fs/promises';
import { isAbsolute, relative, resolve } from 'node:path';

function isWithinRoot(root: string, candidate: string): boolean {
  const rel = relative(root, candidate);
  return rel !== '..' && !rel.startsWith(`..${process.platform === 'win32' ? '\\' : '/'}`) && !isAbsolute(rel);
}

/**
 * Open an existing regular file only when its resolved target is contained by root.
 *
 * Error handling is fail-closed: realpath(), containment, open(), and post-open
 * validation failures propagate without an alternate-path retry. Reads through
 * the returned handle remain bound to the opened file. The module header
 * defines the pre-open race excluded from this contract.
 */
export async function openWithinRoot(root: string, candidate: string): Promise<FileHandle> {
  const candidatePath = resolve(root, candidate);
  const realRoot = await realpath(root);
  const realCandidate = await realpath(candidatePath);
  if (!isWithinRoot(realRoot, realCandidate)) {
    throw new Error(`openWithinRoot: candidate escapes root: ${candidatePath}`);
  }

  const noFollow = typeof constants.O_NOFOLLOW === 'number' ? constants.O_NOFOLLOW : 0;
  const handle = await open(realCandidate, constants.O_RDONLY | noFollow);
  try {
    const stats = await handle.stat();
    if (!stats.isFile()) {
      throw new Error(`openWithinRoot: candidate is not a regular file: ${candidatePath}`);
    }
    return handle;
  } catch (error) {
    await handle.close().catch(() => undefined);
    throw error;
  }
}
