import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { mkdir, mkdtemp, rename, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openWithinRoot } from '../src/fs-safety.js';

let tempDir: string;
let root: string;
let outsideFile: string;

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), 'checkchange-fs-safety-'));
  root = join(tempDir, 'root');
  outsideFile = join(tempDir, 'outside.txt');
  await mkdir(root);
  await writeFile(outsideFile, 'outside', 'utf8');
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

describe('openWithinRoot', () => {
  test('rejects a candidate outside root', async () => {
    await expect(openWithinRoot(root, outsideFile)).rejects.toThrow('escapes root');
  });

  test('rejects a symlink to a file outside root', async () => {
    const link = join(root, 'escape.txt');
    await symlink(outsideFile, link);

    await expect(openWithinRoot(root, link)).rejects.toThrow('escapes root');
  });

  test('throws when candidate realpath fails', async () => {
    await expect(openWithinRoot(root, 'missing.txt')).rejects.toMatchObject({ code: 'ENOENT' });
  });

  test('handle reads opened inode after candidate path replacement', async () => {
    const candidate = join(root, 'inside.txt');
    await writeFile(candidate, 'opened content', 'utf8');

    const handle = await openWithinRoot(root, candidate);
    try {
      await rename(candidate, join(root, 'opened.txt'));
      await writeFile(candidate, 'replacement content', 'utf8');

      await expect(handle.readFile('utf8')).resolves.toBe('opened content');
    } finally {
      await handle.close();
    }
  });
});
