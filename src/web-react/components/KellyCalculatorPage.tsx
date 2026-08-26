import { useEffect, useMemo, useState } from 'react';
import { getDailyFixtures } from '../../services/fixturesService.js';
import { LEAGUE_LIST } from '../../config/leagues.js';
import { CompactKellyCard } from './CompactKellyCard';
import { useTheme } from '../hooks/useTheme';
import { sanitizeSearchQuery, isValidDateString } from '../lib/validation';
import { sortFixtures } from '../lib/export';
import { KELLY_RISK_MODES, type KellyRiskMode, type OneX2Outcome } from '../lib/kelly';
import {
  formatCurrency,
  loadPortfolio,
  savePortfolio,
  MINIMUM_STAKE_UNITS,
  type PortfolioState,
} from '../lib/portfolio';
import type { Fixture, FixturesResponse, League } from '../types';
import { Search, X, Wallet, ChevronDown, ChevronRight } from 'lucide-react';

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

interface StagedBet {
  fixtureId: string;
  fixtureLabel: string;
  selection: OneX2Outcome;
  odds: { home: number; draw: number; away: number };
  modelProbabilityPercent: number;
  recommendedStake: number;
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
  const [selectedFixtureIds, setSelectedFixtureIds] = useState<Set<string>>(new Set());
  const [formMap, setFormMap] = useState<Record<string, { recentForm: string[]; formPoints: number }> | null>(null);
  const [stagedBets, setStagedBets] = useState<StagedBet[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [portfolio, setPortfolio] = useState<PortfolioState>(() => loadPortfolio());
  useEffect(() => { savePortfolio(portfolio); }, [portfolio]);

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

  const selectedFixtures = useMemo(
    () => sorted.filter((f) => selectedFixtureIds.has(f.id)),
    [sorted, selectedFixtureIds]
  );

  function toggleFixture(id: string) {
    setSelectedFixtureIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function removeFixture(id: string) {
    setSelectedFixtureIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  function stageBet(bet: StagedBet) {
    setStagedBets((prev) => [...prev, bet]);
  }

  function removeStaged(index: number) {
    setStagedBets((prev) => prev.filter((_, i) => i !== index));
  }

  function confirmAll() {
    if (stagedBets.length === 0) return;
    const newBets = stagedBets.map((b) => ({
      id: `${b.fixtureId}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      fixtureId: b.fixtureId,
      fixtureLabel: b.fixtureLabel,
      selection: b.selection,
      oddsAtCalculation: b.odds[b.selection],
      calculatedStake: b.recommendedStake,
      modelProbabilityPercent: b.modelProbabilityPercent,
      riskMode: b.riskMode,
      actualOdds: b.odds[b.selection],
      actualStake: b.recommendedStake,
      status: 'pending' as const,
      createdAt: Date.now(),
    }));
    setPortfolio((c) => ({ ...c, bets: [...newBets, ...c.bets] }));
    setStagedBets([]);
  }

  const currency = portfolio.settings.currency;
  const totalStaked = stagedBets.reduce((sum, b) => sum + b.recommendedStake, 0);

  return (
    <div className="mx-auto w-full max-w-7xl p-4 sm:p-6">
      <div className="mb-6">
        <h2 className="font-display text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Kelly Calculator</h2>
        <p className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
          Select fixtures, enter odds, and calculate optimal Kelly stakes. Bankroll and risk settings are shared across all selections.
        </p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
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
              <p className="mb-2 font-mono text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
                {sorted.length} fixtures · {selectedFixtureIds.size} selected
              </p>
              {sorted.map((fixture) => {
                const isSelected = selectedFixtureIds.has(fixture.id);
                const prob = fixture.prediction.probabilities;
                return (
                  <button
                    key={fixture.id}
                    onClick={() => toggleFixture(fixture.id)}
                    className="glass flex w-full items-center gap-3 p-3 text-left transition-colors"
                    style={{
                      borderColor: isSelected ? 'var(--accent)' : 'var(--border-glass)',
                      backgroundColor: isSelected ? 'var(--accent-tint)' : undefined,
                    }}
                  >
                    <span
                      className="flex size-5 shrink-0 items-center justify-center border text-[10px]"
                      style={{
                        borderColor: isSelected ? 'var(--accent)' : 'var(--border-glass-strong)',
                        backgroundColor: isSelected ? 'var(--accent)' : 'transparent',
                        color: isSelected ? 'white' : 'var(--text-muted)',
                      }}
                    >
                      {isSelected ? '✓' : ''}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        <span>{fixture.flag}</span>
                        <span>{fixture.leagueName}</span>
                        <span>·</span>
                        <span>{fixture.time}</span>
                      </div>
                      <p className="mt-0.5 truncate text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {fixture.homeTeam} vs {fixture.awayTeam}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="flex gap-1.5 font-mono text-[10px] tabular">
                        <span style={{ color: 'var(--win)' }}>{prob.homeWin}%</span>
                        <span style={{ color: 'var(--draw)' }}>{prob.draw}%</span>
                        <span style={{ color: 'var(--lose)' }}>{prob.awayWin}%</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="w-full lg:w-1/2">
          <div className="glass mb-3 p-3">
            <button
              type="button"
              onClick={() => setSettingsOpen((o) => !o)}
              className="flex w-full items-center justify-between"
            >
              <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                <Wallet className="size-3.5" />
                Bankroll & Risk Settings
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
                  <span className="mb-0.5 block font-mono text-[9px] uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Bankroll ({currency})</span>
                  <input
                    type="number"
                    min="0"
                    step={portfolio.settings.minimumStakeUnit}
                    value={portfolio.settings.bankroll || ''}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      updateSettings({ bankroll: Number.isFinite(v) ? v : 0 });
                    }}
                    className="w-full rounded border bg-transparent px-2 py-1.5 font-mono text-xs"
                    style={{ borderColor: 'var(--border-glass-strong)', color: 'var(--text-primary)' }}
                  />
                </label>
                <label>
                  <span className="mb-0.5 block font-mono text-[9px] uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Min edge (%)</span>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={portfolio.settings.minimumEdgePercent}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      updateSettings({ minimumEdgePercent: Number.isFinite(v) ? v : 0 });
                    }}
                    className="w-full rounded border bg-transparent px-2 py-1.5 font-mono text-xs"
                    style={{ borderColor: 'var(--border-glass-strong)', color: 'var(--text-primary)' }}
                  />
                </label>
                <label>
                  <span className="mb-0.5 block font-mono text-[9px] uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Max stake</span>
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
                    <option value="GBP">GBP (£)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="USD">USD ($)</option>
                    <option value="JPY">JPY (¥)</option>
                  </select>
                </label>
                <div className="sm:col-span-2">
                  <span className="mb-1 block font-mono text-[9px] uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Risk mode</span>
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

          {selectedFixtures.length === 0 && stagedBets.length === 0 && (
            <div className="glass flex h-48 items-center justify-center p-6 text-center">
              <div>
                <p className="font-display text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>No fixture selected</p>
                <p className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Select fixtures from the left to calculate Kelly stakes.
                </p>
              </div>
            </div>
          )}

          {selectedFixtures.length > 0 && (
            <div className="space-y-2">
              <p className="mb-1 font-mono text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
                {selectedFixtures.length} fixture{selectedFixtures.length !== 1 ? 's' : ''} · enter H/D/A odds
              </p>
              {selectedFixtures.map((fixture) => (
                <div key={fixture.id} className="relative">
                  <button
                    onClick={() => removeFixture(fixture.id)}
                    className="absolute right-2 top-2 z-10 rounded p-0.5 transition-colors"
                    style={{ color: 'var(--text-muted)' }}
                    aria-label="Remove"
                  >
                    <X className="size-3" />
                  </button>
                  <CompactKellyCard
                    fixture={fixture}
                    bankroll={portfolio.settings.bankroll}
                    riskMode={portfolio.settings.riskMode ?? 'moderate'}
                    minimumEdgePercent={portfolio.settings.minimumEdgePercent}
                    minimumStakeUnit={portfolio.settings.minimumStakeUnit}
                    maximumStake={portfolio.settings.maximumStake}
                    currency={currency}
                    onStage={stageBet}
                  />
                </div>
              ))}
            </div>
          )}

          {stagedBets.length > 0 && (
            <div className="glass mt-3 p-3">
              <div className="flex items-center justify-between">
                <p className="font-mono text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
                  Staged ({stagedBets.length}) · Total {formatCurrency(totalStaked, currency)}
                </p>
                <button
                  type="button"
                  onClick={confirmAll}
                  className="rounded px-3 py-1.5 text-[10px] font-semibold"
                  style={{ backgroundColor: 'var(--accent)', color: 'white' }}
                >
                  Confirm All
                </button>
              </div>
              <div className="mt-2 space-y-1">
                {stagedBets.map((bet, i) => (
                  <div key={i} className="flex items-center justify-between rounded px-2 py-1.5 text-[11px]" style={{ backgroundColor: 'var(--surface)' }}>
                    <span className="truncate" style={{ color: 'var(--text-primary)' }}>
                      {bet.fixtureLabel} · <span style={{ color: 'var(--accent)' }}>{bet.selection.toUpperCase()}</span>
                    </span>
                    <span className="ml-2 flex items-center gap-2 shrink-0">
                      <span className="font-mono tabular" style={{ color: 'var(--text-secondary)' }}>
                        {bet.odds[bet.selection].toFixed(2)} · {formatCurrency(bet.recommendedStake, currency)}
                      </span>
                      <button onClick={() => removeStaged(i)} style={{ color: 'var(--text-muted)' }}>
                        <X className="size-3" />
                      </button>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
