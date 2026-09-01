# WP10: Capability and Product Definition

## 1. Capability Definition
### What the Engine Does
- **Deterministic Evidence Generation:** Computes function-level code metrics (Cyclomatic Complexity, coverage integration, delta risk) purely deterministically from source code, AST/token parsers, and git diffs.
- **Contract Enforcement:** Produces strict, typed JSON artifacts matching frozen schema 0.2 (and forward-compatible design structures) with strict invariants (`INV-01` through `INV-04`).
- **Multi-Language Dispatch:** Dynamically routes file analysis based on file extension (`.py`, `.ts`, `.tsx`) to language-specific complexity providers (Lizard token-based for Python, AST-based for TypeScript).

### What the Engine Does Not Do
- **Arbitrary LLM Hallucination:** Does not rely on probabilistic generation for core metrics; all complexity and risk scores are mathematically derived from code structure and test execution.
- **Universal Language Support Out-of-the-Box:** Does not support every programming language natively without an explicit provider registered via the adapter layer.
- **Automated Refactoring:** Does not automatically rewrite code to reduce complexity or fix coverage gaps.

---

## 2. Target-User and Use-Case Definition
### Who Benefits
- **Core Maintainers / Code Reviewers:** Gain objective, non-negotiable complexity and test-coverage risk metrics for pull requests without manual counting.
- **Automated CI/CD Gates:** Block or flag pull requests that introduce high-complexity untested code changes.
- **Downstream LLM Agents:** Consume structured JSON evidence rather than raw diffs to understand exact code changes, complexity, and coverage impact.

### Improved Decision
- Deciding whether a pull request is safe to merge based on objective risk criteria (complexity delta, coverage delta) rather than subjective reviewer intuition.

### Smallest Useful Workflow
1. Developer opens PR.
2. CI action computes git diff and invokes evidence engine.
3. Engine runs language-specific complexity analyzer and coverage integration.
4. Engine outputs structured JSON evidence.
5. Reviewer / CI gate reads evidence to approve or block.

---

## 3. Supported-Claim Matrix

| Claim | Evidence | Confidence | Limitation |
|---|---|---|---|
| **Deterministic Metrics** | `src/evidence.ts`, unit tests | High | Depends on deterministic tool outputs (Lizard, coverage.py). |
| **Language Extensibility** | `experiments/wp13/adapter/index.ts`, `.py` & `.ts` routing | Medium | CC semantics diverge between token-based (Python) and AST-based (TS). |
| **Invariant Safety** | `evidence-contract.md` (`INV-01` to `INV-04`) | High | Assumes valid input files and correct git history state. |

---

## 4. Non-Goals
- Real-time IDE telemetry or LSP integration.
- Proprietary cloud-hosted telemetry database.
- Replacing standard linters (ESLint, Pylint) — engine focuses strictly on *changed function* delta risk and complexity.

---

## 5. Success Metrics
- **Determinism:** 100% reproducible metric output given the same commit range and workspace state.
- **Integration Reliability:** Zero unhandled exceptions during standard multi-language CI runs.
- **Actionability:** Clear binary or scored output that CI gates can evaluate in under 30 seconds.

---

## 6. Product-Shape Decision
- **Decision:** Standalone Core Engine + Engram Integration / Adapter Pattern.
- **Rationale:** Keeping the core engine lightweight and dependency-free ensures it can be embedded in any CI pipeline, CLI tool, or Engram workflow without tight coupling.
- **Rejected Alternatives:** Monolithic SaaS platform (too heavy) and pure CLI script without structured contracts (lacks maintainability).

---

## 7. Prioritized Research Questions (Ordered by Evidence Gap)
1. **Complexity Equivalence:** How significantly do Python token-based CC metrics diverge from AST-based metrics, and is a normalization factor required? (`WP13 REMAINING_LIMITATIONS_DEFERRED.md`)
2. **CI Overhead:** What is the exact execution time penalty when running multi-language AST/token analysis on large monorepos?
3. **LLM Consumption Efficiency:** Does providing structured JSON evidence directly improve downstream LLM code-review accuracy compared to raw diffs?

---

## 8. Provisional Next Branch
- **Selected Fork:** Proceed toward WP11 (Production Evidence Contract) and WP12 (Real Integration Validation) as core multi-language routing (`WP13-LANG-REGISTRY`) is successfully established.

---

## 9. Exit Criterion Answer
**"What problem are we solving, for whom, and what evidence would demonstrate that we solve it?"**
- **Problem:** Code review subjectivity and blind spots around high-complexity, untested changes in multi-language codebases.
- **For Whom:** Engineering teams and automated CI/CD systems managing evolving codebases.
- **Evidence:** Reproducible, structured JSON evidence artifacts produced reliably across Python and TypeScript codebases in CI workflows, satisfying frozen contract invariants (`INV-01` to `INV-04`).
