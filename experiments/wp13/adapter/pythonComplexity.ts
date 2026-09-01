import { spawnSync } from 'node:child_process';
import { relative, resolve } from 'node:path';

export interface ComplexityInfo {
  file: string;
  method: string;
  lineStart: number;
  lineEnd: number;
  cc: number;
}

export async function collectPythonComplexity(
  cwd: string,
  sourceGlob = '**/*.py'
): Promise<ComplexityInfo[]> {
  const complexityInfo: ComplexityInfo[] = [];
  
  try {
    const findCmd = `find . -path "*/src/*.py" -type f 2>/dev/null | head -100`;
    const result = spawnSync(findCmd, { cwd, shell: true, encoding: 'utf8' });
    
    if (result.status !== 0) {
      return [];
    }
    
    const files = result.stdout
      .trim()
      .split('\n')
      .filter(f => f.trim().length > 0)
      .map(f => f.replace('./', ''));
    
    if (files.length === 0) {
      return [];
    }
    
    for (const file of files) {
      const absPath = resolve(cwd, file);
      const cmd = `lizard --csv "${absPath}"`;
      const cmdResult = spawnSync(cmd, { shell: true, encoding: 'utf8' });
      
      if (cmdResult.status !== 0) {
        continue;
      }
      
      const lines = cmdResult.stdout.split('\n');
      
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        
        // Lizard CSV: cc,bran,len,params,args,tokens,file,func,name,start,end
        const parts = trimmed.split(',');
        if (parts.length < 11) continue;
        
        const cc = parseInt(parts[0], 10) || 0;
        const functionName = parts[7]; // FunctionName is 8th field (index 7)
        const lineStart = parseInt(parts[9], 10) || 0;
        const lineEnd = parseInt(parts[10], 10) || lineStart;
        
        complexityInfo.push({
          file: relative(cwd, absPath).replace(/\\/g, '/'),
          method: functionName,
          lineStart,
          lineEnd,
          cc
        });
      }
    }
    
    return complexityInfo;
  } catch (error) {
    throw new Error(`Failed to collect Python complexity: ${error instanceof Error ? error.message : String(error)}`);
  }
}
