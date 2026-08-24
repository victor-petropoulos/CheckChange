import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import parseChangedIntervals from dist/git.js using __dirname
const gitModule = await import(join(__dirname, '../../dist/git.js'));
const { parseChangedIntervals } = gitModule;

import { readFileSync } from 'fs';

// Read the crap-full.json to get method ranges
const crapFull = JSON.parse(readFileSync(join(__dirname, '../wp1/crap-full.json'), 'utf8'));
const methods = crapFull.methods.reduce((acc, m) => {
  acc[m.method] = { start: m.lineStart, end: m.lineEnd };
  return acc;
}, {});

// Function to compute intersection
function intersect(aStart, aEnd, bStart, bEnd) {
  const start = Math.max(aStart, bStart);
  const end = Math.min(aEnd, bEnd);
  if (start <= end) {
    return { start, end };
  }
  return null;
}

// Read diff files
const diffs = {
  'modified-add': readFileSync(join(__dirname, '../wp1/git-diff-modified.txt'), 'utf8'),
  'added-multiply': readFileSync(join(__dirname, '../wp1/git-diff-modified.txt'), 'utf8'),
  'rename-multiply-to-times': readFileSync(join(__dirname, '../wp1/git-diff-rename.txt'), 'utf8'),
  'deleted-halve': readFileSync(join(__dirname, '../wp1/git-diff-delete.txt'), 'utf8')
};

// For each case, compute git intervals and intersections
const cases = [];

// modified-add: changes to add function
{
  const diff = diffs['modified-add'];
  const intervalsMap = parseChangedIntervals(diff);
  const intervals = intervalsMap.get('src/math.ts') || [];
  const gitIntervals = intervals.map(i => ({ start: i.start, end: i.end }));
  // Compute intersections with add method range (1-17)
  const addRange = methods.add;
  const intersections = gitIntervals.map(i => 
    intersect(i.start, i.end, addRange.start, addRange.end)
  ).filter(Boolean);
  cases.push({
    case: 'modified-add',
    file: 'src/math.ts',
    gitHunk: diff.split('\n').filter(line => line.startsWith('@@')).map(line => line.trim()),
    gitIntervals,
    method: { name: 'add', start: addRange.start, end: addRange.end },
    intersections,
    changed: intersections.length > 0
  });
}

// added-multiply: addition of multiply function (which is now times)
{
  const diff = diffs['added-multiply'];
  const intervalsMap = parseChangedIntervals(diff);
  const intervals = intervalsMap.get('src/math.ts') || [];
  const gitIntervals = intervals.map(i => ({ start: i.start, end: i.end }));
  // Compute intersections with times method range (19-31)
  const methodRange = methods.times;
  const intersections = gitIntervals.map(i => 
    intersect(i.start, i.end, methodRange.start, methodRange.end)
  ).filter(Boolean);
  cases.push({
    case: 'added-multiply',
    file: 'src/math.ts',
    gitHunk: diff.split('\n').filter(line => line.startsWith('@@')).map(line => line.trim()),
    gitIntervals,
    method: { name: 'times', start: methodRange.start, end: methodRange.end },
    intersections,
    changed: intersections.length > 0
  });
}

// rename-multiply-to-times
{
  const diff = diffs['rename-multiply-to-times'];
  const intervalsMap = parseChangedIntervals(diff);
  const intervals = intervalsMap.get('src/math.ts') || [];
  const gitIntervals = intervals.map(i => ({ start: i.start, end: i.end }));
  // Compute intersections with times method range (19-31)
  const methodRange = methods.times;
  const intersections = gitIntervals.map(i => 
    intersect(i.start, i.end, methodRange.start, methodRange.end)
  ).filter(Boolean);
  cases.push({
    case: 'rename-multiply-to-times',
    file: 'src/math.ts',
    gitHunk: diff.split('\n').filter(line => line.startsWith('@@')).map(line => line.trim()),
    gitIntervals,
    method: { name: 'times', start: methodRange.start, end: methodRange.end },
    intersections,
    changed: intersections.length > 0
  });
}

// deleted-halve
{
  const diff = diffs['deleted-halve'];
  const intervalsMap = parseChangedIntervals(diff);
  const intervals = intervalsMap.get('src/math.ts') || [];
  const gitIntervals = intervals.map(i => ({ start: i.start, end: i.end }));
  // Check if the halve function was deleted.
  const lines = diff.split('\n');
  const hasHalveDeletion = lines.some(line => line.startsWith('-') && line.includes('halve'));
  cases.push({
    case: 'deleted-halve',
    file: 'src/math.ts',
    gitHunk: diff.split('\n').filter(line => line.startsWith('@@')).map(line => line.trim()),
    gitIntervals,
    gitDeletionDetected: hasHalveDeletion,
    currentAnalyzerEvidence: 'absent',
    historicalMetrics: 'unavailable',
    method: null,
    intersections: [],
    changed: false
  });
}

const result = {
  generatedAt: new Date().toISOString(),
  tool: '@barney-media/crap-typescript@0.5.0',
  cases
};

console.log(JSON.stringify(result, null, 2));