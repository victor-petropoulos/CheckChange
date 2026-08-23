import { describe, expect, it } from 'vitest';
import { add, times } from './math.ts';

describe('add', () => {
  it('should add two numbers', () => {
    expect(add(2, 3)).toBe(5);
    expect(add(-1, 1)).toBe(0);
    expect(add(0, 0)).toBe(0);
    expect(add(-2, -3)).toBe(-5);
    expect(add(2, -3)).toBe(-1);
    expect(add(-2, 3)).toBe(1);
  });
});

describe('times', () => {
  it('should times two numbers', () => {
    expect(times(2, 3)).toBe(6);
    expect(times(0, 5)).toBe(0);
    expect(times(1, 5)).toBe(5);
    expect(times(3, 1)).toBe(3);
    expect(times(-2, 3)).toBe(-6);
    expect(times(-2, -3)).toBe(6);
  });
});