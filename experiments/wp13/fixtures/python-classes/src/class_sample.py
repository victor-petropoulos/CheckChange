class MyClass:
    def __init__(self, value):
        self.value = value

    def method_one(self, x):
        if x > 10:
            return x * 2
        elif x > 5:
            return x + 5
        else:
            return x

    def method_two(self, items):
        total = 0
        for item in items:
            if item is None:
                continue
            total += item
        return total

    @staticmethod
    def static_helper(a, b):
        if a and b:
            return a + b
        return a or b

    class Inner:
        def inner_method(self, y):
            if y:
                return y * 3
            return 0
