import { parseFileMethods } from '@barney-media/crap-typescript-core';
import { coverageForMethods } from '@barney-media/crap-typescript-core';
import type { MethodDescriptor } from '@barney-media/crap-typescript-core';
import { resolve } from 'node:path';

// We'll define the ComplexityInfo interface here (same as in complexity.ts)
interface ComplexityInfo {
  file: string;
  method: string;
  lineStart: number;
  lineEnd: number;
  cc: number;
}

// We'll define the CoverageResult interface here (same as in coverage.ts)
interface CoverageResult {
  available: boolean;
  coverageMap: Map<string, any> | null;
  error: boolean;
}

export interface AttributedComplexity {
  info: ComplexityInfo;
  coveragePercent: number | null;
  coverageKind: string | null;
}

export async function attachCoverage(
  complexityInfo: ComplexityInfo[],
  coverageResult: CoverageResult
): Promise<AttributedComplexity[]> {
  // If coverage is not available or has error, return null for coverage
  if (!coverageResult.available || coverageResult.error) {
    return complexityInfo.map(info => ({
      info,
      coveragePercent: null,
      coverageKind: null
    }));
  }

  // Cache for parsed method descriptors per file
  const descriptorCache = new Map<string, MethodDescriptor[]>();
  // Result map: keyed by (filePath, methodName, startLine) to coverage data
  const coverageMap = new Map<string, { coveragePercent: number | null; coverageKind: string | null }>();

  // Group complexity info by file
  const complexityByFile = new Map<string, ComplexityInfo[]>();
  for (const info of complexityInfo) {
    if (!complexityByFile.has(info.file)) {
      complexityByFile.set(info.file, []);
    }
    complexityByFile.get(info.file)!.push(info);
  }

  // Process each file that has coverage
  for (const [filePath, fileCoverage] of coverageResult.coverageMap!) {
    // We know coverageMap is not null because we checked available and not error
    // coverageMap keys are absolute normalized paths, complexity files are relative -> use suffix match
    let fileComplexity = complexityByFile.get(filePath);
    if (!fileComplexity) {
      // try suffix match (relative vs absolute)
      const normalizedFilePath = filePath.replace(/\\/g, '/');
      for (const [rel, list] of complexityByFile.entries()) {
        const normalizedRel = rel.replace(/\\/g, '/');
        if (normalizedFilePath.endsWith(normalizedRel) || normalizedRel.endsWith(normalizedFilePath)) {
          fileComplexity = list;
          break;
        }
      }
    }
    if (!fileComplexity) {
      // No complexity info for this file, skip
      continue;
    }

    // Get or parse method descriptors for this file
    let methodDescriptors: MethodDescriptor[];
    if (descriptorCache.has(filePath)) {
      methodDescriptors = descriptorCache.get(filePath)!;
    } else {
      try {
        methodDescriptors = await parseFileMethods(filePath);
        descriptorCache.set(filePath, methodDescriptors);
      } catch (error) {
        // If parsing fails, treat as no coverage for this file's methods
        for (const info of fileComplexity) {
          const key = `${info.file}:${info.method}:${info.lineStart}`;
          coverageMap.set(key, { coveragePercent: null, coverageKind: null });
        }
        continue;
      }
    }

    // Create a map from descriptor key to descriptor for quick lookup
    const descriptorMap = new Map<string, MethodDescriptor>();
    for (const descriptor of methodDescriptors) {
      const key = `${descriptor.functionName}:${descriptor.startLine}`;
      descriptorMap.set(key, descriptor);
    }

    // For each complexity info in this file, find matching descriptor and compute coverage
    for (const info of fileComplexity) {
      const key = `${info.method}:${info.lineStart}`;
      const descriptor = descriptorMap.get(key);
      if (descriptor) {
        try {
          const methodCoverageArray = coverageForMethods([descriptor], fileCoverage);
          const methodCoverage = methodCoverageArray[0];
          if (methodCoverage) {
            const coveragePercent = methodCoverage.coverage.percent;
            // Determine coverageKind based on statement and branch coverage
            const stmtPercent = methodCoverage.statementCoverage.percent;
            const branchPercent = methodCoverage.branchCoverage.percent;
            let coverageKind: string | null = null;
            if (stmtPercent === null && branchPercent === null) {
              coverageKind = null;
            } else if (stmtPercent === null) {
              coverageKind = 'branch';
            } else if (branchPercent === null) {
              coverageKind = 'stmt';
            } else {
              if (stmtPercent < branchPercent) {
                coverageKind = 'stmt';
              } else if (branchPercent < stmtPercent) {
                coverageKind = 'branch';
              } else {
                coverageKind = 'stmt'; // arbitrary choice when equal
              }
            }
            const coverageKey = `${info.file}:${info.method}:${info.lineStart}`;
            coverageMap.set(coverageKey, { coveragePercent, coverageKind });
          } else {
            // No coverage data returned
            const coverageKey = `${info.file}:${info.method}:${info.lineStart}`;
            coverageMap.set(coverageKey, { coveragePercent: null, coverageKind: null });
          }
        } catch (error) {
          // Error in coverage attribution
          const coverageKey = `${info.file}:${info.method}:${info.lineStart}`;
          coverageMap.set(coverageKey, { coveragePercent: null, coverageKind: null });
        }
      } else {
        // No matching descriptor found
        const coverageKey = `${info.file}:${info.method}:${info.lineStart}`;
        coverageMap.set(coverageKey, { coveragePercent: null, coverageKind: null });
      }
    }
  }

  // Build the result in the same order as complexityInfo
  const result: AttributedComplexity[] = [];
  for (const info of complexityInfo) {
    const key = `${info.file}:${info.method}:${info.lineStart}`;
    const coverageData = coverageMap.get(key) ?? { coveragePercent: null, coverageKind: null };
    result.push({
      info,
      coveragePercent: coverageData.coveragePercent,
      coverageKind: coverageData.coverageKind
    });
  }

  return result;
}