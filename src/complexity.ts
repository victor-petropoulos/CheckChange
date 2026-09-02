import { findAllTypeScriptFilesUnderSourceRoots, parseFileMethods } from '@barney-media/crap-typescript-core';
import { relative, resolve } from 'node:path';
import { execSync } from 'node:child_process';

export interface ComplexityInfo {
  file: string;
  method: string;
  lineStart: number;
  lineEnd: number;
  cc: number;
}

function getGitTrackedCodeFiles(cwd: string): string[] {
  try {
    // Get list of tracked files, one per line
    const output = execSync('git ls-files --cached --others --exclude-standard', { cwd, encoding: 'utf8' });
    const lines = output.trim().split('\n');
    const codeFiles: string[] = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (/\.(ts|tsx|js|jsx|mjs|cjs)$/.test(trimmed)) {
        // Convert to absolute path
        codeFiles.push(resolve(cwd, trimmed));
      }
    }
    return codeFiles;
  } catch (_) {
    // If git fails (not a repo, or any error), return empty array
    return [];
  }
}

export async function collectComplexity(cwd: string): Promise<ComplexityInfo[]> {
  // Find all TypeScript files under the source roots
  const sourceRootFiles = await findAllTypeScriptFilesUnderSourceRoots(cwd);
  // Get all tracked code files in the repo (respects .gitignore)
  const gitTrackedCode = getGitTrackedCodeFiles(cwd);
  
  // Union of both lists, deduplicated
  const fileSet = new Set<string>();
  for (const f of sourceRootFiles) {
    fileSet.add(f);
  }
  for (const f of gitTrackedCode) {
    fileSet.add(f);
  }
  const filePaths = Array.from(fileSet);
  
  const complexityInfo: ComplexityInfo[] = [];

  for (const filePath of filePaths) {
    try {
      const methodDescriptors = await parseFileMethods(filePath);
      for (const descriptor of methodDescriptors) {
        // Build method name: if containerName exists, use "containerName.functionName", else just functionName
        const methodName = descriptor.containerName
          ? `${descriptor.containerName}.${descriptor.functionName}`
          : descriptor.functionName;
        const rel = relative(cwd, filePath).replace(/\\/g, '/');
        complexityInfo.push({
          file: rel,
          method: methodName,
          lineStart: descriptor.startLine,
          lineEnd: descriptor.endLine,
          cc: descriptor.complexity,
        });
      }
    } catch (error) {
      // If parsing fails, we throw to be handled by the caller (evidence.ts)
      throw new Error(`Failed to parse TypeScript file ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return complexityInfo;
}