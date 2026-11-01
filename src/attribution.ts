import { parseFileMethods } from '@barney-media/crap-typescript-core';
import { coverageForMethods } from '@barney-media/crap-typescript-core';
import type { MethodDescriptor } from '@barney-media/crap-typescript-core';
import { parsePythonFileMethods } from './complexity-providers/pythonDescriptorProvider.js';
// Language-specific descriptor parsers. `coverageForMethods` is language-
// agnostic (it attributes by `bodySpan` containment), so a parser that emits
// the shared MethodDescriptor shape is all the join needs per language.
//
// KNOWN LIMITATION (deliberate, not an oversight): the rich vehicle's output is
// NOT consulted here. `csharpDescriptorProvider.isRichDescriptor`
// (csharpDescriptorProvider.ts:65) does not require `bodySpan`, so a descriptor
// set from that path can be missing the field `coverageForMethods` needs.
// Attribution therefore always uses the fallback parser's span. Closing that
// gap means teaching the rich vehicle to emit bodySpan, which is a larger
// change than this fix and is tracked separately.
import { parseCsharpFileMethods } from './complexity-providers/csharpFallbackParser.js';
import type { CoverageResult } from './coverage.js';

// Type-only import (erased at runtime, so no import cycle with complexity.ts):
// this file used to REDECLARE ComplexityInfo as a 5-field copy of complexity.ts's
// interface. That copy silently dropped every field the owning module later grew
// — first `provenance`, which mapToMethodEvidence reads to report a per-language
// source.tool. One type, imported.
import type { ComplexityInfo } from './complexity.js';

// Provenance for the attribution lineage stage: coverageForMethods/parseFileMethods from the core package.
export const attributionProvenance = { tool: '@barney-media/crap-typescript-core', version: '0.5.0' } as const;

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
     return nullCoverageForAll(complexityInfo);
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
       // We'll find all complexity files where the absolute coverage path ends with the relative complexity path
      const fileComplexity = matchingComplexityForFile(filePath, complexityByFile);
      if (fileComplexity === undefined) {
        // No exact match or ambiguous -> skip this coverage file (no attribution from it)
        continue;
      }
      const methodDescriptors = await descriptorsForFile(filePath, descriptorCache);
      if (methodDescriptors === undefined) {
        // If parsing fails, treat as no coverage for this file's methods
        for (const info of fileComplexity) {
          coverageMap.set(coverageKeyFor(info), nullCoverageEntry());
        }
        continue;
      }
      attributeFile(fileComplexity, fileCoverage, descriptorIndex(methodDescriptors), coverageMap);
    }

  return assembleResult(complexityInfo, coverageMap);
}

// Input normalization: coverage is absent or errored, so every entry reports null coverage.
function nullCoverageForAll(complexityInfo: ComplexityInfo[]): AttributedComplexity[] {
  return complexityInfo.map(info => ({
    info,
    coveragePercent: null,
    coverageKind: null
  }));
}

// File matching: resolve the complexity entries a coverage file belongs to. Exactly one
// case-insensitive suffix match wins; zero matches or an ambiguous multi-match declines
// attribution for that coverage file.
function matchingComplexityForFile(
    filePath: string,
    complexityByFile: Map<string, ComplexityInfo[]>
  ): ComplexityInfo[] | undefined {
  const normalizedFilePath = filePath.replace(/\\/g, '/');
  const matches: { rel: string; list: ComplexityInfo[] }[] = [];
  for (const [rel, list] of complexityByFile.entries()) {
    const normalizedRel = rel.replace(/\\/g, '/');
    // case-insensitive suffix match to handle provider lowercasing (e.g., crapCalc.ts)
    if (normalizedFilePath.toLowerCase().endsWith(normalizedRel.toLowerCase())) {
      matches.push({ rel, list });
    }
  }
  let fileComplexity: ComplexityInfo[] | undefined;
  if (matches.length === 1) {
    fileComplexity = matches[0]!.list;
  } else if (matches.length > 1) {
    // Ambiguous match: decline attribution for this coverage file
    fileComplexity = undefined;
  } else {
    // No match
    fileComplexity = undefined;
  }
  return fileComplexity;
}

// Result-map key for one complexity entry.
function coverageKeyFor(info: ComplexityInfo): string {
  return `${info.file}:${info.method}:${info.lineStart}`;
}

// Null result entry: records "no coverage attributed" for one complexity entry.
function nullCoverageEntry(): { coveragePercent: number | null; coverageKind: string | null } {
  return { coveragePercent: null, coverageKind: null };
}

// Descriptor lookup: parse this file's method descriptors (Python-aware) through the
// caller-owned cache. undefined means parsing failed, so the caller records no coverage.
async function descriptorsForFile(
    filePath: string,
    descriptorCache: Map<string, MethodDescriptor[]>
  ): Promise<MethodDescriptor[] | undefined> {
  const cached = descriptorCache.get(filePath);
  if (cached !== undefined) {
    return cached;
  }
  try {
    const methodDescriptors = filePath.endsWith('.py')
      ? await parsePythonFileMethods(filePath)
      : filePath.endsWith('.cs')
        ? await parseCsharpFileMethods(filePath)
        : await parseFileMethods(filePath);
    descriptorCache.set(filePath, methodDescriptors);
    return methodDescriptors;
  } catch {
    return undefined;
  }
}

// Create a map from descriptor key to descriptor for quick lookup
function descriptorIndex(methodDescriptors: MethodDescriptor[]): Map<string, MethodDescriptor> {
  const descriptorMap = new Map<string, MethodDescriptor>();
  for (const descriptor of methodDescriptors) {
    const key = `${descriptor.containerName ? descriptor.containerName + '.' : ''}${descriptor.functionName}:${descriptor.startLine}`;
    descriptorMap.set(key, descriptor);
  }
  return descriptorMap;
}

// For each complexity info in this file, find matching descriptor and compute coverage
function attributeFile(
    fileComplexity: ComplexityInfo[],
    fileCoverage: Parameters<typeof coverageForMethods>[1],
    descriptorMap: Map<string, MethodDescriptor>,
    coverageMap: Map<string, { coveragePercent: number | null; coverageKind: string | null }>
  ): void {
  for (const info of fileComplexity) {
    const descriptor = descriptorMap.get(`${info.method}:${info.lineStart}`);
    if (!descriptor) {
      // No matching descriptor found
      coverageMap.set(coverageKeyFor(info), nullCoverageEntry());
      continue;
    }
    try {
      const methodCoverage = coverageForMethods([descriptor], fileCoverage)[0];
      if (!methodCoverage) {
        // No coverage data returned
        coverageMap.set(coverageKeyFor(info), nullCoverageEntry());
        continue;
      }
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
      } else if (stmtPercent < branchPercent) {
        coverageKind = 'stmt';
      } else if (branchPercent < stmtPercent) {
        coverageKind = 'branch';
      } else {
        coverageKind = 'stmt'; // arbitrary choice when equal
      }
      coverageMap.set(coverageKeyFor(info), {
        coveragePercent: methodCoverage.coverage.percent,
        coverageKind
      });
    } catch {
      // Error in coverage attribution
      coverageMap.set(coverageKeyFor(info), nullCoverageEntry());
    }
  }
}

// Result assembly: build the result in the same order as complexityInfo. A single
// forward pass, so the result order always matches the input order.
function assembleResult(
    complexityInfo: ComplexityInfo[],
    coverageMap: Map<string, { coveragePercent: number | null; coverageKind: string | null }>
  ): AttributedComplexity[] {
  const result: AttributedComplexity[] = [];
  for (const info of complexityInfo) {
    const coverageData = coverageMap.get(coverageKeyFor(info)) ?? nullCoverageEntry();
    result.push({
      info,
      coveragePercent: coverageData.coveragePercent,
      coverageKind: coverageData.coverageKind
    });
  }
  return result;
}
