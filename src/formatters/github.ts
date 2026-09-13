import type { EvidenceOutputShape } from './index.js';

/** PR-comment markdown table over changed functions + rule results + gate. */
function prTable(out: EvidenceOutputShape): string {
  const rows = out.ruleResults
    .map((r, i) => {
      const fn = out.changedFunctions[i]!;
      return `| ${r.file} | ${r.method} | ${fn.lineStart}-${fn.lineEnd} | ${r.result} | ${r.crap ?? 'n/a'} | ${r.coverage ?? 'n/a'} |`;
    })
    .join('\n');
  return [
    '| File | Method | Lines | Result | CRAP | Coverage |',
    '|------|--------|-------|--------|------|----------|',
    rows,
    '',
    `Gate: ${out.gate}`,
    `Completeness: ${out.completeness}`,
  ].join('\n');
}

/** GitHub Actions annotations + PR-comment markdown table. */
export function formatGitHub(out: EvidenceOutputShape, opts: { cwd: string }): string {
  const annotations = out.ruleResults
    .map((r, i) => ({ r, fn: out.changedFunctions[i]! }))
    .filter(({ r }) => r.result === 'WARN' || r.result === 'NOT_EVALUATED')
    .map(
      ({ r, fn }) =>
        `::warning file=${r.file},line=${fn.lineStart},endLine=${fn.lineEnd},title=high CRAP:: ${r.method} CRAP ${r.crap} > ${r.threshold} (cc ${r.cc}, cov ${r.coverage})`
    )
    .join('\n');
  return [annotations, prTable(out)].filter(Boolean).join('\n\n---\n\n');
}