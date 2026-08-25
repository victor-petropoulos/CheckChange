# WP4R Evidence Manifest

## Purpose
Freeze the principal evidence used to accept and close WP4R. Raw evidence was not altered during manifest generation.

| Evidence | Path | SHA-256 | Status |
|---|---|---|---|
| Original final usefulness results | `docs/research/WP4R_FINAL_USEFULNESS_RESULTS.md` | a7db3b2d5b22c98bca0ca084bc15b5bf5e63d9972afa98d0399fe0974e176016 | OK — note: manifest template expected `experiments/wp4r-final/WP4R_FINAL_USEFULNESS_RESULTS.md`, which is absent; verified actual location recorded here |
| Corrected original human-review packet | `experiments/wp4r-final/human-review-packet.md` | b7c4fb3b424d21171f881021315db12becad22d810353c204e2011643c6734ca | OK |
| Human-review diagnostics | `experiments/wp4r-final/human-review-diagnostics.md` | 728a56748b8002feb18c72ddbc9ebb70030d6afafe0f61526765935f7cb35ef9 | OK |
| Supplemental repository selection | `experiments/wp4r-supplemental/repository-selection.md` | bddd25ff493196aacb131a878268c5f590233625e1255165f73c3670fef443d2 | OK |
| Supplemental human-review packet | `experiments/wp4r-supplemental/human-review-packet.md` | c56cb6897fcbc0e0231f9c5bba83e570f2587d210f5aff42852dd8f109dc7edf | OK (hashed after classification) |
| Supplemental results | `experiments/wp4r-supplemental/WP4R_SUPPLEMENTAL_RESULTS.md` | 035bebf152773f6fcc6d9789ba274645fd7d17583d4cf6300ca8272d588d979f | OK (hashed after update) |
| SUP-A coverage | `experiments/wp4r-supplemental/sup-a/coverage-final.json` | c57f8a240538e5886deb1f8da64e1075025b9833822705c40e349f2b8d05e839 | OK |
| SUP-A threshold 30 | `experiments/wp4r-supplemental/sup-a/output-threshold-30.json` | 201de3e5399133d535ac7f607c03dad661d7f697ca2af7da5cd31fc03d300b61 | OK |
| SUP-A threshold 15 | `experiments/wp4r-supplemental/sup-a/output-threshold-15.json` | 3e66133c908faba14cfa65d73631338ea617b6872811924c36c1a203add707c9 | OK |
| SUP-B coverage | `experiments/wp4r-supplemental/sup-b/coverage-final.json` | 338e0e0a32dd1b93c5f2d8f82ddb64f3e5d27954f4beb5c2cb249a11f9f45584 | OK |
| SUP-B threshold 30 | `experiments/wp4r-supplemental/sup-b/output-threshold-30.json` | 7df5b7ba34211216becb943959e71a35509c202d3026fc243ba721e7bd1926bd | OK |
| SUP-B threshold 15 | `experiments/wp4r-supplemental/sup-b/output-threshold-15.json` | a510c74376fd207be0c50f26cab63da6c7b0cd6717ad39476cddbd4602e11642 | OK |
| WP4R closure | `experiments/wp4r-final/WP4R_CLOSURE.md` | 254805a5db314eee79ff87f41c5a22225bea257cf4135a9cccbc2ae40f12095f | OK (computed after closure written) |

## Path Note
`WP4R_FINAL_USEFULNESS_RESULTS.md` was authored under `docs/research/` in an earlier pass. The manifest records the verified actual path and hash rather than duplicating or relocating raw evidence. No required evidence was missing; one canonical-path expectation was corrected here.

## Freeze Rule
If required evidence were missing or materially inconsistent, closure would stop. After successful closure, future work must not silently rewrite the WP4R evidence record.