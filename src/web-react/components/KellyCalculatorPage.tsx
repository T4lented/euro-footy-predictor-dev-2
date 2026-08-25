import { useEffect, useMemo, useState } from 'react';
import { getDailyFixtures } from '../../services/fixturesService.js';
import { LEAGUE_LIST } from '../../config/leagues.js';
import { KellyPanel } from './KellyPanel';
import { useTheme } from '../hooks/useTheme';
import { sanitizeSearchQuery, isValidDateString } from '../lib/validation';
import { sortFixtures } from '../lib/export';
import type { Fixture, FixturesResponse, League } from '../types';
import { Search, X } from 'lucide-react';

const leagues = LEAGUE_LIST as League[];

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

export function KellyCalculatorPage() {
  const [theme] = useTheme();
  const dateOptions = useMemo(buildDateOptions, []);
  const [selectedDate, setSelectedDate] = useState(dateOptions[1].value);
  const [query, setQuery] = useState('');
  const [data, setData] = useState<FixturesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFixtureIds, setSelectedFixtureIds] = useState<Set<string>>(new Set());
  const [activeDetailFixture, setActiveDetailFixture] = useState<Fixture | null>(null);
  const [formMap, setFormMap] = useState<Record<string, { recentForm: string[]; formPoints: number }> | null>(null);

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

  return (
    <div className="mx-auto w-full max-w-7xl p-4 sm:p-6">
      <div className="mb-6">
        <h2 className="font-display text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Kelly Calculator</h2>
        <p className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
          Select fixtures from the list below to size your stakes using the Kelly criterion. Enter your odds and bankroll to calculate optimal bet sizes.
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
          {selectedFixtures.length === 0 && (
            <div className="glass flex h-64 items-center justify-center p-6 text-center">
              <div>
                <p className="font-display text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>No fixture selected</p>
                <p className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Select one or more fixtures from the left panel to calculate Kelly stake sizes.
                </p>
              </div>
            </div>
          )}

          {selectedFixtures.map((fixture) => (
            <div key={fixture.id} className="mb-4">
              <div className="glass mb-2 flex items-center justify-between p-3">
                <div>
                  <p className="flex items-center gap-1.5 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                    <span>{fixture.flag}</span> {fixture.leagueName} · {fixture.time}
                  </p>
                  <p className="mt-0.5 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {fixture.homeTeam} vs {fixture.awayTeam}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedFixtureIds((prev) => {
                      const next = new Set(prev);
                      next.delete(fixture.id);
                      return next;
                    });
                  }}
                  className="glass p-1.5"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <X className="size-3.5" />
                </button>
              </div>
              <div className="glass p-4">
                <KellyPanel fixture={fixture} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}