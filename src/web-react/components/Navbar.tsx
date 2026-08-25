import { Search, Menu } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import type { Theme } from '../hooks/useTheme';

interface NavbarProps {
  query: string;
  onQueryChange: (v: string) => void;
  theme: Theme;
  onToggleTheme: () => void;
  onOpenMenu: () => void;
  activeLeagueLabel?: string | null;
}

export function Navbar({ query, onQueryChange, theme, onToggleTheme, onOpenMenu, activeLeagueLabel }: NavbarProps) {
  return (
    <header className="glass sticky top-0 z-30 border-x-0 border-t-0">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenMenu}
            className="glass flex size-9 shrink-0 items-center justify-center lg:hidden"
            aria-label="Open league filter menu"
          >
            <Menu className="size-4" style={{ color: 'var(--text-secondary)' }} />
          </button>
          <div
            className="glass hidden size-9 shrink-0 items-center justify-center text-lg lg:flex"
            style={{ borderColor: 'var(--border-glass-strong)' }}
          >
            ⚽
          </div>
          <div className="leading-tight">
            <h1 className="font-display text-sm font-bold tracking-tight sm:text-base" style={{ color: 'var(--text-primary)' }}>
              EURO FOOTY PREDICTOR
            </h1>
            <span className="font-mono text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
              Top leagues & UEFA · 12-factor engine
              {activeLeagueLabel ? ` · ${activeLeagueLabel}` : ''}
            </span>
          </div>
        </div>

        <div className="flex w-full items-center gap-2 sm:w-auto">
          <div className="relative w-full sm:max-w-xs">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2"
              style={{ color: 'var(--text-muted)' }}
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Search teams, leagues, stadiums..."
              maxLength={100}
              aria-label="Search teams, leagues, and stadiums"
              className="glass w-full py-2 pl-9 pr-3 text-sm outline-none transition-colors"
              style={{ color: 'var(--text-primary)' }}
            />
          </div>
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </div>
      </div>
    </header>
  );
}
