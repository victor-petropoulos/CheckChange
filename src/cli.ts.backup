import { validateGitRepo, resolveBaseRef, getChangedIntervals } from './git.js';
import { runCrap } from './crap.js';
import { correlate, buildOutput, ChangedFunction } from './evidence.js';
import { parseArgs } from 'node:util';

/**
 * Parses command line arguments.
 * Returns parsed args or prints error and exits.
 */
function parseCliArgs(): { base: string; json: boolean; crapThreshold: number } | never {
  let base = null;
  let json = false;
  let help = false;
  let crapThreshold = 30; // default
  const positionals: string[] = [];

  const args = process.argv.slice(2);
  let i = 0;
  while (i < args.length) {
    const arg = args[i]!;
    if (arg === '--base') {
      if (i + 1 >= args.length) {
        console.error('Error: --base requires a value');
        process.exit(1);
      }
      base = args[++i];
    } else if (arg === '--json') {
      json = true;
    } else if (arg === '--help') {
      help = true;
    } else if (arg.startsWith('--crap-threshold')) {
      let value: string;
      const parts = arg.split('=');
      if (parts.length > 1) {
        value = parts[1]!;
      } else {
        if (i + 1 >= args.length) {
          console.error('Error: --crap-threshold requires a value');
          process.exit(1);
        }
        value = args[++i]!;
      }
      const parsed = parseFloat(value);
      if (!isFinite(parsed) || parsed < 0) {
        console.error('Error: --crap-threshold must be a finite non-negative number');
        process.exit(1);
      }
      crapThreshold = parsed;
    } else if (arg.startsWith('-')) {
      console.error(`Error: Unknown option ${arg}`);
      process.exit(1);
    } else {
      positionals.push(arg);
    }
    i++;
  }

  if (help) {
    console.log('Usage: code-risk check --base <ref> [--json] [--crap-threshold <number>]');
    console.log('Options:');
    console.log('  --base <ref>             Git base reference to compare against (required)');
    console.log('  --json                   Output JSON (default: false)');
    console.log('  --crap-threshold <number> CRAP threshold for WARN (default: 30)');
    process.exit(0);
  }

  // Validate explicit --base required
  if (!base) {
    console.error('Error: --base is required');
    process.exit(1);
  }

  // Validate positional command must be exactly "check"
  if (positionals.length !== 1 || positionals[0] !== 'check') {
    console.error('Error: Command must be "check"');
    process.exit(1);
  }

  return { base, json, crapThreshold };
}

/**
 * Main CLI function
 */
async function main(): Promise<void> {
  try {
    const { base, json, crapThreshold } = parseCliArgs();
    
    // Validate git repo
    await validateGitRepo();
    
    // Resolve base ref
    const resolvedBase = await resolveBaseRef(base);
    
    // Get changed intervals
    const { intervals } = await getChangedIntervals(resolvedBase);
    
    // Run crap-typescript
    const crapResult = await runCrap(process.cwd());
    
    let changedFunctions: ChangedFunction[] = [];
    let crapTypescriptCapability: string = "available";
    
    // Handle crap-typescript availability
    if (crapResult.exitCode === null && crapResult.rawJson.trim() === '') {
      // crap-typescript not available (ENOENT)
      crapTypescriptCapability = 'unavailable';
    } else if (crapResult.exitCode !== null && crapResult.exitCode !== 0 && crapResult.exitCode !== 2) {
      // crap-typescript execution failed (exit code not 0 or 2)
      crapTypescriptCapability = 'failed';
    } else {
      // Try to parse JSON
      let parsedJson: any = null;
      try {
        parsedJson = JSON.parse(crapResult.rawJson);
      } catch (e) {
        // Invalid JSON
        crapTypescriptCapability = 'failed';
      }
      
      if (crapTypescriptCapability !== 'failed' && parsedJson && Array.isArray(parsedJson.methods)) {
        // Successfully parsed JSON, correlate evidence
        changedFunctions = correlate(crapResult.methodEvidence, intervals);
      } else if (crapTypescriptCapability !== 'failed') {
        // Valid exit code but invalid/no JSON
        crapTypescriptCapability = 'failed';
      }
    }
    
// Build output
     const output = buildOutput(resolvedBase, changedFunctions, crapThreshold, {
       git: 'available',
       crapTypescript: crapTypescriptCapability
     });
    
    // Output JSON if --json flag is set
    if (json) {
      console.log(JSON.stringify(output, null, 2));
    } else {
      // For WP1, we primarily want JSON, but let's output a simple summary if not JSON
      console.log(`Analysis complete. Base: ${resolvedBase}, Changed functions: ${changedFunctions.length}`);
    }
    
    process.exit(0);
  } catch (error: any) {
    // Handle git errors (invalid base, not a repo, etc.)
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

main();
