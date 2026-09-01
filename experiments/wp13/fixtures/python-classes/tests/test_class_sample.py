from src.class_sample import MyClass

def test_method_one():
    obj = MyClass(1)
    assert obj.method_one(12) == 24
    assert obj.method_one(7) == 12
    assert obj.method_one(3) == 3

def test_method_two():
    obj = MyClass(1)
    assert obj.method_two([1,2,None,3]) == 6

def test_static_helper():
    assert MyClass.static_helper(2,3) == 5
    assert MyClass.static_helper(0,5) == 5

def test_inner():
    inner = MyClass.Inner()
    assert inner.inner_method(2) == 6
