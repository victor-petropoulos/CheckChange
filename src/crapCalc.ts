// Provenance for the crapCalc lineage stage. Self tool version tracks package.json
// (matches existing hard-coded '0.5.0' style for the core package).
export const crapCalcProvenance = { tool: 'checkchange', version: '0.4.0' } as const;

export function calculateCrap(cc: number, coveragePercent: number | null): number | null {
  if (coveragePercent == null) {
    return null;
  }
  const fraction = coveragePercent / 100.0;
  const term = Math.pow(1 - fraction, 3);
  return cc * cc * term + cc;
}
