import { parseChangedIntervals } from '../../dist/git.js';
import { correlate } from '../../dist/evidence.js';
import { readFileSync, writeFileSync } from 'fs';

// Paths to the input files (relative to the script's location)
const diffFiles = [
  'git-diff-modified.txt',
  'git-diff-rename.txt',
  'git-diff-delete.txt'
];
const crapJsonPath = 'crap-full.json';

// Read and parse diffs
let intervalsMap = new Map(); // file -> Array<{start, end}>

for (const file of diffFiles) {
  const diffText = readFileSync(file, 'utf8');
  const fileIntervals = parseChangedIntervals(diffText);
  // Merge fileIntervals into intervalsMap
  for (const [filePath, intervals] of fileIntervals.entries()) {
    if (!intervalsMap.has(filePath)) {
      intervalsMap.set(filePath, []);
    }
    intervalsMap.get(filePath).push(...intervals);
  }
}

// Read crap JSON
const crapJson = JSON.parse(readFileSync(crapJsonPath, 'utf8'));
// Map the methods array to MethodEvidence
const methodEvidence = crapJson.methods.map(m => ({
  file: m.src,
  method: m.method,
  lineStart: m.lineStart,
  lineEnd: m.lineEnd,
  cc: m.cc,
  crap: m.crap,
  coverage: m.cov,
  coverageKind: m.covKind,
  analyzerStatus: m.status // Note: m.status is either 'passed' or 'failed'
}));

// Correlate
const changedFunctions = correlate(methodEvidence, intervalsMap);

// Write the result
writeFileSync('changed-functions.json', JSON.stringify(changedFunctions, null, 2));
console.log('Correlation complete. Output written to changed-functions.json');
