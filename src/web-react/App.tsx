import { useEffect, useMemo, useState } from 'react';
import { getDailyFixtures } from '../services/fixturesService.js';
import { LEAGUE_LIST } from '../config/leagues.js';
import { Navbar, type Page } from './components/Navbar';
import { DateRibbon } from './components/DateRibbon';
import { LeagueSidebar } from './components/LeagueSidebar';
import { LeagueSection } from './components/LeagueSection';
import { MobileMenu } from './components/MobileMenu';
import { FixtureCard } from './components/FixtureCard';
import { MatchModal } from './components/MatchModal';
import { SelectionBar } from './components/SelectionBar';
import { BetSlipModal } from './components/BetSlipModal';
import { FeaturesSection } from './components/FeaturesSection';
import { Footer } from './components/Footer';
import { KellyCalculatorPage } from './components/KellyCalculatorPage';
import { PortfolioTrackerPage } from './components/PortfolioTrackerPage';
import { useTheme } from './hooks/useTheme';
import { sanitizeSearchQuery, isValidDateString } from './lib/validation';
import { sortFixtures } from './lib/export';
import { exportFixturesImage } from './lib/imageExport';
import type { Fixture, FixturesResponse, League, SortOption } from './types';

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

export default function App() {
  const [theme, toggleTheme] = useTheme();
  const dateOptions = useMemo(buildDateOptions, []);
  const [selectedDate, setSelectedDate] = useState(dateOptions[1].value);
  const [leagueCode, setLeagueCode] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [data, setData] = useState<FixturesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFixture, setActiveFixture] = useState<Fixture | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [globalSort, setGlobalSort] = useState<string | null>(null);
  const [sort, setSort] = useState<SortOption>('confidence');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [slipOpen, setSlipOpen] = useState(false);
  const [slip, setSlip] = useState<Fixture[]>([]);
  const [formMap, setFormMap] = useState<Record<string, { recentForm: string[]; formPoints: number }> | null>(null);
  const [activePage, setActivePage] = useState<Page>('fixtures');

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
      selectedDate,
      leagueCode,
      { formMap }
    )
      .then((res: FixturesResponse) => {
        if (!cancelled) {
          setData(res);
          setSelectedIds(new Set());
        }
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message || 'Failed to load fixtures.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedDate, leagueCode, formMap]);

  const fixtures = data?.fixtures ?? [];
  const hasLiveGames = useMemo(() => fixtures.some((f) => f.live?.state === 'in'), [fixtures]);

  useEffect(() => {
    if (!hasLiveGames) return;
    const id = setInterval(() => {
      (getDailyFixtures as (d?: string | null, l?: string | null, o?: object) => Promise<FixturesResponse>)(
        selectedDate,
        leagueCode,
        { formMap }
      )
        .then((res: FixturesResponse) => setData(res))
        .catch(() => {});
    }, 30000);
    return () => clearInterval(id);
  }, [hasLiveGames, selectedDate, leagueCode, formMap]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const f of fixtures) c[f.leagueCode] = (c[f.leagueCode] ?? 0) + 1;
    return c;
  }, [fixtures]);

  const filtered = useMemo(() => {
    const q = sanitizeSearchQuery(query);
    if (!q) return fixtures;
    return fixtures.filter(
      (f) =>
        f.homeTeam.toLowerCase().includes(q) ||
        f.awayTeam.toLowerCase().includes(q) ||
        f.leagueName.toLowerCase().includes(q) ||
        f.stadium.toLowerCase().includes(q)
    );
  }, [fixtures, query]);

  const groupedFixtures = useMemo(() => {
    const groups: Record<string, Fixture[]> = {};
    for (const fixture of filtered) {
      if (!groups[fixture.leagueCode]) {
        groups[fixture.leagueCode] = [];
      }
      groups[fixture.leagueCode].push(fixture);
    }
    return groups;
  }, [filtered]);

  const globallySortedFixtures = useMemo(() => {
    if (!globalSort) return null;

    const sorted = [...filtered];
    switch (globalSort) {
      case 'confidence': {
        const confRank: Record<string, number> = { 'Very High': 4, High: 3, Moderate: 2, 'Low (Contested)': 1 };
        return sorted.sort(
          (a, b) =>
            (confRank[b.prediction.confidence] ?? 1) - (confRank[a.prediction.confidence] ?? 1) ||
            Math.max(b.prediction.probabilities.homeWin, b.prediction.probabilities.awayWin) -
            Math.max(a.prediction.probabilities.homeWin, a.prediction.probabilities.awayWin)
        );
      }
      case 'time-asc':
        return sorted.sort((a, b) => a.time.localeCompare(b.time));
      case 'time-desc':
        return sorted.sort((a, b) => b.time.localeCompare(a.time));
      case 'prob-asc':
        return sorted.sort((a, b) => {
          const probA = Math.max(
            a.prediction.probabilities.homeWin,
            a.prediction.probabilities.awayWin
          );
          const probB = Math.max(
            b.prediction.probabilities.homeWin,
            b.prediction.probabilities.awayWin
          );
          return probA - probB;
        });
      case 'prob-desc':
        return sorted.sort((a, b) => {
          const probA = Math.max(
            a.prediction.probabilities.homeWin,
            a.prediction.probabilities.awayWin
          );
          const probB = Math.max(
            b.prediction.probabilities.homeWin,
            b.prediction.probabilities.awayWin
          );
          return probB - probA;
        });
      case 'league-asc':
        return sorted.sort((a, b) =>
          a.leagueCode.localeCompare(b.leagueCode) || a.id.localeCompare(b.id)
        );
      case 'league-desc':
        return sorted.sort((a, b) =>
          b.leagueCode.localeCompare(a.leagueCode) || b.id.localeCompare(a.id)
        );
      default:
        return null;
    }
  }, [filtered, globalSort]);

  const sorted = useMemo(() => sortFixtures(filtered, sort), [filtered, sort]);

  const selectedFixtures = useMemo(
    () => sorted.filter((f) => selectedIds.has(f.id)),
    [sorted, selectedIds]
  );

  const fixturesByLeague = useMemo(() => {
    const map: Record<string, Fixture[]> = {};
    for (const f of sorted) {
      (map[f.leagueCode] = map[f.leagueCode] || []).push(f);
    }
    return map;
  }, [sorted]);

  const slipFixtures = useMemo(
    () => fixtures.filter((f) => slip.some((s) => s.id === f.id)),
    [fixtures, slip]
  );

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSlip(fixture: Fixture) {
    setSlip((prev) => (prev.some((s) => s.id === fixture.id) ? prev.filter((s) => s.id !== fixture.id) : [...prev, fixture]));
  }

  const activeLeagueLabel = leagueCode ? leagues.find(l => l.code === leagueCode)?.name : null;

  const isFixturesPage = activePage === 'fixtures';

  return (
    <div className="relative min-h-screen flex flex-col">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div
          className="absolute -top-32 -left-32 h-96 w-96"
          style={{ background: 'var(--blob-a)', filter: 'blur(120px)', opacity: 0.5 }}
        />
        <div
          className="absolute top-1/3 -right-40 h-[28rem] w-[28rem]"
          style={{ background: 'var(--blob-b)', filter: 'blur(130px)', opacity: 0.45 }}
        />
        <div
          className="absolute bottom-0 left-1/4 h-80 w-80"
          style={{ background: 'var(--blob-c)', filter: 'blur(110px)', opacity: 0.35 }}
        />
      </div>

      <Navbar
        query={query}
        onQueryChange={setQuery}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenMenu={() => setMobileMenuOpen(true)}
        activeLeagueLabel={isFixturesPage ? activeLeagueLabel : null}
        activePage={activePage}
        onNavigate={setActivePage}
      />

      {isFixturesPage && (
        <>
          <MobileMenu
            open={mobileMenuOpen}
            onClose={() => setMobileMenuOpen(false)}
            leagues={leagues}
            activeCode={leagueCode}
            counts={counts}
            onSelect={setLeagueCode}
            fixturesByLeague={fixturesByLeague}
            onSelectGame={setActiveFixture}
          />

          <DateRibbon dates={dateOptions} selected={selectedDate} onSelect={setSelectedDate} />

          <div className="mx-auto flex w-full max-w-7xl flex-1">
            <LeagueSidebar
              leagues={leagues}
              activeCode={leagueCode}
              counts={counts}
              onSelect={setLeagueCode}
              fixturesByLeague={fixturesByLeague}
              onSelectGame={setActiveFixture}
            />

            <main className="min-w-0 flex-1 p-4 sm:p-6 overflow-x-hidden">
              {loading && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="glass h-40 animate-pulse" />
                  ))}
                </div>
              )}

              {!loading && error && (
                <div className="glass p-6 text-center" style={{ borderColor: 'var(--lose)' }}>
                  <p className="font-display text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Couldn't load fixtures</p>
                  <p className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>{error}</p>
                </div>
              )}

              {!loading && !error && data && filtered.length === 0 && (
                <div className="glass p-8 text-center">
                  <p className="font-display text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>No fixtures found</p>
                  <p className="mx-auto mt-1 max-w-sm text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {data.message || 'Try another date, clear the league filter, or clear your search.'}
                  </p>
                </div>
              )}

              {!loading && !error && filtered.length > 0 && (
                <>
                  <div className="mb-3 flex items-center justify-between font-mono text-[11px] uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
                    <span>{filtered.length} fixture{filtered.length === 1 ? '' : 's'} · {data?.provider}</span>
                    <span>{selectedDate}</span>
                  </div>

                  <div className="mb-4 flex items-center gap-2">
                    <span className="font-mono text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Sort by</span>
                    {([
                      ['confidence', 'Confidence'],
                      ['prob-desc', 'Win %'],
                      ['time-asc', 'Kick-off'],
                      ['league-asc', 'League'],
                    ] as [SortOption, string][]).map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setGlobalSort(globalSort === value ? null : value)}
                        className="border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide transition-colors"
                        style={
                          globalSort === value
                            ? { borderColor: 'var(--accent)', backgroundColor: 'var(--accent-soft)', color: 'var(--accent-text)' }
                            : { borderColor: 'var(--border-glass)', color: 'var(--text-secondary)' }
                        }
                      >
                        {label}
                      </button>
                    ))}
                    {globalSort && (
                      <button
                        type="button"
                        onClick={() => setGlobalSort(null)}
                        className="border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide transition-colors"
                        style={{ borderColor: 'var(--border-glass)', color: 'var(--text-muted)' }}
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  {globalSort && globallySortedFixtures ? (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {globallySortedFixtures.map((fixture) => (
                        <FixtureCard key={fixture.id} fixture={fixture} onOpen={setActiveFixture} />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {Object.entries(groupedFixtures).map(([code, leagueFixtures]) => {
                        const league = leagues.find(l => l.code === code);
                        if (!league) return null;

                        return (
                          <LeagueSection
                            key={code}
                            leagueCode={code}
                            leagueName={league.name}
                            flag={league.flag}
                            leagueLogo={league.logo}
                            country={league.country}
                            fixtures={leagueFixtures}
                            onOpen={setActiveFixture}
                          />
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </main>
          </div>

          <FeaturesSection />

          <SelectionBar
            count={selectedFixtures.length}
            onExportPng={() => exportFixturesImage(selectedFixtures, selectedDate, theme)}
            onClear={() => setSelectedIds(new Set())}
            slipCount={slip.length}
            onOpenSlip={() => setSlipOpen(true)}
          />

          <BetSlipModal
            open={slipOpen}
            fixtures={slipFixtures}
            dateStr={selectedDate}
            onClose={() => setSlipOpen(false)}
          />

          <MatchModal fixture={activeFixture} onClose={() => setActiveFixture(null)} />
        </>
      )}

      {activePage === 'calculator' && <KellyCalculatorPage />}
      {activePage === 'portfolio' && <PortfolioTrackerPage />}

      <Footer />
    </div>
  );
}