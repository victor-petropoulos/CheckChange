import { readFileSync, existsSync } from 'node:fs';
import { relative, resolve } from 'node:path';

export interface CoverageResult {
  available: boolean;
  coverageMap: Map<string, any> | null;
  error: boolean;
  reason?: string;
}

export async function readPythonCoverage(
  cwd: string,
  coverageFile = 'coverage.json'
): Promise<CoverageResult> {
  try {
    const absCoverageFile = resolve(cwd, coverageFile);
    
    if (!existsSync(absCoverageFile)) {
      return { available: false, coverageMap: null, error: false };
    }
    
    const content = readFileSync(absCoverageFile, 'utf8');
    const data = JSON.parse(content);
    
    if (!data.files || typeof data.files !== 'object') {
      return { available: true, coverageMap: null, error: true, reason: 'malformed' };
    }
    
    const coverageMap = new Map<string, any>();
    
    for (const [filePath, fileData] of Object.entries(data.files)) {
        if (!fileData) continue;
        const fileDataTyped = fileData as any;
      
      const absPath = resolve(cwd, filePath);
      const relPath = relative(cwd, absPath).replace(/\\/g, '/');
      
      const executedLines = (fileDataTyped.executed_lines || []) as number[];
      const missingLines = (fileDataTyped.missing_lines || []) as number[];
      const functions = fileDataTyped.functions || {};
      
      const statementMap: Record<string, any> = {};
      const executedStatements = new Set<number>();
      
      for (const line of executedLines) {
        executedStatements.add(line);
      }
      
      for (const [fnName, fnData] of Object.entries(functions)) {
        if (fnName === '' || !fnData) continue;
        const fnDataTyped = fnData as any;
        
        const startLine = (fnDataTyped.start_line as number) || 0;
        const executed = (fnDataTyped.executed_lines || []) as number[];
        
        statementMap[fnName] = {
          type: 'statement',
          lines: executed,
          line: startLine
        };
      }
      
      const percentBranchesCovered = fileDataTyped.summary?.percent_branches_covered;
      const executedBranches = fileDataTyped.executed_branches || [];
      const missingBranches = fileDataTyped.missing_branches || [];
      
      const branchMap: Record<string, any> = {};
      
      for (const [fnName, fnData] of Object.entries(functions)) {
        if (fnName === '' || !fnData) continue;
        const fnDataTyped = fnData as any;
        
        const fnExecutedBranches = fnDataTyped.executed_branches || [];
        const fnMissingBranches = fnDataTyped.missing_branches || [];
        
        if (fnExecutedBranches.length > 0 || fnMissingBranches.length > 0) {
          branchMap[fnName] = {
            type: 'branch',
            locations: fnExecutedBranches.map((b: number[]) => ({ source: b })),
            lines: fnExecutedBranches[0] || []
          };
        }
      }
      
      coverageMap.set(relPath, {
        statementMap,
        branchMap,
        fnMap: {},
        allLines: executedLines.length > 0 ? new Set<number>(executedLines) : new Set<number>(),
        allBranches: executedBranches.length > 0 ? executedBranches : [],
        allFunctions: {},
        coverageData: {
          executedLines,
          missingLines,
          percent: fileDataTyped.summary?.percent_covered || null,
          coverageKind: percentBranchesCovered != null ? 'branches' : 'stmt',
          branchCoverage: {
            percent: percentBranchesCovered || null,
            executedBranches,
            missingBranches
          }
        }
      });
    }
    
    return { available: true, coverageMap, error: false };
  } catch (error) {
    return { available: true, coverageMap: null, error: true, reason: 'malformed' };
  }
}
