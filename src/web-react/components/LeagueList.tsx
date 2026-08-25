import { useState } from 'react';
import { ChevronDown, SlidersHorizontal } from 'lucide-react';
import type { Fixture, League } from '../types';

interface LeagueListProps {
  leagues: League[];
  activeCode: string | null;
  counts: Record<string, number>;
  onSelect: (code: string | null) => void;
  onItemSelect?: () => void;
  fixturesByLeague?: Record<string, Fixture[]>;
  onSelectGame?: (fixture: Fixture) => void;
}

export function LeagueList({ leagues, activeCode, counts, onSelect, onItemSelect, fixturesByLeague, onSelectGame }: LeagueListProps) {
  const [expandedCode, setExpandedCode] = useState<string | null>(null);

  return (
    <>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
          🏆 Leagues & Cups
        </h2>
        <button
          type="button"
          title="Show all competitions in the main view"
          onClick={() => {
            onSelect(null);
            setExpandedCode(null);
            onItemSelect?.();
          }}
          className="border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide transition-colors"
          style={
            activeCode === null
              ? { borderColor: 'var(--border-glass-strong)', backgroundColor: 'var(--accent-soft)', color: 'var(--accent-text)' }
              : { borderColor: 'var(--border-glass)', color: 'var(--text-secondary)' }
          }
        >
          All
        </button>
      </div>
      <ul className="space-y-1">
        {leagues.map((l) => {
          const active = activeCode === l.code;
          const expanded = expandedCode === l.code;
          const games = (fixturesByLeague && fixturesByLeague[l.code]) || [];
          return (
            <li key={l.code}>
              <button
                type="button"
                onClick={() => setExpandedCode(expanded ? null : l.code)}
                aria-expanded={expanded}
                className="flex w-full items-center gap-2 px-2.5 py-2 text-left text-sm transition-colors"
                style={{
                  color: active || expanded ? 'var(--text-primary)' : 'var(--text-secondary)',
                  backgroundColor: active || expanded ? 'var(--accent-soft)' : 'transparent',
                  borderRadius: expanded ? '6px 6px 0 0' : '6px',
                }}
              >
                <span className="text-base leading-none">{l.flag}</span>
                <span className="flex-1 truncate">{l.name}</span>
                <span className="font-mono text-[10px] tabular" style={{ color: 'var(--text-muted)' }}>
                  {counts[l.code] ?? 0}
                </span>
                <ChevronDown
                  className={`size-4 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
                  style={{ color: 'var(--text-muted)' }}
                />
              </button>

              {expanded && (
                <ul className="mb-1 border border-t-0 py-1" style={{ borderColor: 'var(--border-glass)', backgroundColor: 'var(--accent-soft)', borderRadius: '0 0 6px 6px' }}>
                  <li>
                    <button
                      type="button"
                      onClick={() => {
                        onSelect(active ? null : l.code);
                        onItemSelect?.();
                      }}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-left font-mono text-[10px] uppercase tracking-wide"
                      style={{ color: active ? 'var(--accent-text)' : 'var(--text-secondary)' }}
                    >
                      <SlidersHorizontal className="size-3" />
                      {active ? 'Showing in main view' : 'Filter main view'}
                    </button>
                  </li>
                  {games.length === 0 && (
                    <li className="px-3 py-1.5 font-mono text-[10px]" style={{ color: 'var(--text-muted)' }}>
                      No games for this day
                    </li>
                  )}
                  {games.map((f) => {
                    const live = f.live && f.live.state !== 'pre';
                    return (
                      <li key={f.id}>
                        <button
                          type="button"
                          onClick={() => {
                            onSelectGame?.(f);
                            onItemSelect?.();
                          }}
                          className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[11px] transition-colors hover:bg-black/10 dark:hover:bg-white/5"
                        >
                          <span className="w-9 shrink-0 font-mono tabular" style={{ color: 'var(--text-muted)' }}>
                            {live && f.live?.clock ? f.live.clock.slice(0, 8) : f.time.replace(':', '')}
                          </span>
                          <span className="min-w-0 flex-1 truncate" style={{ color: 'var(--text-primary)' }}>
                            {f.homeTeam} – {f.awayTeam}
                          </span>
                          {live && f.live?.homeScore !== undefined && (
                            <span className="shrink-0 font-mono text-[10px] font-bold tabular" style={{ color: 'var(--win)' }}>
                              {f.live.homeScore}-{f.live.awayScore}
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}
