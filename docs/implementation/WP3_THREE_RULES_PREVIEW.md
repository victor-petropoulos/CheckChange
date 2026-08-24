# WP3 — Three Deterministic Rules Preview

**FUTURE — DO NOT EXECUTE YET**

This file preserves direction only.

1. **Test failure:** existing project tests fail → FAIL.
2. **Changed function high CRAP:** changed current function + CRAP above explicit threshold → finding.
3. **Changed high-risk function with inadequate coverage:** changed + CRAP above threshold + reliable coverage below threshold → HIGH/FAIL.

Unavailable coverage must never be treated as zero. Threshold policy must be explicit; do not silently adopt the analyzer's default as product policy.

Rules report deterministic facts, not subjective review prose. No LLM.
