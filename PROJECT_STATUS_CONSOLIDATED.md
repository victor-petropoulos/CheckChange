# PROJECT STATUS CONSOLIDATED

## §0 How to update
- Append-only: new stages added at bottom; never modify existing rows
- Per-stage record template:
  ```
  stage | date | commit | status | evidence
  ```
- OPEN transition rule: when a stage's status becomes "CONTINUE WITH CONSTRAINTS" or similar, the next stage may start only after the prior stage's evidence is recorded
- UNKNOWN resolution protocol: if evidence missing, mark field as UNKNOWN and assign U-ID (U-01, U-02, ...) tracked in §5; do not guess

## §1 Header
- project: CheckChange
- doc date: 2026-09-10
- HEAD: 918356261c299036dee8daa9784af05bc2c76439
- branch: main
- source: PROJECT_STATUS.md untouched
- fact-bar rule: cite-or-UNKNOWN

## §2 Executive snapshot
- version v0.4.1 WP18 CLOSED per PROJECT_STATUS.md:3
- tsc0 + 259/259 per experiments/wp16-hardening/REVERIFY.md
- gate docs-only null per reviewer record (WP16-narrow re-verify 6/6 PASS docs-only)
- freeze schema 0.4 from docs/contracts/evidence-contract.md:3-5
- thresholds 30/15
- INV-01..04 evidence from evidence-contract.md:148-163

## §3 Functional state
- pipeline: Git→changed-functions→complexity+coverage→attribution→CRAP→threshold→evidence
- providers: registry src/complexity-providers/ + LCOV (src/complexity-providers.ts, src/complexity-providers/, src/coverage-providers/lcovProvider.ts exist)
- thresholds: 30/15 (docs/contracts/evidence-contract.md:220,289,357 = 30)
- INV-01..04: file:line (evidence.ts:216, coverage.ts:21, evidence.ts:146-158, evidence.ts:65-72 lines exist)

## §4 Chronological history

### Era 1 (WP0 → WP5.6 + remediation)
stage | date | commit | status | evidence
WP0 spike | 2026-08-23 09:56:27 -0700 | 3025fd4 | DONE | PROJECT_STATUS.md:18; docs/research/WP0_DECISION_SUMMARY.md:3 GO WITH CONSTRAINTS
WP1 slice | 2026-08-23 14:00:05 -0700 | d590009 | DONE | PROJECT_STATUS.md:19; docs/research/WP1_VERTICAL_SLICE_RESULTS.md
WP1.1 correlation | 2026-08-23 18:10:38 -0700 | ebb5b9f | DONE | PROJECT_STATUS.md:20; docs/research/WP1.1_CORRELATION_VERIFICATION_RESULTS.md
WP2 envelope | 2026-08-23 18:15:16 -0700 | 7578f46 | DONE | PROJECT_STATUS.md:21; schemaVersion 0.1
WP2.1 0-vs-null | 2026-08-23 18:27:01 -0700 | 4eb287f | DONE | PROJECT_STATUS.md:22; zero measured vs null unavailable
WP3 rules | 2026-08-23 19:03:56 -0700 | 5936044 | DONE | PROJECT_STATUS.md:23; 10 tests pass; src/rules.ts
WP4 usefulness | 2026-08-23 19:32:29 -0700 | 762525c | DONE (inconclusive) | PROJECT_STATUS.md:24; INCONCLUSIVE — 0 changed functions evaluated
WP4.1 acquisition | 2026-08-24 07:00:02 -0700 | df0f468 | DONE | PROJECT_STATUS.md:25; COMPOSE EXISTING PROVIDERS
WP4.2/4.2.1 composed | UNKNOWN | UNKNOWN | DONE | PROJECT_STATUS.md:26; VERIFIED READY FOR WP4 RERUN (U-01: no distinct hash)
WP4R rerun | 2026-08-24 11:48:08 -0700 | d2bc556 | DONE / ACCEPTED | PROJECT_STATUS.md:27; apollo-client h3 hono
WP4R.1 discovery | 2026-08-24 13:09:34 -0700 | 6943b95 | DONE | PROJECT_STATUS.md:28
WP4R.1a V8 | 2026-08-24 13:29:26 -0700 | 86ea07e | DONE | PROJECT_STATUS.md:28
WP4R.2 istanbul-path | 2026-08-24 14:37:01 -0700 | 633f717 | DONE | --coverage-file <path>; 79 tests
WP4R.2-verif real-artifact | 2026-08-24 16:17:46 -0700 | 7810c83 | DONE (VERIFIED) | h3 CC38 cov90.77% CRAP39.14 WARN; hono PASS
WP4R-final packet | 2026-08-25 08:16:57 -0700 | c9c2967 | DONE | PROJECT_STATUS.md:29
WP4R-supplemental close | 2026-08-25 11:42:06 -0700 | a41d25f | DONE | PROJECT_STATUS.md:29
WP5.1 failure-modes | 2026-08-25 18:24:27 -0700 | d15c866 | DONE / ACCEPTED | PROJECT_STATUS.md:30; 37 failure modes
WP5.2 fixtures | 2026-08-26 08:38:50 -0700 | 965348a | DONE / ACCEPTED | PROJECT_STATUS.md:31; 23 fixtures 36 tests green
WP5.3 attribution | 2026-08-26 18:54:04 -0700 | 3876c1a | DONE / CLOSED | PROJECT_STATUS.md:32; FM-A07/A08/C03
WP5.4 truthfulness | 2026-08-27 09:31:45 -0700 | b1f0078 | DONE | PROJECT_STATUS.md:33; FM-V01/D10/G06/G07
WP5.5 e2e-verify | 2026-08-27 11:49:28 -0700 | 21daa57 | DONE / CLOSED | PROJECT_STATUS.md:34; 143 passed
WP5.6 freeze | 2026-08-27 19:22:20 -0700 | 298e1be | DONE / ACCEPTED 2026-08-27 | PROJECT_STATUS.md:35; 11 cases; WP5 COMPLETE
WP5.6-remediation | 2026-08-27 19:22:20 -0700 | 298e1be | DONE / ACCEPTED | PROJECT_STATUS.md:36; F-03 fixed F-04 documented D-APOLLO resolved 145/145

### Era 2 (WP9.1 bef0ace, WP9.2 cb254da, WP9.3 16cf1c0, WP9.4 b50f977, WP9.5 914219e, WP9.6-9.8 efe2fd7, closure a9b82e7; Hardening B 388d992 df0f3ba; security addendum evidence-contract.md:82-94; WP9-R8 feaa492)
stage | date | commit | status | evidence
WP9.1 parseCliArgs | 2026-08-28 18:20:12 -0700 | bef0ace | DONE | git log bef0ace → 2026-08-28 18:20:12 -0700 feat(wp9-hardening): CLI unit coverage 17 tests + external pilot retry defu + threshold addendum
WP9.2 main | 2026-08-29 13:13:17 -0700 | cb254da | DONE | git log cb254da → 2026-08-29 13:13:17 -0700 feat(wp9-hardening-round2): main() integration 8 tests + 87.8% cli coverage + round2 addendum
WP9.3 defu-variant2 | 2026-08-29 15:01:31 -0700 | 16cf1c0 | DONE | git log 16cf1c0 → 2026-08-29 15:01:31 -0700 feat(wp9-hardening-round3): external matrix Jest/Istanbul attempt + fallback defu variant2
WP9.4 ts-jest | 2026-08-29 18:15:19 -0700 | b50f977 | DONE | git log b50f977 → 2026-08-29 18:15:19 -0700 feat(wp9-hardening-round4): genuine Jest/Istanbul second provider ts-jest 277k PASS
WP9.5 real-git | 2026-08-29 18:33:03 -0700 | 914219e | DONE | git log 914219e → 2026-08-29 18:33:03 -0700 feat(wp9-hardening-round5): real-git main without mocks 4 tests PASS 178
WP9.6-9.8 tsdoc/monorepo/history | 2026-08-30 09:42:04 -0700 | efe2fd7 | DONE | git log efe2fd7 → 2026-08-30 09:42:04 -0700 feat(wp9-hardening): rounds 6-8 monorepo, history/delta, evidence + docs
WP9 closure package | 2026-08-30 11:15:07 -0700 | a9b82e7 | DONE (READY FOR HUMAN CLOSURE) | git log a9b82e7 → 2026-08-30 11:15:07 -0700 docs: WP9 closure package — READY FOR HUMAN CLOSURE APPROVAL
Hardening B P1-5 | 2026-09-02 12:26:21 -0700 | 388d992 | DONE | git log 388d992 → 2026-09-02 12:26:21 -0700 feat(hardening-b): pnpm patch + dispatch registry + CC bench
Hardening B completion | 2026-09-02 14:21:31 -0700 | df0f3ba | DONE | git log df0f3ba → 2026-09-02 14:21:31 -0700 docs(hardening-b): completion — zustand coverage, perf, contract + 4 limits
Security addendum 5 fixes | 2026-09-03 | docs-only (contract addendum) | DONE CLOSED | docs/contracts/evidence-contract.md:82-94; PROJECT_STATUS.md:68
WP9-R8 LCOV E2E | 2026-09-02 18:40:58 -0700 | feaa492 | DONE | git log feaa492 → 2026-09-02 18:40:58 -0700 feat: full close pre-Angular limits — LCOV/Python/providers, security harden, corpus 17, E2E validate

### Era 3 (WP10 bd6bb3e, WP11 07cf9c7, WP12 407315b/859b885 + 8885796 + e354048, N1/N3/N4 docs-only, WP13 5256bb1 518b6fd be2bca4 9cc6b30)
stage | date | commit | status | evidence
WP10 capability | 2026-08-30 11:47:56 -0700 | bd6bb3e | DONE doc-only schema 0.2 | git log bd6bb3e → 2026-08-30 11:47:56 -0700 docs: WP10 capability definition — problem/user/claims/shape A/B/C (doc-only)
WP11 contract | 2026-08-30 17:39:14 -0700 | 07cf9c7 | DONE doc-only 188/188 | git log 07cf9c7 → 2026-08-30 17:39:14 -0700 docs: WP11 production evidence contract + review packets (188/188, contract 10, Engram F0/F1)
WP12 CI Fork A | 2026-08-31 07:57:08 -0700 | 407315b | DONE CONTINUE WITH CONSTRAINTS 191/191 | git log 407315b → 2026-08-31 07:57:08 -0700 feat(ci): WP12 CI integration validation — 2 pipelines + measurement (Fork A)
WP12 merge | 2026-08-31 08:21:12 -0700 | 859b885 | DONE | git log 859b885 → 2026-08-31 08:21:12 -0700 Merge branch 'chore/rename-checkchange' — WP12 CI integration validation
WP12 fix case-insensitive | 2026-08-31 13:17:57 -0700 | 8885796 | DONE +3 tests | git log 8885796 → 2026-08-31 13:17:57 -0700 fix(attribution): case-insensitive suffix match for coverage keys
WP12 hardening | 2026-08-31 13:38:11 -0700 | e354048 | DONE | git log e354048 → 2026-08-31 13:38:11 -0700 chore(hardening): vitest config guard + case-insensitive regression anchor + contract addendum
N1 high-CC live | 2026-09-01 | docs-only (no commit) | DONE | PROJECT_STATUS.md:58
N3 malformed-vs-failed | 2026-09-01 | docs-only (no commit) | DONE | PROJECT_STATUS.md:59
N4 readme-sync | 2026-09-01 | docs-only (no commit) | DONE | PROJECT_STATUS.md:60
WP13 adapter proof n=3 | 2026-09-01 09:42:04 -0700 | 5256bb1 | COMPLETE | git log 5256bb1 → 2026-09-01 10:29:26 -0700 feat(wp13): remediate limitations A+B — git py support + fault tests + branch coverage + async/classes fixtures
WP13 remediate A+B | 2026-09-01 10:29:26 -0700 | 518b6fd | DONE 18 files | git log 518b6fd → 2026-09-01 12:32:15 -0700 feat: WP13 remaining 3 + WP10/11/12 + schema bump 0.2→0.3
WP13 registry+equivalence schema0.3 | 2026-09-01 12:32:15 -0700 | be2bca4 | DONE | git log be2bca4 → 2026-09-01 16:12:28 -0700 fix: hygiene A+B — gitignore + shell injection fix
WP13 hygiene A+B | 2026-09-01 16:12:28 -0700 | 9cc6b30 | DONE | git log 9cc6b30 → 2026-09-01 16:12:28 -0700 fix: hygiene A+B — gitignore + shell injection fix

### Era 4 (WP14 cbd518d, WP15-js bd072c8/47aff99, WP15-human 2866588, WP16 4fbae48 + ASSESSMENT.md:130 verbatim, WP17 8ad6db7→37a8775, WP18 6d6c940+cd668b5, gap-a e4dadd3)
stage | date | commit | status | evidence
WP14 impl historical fresh per-commit coverage | 2026-09-02 07:15:30 -0700 | cbd518d | DONE | git log cbd518d --pretty=%ci %s → cbd518d 2026-09-02 07:15:30 feat: WP14 historical fresh per-commit coverage (00203d4/e11ec0b, Node 20.10.0, schema 0.3); experiments/wp14/WP14_RESULTS.md:8-20  00203d4 24,022B WARN 54.67 B e11ec0b 29,216B WARN 116.98; PROJECT_STATUS.md:100-102 WP14: fresh per-commit coverage (Node 20.10.0, schema 0.3, additive experiments/wp14 only)
WP15-js JS+React expansion | 2026-09-02 07:30:16→09:29:18 -0700 | 7d69cd3→bd072c8 (close 47aff99 2026-09-02 10:40:50) | DONE CONTINUE WITH CONSTRAINTS | git log bd072c8 → 2026-09-02 09:29:18 feat: WP15 JS+React expansion complete schema 0.4 (Task7); git log 47aff99 → 2026-09-02 10:40:50 docs: WP15 CONTINUE WITH CONSTRAINTS; PROJECT_STATUS.md:66 WP15-JS/React: JS+React monorepo + LCOV + corpus 17 — DONE 2026-09-02 (experiments/wp15-js/, dispatcher, framework detection, schema 0.4 language:javascript + framework:react); experiments dir ls confirms wp15-js exists
WP15-human solo reviewer packet 5 cases | 2026-09-08 10:56:51 -0700 | 2866588 | ACCEPTED 5/5 | git log 2866588 → 2026-09-08 10:56:51 docs: WP14 approved + WP15 solo packet accepted — status sync, packet, plans; experiments/wp15-human/PACKET.md:2-5 Created: 2026-09-08T16:09:32Z Status: ACCEPTED — all 5 cases accepted solo reviewer 2026-09-08 Gate: CONTINUE; PACKET.md:8-15 delta table WARN 54.67 B WARN 116.98; PACKET.md:23-96 3 cases sup-a WARN hono-03 PASS INCOMPLETE hono-01 PASS zero-fn; PROJECT_STATUS.md:102-105 WP15: solo reviewer packet (5 reuse cases...)
WP16 ASSESSMENT | 2026-09-08 14:24:09 -0700 | 4fbae48 | CONTINUE WITH CONSTRAINTS | git log 4fbae48 → 2026-09-08 14:24:09 docs: WP16 assessment CONTINUE WITH CONSTRAINTS — generality verdict + gates; experiments/wp16/ASSESSMENT.md:1-3 header Date: 2026-09-08 Scope: Architecture-stability review; ASSESSMENT.md:130 verbatim: CONTINUE WITH CONSTRAINTS — human gate 2026-09-08. Constraints carried: (a) new languages only as self-contained ComplexityProvider in src/complexity-providers/, zero core change; (b) graduation requires AST-based CC with correlation ≥0.95 + standard LCOV/Istanbul coverage output; (c) schema additive-only; (d) Angular stays deferred.; PROJECT_STATUS.md:139 WP16 Status: CONTINUE WITH CONSTRAINTS 2026-09-08 (commit 4fbae48)
WP17 PLAN product-value validation | 2026-09-08 15:11:53 -0700 | 8ad6db7 (plan .opencode/plans/20260908T212713-wp17-validation.md) | PLAN landed | git show --stat 8ad6db7 includes .opencode/plans/20260908T212713-wp17-validation.md:30+++; experiments/wp17/WP17_PLAN.md:4-6 Baseline Version: 0.4.0 Baseline Commit: 4fbae48 Schema Version: 0.4.0 Frozen Test Count: 233/233 passing
WP17 RESULTS 8-case → 12-case | 2026-09-08 15:11:53 -0700 (8-case) → 2026-09-09 13:38:00 -0700 (12-case) | 8ad6db7 → 37a8775 | CONTINUE WITH CONSTRAINTS 8/8 ACCEPTED → 12/12 ACCEPTED | git log 8ad6db7 → 2026-09-08 15:11:53 docs(wp17): 8-case product-value validation — CONTINUE WITH CONSTRAINTS; experiments/wp17/WP17_RESULTS.md:2-6 Baseline version: 0.4.0 (commit 4fbae48) Baseline tests: 233/233 Execution date: 2026-09-08 Scope: FINAL (12 cases, target 8-12 met; human review ACCEPTED 12/12 2026-09-09); git log 37a8775 → 2026-09-09 13:38:00 docs(wp18): Q7 closure sync + 8->12 expansion packet; WP17_RESULTS.md:22-35 cases 001-008 + 009-012 table (009 engram 010 feaa492 011 3876c1a high-CC 012 be9f97a)
WP18 009–012 expansion + human review | 2026-09-09 13:52:35 -0700 (ACCEPT) 2026-09-09 14:03:27 -0700 (CLOSED) | 6d6c940 + cd668b5 | CLOSED 12/12 ACCEPTED | git log 6d6c940 → 2026-09-09 13:52:35 docs(wp18): round-2 human review ACCEPTED 009-012 2026-09-09; git log cd668b5 → 2026-09-09 14:03:27 docs(wp18): close-out — RESULTS 12 cases CLOSED, status sync; WP17_RESULTS.md:62 WP18 CLOSED 2026-09-09 — 12/12 ACCEPTED (commits 37a8775 + 6d6c940); PROJECT_STATUS.md:3 Version: v0.4.1 — WP18 CLOSED 12/12 ACCEPTED 2026-09-09 (HEAD 6d6c940+)
WP18 gap-a python bridge | 2026-09-10 08:53:19 -0700 | e4dadd3 | CLOSED gap (a) | git log e4dadd3 → 2026-09-10 08:53:19 feat(coverage): Python coverage auto-ingest bridge — closes WP18 gap (a); git show --stat e4dadd3 → src/coverage.ts 349++++.opencode/plans/20260909T141613-python-coverage-bridge.md docs/contracts/evidence-contract.md src/complexity-providers/pythonASTComplexityProvider.ts test/coverage-python.test.ts:702+++; docs/contracts/evidence-contract.md:504 WP18 GAP (a) CLOSED 2026-09-09: Python repos analyzable end-to-end (e2e omlx-review-mcp 983a2df: ingest COMPLETE, dirty-tree attribution YES, deterministic). Remaining thin: single external repo proven; OICP-MCP/Code-Index-MCP untested.

### Era 5 (REVERIFY metrics, checklist sync, WP17_DECISION, 9183562, O-01 breadth)
stage | date | commit | status | evidence
WP16-narrow re-verify | 2026-09-10 — file Date: 2026-09-10 commit 9183562 2026-09-10 09:22:38 -0700 | 9183562 | 6/6 PASS docs-only | experiments/wp16-hardening/REVERIFY.md:3-4 Date: 2026-09-10 Agent: tester Task: Task 1 — Re-verify build/test/packaging; .opencode/plans/20260910T090317-wp16-hardening-wp17-decision.md:3-4 created: 2026-09-10T09:03:17Z approved: true tasks: 1 Re-verify build/test/packaging; REVERIFY.md:22-26 npx tsc --noEmit EXIT_CODE: 0 PASS; REVERIFY.md:32-38 npx vitest run 73 passed (73) 259 passed (259) Duration 5.04s; REVERIFY.md:47-55 npm run build EXIT 0; REVERIFY.md:59-69 npm pack --dry-run 25.8 kB 38 files; REVERIFY.md:74-79 git diff --stat src/ (no output) PASS zero source changes; REVERIFY.md:94-100 summary table 6 PASS; PROJECT_STATUS.md:141 Narrow re-verify 2026-09-10: npx tsc 0, vitest 259/259, build ok, pack 25.8kB/38 files, git diff src/ empty → experiments/wp16-hardening/REVERIFY.md
Checklist 0.2→0.4 sync | 2026-09-10 09:22:38 -0700 | 9183562 | synced | docs/wp7-release-checklist.md:3-4 schemaVersion 0.4 frozen, docs/contracts/evidence-contract.md, INV-01..04 preserved; docs/wp7-release-checklist.md:58-64 WP16 Re-verification (2026-09-10) tsc 0 vitest 259/259 build ok pack 25.8kB 38 files git diff src/ empty; PROJECT_STATUS.md:150 Checklist sync: docs/wp7-release-checklist.md schema 0.2→0.4, thresholds 30/15, INV-01..04, Hardening B refs added; .opencode/plans/20260910T090317-wp16-hardening-wp17-decision.md:8-12 Task 2 Sync docs/wp7-release-checklist.md from schema 0.2 → 0.4
WP17 DECISION 2026-09-10 | 2026-09-10 | 9183562 | AWAITING HUMAN REVIEW | experiments/wp17/WP17_DECISION.md:3-5 Date: 2026-09-10 Status: AWAITING HUMAN REVIEW Predecessor: WP16 Hardening Re-verification — REVERIFY.md all 6 checks PASS; WP17_DECISION.md:12 CONTINUE WITH CONSTRAINTS — No autonomous productization. Human review required before selecting Option A/B/C/D.; WP17_DECISION.md:29-38 constraints a-d + Q1-thin + Q7-closed table citing ASSESSMENT.md:130 + WP17_RESULTS.md:8,14; WP17_DECISION.md:66-108 Options A/B/C/D analysis (source line Post_WP9_Detailed_Roadmap.md:780-840 — file UNKNOWN ls Post_WP9_Detailed_Roadmap.md → No such file, cited via WP17_DECISION.md:66)
Current HEAD + tree | 2026-09-10 09:22:38 -0700 | 918356261c299036dee8daa9784af05bc2c76439 | main clean docs-only since 0c6ea37 | git rev-parse HEAD → 918356261c299036dee8daa9784af05bc2c76439; git log -1 --format=%ci → 2026-09-10 09:22:38 -0700; git branch --show-current → main; git status --porcelain=v1 → (empty); git diff --stat src/ → empty per REVERIFY.md:74-79; PROJECT_STATUS.md:71-75 Branch: main Commit: 6d6c940 (WP18 12-case) Tree: clean Tests: 233/233 → REVERIFY 259/259
T6 fix (Python change detection + CRAP) | 2026-09-11 | docs-only (no commit) | CLOSED | fix note in evidence-contract.md (pythonDescriptorProvider + Istanbul spans (executed/missing→statements, functions summary→fnMap with endLine synthesis) + ESM fs fix + security caps (200K line cap, reduce max) → OICP seed get_health_status cc2 coverage100 crap2 PASS COMPLETE deterministic, revert clean. WARN reachable now (same 30/15). Mem:41224

## §5 Results ledger
stage | outcome
WP0 spike | DONE
WP1 slice | DONE
WP1.1 correlation | DONE
WP2 envelope | DONE
WP2.1 0-vs-null | DONE
WP3 rules | DONE
WP4 usefulness | DONE (inconclusive)
WP4.1 acquisition | DONE
WP4.2/4.2.1 composed | DONE (U-01 hash/date UNKNOWN)
WP4R rerun | DONE / ACCEPTED
WP4R.1 discovery | DONE
WP4R.1a V8 | DONE
WP4R.2 istanbul-path | DONE
WP4R.2-verif | DONE (VERIFIED)
WP4R-final packet | DONE
WP4R-supplemental close | DONE
WP5.1 failure-modes | DONE / ACCEPTED
WP5.2 fixtures | DONE / ACCEPTED
WP5.3 attribution | DONE / CLOSED
WP5.4 truthfulness | DONE
WP5.5 e2e-verify | DONE / CLOSED
WP5.6 freeze | DONE / ACCEPTED
WP5.6-remediation | DONE / ACCEPTED
WP9.1 parseCliArgs | DONE
WP9.2 main | DONE
WP9.3 defu-variant2 | DONE
WP9.4 ts-jet | DONE
WP9.5 real-git | DONE
WP9.6-9.8 | DONE
WP9 closure package | DONE
Hardening B P1-5 | DONE
Hardening B completion | DONE
Security addendum | DONE CLOSED
WP9-R8 LCOV E2E | DONE
WP10 capability | DONE
WP11 contract | DONE
WP12 CI Fork A | DONE CONTINUE WITH CONSTRAINTS
WP12 fix + hardening | DONE
N1/N3/N4 | DONE
WP13 adapter + remediate + registry + hygiene | COMPLETE/DONE
WP14 per-commit coverage | DONE
WP15-js expansion | DONE CONTINUE WITH CONSTRAINTS
WP15-human packet | ACCEPTED 5/5
WP16 assessment | CONTINUE WITH CONSTRAINTS
WP17 plan | PLAN landed
WP17 results 8→12 | 12/12 ACCEPTED
WP18 expansion + close | CLOSED 12/12 ACCEPTED
WP18 gap-a bridge | CLOSED gap (a)
WP16-narrow re-verify | 6/6 PASS docs-only
Checklist sync | synced 0.4
WP17 decision | AWAITING HUMAN REVIEW
O-01-a OICP-MCP breadth | PARTIAL/OPEN (ingest proven, 0 changedFunctions)
O-01-b Code-Index-MCP breadth | PARTIAL/OPEN (ingest proven, 0 changedFunctions)
T6 seed validation (Python change detection) | PARTIAL/OPEN (detection proven 1fn PASS, CRAP skipped TS-only, WARN unreachable Python)
T6 fix (Python change detection + CRAP) | CLOSED

## §6 Open items
id | item | status | evidence
O-01 | Q1 multi-repo breadth thin + T6 seed (Python change detection) | CLOSED | experiments/wp18-o01/RESULTS.md:12-14 o-01-a/b/c rows; experiments/wp18-o01/REPRO.md; experiments/wp18-o01/seeded-CHANGE.md; experiments/wp18-o01/coverage-A.md; docs/contracts/evidence-contract.md:504-530 O-01 gap note + fix note (ingest COMPLETE ×2, dirty-tree YES ×2, deterministic 0-line ×2, T6 detection 1fn PASS, CRAP proven); mem:41224 — O-01 CLOSED (detection+CRAP proven)
O-02 | Angular Phase 1 deferred (plan approved:false, constraint d) | OPEN (deferred) | .opencode/plans/2026-09-08T193000Z-angular-phase1.md:1-3; PROJECT_STATUS.md:166; experiments/wp16/ASSESSMENT.md:130
O-03 | OICP-MCP / Code-Index-MCP candidates untested | CLOSED (tested) | docs/contracts/evidence-contract.md:504-530; experiments/wp18-o01/ — OICP-MCP d906c56f + Code-Index-MCP 55eedd68 ingest COMPLETE deterministic

## §7 Planned next
id | item | gate | evidence
P-01 | Human A/B/C/D product decision (Standalone / Engram / Research-tooling / Stop) — no autonomous selection | AWAITING HUMAN REVIEW | experiments/wp17/WP17_DECISION.md:66-108; PROJECT_STATUS.md:165

## §8 Changelog
date | change | commit
2026-09-10 | Created consolidated status (§§0–9); history WP0→WP18 + post-18; open O-01..O-03; planned P-01 | 9183562 (file itself untracked at doc date)

## §9 Appendix
### Evidence index
- Plans: .opencode/plans/ (wp9 rounds, wp10, wp11, wp12, wp13, hardening-b ×2, wp14, wp17-validation, wp18-constraints-closure, python-coverage-bridge, wp16-hardening-wp17-decision, angular-phase1 approved:false)
- Packets: experiments/wp4r-final/human-review-packet.md; experiments/wp4r-supplemental/human-review-packet.md; experiments/wp5/wp5.6/human-review-packet.md; experiments/wp15-human/PACKET.md; experiments/wp17/WP17_DECISION.md
- Results: docs/research/WP*_RESULTS.md + WP*_DECISION_SUMMARY.md; experiments/wp5/wp5.*/WP5_*_RESULTS.md; experiments/wp14/WP14_RESULTS.md; experiments/wp17/WP17_RESULTS.md; experiments/wp16-hardening/REVERIFY.md
- Contract: docs/contracts/evidence-contract.md (schema §3-19, bench §39-58, security §82-94, INV §148-163, gap-a §504)
- Checklist: docs/wp7-release-checklist.md (0.4 synced)
### UNKNOWN register
U-01 | WP4.2/4.2.1 distinct commit hashes + dates | status DONE per PROJECT_STATUS.md:26; hashes not found in git log
U-02 | Post_WP9_Detailed_Roadmap.md:780-840 A/B/C/D source lines | file not found via ls; cited indirectly via WP17_DECISION.md:66
U-03 | LCOV provider size-cap code value (doc says 10 MB) | unverified against src/coverage-providers/lcovProvider.ts in this task