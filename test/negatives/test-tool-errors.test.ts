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
 * Reason pass-through contract: verifies buildEvidenceOutput (evidence.ts:441)
 * propagates arbitrary reason strings from readCoverage to output unchanged.
 * TEST_COMMAND_FAILED / EXTERNAL_TOOL_UNEXPECTED are example strings — not
 * emitted by src/coverage.ts (which only emits 'missing'/'malformed').
 */
describe('test-tool-errors (mocked unit)', () => {
  afterEach(() => vi.restoreAllMocks())

  const base = 'abc123'
  const cwd = '/tmp'
  const intervals = new Map([['test.ts', [createInterval(1, 10)]]])
  const fn1 = createComplexityInfo('test.ts', 'fn1', 1, 10, 10)

  // ─── TEST_COMMAND_FAILED ────────────────────────────────────────────────────
  describe('TEST_COMMAND_FAILED: test runner non-zero exit', () => {
    test('pipeline: readCoverage test command failed → coverageCapability failed, analysisStatus FAILED', async () => {
      vi.spyOn(complexity, 'collectComplexity').mockResolvedValue([fn1])
      vi.spyOn(coverage, 'readCoverage').mockResolvedValue({ 
        available: true, 
        coverageMap: null, 
        error: true, 
        reason: 'TEST_COMMAND_FAILED' 
      })

      const out = await buildEvidenceOutput(base, intervals, cwd, 30)

      expect(out.analysisStatus).toBe('FAILED')
      expect(out.coverageErrorReason).toBe('TEST_COMMAND_FAILED')
      expect(out.changedFunctions).toHaveLength(0)
    })

    test('status: test command failed → gate null, completeness INCOMPLETE, capabilities.coverageArtifact failed', async () => {
      vi.spyOn(complexity, 'collectComplexity').mockResolvedValue([fn1])
      vi.spyOn(coverage, 'readCoverage').mockResolvedValue({ 
        available: true, 
        coverageMap: null, 
        error: true, 
        reason: 'TEST_COMMAND_FAILED' 
      })

      const out = await buildEvidenceOutput(base, intervals, cwd, 30)

      expect(out.gate).toBe(null)
      expect(out.completeness).toBe('INCOMPLETE')
      expect(out.capabilities.coverageArtifact).toBe('failed')
      expect(out.ruleResults).toHaveLength(0)
    })
  })

  // ─── EXTERNAL_TOOL_UNEXPECTED ───────────────────────────────────────────────
  describe('EXTERNAL_TOOL_UNEXPECTED: tool returns unrecognized output format', () => {
    test('pipeline: readCoverage unexpected output → coverageCapability failed, analysisStatus FAILED', async () => {
      vi.spyOn(complexity, 'collectComplexity').mockResolvedValue([fn1])
      vi.spyOn(coverage, 'readCoverage').mockResolvedValue({ 
        available: true, 
        coverageMap: null, 
        error: true, 
        reason: 'EXTERNAL_TOOL_UNEXPECTED' 
      })

      const out = await buildEvidenceOutput(base, intervals, cwd, 30)

      expect(out.analysisStatus).toBe('FAILED')
      expect(out.coverageErrorReason).toBe('EXTERNAL_TOOL_UNEXPECTED')
      expect(out.changedFunctions).toHaveLength(0)
    })

    test('status: unexpected output → gate null, completeness INCOMPLETE, capabilities.coverageArtifact failed', async () => {
      vi.spyOn(complexity, 'collectComplexity').mockResolvedValue([fn1])
      vi.spyOn(coverage, 'readCoverage').mockResolvedValue({ 
        available: true, 
        coverageMap: null, 
        error: true, 
        reason: 'EXTERNAL_TOOL_UNEXPECTED' 
      })

      const out = await buildEvidenceOutput(base, intervals, cwd, 30)

      expect(out.gate).toBe(null)
      expect(out.completeness).toBe('INCOMPLETE')
      expect(out.capabilities.coverageArtifact).toBe('failed')
      expect(out.ruleResults).toHaveLength(0)
    })
  })

  // ─── DISTINCTION: TEST_COMMAND_FAILED vs EXTERNAL_TOOL_UNEXPECTED ───────────
  describe('distinction: test command failed vs unexpected output produce different reasons', () => {
    test('TEST_COMMAND_FAILED reason ≠ EXTERNAL_TOOL_UNEXPECTED reason — both FAILED but distinguishable', async () => {
      vi.spyOn(complexity, 'collectComplexity').mockResolvedValue([fn1])
      vi.spyOn(coverage, 'readCoverage').mockResolvedValue({ 
        available: true, 
        coverageMap: null, 
        error: true, 
        reason: 'TEST_COMMAND_FAILED' 
      })
      const commandFailedOut = await buildEvidenceOutput(base, intervals, cwd, 30)

      vi.spyOn(complexity, 'collectComplexity').mockResolvedValue([fn1])
      vi.spyOn(coverage, 'readCoverage').mockResolvedValue({ 
        available: true, 
        coverageMap: null, 
        error: true, 
        reason: 'EXTERNAL_TOOL_UNEXPECTED' 
      })
      const unexpectedOut = await buildEvidenceOutput(base, intervals, cwd, 30)

      expect(commandFailedOut.analysisStatus).toBe('FAILED')
      expect(unexpectedOut.analysisStatus).toBe('FAILED')
      expect(commandFailedOut.coverageErrorReason).not.toBe(unexpectedOut.coverageErrorReason)
      expect(commandFailedOut.coverageErrorReason).toBe('TEST_COMMAND_FAILED')
      expect(unexpectedOut.coverageErrorReason).toBe('EXTERNAL_TOOL_UNEXPECTED')
    })
  })
})
