import { describe, it, expect } from 'vitest';
import { formatGitHub } from '../../src/formatters/github.js';

// Hand-built fixture — NO engine calls. Mirrors the stable EvidenceOutputShape
// subset the formatters consume (ruleResults are index-paired with
// changedFunctions, 1:1 via evaluateHighCrap's .map()).
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

describe('formatGitHub', () => {
  it('emits one ::warning annotation per WARN rule result', () => {
    const out = formatGitHub(fixture(), { cwd: '' });
    expect(out).toContain(
      '::warning file=src/a.ts,line=30,endLine=40,title=high CRAP:: beta CRAP 75 > 30 (cc 25, cov 0.4)'
    );
  });

  it('emits a ::warning annotation for NOT_EVALUATED results', () => {
    const out = formatGitHub(fixture(), { cwd: '' });
    expect(out).toContain(
      '::warning file=src/b.ts,line=5,endLine=12,title=high CRAP:: gamma CRAP null > 30 (cc 12, cov null)'
    );
  });

  it('omits PASS results from annotations', () => {
    const out = formatGitHub(fixture(), { cwd: '' });
    expect(out).not.toContain('alpha CRAP');
  });

  it('uses the file path verbatim (relative, no absolute prefix)', () => {
    const out = formatGitHub(fixture(), { cwd: '' });
    expect(out).toContain('file=src/a.ts,line=30');
    expect(out).not.toMatch(/file=\//);
  });

  it('emits a PR-comment markdown table with gate and completeness', () => {
    const out = formatGitHub(fixture(), { cwd: '' });
    expect(out).toContain('| File |');
    expect(out).toContain('| Method |');
    expect(out).toContain('Gate: WARN');
    expect(out).toContain('Completeness: INCOMPLETE');
  });

  it('separates annotations and table with a markdown horizontal rule', () => {
    const out = formatGitHub(fixture(), { cwd: '' });
    const [annotations, table] = out.split('\n\n---\n\n');
    expect(annotations).toContain('::warning');
    expect(table).toContain('| File |');
  });

  it('returns only the table when no WARN or NOT_EVALUATED results exist', () => {
    const clean = fixture();
    clean.ruleResults = clean.ruleResults.map((r) => ({ ...r, result: 'PASS' as const }));
    const out = formatGitHub(clean, { cwd: '' });
    expect(out).not.toContain('::warning');
    expect(out).not.toContain('\n\n---\n\n');
    expect(out).toContain('| File |');
  });
});