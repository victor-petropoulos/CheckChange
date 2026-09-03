#!/usr/bin/env node
// @ts-nocheck
// Restored WP4.2.1 cli
import { validateGitRepo, resolveBaseRef, getChangedIntervals } from './git.js';
import { buildEvidenceOutput } from './evidence.js';
/**
 * Parses command line arguments.
 * Returns parsed args or prints error and exits.
 */
export function parseCliArgs() {
    let base = null;
    let json = false;
    let help = false;
    let verbose = false;
    let crapThreshold = 30; // default
    let coverageFile = undefined; // optional --coverage-file <path>
    const positionals = [];
    const args = process.argv.slice(2);
    let i = 0;
    while (i < args.length) {
        const arg = args[i];
        if (arg === '--base') {
            if (i + 1 >= args.length) {
                console.error('Error: --base requires a value');
                process.exit(1);
            }
            base = args[++i];
        }
        else if (arg === '--json') {
            json = true;
        }
        else if (arg === '--help') {
            help = true;
        }
        else if (arg === '--verbose' || arg === '--debug') {
            verbose = true;
        }
        else if (arg.startsWith('--crap-threshold')) {
            let value;
            const parts = arg.split('=');
            if (parts.length > 1) {
                value = parts[1];
            }
            else {
                if (i + 1 >= args.length) {
                    console.error('Error: --crap-threshold requires a value');
                    process.exit(1);
                }
                value = args[++i];
            }
            const parsed = parseFloat(value);
            if (!isFinite(parsed) || parsed < 0) {
                console.error('Error: --crap-threshold must be a finite non-negative number');
                process.exit(1);
            }
            crapThreshold = parsed;
        }
        else if (arg.startsWith('--coverage-file')) {
            let value;
            const parts = arg.split('=');
            if (parts.length > 1) {
                value = parts[1];
            }
            else {
                if (i + 1 >= args.length) {
                    console.error('Error: --coverage-file requires a value');
                    process.exit(1);
                }
                value = args[++i];
            }
            if (value === undefined || value === '') {
                console.error('Error: --coverage-file requires a value');
                process.exit(1);
            }
            coverageFile = value;
        }
        else if (arg.startsWith('-')) {
            console.error(`Error: Unknown option ${arg}`);
            process.exit(1);
        }
        else {
            positionals.push(arg);
        }
        i++;
    }
    if (help) {
        console.log('Usage: checkchange check --base <ref> [--json] [--crap-threshold <number>] [--coverage-file <path>] [--verbose]');
        console.log('Options:');
        console.log('  --base <ref>             Git base reference to compare against (required)');
        console.log('  --json                   Output JSON (default: false)');
        console.log('  --crap-threshold <number> CRAP threshold for WARN (default: 30)');
        console.log('  --coverage-file <path>   Istanbul coverage JSON file path');
        console.log('  --verbose                Print diagnostic info to stderr');
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
    return { base, json, crapThreshold, coverageFile, verbose };
}
/**
 * Main CLI function
 */
export async function main() {
    try {
        const { base, json, crapThreshold, coverageFile, verbose } = parseCliArgs();
        // Validate git repo
        await validateGitRepo();
        // Resolve base ref
        const resolvedBase = await resolveBaseRef(base);
        // Get changed intervals
        const { intervals } = await getChangedIntervals(resolvedBase);
        // Build evidence output using composed providers
        const output = await buildEvidenceOutput(resolvedBase, intervals, process.cwd(), crapThreshold, coverageFile);
        if (verbose) {
            console.error(`[verbose] analysisStatus=${output.analysisStatus} gate=${output.gate} completeness=${output.completeness} changedFunctions=${output.changedFunctions.length}`);
        }
        // Output JSON if --json flag is set
        if (json) {
            console.log(JSON.stringify(output, null, 2));
        }
        else {
            // For WP1, we primarily want JSON, but let's output a simple summary if not JSON
            console.log(`Analysis complete. Base: ${resolvedBase}, Changed functions: ${output.changedFunctions.length}`);
        }
        if (output.analysisStatus === 'FAILED') {
            if (output.coverageErrorReason === 'missing') {
                console.error('Error: coverage artifact missing');
            } else if (output.coverageErrorReason === 'malformed') {
                console.error('Error: coverage artifact malformed');
            } else {
                console.error('Error: coverage artifact malformed');
            }
            process.exit(1);
            return;
        }
        let exitCode = 0;
        if (output.analysisStatus === 'SUCCESS' && output.gate !== 'PASS') {
            exitCode = 1;
        }
        else if (output.analysisStatus === 'UNSUPPORTED') {
            if (!(output.gate === null && output.completeness === 'NOT_APPLICABLE')) {
                exitCode = 1;
            }
        }
        process.exit(exitCode);
    }
    catch (error) {
        // Handle git errors (invalid base, not a repo, etc.)
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
}
if (process.argv[1] && !process.argv[1].includes('vitest')) {
    main();
}