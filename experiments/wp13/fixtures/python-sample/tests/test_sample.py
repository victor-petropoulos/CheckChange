"""Tests for sample.py - WP13 Python fixture."""

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

from sample import simple, branched, complex


class TestSimple:
    """Test simple function (CC=1, expected 100% coverage)."""

    def test_simple_positive(self):
        """simple(5) = 6."""
        assert simple(5) == 6

    def test_simple_zero(self):
        """simple(0) = 1."""
        assert simple(0) == 1

    def test_simple_negative(self):
        """simple(-3) = -2."""
        assert simple(-3) == -2


class TestBranched:
    """Test branched function (CC=4, expected 100% coverage)."""

    def test_branched_negative(self):
        """branched(-1) = 'negative'."""
        assert branched(-1) == "negative"

    def test_branched_zero(self):
        """branched(0) = 'zero'."""
        assert branched(0) == "zero"

    def test_branched_small(self):
        """branched(5) = 'small'."""
        assert branched(5) == "small"

    def test_branched_large(self):
        """branched(15) = 'large'."""
        assert branched(15) == "large"


class TestComplex:
    """Test complex function (CC=8, expected partial coverage)."""

    def test_complex_all_positive(self):
        """complex(1, 2, 3) = 6 - covers a>0, b>0, c>0 path."""
        assert complex(1, 2, 3) == 6
