// Provenance for the crapCalc lineage stage. Self tool version tracks package.json.
export const crapCalcProvenance = { tool: 'checkchange', version: '0.5.8' } as const;

export function calculateCrap(cc: number, coveragePercent: number | null): number | null {
  if (coveragePercent == null) {
    return null;
  }
  const fraction = coveragePercent / 100.0;
  const term = Math.pow(1 - fraction, 3);
  return cc * cc * term + cc;
}
