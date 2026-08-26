import { useState } from 'react';
import { ChevronUp, ChevronDown, Clock, TrendingUp } from 'lucide-react';
import type { Fixture } from '../types';
import { FixtureCard } from './FixtureCard';
import { LeagueLogo } from './LeagueLogo';

interface LeagueSectionProps {
  leagueCode: string;
  leagueName: string;
  flag: string;
  leagueLogo?: string | null;
  country?: string;
  fixtures: Fixture[];
  onOpen: (fixture: Fixture) => void;
}

type SortOption = 'time-asc' | 'time-desc' | 'prob-asc' | 'prob-desc';

export function LeagueSection({
  leagueCode,
  leagueName,
  flag,
  leagueLogo,
  country,
  fixtures,
  onOpen
}: LeagueSectionProps) {
  const [sortBy, setSortBy] = useState<SortOption>('time-asc');

  // Sort fixtures based on the selected option
  const sortedFixtures = [...fixtures].sort((a, b) => {
    switch (sortBy) {
      case 'time-asc':
        return a.time.localeCompare(b.time);
      case 'time-desc':
        return b.time.localeCompare(a.time);
      case 'prob-asc': {
        const probA = Math.max(
          a.prediction.probabilities.homeWin,
          a.prediction.probabilities.awayWin
        );
        const probB = Math.max(
          b.prediction.probabilities.homeWin,
          b.prediction.probabilities.awayWin
        );
        return probA - probB;
      }
      case 'prob-desc': {
        const probA = Math.max(
          a.prediction.probabilities.homeWin,
          a.prediction.probabilities.awayWin
        );
        const probB = Math.max(
          b.prediction.probabilities.homeWin,
          b.prediction.probabilities.awayWin
        );
        return probB - probA;
      }
      default:
        return 0;
    }
  });

  const toggleSort = (option: SortOption) => {
    // If clicking the same option, toggle between asc/desc
    if (sortBy === option) {
      if (option === 'time-asc') setSortBy('time-desc');
      else if (option === 'time-desc') setSortBy('time-asc');
      else if (option === 'prob-asc') setSortBy('prob-desc');
      else if (option === 'prob-desc') setSortBy('prob-asc');
    } else {
      setSortBy(option);
    }
  };

  return (
    <section className="glass overflow-hidden">
      {/* League Header */}
      <div className="flex items-center justify-between border-b p-4" style={{ borderColor: 'var(--border-glass)' }}>
        <div className="flex items-center gap-3">
          <LeagueLogo logo={leagueLogo} flag={flag} name={leagueName} className="size-8 shrink-0" />
          <div>
            <h2 className="font-display text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              {leagueName}
            </h2>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {country} · {fixtures.length} matches
            </p>
          </div>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => toggleSort('time-asc')}
            className={`flex items-center gap-1 border px-2 py-1 text-[10px] uppercase tracking-wide transition-colors ${sortBy === 'time-asc' || sortBy === 'time-desc' ? 'border-[color:var(--border-glass-strong)]' : ''}`}
            style={{
              borderColor:
                sortBy === 'time-asc' || sortBy === 'time-desc'
                  ? 'var(--border-glass-strong)'
                  : 'var(--border-glass)',
              color:
                sortBy === 'time-asc' || sortBy === 'time-desc'
                  ? 'var(--accent-text)'
                  : 'var(--text-secondary)'
            }}
          >
            <Clock className="size-3" />
            <span>Time</span>
            {sortBy === 'time-asc' && <ChevronUp className="size-3" />}
            {sortBy === 'time-desc' && <ChevronDown className="size-3" />}
          </button>

          <button
            onClick={() => toggleSort('prob-asc')}
            className={`flex items-center gap-1 border px-2 py-1 text-[10px] uppercase tracking-wide transition-colors ${sortBy === 'prob-asc' || sortBy === 'prob-desc' ? 'border-[color:var(--border-glass-strong)]' : ''}`}
            style={{
              borderColor:
                sortBy === 'prob-asc' || sortBy === 'prob-desc'
                  ? 'var(--border-glass-strong)'
                  : 'var(--border-glass)',
              color:
                sortBy === 'prob-asc' || sortBy === 'prob-desc'
                  ? 'var(--accent-text)'
                  : 'var(--text-secondary)'
            }}
          >
            <TrendingUp className="size-3" />
            <span>Prob</span>
            {sortBy === 'prob-asc' && <ChevronUp className="size-3" />}
            {sortBy === 'prob-desc' && <ChevronDown className="size-3" />}
          </button>
        </div>
      </div>

      {/* Matches Grid */}
      <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
        {sortedFixtures.map((fixture) => (
          <FixtureCard key={fixture.id} fixture={fixture} onOpen={onOpen} />
        ))}
      </div>
    </section>
  );
}