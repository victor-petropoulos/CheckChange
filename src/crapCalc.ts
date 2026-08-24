export function calculateCrap(cc: number, coveragePercent: number | null): number | null {
  if (coveragePercent === null) {
    return null;
  }
  const fraction = coveragePercent / 100.0;
  const term = Math.pow(1 - fraction, 3);
  return cc * cc * term + cc;
}
