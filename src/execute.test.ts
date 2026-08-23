import { describe, expect, test } from 'vitest';
import { execute } from './execute.js';

describe('execute', () => {
  test('should run a simple command and return result', async () => {
    const result = await execute('echo', ['hello']);
    expect(result.command).toBe('echo');
    expect(result.args).toEqual(['hello']);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('hello');
    expect(result.timedOut).toBe(false);
  });

  test('should handle non-existent command', async () => {
    const result = await execute('this-command-does-not-exist-12345');
    expect(result.exitCode).toBeNull();
    expect(result.timedOut).toBe(false);
  });
});