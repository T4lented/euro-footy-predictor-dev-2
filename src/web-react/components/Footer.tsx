const YEAR = new Date().getFullYear();

export function Footer() {
  return (
    <footer
      className="border-t py-6 text-center"
      style={{ borderColor: 'var(--border-glass)' }}
    >
      <nav className="mb-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 font-mono text-[10px] uppercase tracking-wider">
        <a href="/" className="transition-colors hover:underline" style={{ color: 'var(--text-secondary)' }}>
          Home
        </a>
        <a href="#features" className="transition-colors hover:underline" style={{ color: 'var(--text-secondary)' }}>
          How it works
        </a>
        <a
          href="https://www.espn.com/soccer/"
          target="_blank"
          rel="noopener noreferrer"
          className="transition-colors hover:underline"
          style={{ color: 'var(--text-secondary)' }}
        >
          ESPN Soccer
        </a>
        <a
          href="https://www.football-data.org/"
          target="_blank"
          rel="noopener noreferrer"
          className="transition-colors hover:underline"
          style={{ color: 'var(--text-secondary)' }}
        >
          Football-Data.org
        </a>
        <a href="/404" className="transition-colors hover:underline" style={{ color: 'var(--text-secondary)' }}>
          Help
        </a>
      </nav>
      <p className="font-mono text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
        © {YEAR} Euro Footy Predictor · Poisson &amp; Dixon-Coles engine · Data via ESPN Scoreboard API
      </p>
    </footer>
  );
}
