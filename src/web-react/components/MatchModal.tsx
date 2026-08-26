import { useEffect, useState, useCallback } from 'react';
import { X, ChevronDown, ChevronRight, RefreshCw } from 'lucide-react';
import type { Fixture } from '../types';
import { TeamLogo } from './TeamLogo';
import { LeagueLogo } from './LeagueLogo';
import { fetchMatchStats, buildStatRows, type MatchStatsResponse } from '../services/matchStats';

interface MatchModalProps {
  fixture: Fixture | null;
  onClose: () => void;
}

export function MatchModal({ fixture, onClose }: MatchModalProps) {
  const [factorOpen, setFactorOpen] = useState(false);
  const [liveStats, setLiveStats] = useState<MatchStatsResponse | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    if (!fixture?.espnEventId || !fixture?.live || fixture.live.state === 'pre') return;
    setStatsLoading(true);
    setStatsError(null);
    try {
      const data = await fetchMatchStats(fixture.leagueCode, fixture.espnEventId);
      if (data) {
        setLiveStats(data);
      } else {
        setStatsError('Stats unavailable');
      }
    } catch {
      setStatsError('Failed to load stats');
    } finally {
      setStatsLoading(false);
    }
  }, [fixture?.espnEventId, fixture?.leagueCode, fixture?.live]);

  useEffect(() => { loadStats(); }, [loadStats]);

  useEffect(() => {
    if (!fixture?.espnEventId || !fixture?.live || fixture.live.state !== 'in') return;
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, [fixture?.espnEventId, fixture?.live, loadStats]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!fixture) return null;
  const { prediction } = fixture;
  const isLiveOrFinished = fixture.live && fixture.live.state !== 'pre';
  const hasStats = liveStats?.stats;
  const statRows = hasStats ? buildStatRows(liveStats!.stats!.home.stats, liveStats!.stats!.away.stats) : [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 backdrop-blur-sm sm:items-center sm:p-6"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
      onClick={onClose}
    >
      <div className="glass-strong my-8 w-full max-w-2xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 border-b p-5" style={{ borderColor: 'var(--border-glass)' }}>
          <div>
            <p className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
              <LeagueLogo logo={fixture.leagueLogo} flag={fixture.flag} name={fixture.leagueName} className="size-5 shrink-0" /> {fixture.leagueName} · {fixture.matchType}
            </p>
            <h3 className="mt-1.5 flex flex-wrap items-center gap-2 font-display text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              <TeamLogo logo={fixture.homeTeamLogo} name={fixture.homeTeam} className="size-6 shrink-0" />
              {fixture.homeTeam}
              <span style={{ color: 'var(--text-muted)' }}>vs</span>
              {fixture.awayTeam}
              <TeamLogo logo={fixture.awayTeamLogo} name={fixture.awayTeam} className="size-6 shrink-0" />
            </h3>
            <p className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>{fixture.stadium} · {fixture.time}</p>
          </div>
          <button onClick={onClose} className="glass glass-hover shrink-0 p-1.5 transition-colors" style={{ color: 'var(--text-secondary)' }} aria-label="Close">
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-6 p-5">
          {isLiveOrFinished && (
            <div className="glass p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 flex-1 items-center justify-end gap-2 text-right">
                  <span className="truncate font-display text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{fixture.homeTeam}</span>
                  <TeamLogo logo={fixture.homeTeamLogo} name={fixture.homeTeam} className="size-6 shrink-0" />
                </div>
                <div className="shrink-0 text-center">
                  <p className="font-mono text-3xl font-bold tabular" style={{ color: 'var(--text-primary)' }}>
                    {fixture.live!.homeScore}–{fixture.live!.awayScore}
                  </p>
                  <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wide" style={{ color: fixture.live!.state === 'in' ? 'var(--lose)' : 'var(--text-muted)' }}>
                    {fixture.live!.state === 'in' ? `● LIVE ${fixture.live!.clock}` : 'Full time'}
                  </p>
                </div>
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <TeamLogo logo={fixture.awayTeamLogo} name={fixture.awayTeam} className="size-6 shrink-0" />
                  <span className="truncate font-display text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{fixture.awayTeam}</span>
                </div>
              </div>

              {fixture.espnEventId && (
                <div className="mt-3 flex justify-center">
                  <button
                    onClick={loadStats}
                    disabled={statsLoading}
                    className="flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-wide transition-colors"
                    style={{ backgroundColor: 'var(--bg-elevated)', color: statsLoading ? 'var(--text-muted)' : 'var(--accent)', border: '1px solid var(--border-glass)' }}
                  >
                    <RefreshCw className={`size-3 ${statsLoading ? 'animate-spin' : ''}`} />
                    {statsLoading ? 'Loading...' : 'Refresh Stats'}
                  </button>
                </div>
              )}

              {statRows.length > 0 && (
                <div className="mt-4 space-y-1.5 border-t pt-3" style={{ borderColor: 'var(--border-glass)' }}>
                  <p className="mb-1 font-mono text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Live match stats</p>
                  {statRows.map((s) => (
                    <div key={s.key} className="flex items-center justify-between font-mono text-[11px] tabular">
                      <span className="w-8 shrink-0 text-right font-bold" style={{ color: 'var(--text-primary)' }}>{s.home}</span>
                      <span className="px-2 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{s.label}</span>
                      <span className="w-8 shrink-0 font-bold" style={{ color: 'var(--text-primary)' }}>{s.away}</span>
                    </div>
                  ))}
                </div>
              )}

              {!hasStats && statsLoading && (
                <div className="mt-4 border-t pt-3" style={{ borderColor: 'var(--border-glass)' }}>
                  <p className="text-center font-mono text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Loading match stats...</p>
                </div>
              )}

              {statsError && !statsLoading && (
                <div className="mt-4 border-t pt-3" style={{ borderColor: 'var(--border-glass)' }}>
                  <p className="text-center font-mono text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{statsError}</p>
                </div>
              )}
            </div>
          )}

          <div>
            <div className="flex h-3 w-full overflow-hidden" style={{ backgroundColor: 'var(--border-glass)' }}>
              <div style={{ width: `${prediction.probabilities.homeWin}%`, backgroundColor: 'var(--win)' }} />
              <div style={{ width: `${prediction.probabilities.draw}%`, backgroundColor: 'var(--draw)' }} />
              <div style={{ width: `${prediction.probabilities.awayWin}%`, backgroundColor: 'var(--lose)' }} />
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2 text-center font-mono text-xs tabular">
              <div>
                <p style={{ color: 'var(--win)' }}>{prediction.probabilities.homeWin}%</p>
                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>HOME WIN</p>
              </div>
              <div>
                <p style={{ color: 'var(--draw)' }}>{prediction.probabilities.draw}%</p>
                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>DRAW</p>
              </div>
              <div>
                <p style={{ color: 'var(--lose)' }}>{prediction.probabilities.awayWin}%</p>
                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>AWAY WIN</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Expected goals', value: `${prediction.expectedGoals.home}–${prediction.expectedGoals.away}` },
              { label: 'Over 2.5', value: `${prediction.probabilities.over25}%` },
              { label: 'BTTS', value: `${prediction.probabilities.btts}%` },
              { label: 'Confidence', value: prediction.confidence },
            ].map((s) => (
              <div key={s.label} className="glass p-3">
                <p className="font-mono text-sm font-semibold tabular" style={{ color: 'var(--text-primary)' }}>{s.value}</p>
                <p className="mt-0.5 text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>{s.label}</p>
              </div>
            ))}
          </div>

          <div>
            <h4 className="mb-2 font-mono text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Most likely scorelines</h4>
            <div className="flex flex-wrap gap-2">
              {prediction.topScorelines.map((s) => (
                <div key={s.score} className="glass px-3 py-1.5 text-center">
                  <span className="font-mono text-sm font-semibold tabular" style={{ color: 'var(--text-primary)' }}>{s.score}</span>
                  <span className="ml-2 font-mono text-[10px] tabular" style={{ color: 'var(--text-muted)' }}>{s.prob.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>

          {prediction.h2h && (prediction.h2h.totalMatches ?? 0) > 0 ? (
            <div className="glass p-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
              <div className="flex flex-wrap items-center gap-2">
                <span style={{ color: 'var(--text-primary)' }}>Head-to-head:</span>
                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{prediction.h2h.totalMatches} meetings</span>
                <span>·</span>
                <span style={{ color: 'var(--win)' }}>{prediction.h2h.homeWins || 0}W</span>
                <span style={{ color: 'var(--draw)' }}>{prediction.h2h.draws || 0}D</span>
                <span style={{ color: 'var(--lose)' }}>{prediction.h2h.awayWins || 0}L</span>
                {prediction.h2h.derbyOrRivalry ? ' · rivalry fixture' : ''}
              </div>
              {prediction.h2h.last5Meetings && prediction.h2h.last5Meetings.length > 0 && (
                <div className="mt-2 space-y-1 border-t pt-2" style={{ borderColor: 'var(--border-glass)' }}>
                  <p className="font-mono text-[9px] uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Last {prediction.h2h.last5Meetings.length} meetings</p>
                  {prediction.h2h.last5Meetings.map((m, i) => (
                    <div key={i} className="flex items-center justify-between gap-2 font-mono text-[10px] tabular">
                      <span className="shrink-0" style={{ color: 'var(--text-muted)' }}>{m.date || '—'}</span>
                      <span className="min-w-0 flex-1 truncate text-right" style={{ color: 'var(--text-primary)' }}>
                        {m.home} <span style={{ color: 'var(--accent)' }}>{m.score}</span> {m.away}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="glass p-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
              <span style={{ color: 'var(--text-muted)' }}>No historical H2H data available for this fixture.</span>
            </div>
          )}

          <div>
            <button
              type="button"
              onClick={() => setFactorOpen((o) => !o)}
              className="flex w-full items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider"
              style={{ color: 'var(--text-secondary)' }}
            >
              {factorOpen ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
              12-factor breakdown
            </button>
            {factorOpen && (
              <div className="mt-2 space-y-2">
                {prediction.factorDiffs.map((f) => (
                  <div key={f.key} className="flex items-center gap-3">
                    <span className="w-40 shrink-0 truncate text-xs" style={{ color: 'var(--text-primary)' }} title={f.name}>
                      <span className="mr-1.5">{f.icon}</span>
                      {f.name}
                    </span>
                    <div className="relative h-1.5 flex-1" style={{ backgroundColor: 'var(--border-glass)' }}>
                      <div className="absolute inset-y-0 left-1/2 w-px" style={{ backgroundColor: 'var(--border-glass-strong)' }} />
                      {f.favors === 'HOME' && (
                        <div className="absolute inset-y-0 right-1/2" style={{ width: `${Math.min(50, Math.abs(f.diff) * 10)}%`, backgroundColor: 'var(--home)' }} />
                      )}
                      {f.favors === 'AWAY' && (
                        <div className="absolute inset-y-0 left-1/2" style={{ width: `${Math.min(50, Math.abs(f.diff) * 10)}%`, backgroundColor: 'var(--away)' }} />
                      )}
                    </div>
                    <span className="w-16 shrink-0 text-right font-mono text-[10px] tabular" style={{ color: 'var(--text-muted)' }}>
                      {f.homeScore.toFixed(1)} / {f.awayScore.toFixed(1)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
