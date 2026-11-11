import type { EvidenceOutputShape } from './index.js';

/** SARIF 2.1.0: one result per WARN with verbatim relative uri + line region. */
export function formatSARIF(out: EvidenceOutputShape, opts: { cwd: string }): string {
  void opts;
  const warnResults = out.ruleResults
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
  // FN/FNDA: informational note results when diagnostics carry function coverage.
  const coverageEntries = out.diagnostics?.functionCoverage ?? [];
  const results = [
    ...warnResults,
    ...coverageEntries.map((entry) => ({
      ruleId: 'function-hit-coverage',
      level: 'note',
      locations: [
        {
          physicalLocation: {
            artifactLocation: { uri: entry.file },
            region: { startLine: entry.line, endLine: entry.line },
          },
        },
      ],
      message: { text: `${entry.method} FN hits ${entry.hits}` },
    })),
  ];
  const rules =
    coverageEntries.length > 0
      ? [{ id: 'changed-function-high-crap' }, { id: 'function-hit-coverage' }]
      : [{ id: 'changed-function-high-crap' }];
  return JSON.stringify(
    {
      // SARIF 2.1.0 top-level schema key is `$schema`; the schemastore schema
      // has additionalProperties:false, so `schema` would make the doc invalid.
      $schema: 'https://json.schemastore.org/sarif-2.1.0.json',
      version: '2.1.0',
      runs: [
        {
          tool: {
            driver: {
              name: 'checkchange',
              version: out.schemaVersion,
              rules,
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