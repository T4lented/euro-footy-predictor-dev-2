import { useEffect, useMemo, useState, useCallback } from 'react';
import { getDailyFixtures } from '../../services/fixturesService.js';
import { LEAGUE_LIST } from '../../config/leagues.js';
import { LeagueLogo } from './LeagueLogo';
import { TeamLogo } from './TeamLogo';
import { useTheme } from '../hooks/useTheme';
import { sanitizeSearchQuery, isValidDateString } from '../lib/validation';
import { sortFixtures } from '../lib/export';
import { KELLY_RISK_MODES, calculateKelly, calculateNoVigMarket, type KellyRiskMode, type OneX2Odds, type OneX2Outcome } from '../lib/kelly';
import { fetchOddsForFixture } from '../services/oddsService';
import {
  formatCurrency,
  loadPortfolio,
  savePortfolio,
  MINIMUM_STAKE_UNITS,
  type PortfolioState,
} from '../lib/portfolio';
import type { Fixture, FixturesResponse } from '../types';
import { Search, Wallet, ChevronDown, ChevronRight, Zap, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';

function formatDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function buildDateOptions() {
  const today = new Date();
  const labels = ['Yesterday', 'Today', 'Tomorrow'];
  const options: { label: string; sub: string; value: string }[] = [];
  for (let offset = -1; offset <= 4; offset++) {
    const d = new Date(today);
    d.setDate(today.getDate() + offset);
    const label = offset >= -1 && offset <= 1
      ? labels[offset + 1]
      : d.toLocaleDateString(undefined, { weekday: 'short' });
    const sub = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    options.push({ label, sub, value: formatDate(d) });
  }
  return options;
}

interface AutoBet {
  fixtureId: string;
  fixture: Fixture;
  selection: OneX2Outcome;
  odds: OneX2Odds;
  modelProb: number;
  marketProb: number;
  fairProb: number;
  edge: number;
  kellyStake: number;
  potentialReturn: number;
  riskMode: KellyRiskMode;
}

export function KellyCalculatorPage() {
  const [theme] = useTheme();
  const dateOptions = useMemo(buildDateOptions, []);
  const [selectedDate, setSelectedDate] = useState(dateOptions[1].value);
  const [query, setQuery] = useState('');
  const [data, setData] = useState<FixturesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [oddsLoading, setOddsLoading] = useState(false);
  const [formMap, setFormMap] = useState<Record<string, { recentForm: string[]; formPoints: number }> | null>(null);

  const [portfolio, setPortfolio] = useState<PortfolioState>(() => loadPortfolio());
  useEffect(() => { savePortfolio(portfolio); }, [portfolio]);

  const [autoBets, setAutoBets] = useState<AutoBet[]>([]);
  const [selectedBetIds, setSelectedBetIds] = useState<Set<number>>(new Set());
  const [settingsOpen, setSettingsOpen] = useState(false);

  function updateSettings(patch: Partial<PortfolioState['settings']>) {
    setPortfolio((c) => ({ ...c, settings: { ...c.settings, ...patch } }));
  }

  useEffect(() => {
    const today = formatDate(new Date());
    fetch(`/api/form?date=${today}&days=35`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.form && Object.keys(d.form).length > 0) setFormMap(d.form);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    if (selectedDate && !isValidDateString(selectedDate)) {
      setError('Invalid date format. Please use YYYY-MM-DD.');
      setLoading(false);
      return;
    }
    (getDailyFixtures as (d?: string | null, l?: string | null, o?: object) => Promise<FixturesResponse>)(
      selectedDate, null, { formMap }
    )
      .then((res: FixturesResponse) => { if (!cancelled) setData(res); })
      .catch((err: Error) => { if (!cancelled) setError(err.message || 'Failed to load fixtures.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [selectedDate, formMap]);

  const fixtures = data?.fixtures ?? [];

  const filtered = useMemo(() => {
    const q = sanitizeSearchQuery(query);
    if (!q) return fixtures;
    return fixtures.filter(
      (f) =>
        f.homeTeam.toLowerCase().includes(q) ||
        f.awayTeam.toLowerCase().includes(q) ||
        f.leagueName.toLowerCase().includes(q)
    );
  }, [fixtures, query]);

  const sorted = useMemo(() => sortFixtures(filtered, 'time-asc'), [filtered]);

  const fetchAllOdds = useCallback(async () => {
    if (sorted.length === 0) return;
    setOddsLoading(true);
    const results: AutoBet[] = [];

    const fetches = sorted.map(async (fixture) => {
      try {
        const { odds } = await fetchOddsForFixture(
          { homeTeam: fixture.homeTeam, awayTeam: fixture.awayTeam, leagueCode: fixture.leagueCode },
          fixture.date
        );
        if (!odds) return null;

        const fair = calculateNoVigMarket(odds);
        if (!fair) return null;

        const probs = fixture.prediction.probabilities;
        const bets: AutoBet[] = [];

        for (const outcome of ['home', 'draw', 'away'] as OneX2Outcome[]) {
          const modelProb = probs[outcome] / 100;
          const fairProb = fair.fair[outcome];
          const edge = modelProb - fairProb;

          if (edge > 0.02) {
            const kelly = calculateKelly({
              bankroll: portfolio.settings.bankroll || 1000,
              decimalOdds: odds[outcome],
              modelProbabilityPercent: probs[outcome],
              fairMarketProbability: fairProb * 100,
              riskMode: portfolio.settings.riskMode ?? 'moderate',
              minimumEdgePercent: portfolio.settings.minimumEdgePercent,
              minimumStakeUnit: MINIMUM_STAKE_UNITS[portfolio.settings.currency],
              maximumStake: portfolio.settings.maximumStake,
            });

            if (kelly.status === 'valid' && kelly.recommendedStake > 0) {
              bets.push({
                fixtureId: fixture.id,
                fixture,
                selection: outcome,
                odds,
                modelProb: probs[outcome],
                marketProb: (1 / odds[outcome]) * 100,
                fairProb: fairProb * 100,
                edge: edge * 100,
                kellyStake: kelly.recommendedStake,
                potentialReturn: kelly.recommendedStake * odds[outcome],
                riskMode: portfolio.settings.riskMode ?? 'moderate',
              });
            }
          }
        }

        return bets.length > 0 ? bets.reduce((best, b) => b.edge > best.edge ? b : best) : null;
      } catch {
        return null;
      }
    });

    const allResults = await Promise.all(fetches);
    for (const result of allResults) {
      if (result) results.push(result);
    }

    results.sort((a, b) => b.edge - a.edge);
    setAutoBets(results);
    setSelectedBetIds(new Set(results.map((_, i) => i)));
    setOddsLoading(false);
  }, [sorted, portfolio.settings]);

  useEffect(() => {
    if (!loading && sorted.length > 0) {
      fetchAllOdds();
    }
  }, [loading, sorted.length, selectedDate]);

  function toggleBet(index: number) {
    setSelectedBetIds((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  function selectAll() {
    setSelectedBetIds(new Set(autoBets.map((_, i) => i)));
  }

  function selectNone() {
    setSelectedBetIds(new Set());
  }

  function confirmBets() {
    const bets = autoBets.filter((_, i) => selectedBetIds.has(i));
    if (bets.length === 0) return;

    const newBets = bets.map((b) => ({
      id: `${b.fixtureId}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      fixtureId: b.fixtureId,
      fixtureLabel: `${b.fixture.homeTeam} vs ${b.fixture.awayTeam}`,
      selection: b.selection,
      oddsAtCalculation: b.odds[b.selection],
      calculatedStake: b.kellyStake,
      modelProbabilityPercent: b.modelProb,
      riskMode: b.riskMode,
      actualOdds: b.odds[b.selection],
      actualStake: b.kellyStake,
      status: 'pending' as const,
      createdAt: Date.now(),
    }));

    setPortfolio((c) => ({ ...c, bets: [...newBets, ...c.bets] }));
    setSelectedBetIds(new Set());
  }

  const currency = portfolio.settings.currency;
  const selectedBets = autoBets.filter((_, i) => selectedBetIds.has(i));
  const totalStake = selectedBets.reduce((sum, b) => sum + b.kellyStake, 0);
  const totalReturn = selectedBets.reduce((sum, b) => sum + b.potentialReturn, 0);

  return (
    <div className="mx-auto w-full max-w-7xl p-4 sm:p-6">
      <div className="mb-6">
        <h2 className="font-display text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Kelly Calculator</h2>
        <p className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
          Auto-fetches odds, calculates edge, and recommends optimal stakes. Only positive EV bets shown.
        </p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Left: Fixtures & Controls */}
        <div className="w-full lg:w-1/2">
          <div className="mb-3 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search teams, leagues..."
                className="glass w-full py-2 pl-9 pr-3 text-sm outline-none"
                style={{ color: 'var(--text-primary)' }}
              />
            </div>
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="glass px-3 py-2 text-sm outline-none"
              style={{ color: 'var(--text-primary)' }}
            >
              {dateOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label} · {opt.sub}</option>
              ))}
            </select>
          </div>

          {/* Settings */}
          <div className="glass mb-3 p-3">
            <button
              type="button"
              onClick={() => setSettingsOpen((o) => !o)}
              className="flex w-full items-center justify-between"
            >
              <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                <Wallet className="size-3.5" />
                Settings
              </span>
              <span className="flex items-center gap-1.5">
                <span className="font-mono text-[10px] tabular" style={{ color: 'var(--text-secondary)' }}>
                  {formatCurrency(portfolio.settings.bankroll, currency)} · {KELLY_RISK_MODES[portfolio.settings.riskMode ?? 'moderate'].label}
                </span>
                {settingsOpen ? <ChevronDown className="size-3.5" style={{ color: 'var(--text-muted)' }} /> : <ChevronRight className="size-3.5" style={{ color: 'var(--text-muted)' }} />}
              </span>
            </button>
            {settingsOpen && (
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <label>
                  <span className="mb-0.5 block font-mono text-[9px] uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Max Bet ({currency})</span>
                  <input
                    type="number"
                    min="0"
                    step={portfolio.settings.minimumStakeUnit}
                    value={portfolio.settings.maximumStake || ''}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      updateSettings({ maximumStake: v > 0 ? v : undefined });
                    }}
                    className="w-full rounded border bg-transparent px-2 py-1.5 font-mono text-xs"
                    style={{ borderColor: 'var(--border-glass-strong)', color: 'var(--text-primary)' }}
                  />
                </label>
                <label>
                  <span className="mb-0.5 block font-mono text-[9px] uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Currency</span>
                  <select
                    value={currency}
                    onChange={(e) => {
                      const next = e.target.value as PortfolioState['settings']['currency'];
                      updateSettings({ currency: next, minimumStakeUnit: MINIMUM_STAKE_UNITS[next] });
                    }}
                    className="w-full rounded border bg-transparent px-2 py-1.5 font-mono text-xs"
                    style={{ borderColor: 'var(--border-glass-strong)', color: 'var(--text-primary)' }}
                  >
                    <option value="USD">USD ($)</option>
                    <option value="NGN">NGN (₦)</option>
                  </select>
                </label>
                <div className="sm:col-span-2">
                  <span className="mb-1 block font-mono text-[9px] uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Risk Mode</span>
                  <div className="flex gap-1.5">
                    {(Object.keys(KELLY_RISK_MODES) as KellyRiskMode[]).map((mode) => {
                      const active = (portfolio.settings.riskMode ?? 'moderate') === mode;
                      return (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => updateSettings({ riskMode: mode })}
                          className="flex-1 rounded px-2 py-1.5 text-center text-[10px] font-semibold transition-colors"
                          style={{
                            backgroundColor: active ? 'var(--accent)' : 'var(--surface)',
                            color: active ? 'white' : 'var(--text-secondary)',
                            border: `1px solid ${active ? 'var(--accent)' : 'var(--border-glass)'}`,
                          }}
                        >
                          {KELLY_RISK_MODES[mode].label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Fixtures List */}
          {loading && (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="glass h-20 animate-pulse" />
              ))}
            </div>
          )}

          {!loading && error && (
            <div className="glass p-4 text-center" style={{ borderColor: 'var(--lose)' }}>
              <p className="text-xs" style={{ color: 'var(--lose)' }}>{error}</p>
            </div>
          )}

          {!loading && !error && sorted.length === 0 && (
            <div className="glass p-6 text-center">
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>No fixtures available for this date.</p>
            </div>
          )}

          {!loading && sorted.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="font-mono text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
                  {sorted.length} fixtures · {autoBets.length} with edge
                </p>
                {oddsLoading && (
                  <p className="flex items-center gap-1 font-mono text-[10px]" style={{ color: 'var(--accent)' }}>
                    <Zap className="size-3 animate-pulse" /> Fetching odds...
                  </p>
                )}
              </div>
              {sorted.map((fixture) => {
                const hasBet = autoBets.some(b => b.fixtureId === fixture.id);
                const prob = fixture.prediction.probabilities;
                return (
                  <div
                    key={fixture.id}
                    className="glass flex items-center gap-3 p-3"
                    style={{
                      borderColor: hasBet ? 'var(--win)' : 'var(--border-glass)',
                      opacity: hasBet ? 1 : 0.5,
                    }}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        <LeagueLogo logo={fixture.leagueLogo} flag={fixture.flag} name={fixture.leagueName} className="size-3 shrink-0" />
                        <span>{fixture.leagueName}</span>
                        <span>·</span>
                        <span>{fixture.time}</span>
                      </div>
                      <p className="mt-0.5 truncate text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {fixture.homeTeam} vs {fixture.awayTeam}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <TeamLogo logo={fixture.homeTeamLogo} name={fixture.homeTeam} className="size-5 shrink-0" />
                      <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>vs</span>
                      <TeamLogo logo={fixture.awayTeamLogo} name={fixture.awayTeam} className="size-5 shrink-0" />
                    </div>
                    <div className="shrink-0 text-right">
                      {hasBet ? (
                        <span className="flex items-center gap-1 text-[10px] font-semibold" style={{ color: 'var(--win)' }}>
                          <TrendingUp className="size-3" /> Edge found
                        </span>
                      ) : (
                        <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>No edge</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Auto-detected Bets */}
        <div className="w-full lg:w-1/2">
          <div className="glass p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                <TrendingUp className="size-3.5" />
                Auto-Detected Positive EV Bets
              </h3>
              {autoBets.length > 0 && (
                <div className="flex gap-1.5">
                  <button onClick={selectAll} className="font-mono text-[9px] underline" style={{ color: 'var(--accent)' }}>All</button>
                  <button onClick={selectNone} className="font-mono text-[9px] underline" style={{ color: 'var(--text-muted)' }}>None</button>
                </div>
              )}
            </div>

            {autoBets.length === 0 && !oddsLoading && (
              <div className="py-8 text-center">
                <AlertTriangle className="mx-auto mb-2 size-6" style={{ color: 'var(--text-muted)' }} />
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  No positive EV bets found for this date.
                </p>
                <p className="mt-1 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  Try a different date or adjust risk mode.
                </p>
              </div>
            )}

            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {autoBets.map((bet, index) => {
                const isSelected = selectedBetIds.has(index);
                const outcomeLabel = bet.selection === 'home' ? bet.fixture.homeTeam :
                  bet.selection === 'away' ? bet.fixture.awayTeam : 'Draw';
                return (
                  <button
                    key={`${bet.fixtureId}-${bet.selection}`}
                    onClick={() => toggleBet(index)}
                    className="glass flex w-full items-start gap-3 p-3 text-left transition-colors"
                    style={{
                      borderColor: isSelected ? 'var(--win)' : 'var(--border-glass)',
                      backgroundColor: isSelected ? 'rgba(34, 197, 94, 0.05)' : undefined,
                    }}
                  >
                    <span
                      className="mt-0.5 flex size-5 shrink-0 items-center justify-center border text-[10px]"
                      style={{
                        borderColor: isSelected ? 'var(--win)' : 'var(--border-glass-strong)',
                        backgroundColor: isSelected ? 'var(--win)' : 'transparent',
                        color: isSelected ? 'white' : 'var(--text-muted)',
                      }}
                    >
                      {isSelected ? '✓' : ''}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        <LeagueLogo logo={bet.fixture.leagueLogo} flag={bet.fixture.flag} name={bet.fixture.leagueName} className="size-3 shrink-0" />
                        <span>{bet.fixture.leagueName}</span>
                      </div>
                      <p className="mt-0.5 text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {outcomeLabel}
                      </p>
                      <div className="mt-1 flex gap-3 font-mono text-[10px] tabular">
                        <span style={{ color: 'var(--text-secondary)' }}>Odds: {bet.odds[bet.selection].toFixed(2)}</span>
                        <span style={{ color: 'var(--text-secondary)' }}>Edge: <span style={{ color: 'var(--win)' }}>{bet.edge.toFixed(1)}%</span></span>
                      </div>
                      <div className="mt-1 flex gap-3 font-mono text-[10px] tabular">
                        <span style={{ color: 'var(--text-secondary)' }}>Model: {bet.modelProb.toFixed(1)}%</span>
                        <span style={{ color: 'var(--text-secondary)' }}>Market: {bet.marketProb.toFixed(1)}%</span>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-mono text-sm font-bold" style={{ color: 'var(--win)' }}>
                        {formatCurrency(bet.kellyStake, currency)}
                      </p>
                      <p className="font-mono text-[9px]" style={{ color: 'var(--text-muted)' }}>
                        → {formatCurrency(bet.potentialReturn, currency)}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {autoBets.length > 0 && (
              <div className="mt-4 border-t pt-3" style={{ borderColor: 'var(--border-glass)' }}>
                <div className="mb-3 flex justify-between font-mono text-xs tabular">
                  <span style={{ color: 'var(--text-secondary)' }}>{selectedBetIds.size} bets selected</span>
                  <span style={{ color: 'var(--text-primary)' }}>Stake: {formatCurrency(totalStake, currency)}</span>
                </div>
                <div className="mb-3 flex justify-between font-mono text-[10px] tabular">
                  <span style={{ color: 'var(--text-secondary)' }}>Potential return</span>
                  <span style={{ color: 'var(--win)' }}>{formatCurrency(totalReturn, currency)}</span>
                </div>
                <button
                  onClick={confirmBets}
                  disabled={selectedBetIds.size === 0}
                  className="flex w-full items-center justify-center gap-2 rounded py-2.5 text-xs font-semibold transition-colors disabled:opacity-40"
                  style={{
                    backgroundColor: selectedBetIds.size > 0 ? 'var(--win)' : 'var(--surface)',
                    color: selectedBetIds.size > 0 ? 'white' : 'var(--text-muted)',
                  }}
                >
                  <CheckCircle2 className="size-3.5" />
                  Confirm {selectedBetIds.size} Bets
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
