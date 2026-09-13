import type { EvidenceOutputShape } from './index.js';

/** SARIF 2.1.0: one result per WARN with verbatim relative uri + line region. */
export function formatSARIF(out: EvidenceOutputShape, opts: { cwd: string }): string {
  const results = out.ruleResults
    .map((r, i) => ({ r, fn: out.changedFunctions[i]! }))
    .filter(({ r }) => r.result === 'WARN')
    .map(({ r, fn }) => ({
      ruleId: 'changed-function-high-crap',
      level: 'warning',
      locations: [
        {
          physicalLocation: {
            artifactLocation: { uri: r.file },
            region: { startLine: fn.lineStart, endLine: fn.lineEnd },
          },
        },
      ],
      message: { text: `${r.method} CRAP ${r.crap} > ${r.threshold} (cc ${r.cc}, cov ${r.coverage})` },
    }));
  return JSON.stringify(
    {
      version: '2.1.0',
      runs: [
        {
          tool: {
            driver: {
              name: 'checkchange',
              version: out.schemaVersion,
              rules: [{ id: 'changed-function-high-crap' }],
            },
          },
          results,
        },
      ],
    },
    null,
    2
  );
}