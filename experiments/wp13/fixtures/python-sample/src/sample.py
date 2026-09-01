# sample.py - Synthetic fixture for WP13 Python adapter
# Functions with known cyclomatic complexity for testing


def simple(x: int) -> int:
    """CC=1 - simplest path, no branches."""
    return x + 1


def branched(value: int) -> str:
    """CC=4 - if/elif/else chain."""
    if value < 0:
        return "negative"
    elif value == 0:
        return "zero"
    elif value <= 10:
        return "small"
    else:
        return "large"


def complex(a: int, b: int, c: int) -> int:
    """CC=8 - sequential conditionals."""
    if a < 0:
        return -1
    if b < 0:
        return -2
    if c < 0:
        return -3
    if a == 0:
        return 0
    if b == 0:
        return 1
    if c == 0:
        return 2
    if a > b:
        return 3
    return a + b + c
