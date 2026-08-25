import type { BetSlipItem, Fixture } from '../types';

const BOOKMAKER_MARGIN = 1.08;

function favoritePick(f: Fixture): { pick: string; probability: number } {
  const p = f.prediction.probabilities;
  const outcomes = [
    { pick: `${f.homeTeam} win`, prob: p.homeWin },
    { pick: 'Draw', prob: p.draw },
    { pick: `${f.awayTeam} win`, prob: p.awayWin },
  ];
  const best = outcomes.reduce((a, b) => (b.prob > a.prob ? b : a));
  return { pick: best.pick, probability: Math.round(best.prob * 10) / 10 };
}

export function buildSlipItems(fixtures: Fixture[]): BetSlipItem[] {
  return fixtures.map((f) => {
    const fav = favoritePick(f);
    const fairProb = Math.max(0.05, fav.probability / 100);
    const odds = Math.max(1.01, Math.round((1 / (fairProb * BOOKMAKER_MARGIN)) * 100) / 100);
    return {
      fixtureId: f.id,
      matchLabel: `${f.homeTeam} vs ${f.awayTeam}`,
      pick: fav.pick,
      probability: fav.probability,
      odds,
    };
  });
}

export function totalOdds(items: BetSlipItem[]): number {
  return Math.round(items.reduce((acc, i) => acc * i.odds, 1) * 100) / 100;
}

function hashString(input: string): string {
  let h = 5381;
  for (let i = 0; i < input.length; i++) {
    h = ((h << 5) + h + input.charCodeAt(i)) >>> 0;
  }
  return h.toString(36).toUpperCase();
}

export function generatePredictionCode(items: BetSlipItem[], dateStr: string): string {
  if (items.length === 0) return '';
  const seed = items
    .map((i) => i.fixtureId)
    .sort()
    .join('|') + `#${dateStr}`;
  return `EFP-${hashString(seed).slice(0, 6).padEnd(6, 'X')}`;
}

export function formatSlipText(items: BetSlipItem[], code: string, dateStr: string): string {
  const lines = [
    `EuroFootyPredictor — ${dateStr}`,
    `Prediction code: ${code}`,
    '',
    ...items.map((i, idx) => `${idx + 1}. ${i.matchLabel} → ${i.pick.toUpperCase()} @ ${i.odds.toFixed(2)}`),
    '',
    `Total odds (model): ${totalOdds(items).toFixed(2)}`,
    'Generated from 12-factor Poisson predictions.',
    'Not a bookmaker booking code — add these picks manually in your betting app.',
  ];
  return lines.join('\n');
}

export const BOOKMAKERS = [
  { name: 'SportyBet', url: 'https://www.sportybet.com/ng/sport/football/' },
  { name: 'Bet9ja', url: 'https://bet9ja.com/sports' },
  { name: 'BetKing', url: 'https://www.betking.com/sports' },
  { name: '1xBet', url: 'https://1xbet.com/en/' },
];
