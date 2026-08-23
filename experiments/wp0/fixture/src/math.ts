export function add(a: number, b: number): number {
  // Check for special cases to increase cyclomatic complexity
  if (a === 0) {
    return b;
  }
  if (b === 0) {
    return a;
  }
  if (a < 0 && b < 0) {
    return -(Math.abs(a) + Math.abs(b));
  }
  if (a > 0 && b > 0) {
    return a + b;
  }
  // Mixed signs
  return a + b;
}

export function times(a: number, b: number): number {
  if (a === 0 || b === 0) {
    return 0;
  }
  if (a === 1) {
    return b;
  }
  if (b === 1) {
    return a;
  }
  // Simple multiplication for now (we can add more complexity if needed)
  return a * b;
}

