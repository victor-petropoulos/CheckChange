/// <reference types="vitest" />
import { describe, test, expect, vi, afterEach } from 'vitest'
import { buildEvidenceOutput } from '../../src/evidence.js'
import * as complexity from '../../src/complexity.js'
import * as coverage from '../../src/coverage.js'
import * as attribution from '../../src/attribution.js'

// ponytail: mock pattern mirrors coverage-errors.test.ts
function createInterval(start: number, end: number) {
  return { start, end }
}

function createComplexityInfo(file: string, method: string, lineStart: number, lineEnd: number, cc: number) {
  return { file, method, lineStart, lineEnd, cc }
}

/**
 * 3 taxonomy: evidence gap states through buildEvidenceOutput pipeline.
 *   EVIDENCE_EMPTY    → complexity fails → UNSUPPORTED / NOT_APPLICABLE
 *   EVIDENCE_PARTIAL  → coverage absent → SUCCESS / INCOMPLETE (coverageCapability 'absent')
 *   FUNCTION_UNMAPPED → coverage available but function not covered → SUCCESS / INCOMPLETE (coverageCapability 'available')
 */
describe('evidence-gaps (mocked unit)', () => {
  afterEach(() => vi.restoreAllMocks())

  const base = 'abc123'
  const cwd = '/tmp'
  const fn1 = createComplexityInfo('test.ts', 'fn1', 1, 10, 10)

  // ─── EVIDENCE_EMPTY ─────────────────────────────────────────────────────────
  describe('EVIDENCE_EMPTY: complexity fails', () => {
    test('pipeline: collectComplexity throws → analysisStatus UNSUPPORTED, completeness NOT_APPLICABLE', async () => {
      vi.spyOn(complexity, 'collectComplexity').mockRejectedValue(new Error('complexity failed'))
      vi.spyOn(coverage, 'readCoverage').mockResolvedValue({ available: false, coverageMap: null, error: false })
      const intervals = new Map([['test.ts', [createInterval(1, 10)]]])

      const out = await buildEvidenceOutput(base, intervals, cwd, 30)

      expect(out.analysisStatus).toBe('UNSUPPORTED')
      expect(out.completeness).toBe('NOT_APPLICABLE')
      expect(out.gate).toBe(null)
      expect(out.changedFunctions).toHaveLength(0)
      expect(out.capabilities.complexity).toBe('failed')
    })

    test('status: complexity failed → ruleResults empty, coverageArtifact reflects coverage read', async () => {
      vi.spyOn(complexity, 'collectComplexity').mockRejectedValue(new Error('complexity failed'))
      vi.spyOn(coverage, 'readCoverage').mockResolvedValue({ available: false, coverageMap: null, error: false })
      const intervals = new Map([['test.ts', [createInterval(1, 10)]]])

      const out = await buildEvidenceOutput(base, intervals, cwd, 30)

      expect(out.ruleResults).toHaveLength(0)
      expect(out.capabilities.complexity).toBe('failed')
      expect(out.capabilities.coverageArtifact).toBe('absent')
    })
  })

  // ─── EVIDENCE_PARTIAL ───────────────────────────────────────────────────────
  describe('EVIDENCE_PARTIAL: coverage absent', () => {
    test('pipeline: readCoverage absent → analysisStatus SUCCESS, completeness INCOMPLETE, NOT_EVALUATED', async () => {
      vi.spyOn(complexity, 'collectComplexity').mockResolvedValue([fn1])
      vi.spyOn(coverage, 'readCoverage').mockResolvedValue({ available: false, coverageMap: null, error: false })
      vi.spyOn(attribution, 'attachCoverage').mockResolvedValue([{
        info: fn1,
        coveragePercent: null,
        coverageKind: null
      }])
      const intervals = new Map([['test.ts', [createInterval(1, 10)]]])

      const out = await buildEvidenceOutput(base, intervals, cwd, 30)

      expect(out.analysisStatus).toBe('SUCCESS')
      expect(out.completeness).toBe('INCOMPLETE')
      expect(out.capabilities.coverageArtifact).toBe('absent')
      expect(out.ruleResults).toHaveLength(1)
      expect(out.ruleResults[0].result).toBe('NOT_EVALUATED')
    })

    test('status: coverage absent → changedFunction null coverage, crap null, analyzerStatus skipped', async () => {
      vi.spyOn(complexity, 'collectComplexity').mockResolvedValue([fn1])
      vi.spyOn(coverage, 'readCoverage').mockResolvedValue({ available: false, coverageMap: null, error: false })
      vi.spyOn(attribution, 'attachCoverage').mockResolvedValue([{
        info: fn1,
        coveragePercent: null,
        coverageKind: null
      }])
      const intervals = new Map([['test.ts', [createInterval(1, 10)]]])

      const out = await buildEvidenceOutput(base, intervals, cwd, 30)

      const fn = out.changedFunctions[0]
      expect(fn.coverage).toBe(null)
      expect(fn.crap).toBe(null)
      expect(fn.analyzerStatus).toBe('skipped')
    })
  })

  // ─── FUNCTION_UNMAPPED ──────────────────────────────────────────────────────
  describe('FUNCTION_UNMAPPED: coverage available but function not covered', () => {
    test('pipeline: coverage available, attachCoverage null → SUCCESS, INCOMPLETE, NOT_EVALUATED, coverageCapability available', async () => {
      vi.spyOn(complexity, 'collectComplexity').mockResolvedValue([fn1])
      vi.spyOn(coverage, 'readCoverage').mockResolvedValue({ available: true, coverageMap: new Map(), error: false, contentSha256: 'abc123' })
      vi.spyOn(attribution, 'attachCoverage').mockResolvedValue([{
        info: fn1,
        coveragePercent: null,
        coverageKind: null
      }])
      const intervals = new Map([['test.ts', [createInterval(1, 10)]]])

      const out = await buildEvidenceOutput(base, intervals, cwd, 30)

      expect(out.analysisStatus).toBe('SUCCESS')
      expect(out.completeness).toBe('INCOMPLETE')
      expect(out.capabilities.coverageArtifact).toBe('available')
      expect(out.ruleResults).toHaveLength(1)
      expect(out.ruleResults[0].result).toBe('NOT_EVALUATED')
    })

    test('status: function unmapped → changedFunction null coverage, crap null, analyzerStatus skipped', async () => {
      vi.spyOn(complexity, 'collectComplexity').mockResolvedValue([fn1])
      vi.spyOn(coverage, 'readCoverage').mockResolvedValue({ available: true, coverageMap: new Map(), error: false, contentSha256: 'abc123' })
      vi.spyOn(attribution, 'attachCoverage').mockResolvedValue([{
        info: fn1,
        coveragePercent: null,
        coverageKind: null
      }])
      const intervals = new Map([['test.ts', [createInterval(1, 10)]]])

      const out = await buildEvidenceOutput(base, intervals, cwd, 30)

      const fn = out.changedFunctions[0]
      expect(fn.coverage).toBe(null)
      expect(fn.crap).toBe(null)
      expect(fn.analyzerStatus).toBe('skipped')
    })
  })

  // ─── DISTINCTION: EVIDENCE_PARTIAL vs FUNCTION_UNMAPPED ──────────────────────
  describe('distinction: absent coverage vs available-but-unmapped produce different capabilities', () => {
    test('EVIDENCE_PARTIAL coverageCapability absent ≠ FUNCTION_UNMAPPED coverageCapability available — both INCOMPLETE', async () => {
      vi.spyOn(complexity, 'collectComplexity').mockResolvedValue([fn1])
      const intervals = new Map([['test.ts', [createInterval(1, 10)]]])

      // EVIDENCE_PARTIAL: coverage absent
      vi.spyOn(coverage, 'readCoverage').mockResolvedValue({ available: false, coverageMap: null, error: false })
      vi.spyOn(attribution, 'attachCoverage').mockResolvedValue([{
        info: fn1,
        coveragePercent: null,
        coverageKind: null
      }])
      const partialOut = await buildEvidenceOutput(base, intervals, cwd, 30)

      // FUNCTION_UNMAPPED: coverage available but function not mapped
      vi.spyOn(coverage, 'readCoverage').mockResolvedValue({ available: true, coverageMap: new Map(), error: false, contentSha256: 'abc123' })
      vi.spyOn(attribution, 'attachCoverage').mockResolvedValue([{
        info: fn1,
        coveragePercent: null,
        coverageKind: null
      }])
      const unmappedOut = await buildEvidenceOutput(base, intervals, cwd, 30)

      // Both INCOMPLETE + NOT_EVALUATED but distinguishable by coverageCapability
      expect(partialOut.completeness).toBe('INCOMPLETE')
      expect(unmappedOut.completeness).toBe('INCOMPLETE')
      expect(partialOut.capabilities.coverageArtifact).toBe('absent')
      expect(unmappedOut.capabilities.coverageArtifact).toBe('available')
      expect(partialOut.capabilities.coverageArtifact).not.toBe(unmappedOut.capabilities.coverageArtifact)
    })
  })
})
