import type { Fixture, SortOption } from '../types';

const CONFIDENCE_RANKS: Record<string, number> = {
  'Very High': 4,
  High: 3,
  Moderate: 2,
};

function confidenceRank(confidence: string): number {
  return CONFIDENCE_RANKS[confidence] ?? 1;
}

function maxOutcomeProb(f: Fixture): number {
  return Math.max(f.prediction.probabilities.homeWin, f.prediction.probabilities.awayWin);
}

export function sortFixtures(fixtures: Fixture[], sort: SortOption): Fixture[] {
  const sorted = [...fixtures];
  switch (sort) {
    case 'confidence':
      return sorted.sort(
        (a, b) =>
          confidenceRank(b.prediction.confidence) - confidenceRank(a.prediction.confidence) ||
          maxOutcomeProb(b) - maxOutcomeProb(a)
      );
    case 'prob-desc':
      return sorted.sort((a, b) => maxOutcomeProb(b) - maxOutcomeProb(a));
    case 'time-asc':
      return sorted.sort((a, b) => a.time.localeCompare(b.time));
    case 'time-desc':
      return sorted.sort((a, b) => b.time.localeCompare(a.time));
    case 'league-asc':
      return sorted.sort((a, b) =>
        a.leagueCode.localeCompare(b.leagueCode) || a.id.localeCompare(b.id)
      );
    case 'league-desc':
    default:
      return sorted.sort((a, b) =>
        b.leagueCode.localeCompare(a.leagueCode) || b.id.localeCompare(a.id)
      );
  }
}
