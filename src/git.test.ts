import { describe, expect, test } from 'vitest';
import { parseChangedIntervals } from './git.js';

describe('parseChangedIntervals', () => {
  test('should parse a single hunk with line numbers', () => {
    const diff = 
      'diff --git a/src/math.ts b/src/math.ts\n' +
      '@@ -10,2 +12,5 @@\n' +
      ' export function add(a: number, b: number): number {\n' +
      '-    return a + b;\n' +
      '+    return a + b + 1;\n' +
      '+    // comment\n' +
      ' }\n' +
      '+export function multiply(a: number, b: number): number {\n' +
      '+    return a * b;\n' +
      ' }\n';
    const intervals = parseChangedIntervals(diff);
    expect(intervals.has('src/math.ts')).toBe(true);
    const fileIntervals = intervals.get('src/math.ts');
    expect(fileIntervals).toEqual([{ start: 12, end: 16 }]); // newStart=12, newLen=5 => 12..16
  });

  test('should parse a hunk with omitted lengths (default 1) for modification', () => {
    const diff = 
      'diff --git a/src/math.ts b/src/math.ts\n' +
      '@@ -10 +10 @@\n' +
      '-    return a + b;\n' +
      '+    return a + b + 1;\n';
    const intervals = parseChangedIntervals(diff);
    expect(intervals.has('src/math.ts')).toBe(true);
    const fileIntervals = intervals.get('src/math.ts');
    // The hunk header: @@ -10 +10 @@ -> oldStart=10, oldLen=1 (default), newStart=10, newLen=1 (default)
    // The hunk contains one removal line and one addition line.
    // The new file interval is [10, 10] (the line starting with '+')
    expect(fileIntervals).toEqual([{ start: 10, end: 10 }]);
  });

  test('should parse multiple hunks in one file', () => {
    const diff = 
      'diff --git a/src/math.ts b/src/math.ts\n' +
      '@@ -5,2 +5,2 @@\n' +
      '-    return a - b;\n' +
      '+    return a - b + 1;\n' +
      '@@ -    return a * b;\n' +
      '+    return a * b + 1;\n' +
      '@@ -20,1 +20,3 @@\n' +
      '-    return a / b;\n' +
      '+    return a / b + 1;\n' +
      '+    // comment\n' +
      '+    return a / b + 2;\n';
    const intervals = parseChangedIntervals(diff);
    expect(intervals.has('src/math.ts')).toBe(true);
    const fileIntervals = intervals.get('src/math.ts');
    // First hunk: newStart=5, newLen=2 => 5..6
    // Second hunk: newStart=20, newLen=3 => 20..22
    expect(fileIntervals).toEqual([
      { start: 5, end: 6 },
      { start: 20, end: 22 }
    ]);
  });

  test('should handle renamed file (use the new path)', () => {
    const diff = 
      'diff --git a/src/old.ts b/src/new.ts\n' +
      '@@ -1 +1 @@\n' +
      '-    // old\n' +
      '+    // new\n';
    const intervals = parseChangedIntervals(diff);
    expect(intervals.has('src/new.ts')).toBe(true);
    expect(intervals.has('src/old.ts')).toBe(false);
    const fileIntervals = intervals.get('src/new.ts');
    expect(fileIntervals).toEqual([{ start: 1, end: 1 }]);
  });

  test('should handle deleted file (no current path, so no intervals)', () => {
    const diff = 
      'diff --git a/src/deleted.ts b/src/deleted.ts\n' +
      'deleted file mode 100644\n' +
      'index 1234567..0000000\n' +
      '--- a/src/deleted.ts\n' +
      '+++ /dev/null\n' +
      '@@ -1,3 +0,0 @@\n' +
      '-    export function deleted() {\n' +
      '-        return 42;\n' +
      '-    }\n';
    const intervals = parseChangedIntervals(diff);
    expect(intervals.has('src/deleted.ts')).toBe(true);
    const fileIntervals = intervals.get('src/deleted.ts');
    expect(fileIntervals).toEqual([]); // no intervals because it's a deletion
  });

  test('should handle added file', () => {
    const diff = 
      'diff --git /dev/null b/src/new.ts\n' +
      'new file mode 100644\n' +
      'index 0000000..1234567\n' +
      '--- /dev/null\n' +
      '+++ b/src/new.ts\n' +
      '@@ -0,0 +1,3 @@\n' +
      '+    export function added() {\n' +
      '+        return 42;\n' +
      '+    }\n';
    const intervals = parseChangedIntervals(diff);
    expect(intervals.has('src/new.ts')).toBe(true);
    const fileIntervals = intervals.get('src/new.ts');
    expect(fileIntervals).toEqual([{ start: 1, end: 3 }]);
  });

  test('should return empty map for empty diff', () => {
    const diff = '';
    const intervals = parseChangedIntervals(diff);
    expect(intervals.size).toBe(0);
  });
});