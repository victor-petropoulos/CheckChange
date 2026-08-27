# WP5.3 Adversarial Case Matrix

This matrix maps each adversarial test fixture to the invariant it validates, as defined in `attribution-invariants.md`.

| Adversarial Test Fixture | Linked FM | Validated Invariant | Invariant Description |
|--------------------------|-----------|---------------------|----------------------|
| exact-path-control.spec.ts | FM-A08 | INV-01 (Same-Function Identity) | Complexity and coverage must identify the same logical function. |
| suffix-collision-3files.spec.ts | FM-A08 | INV-02 (Wrong-File Prohibition) | Wrong-file coverage must never be selected because paths share suffixes. |
| reversed-coverage-map-order.spec.ts | FM-A08 | INV-04 (Order Independence) | Coverage-map order cannot change attribution. |
| class-method.spec.ts | FM-A07 | INV-05 (Deterministic Container Identity) | Container-method identity must be deterministic. |
| object-method.spec.ts | FM-A07 | INV-05 (Deterministic Container Identity) | Container-method identity must be deterministic. |
| same-name-different-containers.spec.ts | FM-A07 | INV-05 (Deterministic Container Identity) | Container-method identity must be deterministic. |
| top-level-function.spec.ts | FM-A07 | INV-05 (Deterministic Container Identity) | Container-method identity must be deterministic. |
| ambiguous-candidate.spec.ts | FM-A08 | INV-03 (Ambiguity Refusal) | Ambiguity must not silently choose an arbitrary candidate. |
| ts-under-src.spec.ts | FM-A08/A07/FM-C03 | INV-01, INV-05, INV-08 | Combined: same-function identity, deterministic container identity, and changed TS outside analyzed roots must not yield trustworthy COMPLETE/PASS (though this test is under src/, it verifies normal operation). |
| changed-ts-outside-src.spec.ts | FM-C03 | INV-08 (Changed TS Outside Analyzed Roots Must Not Yield Trustworthy COMPLETE/PASS) | Known changed TS outside analyzed roots must not silently yield trustworthy COMPLETE/PASS. |

Note: The invariants are defined in `attribution-invariants.md`. Each test asserts the desired behavior (not the defective behavior) after the WP5.3 fixes.