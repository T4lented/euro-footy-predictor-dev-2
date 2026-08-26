export interface League {
  code: string;
  name: string;
  flag: string;
  logo?: string | null;
  country?: string;
}

export interface FactorDiff {
  key: string;
  name: string;
  icon: string;
  diff: number;
  favors: 'HOME' | 'AWAY' | 'NEUTRAL';
  homeScore: number;
  awayScore: number;
}

export interface Prediction {
  expectedGoals: { home: number; away: number };
  probabilities: {
    homeWin: number;
    draw: number;
    awayWin: number;
    over25: number;
    under25?: number;
    btts: number;
  };
  topScorelines: { score: string; prob: number }[];
  confidence: string;
  factorDiffs: FactorDiff[];
  h2h?: {
    totalMatches?: number;
    homeWins?: number;
    draws?: number;
    awayWins?: number;
    derbyOrRivalry?: string | boolean;
    last5Meetings?: { date?: string; home: string; away: string; score: string }[];
  };
}

export type SortOption =
  | 'confidence'
  | 'prob-desc'
  | 'time-asc'
  | 'time-desc'
  | 'league-asc'
  | 'league-desc';

export interface LiveInfo {
  state: 'in' | 'post' | 'pre';
  clock?: string;
  period?: number;
  homeScore?: string;
  awayScore?: string;
}

export interface StatRow {
  name: string;
  home: string;
  away: string;
}

export interface Fixture {
  id: string;
  espnEventId?: string;
  leagueCode: string;
  leagueName: string;
  flag: string;
  leagueLogo?: string | null;
  date: string;
  time: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamLogo?: string | null;
  awayTeamLogo?: string | null;
  stadium: string;
  matchType: string;
  status: string;
  live?: LiveInfo | null;
  stats?: StatRow[];
  prediction: Prediction;
}

export interface BetSlipItem {
  fixtureId: string;
  matchLabel: string;
  pick: string;
  probability: number;
  odds: number;
}

export interface FixturesResponse {
  date: string;
  provider: string;
  fixtures: Fixture[];
  message: string;
}
