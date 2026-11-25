// Synthetic fixture (plan Task 4, DEC-1 flat layout). ONE method whose
// fallback-parser CC exceeds the 30 threshold: base 1 + 31 `if` decisions = 32.
namespace Sample
{
    public class HighComplexity
    {
        public int Compute(int seed)
        {
            int v = seed;
        if (v == 0) { v += 1; }
        if (v == 1) { v += 2; }
        if (v == 2) { v += 3; }
        if (v == 3) { v += 4; }
        if (v == 4) { v += 5; }
        if (v == 5) { v += 6; }
        if (v == 6) { v += 7; }
        if (v == 7) { v += 8; }
        if (v == 8) { v += 9; }
        if (v == 9) { v += 10; }
        if (v == 10) { v += 11; }
        if (v == 11) { v += 12; }
        if (v == 12) { v += 13; }
        if (v == 13) { v += 14; }
        if (v == 14) { v += 15; }
        if (v == 15) { v += 16; }
        if (v == 16) { v += 17; }
        if (v == 17) { v += 18; }
        if (v == 18) { v += 19; }
        if (v == 19) { v += 20; }
        if (v == 20) { v += 21; }
        if (v == 21) { v += 22; }
        if (v == 22) { v += 23; }
        if (v == 23) { v += 24; }
        if (v == 24) { v += 25; }
        if (v == 25) { v += 26; }
        if (v == 26) { v += 27; }
        if (v == 27) { v += 28; }
        if (v == 28) { v += 29; }
        if (v == 29) { v += 30; }
        if (v == 30) { v += 31; }
            return v;
        }
    }
}
