import { useState } from 'react';
import { ChevronDown, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import type { Fixture, League, SortOption } from '../types';

interface LeagueListProps {
  leagues: League[];
  activeCode: string | null;
  counts: Record<string, number>;
  onSelect: (code: string | null) => void;
  onItemSelect?: () => void;
  fixturesByLeague?: Record<string, Fixture[]>;
  onSelectGame?: (fixture: Fixture) => void;
  sort?: SortOption;
  onSortChange?: (sort: SortOption) => void;
}

type LeagueType = 'league' | 'cup' | 'uefa';

function leagueType(l: League): LeagueType {
  if ((l as any).type === 'uefa') return 'uefa';
  if ((l as any).type === 'cup') return 'cup';
  return 'league';
}

export function LeagueList({ leagues, activeCode, counts, onSelect, onItemSelect, fixturesByLeague, onSelectGame, sort = 'confidence', onSortChange }: LeagueListProps) {
  const [expandedLeagueGroup, setExpandedLeagueGroup] = useState(true);
  const [expandedCupGroup, setExpandedCupGroup] = useState(false);
  const [expandedEuropeanCups, setExpandedEuropeanCups] = useState(false);
  const [expandedDomesticCups, setExpandedDomesticCups] = useState(false);
  const [expandedCode, setExpandedCode] = useState<string | null>(null);

  const domesticLeagues = leagues.filter(l => leagueType(l) === 'league');
  const europeanCups = leagues.filter(l => leagueType(l) === 'uefa');
  const domesticCups = leagues.filter(l => leagueType(l) === 'cup');

  function handleAllClick() {
    onSelect(null);
    setExpandedCode(null);
    onItemSelect?.();
  }

  function handleLeagueClick(code: string) {
    onSelect(activeCode === code ? null : code);
    onItemSelect?.();
  }

  function renderLeagueItem(l: League) {
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
                onClick={() => handleLeagueClick(l.code)}
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
  }

  function renderGroupHeader(
    label: string,
    expanded: boolean,
    onToggle: () => void,
    count?: number
  ) {
    return (
      <li>
        <button
          type="button"
          onClick={onToggle}
          className="flex w-full items-center gap-2 px-2 py-2 text-left font-mono text-[11px] uppercase tracking-wider transition-colors"
          style={{ color: 'var(--text-secondary)' }}
        >
          <ChevronDown
            className={`size-3.5 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
          />
          <span className="flex-1">{label}</span>
          {count !== undefined && (
            <span className="font-mono text-[10px] tabular" style={{ color: 'var(--text-muted)' }}>
              {count}
            </span>
          )}
        </button>
      </li>
    );
  }

  return (
    <>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
          ⚽ Competitions
        </h2>
        <button
          type="button"
          title="Show all competitions in the main view"
          onClick={handleAllClick}
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

      <div className="mb-3">
        <div className="flex items-center gap-1.5">
          <ArrowUpDown className="size-3" style={{ color: 'var(--text-muted)' }} />
          <span className="font-mono text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Sort by</span>
        </div>
        <div className="mt-1.5 flex flex-wrap gap-1">
          {([
            ['confidence', 'Confidence'],
            ['prob-desc', 'Win %'],
            ['time-asc', 'Kick-off'],
            ['league-asc', 'League'],
          ] as [SortOption, string][]).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => onSortChange?.(value)}
              className="border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide transition-colors"
              style={
                sort === value
                  ? { borderColor: 'var(--accent)', backgroundColor: 'var(--accent-soft)', color: 'var(--accent-text)' }
                  : { borderColor: 'var(--border-glass)', color: 'var(--text-secondary)' }
              }
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <ul className="space-y-0.5">
        {/* Leagues group */}
        {renderGroupHeader('Leagues', expandedLeagueGroup, () => setExpandedLeagueGroup(p => !p), domesticLeagues.length)}
        {expandedLeagueGroup && domesticLeagues.map(l => renderLeagueItem(l))}

        {/* Cups group */}
        {renderGroupHeader('Cups', expandedCupGroup, () => setExpandedCupGroup(p => !p), europeanCups.length + domesticCups.length)}
        {expandedCupGroup && (
          <>
            {/* European Cups sub-group */}
            <li className="ml-2">
              <button
                type="button"
                onClick={() => setExpandedEuropeanCups(p => !p)}
                className="flex w-full items-center gap-2 px-2 py-1.5 text-left text-xs transition-colors"
                style={{ color: 'var(--text-secondary)' }}
              >
                <ChevronDown
                  className={`size-3 shrink-0 transition-transform ${expandedEuropeanCups ? 'rotate-180' : ''}`}
                />
                <span className="flex-1">European Cups</span>
                <span className="font-mono text-[10px] tabular" style={{ color: 'var(--text-muted)' }}>
                  {europeanCups.length}
                </span>
              </button>
              {expandedEuropeanCups && (
                <ul className="ml-2 space-y-0.5">
                  {europeanCups.map(l => renderLeagueItem(l))}
                </ul>
              )}
            </li>

            {/* Domestic Cups sub-group */}
            <li className="ml-2">
              <button
                type="button"
                onClick={() => setExpandedDomesticCups(p => !p)}
                className="flex w-full items-center gap-2 px-2 py-1.5 text-left text-xs transition-colors"
                style={{ color: 'var(--text-secondary)' }}
              >
                <ChevronDown
                  className={`size-3 shrink-0 transition-transform ${expandedDomesticCups ? 'rotate-180' : ''}`}
                />
                <span className="flex-1">Domestic Cups</span>
                <span className="font-mono text-[10px] tabular" style={{ color: 'var(--text-muted)' }}>
                  {domesticCups.length}
                </span>
              </button>
              {expandedDomesticCups && (
                <ul className="ml-2 space-y-0.5">
                  {domesticCups.map(l => renderLeagueItem(l))}
                </ul>
              )}
            </li>
          </>
        )}
      </ul>
    </>
  );
}