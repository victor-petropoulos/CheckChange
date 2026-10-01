"""Sample module for descriptor parity.

The text below lives inside a string, not in code. A line-based parser must
not mistake either line for a definition:

def not_a_function():
    return "def also_not_a_function(): pass"
"""

import functools


class Calculator:
    def __init__(self, start):
        self.value = start

    def add_to(self, x):
        if x > 0:
            self.value += x
        return self.value

    @property
    def doubled(self):
        return self.value * 2


def multi_line_signature(a,
                         b,
                         c):
    if a and b:
        return a + b + c
    return c


@functools.lru_cache(maxsize=None)
def cached(x):
    """Return x unchanged; mentions def ghost(y): return y in prose."""
    return x


def one_liner(): return 42


async def fetch(url, retries=3):
    while retries > 0:
        if url is None:
            return None
        retries -= 1
    return url


def loops_and_boolop(items, flag):
    total = 0
    for item in items:
        if item > 0 and flag:
            total += item
        else:
            total -= item
    while total < 0 and not flag:
        total += 1
    return total if flag else 0


def guarded_divide(a, b):
    try:
        if b == 0:
            raise ValueError("zero")
    except ValueError as exc:
        return str(exc)
    return a / b
