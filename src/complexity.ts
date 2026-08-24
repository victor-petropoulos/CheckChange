import { findAllTypeScriptFilesUnderSourceRoots, parseFileMethods } from '@barney-media/crap-typescript-core';
import { relative } from 'node:path';

export interface ComplexityInfo {
  file: string;
  method: string;
  lineStart: number;
  lineEnd: number;
  cc: number;
}

export async function collectComplexity(cwd: string): Promise<ComplexityInfo[]> {
  // Find all TypeScript files under the source roots
  const filePaths = await findAllTypeScriptFilesUnderSourceRoots(cwd);
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
