import sys
sys.path.insert(0, 'src')
import calc
import pytest

def test_add():
    assert calc.add(2, 3) == 5

def test_subtract():
    assert calc.subtract(5, 3) == 2

def test_multiply():
    assert calc.multiply(3, 4) == 12

def test_divide():
    assert calc.divide(10, 2) == 5

def test_divide_by_zero():
    with pytest.raises(ValueError):
        calc.divide(10, 0)

def test_complex_function():
    # Test one branch
    assert calc.complex_function(1, 1, 1) == 3
    assert calc.complex_function(1, 1, -1) == 3
    assert calc.complex_function(1, -1, 1) == 3
    assert calc.complex_function(1, -1, -1) == 3
    assert calc.complex_function(-1, 1, 1) == 3
    assert calc.complex_function(-1, 1, -1) == 3
    assert calc.complex_function(-1, -1, 1) == 3
    assert calc.complex_function(-1, -1, -1) == 3
