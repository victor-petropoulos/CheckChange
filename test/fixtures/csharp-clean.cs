// Synthetic fixture: ONE method well under the 30 threshold — base 1 + 3 `if`
// decisions = 4. Paired with csharp-high-cc.cs so a CC regression is unambiguous.
namespace Sample
{
    public class LowComplexity
    {
        public int Add(int a, int b)
        {
            int v = a + b;
            if (v < 0) { v = 0; }
            if (v == 0) { v = 1; }
            if (v > 100) { v = 100; }
            return v;
        }
    }
}
