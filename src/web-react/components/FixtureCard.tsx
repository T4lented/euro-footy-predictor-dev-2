import { useState } from 'react';
import { Plus, Clock, BarChart3 } from 'lucide-react';
import type { Fixture } from '../types';
import { TeamLogo } from './TeamLogo';

interface FixtureCardProps {
  fixture: Fixture;
  onOpen: (fixture: Fixture) => void;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
  inSlip?: boolean;
  onToggleSlip?: (fixture: Fixture) => void;
}

const confidenceVar: Record<string, string> = {
  'Very High': 'var(--win)',
  High: 'var(--win)',
  Moderate: 'var(--draw)',
  'Low (Contested)': 'var(--lose)',
};

export function FixtureCard({ fixture, onOpen, selected = false, onToggleSelect, inSlip = false, onToggleSlip }: FixtureCardProps) {
  const { probabilities, confidence, expectedGoals } = fixture.prediction;
  const confColor = confidenceVar[confidence] ?? 'var(--text-secondary)';
  const live = fixture.live && fixture.live.state !== 'pre' ? fixture.live : null;
  const isLive = live?.state === 'in';
  const [showDetails, setShowDetails] = useState(true);
  const statLine = fixture.stats
    ?.filter((s) => /corner|shots/i.test(s.name))
    .map((s) => `${s.name} ${s.home}–${s.away}`)
    .slice(0, 2)
    .join(' · ');

  return (
    <button
      onClick={() => onOpen(fixture)}
      className={`glass glass-hover group relative w-full p-4 text-left transition-colors ${selected ? 'ring-1' : ''}`}
      style={{
        ...(selected ? { boxShadow: '0 0 0 1px var(--win)' } : {}),
        ...(isLive ? { boxShadow: '0 0 0 1px var(--lose)' } : {}),
      }}
    >
      <div className="flex items-center justify-between gap-2 text-[11px]" style={{ color: 'var(--text-secondary)' }}>
        <span className="flex min-w-0 items-center gap-1.5 truncate">
          {onToggleSelect && (
            <span
              role="checkbox"
              aria-checked={selected}
              aria-label={`Select ${fixture.homeTeam} vs ${fixture.awayTeam}`}
              onClick={(e) => {
                e.stopPropagation();
                onToggleSelect(fixture.id);
              }}
              className="flex size-[18px] shrink-0 cursor-pointer items-center justify-center border font-mono text-[11px] transition-colors"
              style={{
                borderColor: selected ? 'var(--win)' : 'var(--border-glass-strong)',
                backgroundColor: selected ? 'var(--win)' : 'transparent',
                color: 'var(--page-bg)',
              }}
            >
              {selected ? '✓' : ''}
            </span>
          )}
          <span>{fixture.flag}</span>
          <span className="truncate">{fixture.leagueName}</span>
          <span style={{ color: 'var(--text-muted)' }}>·</span>
          <span className="truncate" style={{ color: 'var(--text-muted)' }}>{fixture.matchType}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowDetails(!showDetails);
            }}
            className="flex size-5 items-center justify-center border transition-colors"
            style={{
              borderColor: showDetails ? 'var(--accent)' : 'var(--border-glass)',
              backgroundColor: showDetails ? 'var(--accent-soft)' : 'transparent',
              color: showDetails ? 'var(--accent-text)' : 'var(--text-muted)',
            }}
            title={showDetails ? 'Hide time & probability' : 'Show time & probability'}
          >
            {showDetails ? <BarChart3 className="size-3" /> : <Clock className="size-3" />}
          </button>
          {isLive ? (
            <span className="flex shrink-0 items-center gap-1.5 border px-1.5 py-0.5 font-mono uppercase tracking-wide" style={{ borderColor: 'var(--lose)', color: 'var(--lose)' }}>
              <span className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style={{ backgroundColor: 'var(--lose)' }} />
                <span className="relative inline-flex size-2 rounded-full" style={{ backgroundColor: 'var(--lose)' }} />
              </span>
              LIVE {live?.clock}
            </span>
          ) : (
            <span className="shrink-0 border px-1.5 py-0.5 font-mono uppercase tracking-wide" style={{ borderColor: 'var(--border-glass)' }}>
              {live?.state === 'post' ? 'FT' : fixture.status}
            </span>
          )}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 truncate font-display text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            <TeamLogo logo={fixture.homeTeamLogo} name={fixture.homeTeam} />
            <span className="truncate">{fixture.homeTeam}</span>
          </p>
          <p className="mt-1.5 flex items-center gap-2 truncate font-display text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            <TeamLogo logo={fixture.awayTeamLogo} name={fixture.awayTeam} />
            <span className="truncate">{fixture.awayTeam}</span>
          </p>
        </div>
        {showDetails ? (
          <div className="shrink-0 text-right">
            {live ? (
              <>
                <p className="font-mono text-lg font-bold tabular" style={{ color: 'var(--text-primary)' }}>
                  {live.homeScore}–{live.awayScore}
                </p>
                <p className="font-mono text-[10px] tabular" style={{ color: live.state === 'post' ? 'var(--text-muted)' : 'var(--lose)' }}>
                  {live.state === 'post' ? 'Full time' : isLive ? `⏱ ${live.clock}` : fixture.time}
                </p>
              </>
            ) : (
              <>
                <p className="font-mono text-sm font-semibold tabular" style={{ color: 'var(--text-primary)' }}>{fixture.time}</p>
                <p className="font-mono text-[10px] tabular" style={{ color: 'var(--text-muted)' }}>
                  xG {expectedGoals.home}–{expectedGoals.away}
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="shrink-0 text-right">
            {live ? (
              <>
                <p className="font-mono text-lg font-bold tabular" style={{ color: 'var(--text-primary)' }}>
                  {live.homeScore}–{live.awayScore}
                </p>
                <p className="font-mono text-[10px] tabular" style={{ color: live.state === 'post' ? 'var(--text-muted)' : 'var(--lose)' }}>
                  {live.state === 'post' ? 'FT' : isLive ? live.clock : fixture.time}
                </p>
              </>
            ) : null}
          </div>
        )}
      </div>

      {showDetails && statLine && (
        <p className="mt-2 truncate font-mono text-[10px] tabular" style={{ color: 'var(--text-muted)' }}>
          📊 {statLine}
        </p>
      )}

      {showDetails && (
        <div className="mt-4">
          <div className="flex h-2 w-full overflow-hidden" style={{ backgroundColor: 'var(--border-glass)' }}>
            <div
              className="transition-all"
              style={{ width: `${probabilities.homeWin}%`, backgroundColor: 'var(--win)' }}
              title={`Home win ${probabilities.homeWin}%`}
            />
            <div
              className="transition-all"
              style={{ width: `${probabilities.draw}%`, backgroundColor: 'var(--draw)' }}
              title={`Draw ${probabilities.draw}%`}
            />
            <div
              className="transition-all"
              style={{ width: `${probabilities.awayWin}%`, backgroundColor: 'var(--lose)' }}
              title={`Away win ${probabilities.awayWin}%`}
            />
          </div>
          <div className="mt-1.5 flex items-center justify-between font-mono text-[10px] tabular">
            <span style={{ color: 'var(--win)' }}>{probabilities.homeWin}%</span>
            <span style={{ color: 'var(--draw)' }}>{probabilities.draw}%</span>
            <span style={{ color: 'var(--lose)' }}>{probabilities.awayWin}%</span>
          </div>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between">
        <span className="border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide" style={{ borderColor: confColor, color: confColor }}>
          {confidence}
        </span>
        <span className="flex items-center gap-2">
          {onToggleSlip && (
            <span
              role="button"
              aria-label={inSlip ? 'Remove from prediction slip' : 'Add to prediction slip'}
              onClick={(e) => {
                e.stopPropagation();
                onToggleSlip(fixture);
              }}
              className={`flex size-5 cursor-pointer items-center justify-center border font-mono text-[10px] transition-colors ${inSlip ? '' : 'opacity-0 group-hover:opacity-100'}`}
              style={{
                borderColor: inSlip ? 'var(--accent)' : 'var(--border-glass-strong)',
                backgroundColor: inSlip ? 'var(--accent-soft)' : 'transparent',
                color: inSlip ? 'var(--accent-text)' : 'var(--text-muted)',
              }}
            >
              {inSlip ? '✓' : <Plus className="size-3" />}
            </span>
          )}
          <span className="font-mono text-[10px] uppercase tracking-wide opacity-0 transition-opacity group-hover:opacity-100" style={{ color: 'var(--text-secondary)' }}>
            View breakdown →
          </span>
        </span>
      </div>
    </button>
  );
}
