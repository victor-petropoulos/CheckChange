import type { EvidenceOutputShape } from './index.js';

/** Escape XML entities in attribute/text content. */
function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** JUnit XML: one <testcase> per changed function; failures == WARN count. */
export function formatJUnit(out: EvidenceOutputShape, opts: { cwd: string }): string {
  const warnCount = out.ruleResults.filter((r) => r.result === 'WARN').length;
  const cases = out.ruleResults
    .map((r, i) => {
      const fn = out.changedFunctions[i]!;
      const attrs = `classname="${escapeXml(fn.file)}" name="${escapeXml(r.method)}" file="${escapeXml(r.file)}" line="${fn.lineStart}"`;
      if (r.result === 'WARN') {
        const message = `CRAP ${r.crap} > ${r.threshold}`;
        return `  <testcase ${attrs}>\n    <failure message="${escapeXml(message)}">${escapeXml(r.method)} ${escapeXml(message)}</failure>\n  </testcase>`;
      }
      if (r.result === 'NOT_EVALUATED') {
        return `  <testcase ${attrs}>\n    <skipped/>\n  </testcase>`;
      }
      return `  <testcase ${attrs}/>`;
    })
    .join('\n');
  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<testsuite name="checkchange" tests="${out.changedFunctions.length}" failures="${warnCount}">\n` +
    `${cases}\n` +
    `</testsuite>\n`
  );
}