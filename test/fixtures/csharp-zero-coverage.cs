// Synthetic fixture: the ZERO-COVERAGE case. No coverage artifact exists
// beside this file, so a run over a repo containing only it must report CC with
// coverage absent — never a fabricated 0%%-covered verdict.
namespace Sample
{
    public class NoCoverage
    {
        public int Identity(int value)
        {
            return value;
        }
    }
}
