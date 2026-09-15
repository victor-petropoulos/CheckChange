/// <reference types="vitest" />
import { describe, test, expect, vi, afterEach } from 'vitest'
import { buildEvidenceOutput } from '../../src/evidence.js'
import * as complexity from '../../src/complexity.js'
import * as coverage from '../../src/coverage.js'
import * as attribution from '../../src/attribution.js'

// ponytail: mock pattern mirrors zero-null-missing-malformed-unavailable.test.ts
function createInterval(start: number, end: number) {
  return { start, end }
}

function createComplexityInfo(file: string, method: string, lineStart: number, lineEnd: number, cc: number) {
  return { file, method, lineStart, lineEnd, cc }
}

/**
 * 3 taxonomy: coverage error states through buildEvidenceOutput pipeline.
 *   COVERAGE_FILE_MISSING  → reason='missing', error=true → FAILED
 *   COVERAGE_FILE_MALFORMED → reason='malformed', error=true → FAILED
 *   COVERAGE_TOOL_ABSENT   → available=false, error=false → absent capability, proceeds normally
 */
describe('coverage-errors (mocked unit)', () => {
  afterEach(() => vi.restoreAllMocks())

  const base = 'abc123'
  const cwd = '/tmp'
  const intervals = new Map([['test.ts', [createInterval(1, 10)]]])
  const fn1 = createComplexityInfo('test.ts', 'fn1', 1, 10, 10)

  // ─── COVERAGE_FILE_MISSING ──────────────────────────────────────────────────
  describe('COVERAGE_FILE_MISSING: error=true, reason=missing', () => {
    test('pipeline: readCoverage missing → coverageCapability failed, analysisStatus FAILED', async () => {
      vi.spyOn(complexity, 'collectComplexity').mockResolvedValue([fn1])
      vi.spyOn(coverage, 'readCoverage').mockResolvedValue({ available: true, coverageMap: null, error: true, reason: 'missing' })

      const out = await buildEvidenceOutput(base, intervals, cwd, 30)

      expect(out.analysisStatus).toBe('FAILED')
      expect(out.coverageErrorReason).toBe('missing')
      expect(out.changedFunctions).toHaveLength(0)
    })

    test('status: missing coverage → gate null, completeness INCOMPLETE, capabilities.coverageArtifact failed', async () => {
      vi.spyOn(complexity, 'collectComplexity').mockResolvedValue([fn1])
      vi.spyOn(coverage, 'readCoverage').mockResolvedValue({ available: true, coverageMap: null, error: true, reason: 'missing' })

      const out = await buildEvidenceOutput(base, intervals, cwd, 30)

      expect(out.gate).toBe(null)
      expect(out.completeness).toBe('INCOMPLETE')
      expect(out.capabilities.coverageArtifact).toBe('failed')
      expect(out.ruleResults).toHaveLength(0)
    })
  })

  // ─── COVERAGE_FILE_MALFORMED ────────────────────────────────────────────────
  describe('COVERAGE_FILE_MALFORMED: error=true, reason=malformed', () => {
    test('pipeline: readCoverage malformed → coverageCapability failed, analysisStatus FAILED', async () => {
      vi.spyOn(complexity, 'collectComplexity').mockResolvedValue([fn1])
      vi.spyOn(coverage, 'readCoverage').mockResolvedValue({ available: true, coverageMap: null, error: true, reason: 'malformed' })

      const out = await buildEvidenceOutput(base, intervals, cwd, 30)

      expect(out.analysisStatus).toBe('FAILED')
      expect(out.coverageErrorReason).toBe('malformed')
      expect(out.changedFunctions).toHaveLength(0)
    })

    test('status: malformed coverage → gate null, completeness INCOMPLETE, capabilities.coverageArtifact failed', async () => {
      vi.spyOn(complexity, 'collectComplexity').mockResolvedValue([fn1])
      vi.spyOn(coverage, 'readCoverage').mockResolvedValue({ available: true, coverageMap: null, error: true, reason: 'malformed' })

      const out = await buildEvidenceOutput(base, intervals, cwd, 30)

      expect(out.gate).toBe(null)
      expect(out.completeness).toBe('INCOMPLETE')
      expect(out.capabilities.coverageArtifact).toBe('failed')
      expect(out.ruleResults).toHaveLength(0)
    })
  })

  // ─── COVERAGE_TOOL_ABSENT ───────────────────────────────────────────────────
  describe('COVERAGE_TOOL_ABSENT: available=false, error=false', () => {
    test('pipeline: readCoverage absent → coverageCapability absent, analysis proceeds with null coverage', async () => {
      vi.spyOn(complexity, 'collectComplexity').mockResolvedValue([fn1])
      vi.spyOn(coverage, 'readCoverage').mockResolvedValue({ available: false, coverageMap: null, error: false })
      vi.spyOn(attribution, 'attachCoverage').mockResolvedValue([{
        info: fn1,
        coveragePercent: null,
        coverageKind: null
      }])

      const out = await buildEvidenceOutput(base, intervals, cwd, 30)

      expect(out.analysisStatus).toBe('SUCCESS')
      expect(out.capabilities.coverageArtifact).toBe('absent')
      const fn = out.changedFunctions[0]
      expect(fn.coverage).toBe(null)
      expect(fn.crap).toBe(null)
      expect(fn.analyzerStatus).toBe('skipped')
    })

    test('status: absent coverage → gate PASS (no WARN), completeness INCOMPLETE (NOT_EVALUATED present)', async () => {
      vi.spyOn(complexity, 'collectComplexity').mockResolvedValue([fn1])
      vi.spyOn(coverage, 'readCoverage').mockResolvedValue({ available: false, coverageMap: null, error: false })
      vi.spyOn(attribution, 'attachCoverage').mockResolvedValue([{
        info: fn1,
        coveragePercent: null,
        coverageKind: null
      }])

      const out = await buildEvidenceOutput(base, intervals, cwd, 30)

      expect(out.gate).toBe('PASS')
      expect(out.completeness).toBe('INCOMPLETE')
      expect(out.ruleResults).toHaveLength(1)
      expect(out.ruleResults[0].result).toBe('NOT_EVALUATED')
    })
  })

  // ─── COMBINED: MISSING vs MALFORMED distinction in same suite ───────────────
  describe('distinction: missing vs malformed produce different reasons', () => {
    test('missing reason ≠ malformed reason — both FAILED but distinguishable', async () => {
      vi.spyOn(complexity, 'collectComplexity').mockResolvedValue([fn1])

      vi.spyOn(coverage, 'readCoverage').mockResolvedValue({ available: true, coverageMap: null, error: true, reason: 'missing' })
      const missingOut = await buildEvidenceOutput(base, intervals, cwd, 30)

      vi.spyOn(coverage, 'readCoverage').mockResolvedValue({ available: true, coverageMap: null, error: true, reason: 'malformed' })
      const malformedOut = await buildEvidenceOutput(base, intervals, cwd, 30)

      expect(missingOut.analysisStatus).toBe('FAILED')
      expect(malformedOut.analysisStatus).toBe('FAILED')
      expect(missingOut.coverageErrorReason).not.toBe(malformedOut.coverageErrorReason)
      expect(missingOut.coverageErrorReason).toBe('missing')
      expect(malformedOut.coverageErrorReason).toBe('malformed')
    })
  })
})
