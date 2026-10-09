/**
 * Pure-TypeScript `.cs` method + approximate cyclomatic-complexity extractor.
 *
 * This is the FALLBACK path for C# analysis: no SDK, no `dotnet`, no Roslyn, no
 * subprocess of any kind. The only host dependency is `node:fs/promises`
 * `readFile`. It exists so that cycle 1 still produces COMPLETE coverage
 * evaluation on a machine without the .NET SDK (the rich path is Task 3).
 *
 * Shape parity: `MethodDescriptor` and `isValidFileName` are copied
 * field-for-field / byte-for-byte from pythonDescriptorProvider.ts:4-24 so that
 * attribution (src/attribution.ts:143 keys descriptors by
 * `${containerName ? containerName + '.' : ''}${functionName}:${startLine}`)
 * and `coverageForMethods` cannot tell the two providers apart. Do NOT
 * "improve" the guard here without changing the python one in the same commit.
 *
 * CC is an APPROXIMATION, by keyword counting over comment/string-stripped
 * source: base 1, plus one per `if` / `else if` / `foreach` / `for` / `while` /
 * `case` / `catch` / `&&` / `||` / `??` / `?:`. The per-token table and its
 * known blind spots are pinned in test/csharp-fallback-parity.test.ts. A real
 * AST would count `else if` once (this does too, via the `if` token) and would
 * additionally count `when` filters, `switch` expressions and `yield`, which
 * this does not. Divergence against the rich path is DELIBERATE and documented,
 * not accidental.
 *
 * Documented limitations (all pinned or waived in the test file):
 * - Block-bodied members AND expression-bodied METHODS (`int F() => x;`) are
 *   reported. Expression-bodied ones carry complexity 1 (the `=>` expression is
 *   never branch-parsed) and a span ending at the statement `;`, not at `{`.
 *   Expression-bodied PROPERTIES (`int P => 1;`), lambda field initialisers,
 *   abstract/interface declarations and fields are NOT methods here. Accepted
 *   blind spot: an expression-bodied member whose expression reaches a `{`
 *   before its `;` (collection initialiser, switch expression, block lambda) is
 *   not reported — the `{` severs the head before the terminator (pinned by the
 *   only-props test in test/csharp-fallback-parity.test.ts).
 * - Generic methods (`M<T>(...)`) ARE recognised: `stripTypeParameters` (:281)
 *   removes `<...>` groups from the head prefix before the name regex (:313),
 *   so `public T Accumulate<T>(` is named `Accumulate` and gets a real span.
 *   Before this, EVERY generic head ended in `>`, the name regex rejected it,
 *   and the method was silently dropped — losing coverage attribution entirely.
 *   REMAINING limitation, by design: an UNBALANCED `<`/`>` in the head
 *   (malformed source) hands the head back unchanged, so such a head is decided
 *   exactly as it was before — including the pre-existing misname of a head like
 *   `public T Broken<T(`, which ends in the identifier `T` and has always been
 *   reported as `T`. Both are pinned as parity locks, not endorsed. A nested
 *   argument list (`Func<Func<int>>`) is NOT a blind spot: the strip counts
 *   depth, so nested groups go whole.
 * - A recognised method body is skipped wholesale, so local functions inside it
 *   are never reported.
 * - Code inside interpolated-string holes (`$"{x if}"`) is blanked with the
 *   rest of the string.
 * - Constructors ARE reported, as functionName === the type name (so
 *   displayName is `Foo.Foo`). Rich-path naming may differ; that difference is
 *   in the pinned delta table.
 * - Malformed source degrades to whatever was recognised before the imbalance; a
 *   file with no recognisable method yields `[]`. Degradation is NON-THROWING
 *   but not faithful, and the deviation is worse than "stopped early": an
 *   unterminated block-comment opener pairs with the next block-comment closer
 *   ANYWHERE later in the file — even one sitting inside a string literal on a
 *   later line — so real code after it is retroactively blanked and reported
 *   spans shift. An unbalanced `[` in an attribute list is dropped whole (never
 *   a method). Only an unreadable path (missing file, bad encoding) THROWS — that
 *   is a caller bug, not unparseable content.
 */
import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';

export interface MethodDescriptor {
  functionName: string;
  containerName: string | null;
  displayName: string;
  startLine: number;
  endLine: number;
  complexity: number;
  bodySpan: {
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
  };
  expectsStatementCoverage: boolean;
  expectsBranchCoverage: boolean;
}

function isValidFileName(file: string): boolean {
  const baseName = basename(file);
  const regex = /^[a-zA-Z0-9._/-]+$/;
  return regex.test(baseName) && !baseName.includes('..') && !baseName.includes('\n') && !baseName.includes(';') && !baseName.includes('|');
}

// ponytail: keyword denylist, not a C# grammar. A head starting with one of
// these is a statement/expression, never a member declaration.
const STATEMENT_KEYWORDS = new Set([
  'add', 'and', 'as', 'async', 'await', 'base', 'break', 'case', 'catch', 'checked', 'class', 'const', 'continue',
  'default', 'delegate', 'do', 'else', 'enum', 'event', 'explicit', 'fixed', 'finally', 'for', 'foreach', 'from',
  'get', 'goto', 'group', 'if', 'implicit', 'in', 'init', 'interface', 'into', 'is', 'join', 'let', 'lock', 'namespace',
  'new', 'not', 'on', 'operator', 'or', 'orderby', 'out', 'params', 'record', 'ref', 'remove', 'return', 'select', 'set',
  'sizeof', 'stackalloc', 'struct', 'switch', 'this', 'throw', 'try', 'typeof', 'unchecked', 'unsafe', 'using',
  'value', 'var', 'when', 'where', 'while', 'with', 'yield',
]);

const CONTAINER_RE = /\b(?:class|struct|interface|record|enum)\s+([A-Za-z_]\w*)/;

// One pass, ordered alternation. Word-boundary keywords first (so `foreach` is
// not also counted as `for`), then the boolean operators, then `??`, then the
// ternary.
//
// The ternary alternative requires a `:` before the next `;`/`{`/`}` so a
// nullable-type annotation (`int? x`) with no colon in the statement is not
// counted, and `(?![?.])` excludes null-conditional access (`a?.b`). The
// lookbehind `(?<![)\]\w])` additionally excludes annotations directly after an
// identifier, `)`, `]` or `>` — e.g. `List<int?> x` — where the colon of a LATER
// ternary in the same statement would otherwise be reached. The cost of that
// guard is a documented false negative for a space-less ternary whose condition
// ends in an identifier, `)` or `]`: `x==1?a:b`. False negatives are preferred
// here because a false positive inflates CC against the 30/15 thresholds.
//
// `#if` preprocessor lines ARE counted as `if`: they are compile-time
// decisions. This is a deliberate divergence from a Roslyn AST walk, which
// ignores preprocessor conditionals.
const DECISION_RE = /\b(?:if|foreach|for|while|case|catch)\b|&&|\|\||\?\?|(?<![)\]\w])\?(?![?.])[^;{}]*?:/g;

/** Replace comment and string/char-literal content with spaces, preserving every offset. */
function blankNonCode(src: string): string {
  const out: string[] = [];
  let i = 0;
  while (i < src.length) {
    if (src.startsWith('//', i)) {
      const nl = src.indexOf('\n', i);
      const end = nl === -1 ? src.length : nl;
      out.push(blanks(src.slice(i, end)));
      i = end;
    } else if (src.startsWith('/*', i)) {
      const close = src.indexOf('*/', i + 2);
      const end = close === -1 ? src.length : close + 2;
      out.push(blanks(src.slice(i, end)));
      i = end;
    } else {
      const ch = src[i] ?? '';
      if (ch === '"' || ch === "'") {
        // Verbatim prefix is `@`, `$@` or `@$` — all three are verbatim (raw
        // `@` is an identifier sigil, `$` interpolation is compatible with
        // verbatim, so `"` after `$` is NOT verbatim).
        const verbatim = ch === '"' && /@\$?|\$@$/.test(src.slice(Math.max(0, i - 2), i));
        let j = i + 1;
        while (j < src.length) {
          const cur = src[j];
          if (!verbatim && cur === '\\') {
            j += 2;
            continue;
          }
          if (cur === ch) {
            if (verbatim && src[j + 1] === '"') {
              j += 2;
              continue;
            }
            j++;
            break;
          }
          if (ch === "'" && cur === '\n') break; // unterminated char literal
          j++;
        }
        out.push(blanks(src.slice(i, j)));
        i = j;
      } else {
        out.push(ch);
        i++;
      }
    }
  }
  return out.join('');
}

function blanks(text: string): string {
  return text.replace(/[^\n]/g, ' ');
}

function lineStartsOf(src: string): number[] {
  const starts = [0];
  for (let i = 0; i < src.length; i++) {
    if (src[i] === '\n') starts.push(i + 1);
  }
  return starts;
}

function lineIndexAt(starts: number[], offset: number): number {
  let lo = 0;
  let hi = starts.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if ((starts[mid] ?? 0) <= offset) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

function matchBrace(src: string, open: number): number {
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    const ch = src[i];
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return src.length - 1;
}

/** Index of the `)` closing the `(` at `open`, or -1 when unbalanced. */
function matchParen(src: string, open: number): number {
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    const ch = src[i];
    if (ch === '(') depth++;
    else if (ch === ')') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

interface Signature {
  name: string;
  returnPart: string;
  /** The head with its leading attribute lists removed — what name/returnPart were read from. */
  head: string;
}

/**
 * Remove leading attribute lists (`[Obsolete]`, `[Authorize(Roles = "x")]`) from
 * a member head. Without this, a parameterised attribute's own `(` is the FIRST
 * `(` in the head, so the member is reported under the attribute's name and the
 * real method vanishes — which silently drops coverage attribution.
 *
 * Safe because `blankNonCode` runs first: every `[`/`]`/`(` inside a string or
 * comment literal is already a space, so bracket counting cannot be fooled.
 * An unbalanced `[` (malformed source) drops the rest of the head.
 */
function stripAttributes(head: string): string {
  let rest = head;
  for (;;) {
    const start = rest.search(/\S/);
    if (start === -1 || rest[start] !== '[') return rest;
    let depth = 0;
    let i = start;
    for (; i < rest.length; i++) {
      if (rest[i] === '[') depth++;
      else if (rest[i] === ']') {
        depth--;
        if (depth === 0) break;
      }
    }
    if (i >= rest.length) return '';
    rest = rest.slice(0, start) + ' ' + rest.slice(i + 1);
  }
}

/**
 * Remove `<...>` groups from the part of a member head that precedes the `(`,
 * so a generic method's name is an identifier again: `public T Accumulate<T>`
 * becomes `public T Accumulate` and the name regex downstream matches it.
 *
 * Without this, EVERY generic method head ends in `>`, the name regex rejects
 * it, and the whole method is SILENTLY DROPPED — no descriptor, no span, no
 * coverage attribution, so a CRAPPY generic method cannot be reported at all.
 * That is the gap this closes.
 *
 * Depth-counted, deliberately NOT `<.*?>`: a nested argument list
 * (`Func<Func<int>>`) closes at the second `>`, and a non-greedy match would
 * stop at the first and leave the method head half-stripped. Not a C# grammar —
 * generic TYPE declarations and constraints never reach here (a constraint
 * follows the parameter list, i.e. after the `(` this slice stops at).
 *
 * Safe because `blankNonCode` runs first: every `<`/`>` inside a string or
 * comment is already a space, so bracket counting cannot be fooled.
 * An unbalanced bracket (malformed source) hands the head back UNCHANGED, so the
 * name regex decides as it did before this function existed — degradation, never
 * a new phantom member.
 */
function stripTypeParameters(before: string): string {
  if (!before.includes('<')) return before;
  let out = '';
  let depth = 0;
  for (const ch of before) {
    if (ch === '<') depth++;
    else if (ch === '>') {
      depth--;
      if (depth < 0) return before; // stray closer: strip nothing
    } else if (depth === 0) out += ch;
  }
  return depth === 0 ? out : before; // unclosed `<`: strip nothing
}

function signatureOf(head: string): Signature | null {
  const stripped = stripAttributes(head);
  const open = stripped.indexOf('(');
  if (open < 0) return null;
  // `=>` in the head is a method ONLY at body position: the first `(`'s
  // balanced `)` must be immediately followed by `=>` (expression-bodied
  // method — the member loop feeds such heads here at the statement `;`).
  // Any other `=>` is a lambda (`Select(i => i)`, `Wrap((x) => x)`) and stays
  // disqualified, exactly as the old blanket `stripped.includes('=>')` gate did.
  if (stripped.includes('=>')) {
    const close = matchParen(stripped, open);
    if (close < 0 || !/^\s*=>/.test(stripped.slice(close + 1))) return null;
  }
  // Strip type-parameter lists BEFORE the name regex, which needs an identifier
  // at the end of the head. `head` itself is left untouched, so `isMethodHead`'s
  // first-token STATEMENT_KEYWORDS read is unaffected, and the `=` / constructor
  // gates below keep seeing the same `returnPart` decision.
  const before = stripTypeParameters(stripped.slice(0, open).trimEnd());
  const nameMatch = /([A-Za-z_]\w*)\s*$/.exec(before);
  if (!nameMatch?.[1]) return null;
  const name = nameMatch[1];
  return { name, returnPart: before.slice(0, before.length - name.length).trim(), head: stripped };
}

function isMethodHead(head: string, containerName: string | null): Signature | null {
  const sig = signatureOf(head);
  if (!sig) return null;
  // Read the first token from the attribute-stripped head, not the raw one.
  const first = /[A-Za-z_]\w*/.exec(sig.head)?.[0];
  if (first === undefined || STATEMENT_KEYWORDS.has(first)) return null;
  // ponytail: a target-typed `new()` / collection-initializer field
  // (`static readonly Dictionary<string,int> Map = new() { ... }`) has a `(` in
  // its head but is a field, not a method — an `=` before the name is the tell.
  if (sig.returnPart.includes('=')) return null;
  // No return type means a constructor (or a lambda — already excluded above).
  if (!sig.returnPart) return sig.name === containerName ? sig : null;
  return sig;
}

export async function parseCsharpFileMethods(filePath: string): Promise<MethodDescriptor[]> {
  if (!isValidFileName(filePath)) {
    throw new Error(`Invalid file name: ${filePath}`);
  }

  const source = blankNonCode(await readFile(filePath, 'utf8'));
  const lineStarts = lineStartsOf(source);
  const descriptors: MethodDescriptor[] = [];
  const stack: { container: string | null }[] = [];
  let headStart = 0;
  let i = 0;

  /** Push a descriptor for the member spanning source[headStart..end] (end = `}` or `;`, inclusive). */
  const pushMember = (
    sig: Signature,
    container: string | null,
    start0: number,
    end: number,
    complexity: number
  ): void => {
    let start = start0;
    while (start < end && ' \t\r\n'.includes(source[start] ?? 'x')) start++;
    const startLineIdx = lineIndexAt(lineStarts, start);
    const endLineIdx = lineIndexAt(lineStarts, end);
    descriptors.push({
      functionName: sig.name,
      containerName: container,
      displayName: container ? `${container}.${sig.name}` : sig.name,
      startLine: startLineIdx + 1,
      endLine: endLineIdx + 1,
      complexity,
      bodySpan: {
        startLine: startLineIdx + 1,
        // A body that fits on ONE line anchors at column 0, not at the
        // declaration's column. Cobertura/LCOV emit statements as whole LINES
        // with startColumn 0 (coberturaProvider.ts:122, lcovProvider.ts:64), and
        // the attribution join compares columns whenever the statement and the
        // span share a start line (coverageAttribution.js:121,124 ->
        // comparePosition returns leftColumn - rightColumn for equal lines). At
        // the declaration column, `comparePosition(L, 12, L, 0) <= 0` was false
        // on both containment paths, so the statement was owned by nobody and
        // coverage came back null -> changed-function-high-crap NOT_EVALUATED ->
        // completeness INCOMPLETE. Multi-line bodies start on a DIFFERENT line
        // from any statement inside them, so their startColumn is never read for
        // containment and stays exactly as measured.
        startColumn:
          startLineIdx === endLineIdx ? 0 : start - (lineStarts[startLineIdx] ?? 0),
        endLine: endLineIdx + 1,
        endColumn: end - (lineStarts[endLineIdx] ?? 0) + 1,
      },
      expectsStatementCoverage: true,
      expectsBranchCoverage: true,
    });
  };

  while (i < source.length) {
    const ch = source[i];
    if (ch === ';') {
      // Expression-bodied members terminate at `;` and never reach the `{`
      // trigger below — evaluate the accumulated head HERE (both gates: this
      // `;` trigger + signatureOf's structural `=>` check). Attribute lists are
      // stripped first so a lambda inside an attribute (`[My(() => 1)]`) does
      // not look like an expression body. complexity is 1: the `=>` expression
      // is never branch-parsed.
      const head = source.slice(headStart, i);
      if (stripAttributes(head).includes('=>')) {
        const container = stack.length ? (stack[stack.length - 1]?.container ?? null) : null;
        const sig = isMethodHead(head, container);
        if (sig) pushMember(sig, container, headStart, i, 1);
      }
      headStart = i + 1;
      i++;
      continue;
    }
    if (ch === '}') {
      stack.pop();
      headStart = i + 1;
      i++;
      continue;
    }
    if (ch !== '{') {
      i++;
      continue;
    }

    const head = source.slice(headStart, i);
    const container = stack.length ? (stack[stack.length - 1]?.container ?? null) : null;
    // An attr-stripped `=>` in the head means an expression-bodied member whose
    // EXPRESSION reaches this `{` (initialiser, switch arm, block lambda) —
    // never a block-bodied method. Evaluating it here would anchor the span
    // mid-expression and branch-count the body; the statement `;` path above
    // owns `=>` heads. Matches the old signatureOf `=>` gate byte-for-byte.
    const sig = stripAttributes(head).includes('=>') ? null : isMethodHead(head, container);
    if (sig) {
      const close = matchBrace(source, i);
      const body = source.slice(i + 1, close);
      pushMember(sig, container, headStart, close, 1 + (body.match(DECISION_RE)?.length ?? 0));
      // Jump past the whole body: nested blocks and local functions are not
      // scanned, and `endLine` is the method's own closing brace.
      i = close + 1;
      headStart = i;
      continue;
    }

    const containerMatch = CONTAINER_RE.exec(head);
    stack.push({ container: containerMatch?.[1] ?? container });
    headStart = i + 1;
    i++;
  }

  return descriptors;
}
