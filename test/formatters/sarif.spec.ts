import { describe, it, expect } from 'vitest';
import { formatSARIF } from '../../src/formatters/sarif.js';

// Hand-built fixture — NO engine calls. Mirrors the stable EvidenceOutputShape
// subset the formatters consume (ruleResults index-paired with changedFunctions).
function fixture() {
  return {
    analysisStatus: 'SUCCESS',
    gate: 'WARN',
    completeness: 'INCOMPLETE',
    schemaVersion: '0.5',
    changedFunctions: [
      { file: 'src/a.ts', method: 'alpha', lineStart: 10, lineEnd: 20, cc: 5, crap: 8, coverage: 0.9 },
      { file: 'src/a.ts', method: 'beta', lineStart: 30, lineEnd: 40, cc: 25, crap: 75, coverage: 0.4 },
      { file: 'src/b.ts', method: 'gamma', lineStart: 5, lineEnd: 12, cc: 12, crap: null, coverage: null },
    ],
    ruleResults: [
      { ruleId: 'changed-function-high-crap', result: 'PASS', file: 'src/a.ts', method: 'alpha', crap: 8, threshold: 30, cc: 5, coverage: 0.9 },
      { ruleId: 'changed-function-high-crap', result: 'WARN', file: 'src/a.ts', method: 'beta', crap: 75, threshold: 30, cc: 25, coverage: 0.4 },
      { ruleId: 'changed-function-high-crap', result: 'NOT_EVALUATED', file: 'src/b.ts', method: 'gamma', crap: null, threshold: 30, cc: 12, coverage: null },
    ],
  };
}

describe('formatSARIF', () => {
  it('emits valid SARIF 2.1.0 with checkchange driver', () => {
    const parsed = JSON.parse(formatSARIF(fixture(), { cwd: '' }));
    expect(parsed.version).toBe('2.1.0');
    expect(parsed.runs).toHaveLength(1);
    expect(parsed.runs[0].tool.driver.name).toBe('checkchange');
    expect(parsed.runs[0].tool.driver.version).toBe('0.5');
    expect(parsed.runs[0].tool.driver.rules).toEqual([{ id: 'changed-function-high-crap' }]);
  });

  it('reports one result per WARN with verbatim relative uri and paired line region', () => {
    const parsed = JSON.parse(formatSARIF(fixture(), { cwd: '' }));
    const results = parsed.runs[0].results;
    expect(results).toHaveLength(1);
    const r = results[0];
    expect(r.ruleId).toBe('changed-function-high-crap');
    expect(r.level).toBe('warning');
    expect(r.locations[0].physicalLocation.artifactLocation.uri).toBe('src/a.ts');
    expect(r.locations[0].physicalLocation.region).toEqual({ startLine: 30, endLine: 40 });
    expect(r.message.text).toBe('beta CRAP 75 > 30 (cc 25, cov 0.4)');
  });

  it('excludes PASS and NOT_EVALUATED from results', () => {
    const parsed = JSON.parse(formatSARIF(fixture(), { cwd: '' }));
    const texts = parsed.runs[0].results.map((r: { message: { text: string } }) => r.message.text);
    expect(texts).toEqual(['beta CRAP 75 > 30 (cc 25, cov 0.4)']);
  });

  it('emits zero results for a fully PASSing run', () => {
    const clean = fixture();
    clean.ruleResults = clean.ruleResults.map((r) => ({ ...r, result: 'PASS' as const }));
    const parsed = JSON.parse(formatSARIF(clean, { cwd: '' }));
    expect(parsed.runs[0].results).toEqual([]);
  });

  it('has no absolute path in artifactLocation.uri', () => {
    const parsed = JSON.parse(formatSARIF(fixture(), { cwd: '' }));
    const uris = parsed.runs[0].results.map((r: { locations: Array<{ physicalLocation: { artifactLocation: { uri: string } } }> }) =>
      r.locations[0].physicalLocation.artifactLocation.uri
    );
    for (const uri of uris) {
      expect(uri.startsWith('/')).toBe(false);
    }
  });
});