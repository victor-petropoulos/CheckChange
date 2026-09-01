#!/usr/bin/env python3
"""Generate coverage.json for WP13 Python fixture."""

import subprocess
import sys

cmd = [
    sys.executable,
    "-m",
    "pytest",
    "tests/",
    "--cov=src",
    "--cov-branch",
    "--cov-report=json:coverage.json",
    "-q",
]

result = subprocess.run(cmd, capture_output=True, text=True)
print(result.stdout)
print(result.stderr)
sys.exit(result.returncode)
