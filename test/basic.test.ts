import { describe, expect, test } from 'vitest';
import { calculateCrap } from '../src/crapCalc';

describe('Basic test', () => {
  test('calculateCrap works', () => {
    const crap = calculateCrap(10, 50);
    expect(crap).toBeCloseTo(22.5);
  });
});