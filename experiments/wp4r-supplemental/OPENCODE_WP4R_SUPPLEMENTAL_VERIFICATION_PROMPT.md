# OpenCode Execution Prompt — WP4R Supplemental WARN and Threshold-Sensitivity Verification

## Mission
Execute one final narrowly scoped **WP4R supplemental verification pass**. WP5 has not started. Do not repeat the existing nine-case rerun.

We need exactly two real historical cases:
- **SUP-A:** changed function with CRAP >30.
- **SUP-B:** changed function with 15 < CRAP <=30.

Stop at the human-review gate.

## Hard Constraints
Do not modify production code, changed-function detection, complexity calculation, CRAP calculation, coverage attribution, thresholds, gate rules, CLI behavior, or target repository source/configuration.

Do not synthesize functions, manually manipulate coverage, fabricate evidence, broaden language support, debug Apollo/Jest as a side project, rerun the full original experiment, begin WP5, or autonomously classify usefulness.

## Step 0 — Documentation Correction
Correct the `isAllowedSecFetchSite` explanation in `experiments/wp4r-final/human-review-packet.md`. Preserve observed CC=3, coverage=100%, CRAP=3. Remove unsupported speculation that this output implies a different CRAP formula. Do not change implementation arithmetic.

## Phase 1 — Candidate Discovery
Search real historical TypeScript runtime changes. Prefer existing WP4R repos where practical; use another real TypeScript repo only if necessary and justify it.

A candidate must have a real base/target pair, runtime change, detection by the existing changed-function detector, numeric complexity, real attributable Istanbul-compatible coverage, and numeric CRAP.

Lock candidates by measured CRAP:
- SUP-A: CRAP >30
- SUP-B: 15 < CRAP <=30

If multiple qualify, prefer the smallest focused case with the cleanest evidence path. If no qualifying case can be found after reasonable bounded discovery, stop and report the search. Do not relax intervals without human approval.

## Phase 2 — Case Lock
Create `experiments/wp4r-supplemental/repository-selection.md`.

For each case record ID, repo, commit subject, base SHA, target SHA, file, function, changed-function count, diff LOC metadata, CC, coverage, CRAP, coverage command/artifact, selection rationale, and caller-side prerequisites.

After locking, do not substitute cases merely because human review might be unfavorable.

## Phase 3 — Execute
Under `experiments/wp4r-supplemental/`, preserve evidence per case.

For each:
1. Verify SHAs.
2. Generate coverage externally using the repository's native supported test path.
3. Preserve raw Istanbul-compatible coverage.
4. Run unchanged prototype at threshold 30 and preserve output/exit.
5. Run unchanged prototype at threshold 15 using the same evidence and preserve output/exit.
6. Confirm evidence inputs are identical except threshold configuration.

Selected functions must have numeric coverage and CRAP. If a target becomes NOT_EVALUATED due to genuine evidence failure, document it and return to discovery for that slot; do not alter the prototype.

Expected:
- SUP-A: WARN at 30; WARN at 15.
- SUP-B: PASS at 30; WARN at 15.

If behavior differs, stop and document it. Do not change code.

## Phase 4 — Human-Review Packet
Create `experiments/wp4r-supplemental/human-review-packet.md`.

Include for each case: IDs/SHAs/subject, file/function/range, changed lines, complete function source when reasonable, exact diff, CC, coverage, CRAP, coverage artifact and Istanbul attribution, threshold-30 result, threshold-15 result, factual logic description, and exact commands.

Leave classifications blank.

SUP-A:
- [ ] EXPECTED_WARN
- [ ] QUESTIONABLE_WARN
- [ ] UNDETERMINED

Question: Does the threshold-30 WARN identify a changed function that merits advisory attention?

SUP-B at threshold 30:
- [ ] EXPECTED_PASS
- [ ] QUESTIONABLE_PASS
- [ ] UNDETERMINED

Question: Does passing this function at threshold 30 appear reasonable?

SUP-B at threshold 15:
- [ ] USEFUL_WARN
- [ ] NOISY_WARN
- [ ] UNDETERMINED

Question: Does lowering the threshold to 15 add useful advisory signal, or primarily noise?

Do not answer these questions.

## Phase 5 — Results
Create `experiments/wp4r-supplemental/WP4R_SUPPLEMENTAL_RESULTS.md` with objective, selection summary, achieved intervals, coverage results, both threshold outcomes, completeness, deterministic-input confirmation, evidence paths, unresolved limitations, and statement that human classification remains pending.

Do not claim WP4R complete.

## Acceptance Gate
Verify:
- documentation correction completed;
- exactly two cases;
- SUP-A >30;
- SUP-B >15 and <=30;
- both real runtime changes with real numeric coverage/CRAP;
- SUP-A WARN/WARN;
- SUP-B PASS/WARN;
- same evidence used for both threshold runs;
- raw evidence preserved;
- review packet complete;
- classifications blank;
- production code untouched;
- WP5 not started.

## Stop Condition
STOP after evidence, review packet, and results summary. Do not classify, tune thresholds, modify prototype, add cases, declare WP4R complete, or begin WP5.

Return: files changed; selected cases/CRAP; 30/15 outcomes; evidence issues; unresolved items; confirmation production code untouched; confirmation WP4R remains at human-review gate.
