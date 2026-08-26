export interface MatchStat {
  label: string;
  key: string;
  home: string;
  away: string;
}

export interface KeyEvent {
  type: string;
  text: string;
  clock: string;
  period: number;
  team: string;
  scorer: string;
  assist: string;
}

export interface LineupPlayer {
  name: string;
  number: string;
  position: string;
  starter: boolean;
  subbedIn: boolean;
  subbedOut: boolean;
}

export interface Lineup {
  team: string;
  formation: string;
  homeAway: string;
  players: LineupPlayer[];
}

export interface MatchStatsResponse {
  stats: {
    home: { team: string; logo?: string; stats: Record<string, string> };
    away: { team: string; logo?: string; stats: Record<string, string> };
  } | null;
  events: KeyEvent[];
  lineups: Lineup[];
}

const STAT_ORDER = [
  'possessionPct', 'totalShots', 'shotsOnTarget', 'wonCorners',
  'foulsCommitted', 'yellowCards', 'redCards', 'totalPasses',
  'passPct', 'offsides', 'saves', 'interceptions',
];

const STAT_LABELS: Record<string, string> = {
  possessionPct: 'Possession',
  totalShots: 'Total Shots',
  shotsOnTarget: 'Shots on Target',
  wonCorners: 'Corners',
  foulsCommitted: 'Fouls',
  yellowCards: 'Yellow Cards',
  redCards: 'Red Cards',
  totalPasses: 'Passes',
  passPct: 'Pass Accuracy',
  offsides: 'Offsides',
  saves: 'Saves',
  interceptions: 'Interceptions',
};

export function buildStatRows(
  homeStats: Record<string, string>,
  awayStats: Record<string, string>
): MatchStat[] {
  return STAT_ORDER
    .filter(k => homeStats[k] != null || awayStats[k] != null)
    .map(k => ({
      label: STAT_LABELS[k] || k,
      key: k,
      home: k === 'possessionPct' ? `${homeStats[k] ?? ''}%` : (homeStats[k] ?? ''),
      away: k === 'possessionPct' ? `${awayStats[k] ?? ''}%` : (awayStats[k] ?? ''),
    }));
}

export async function fetchMatchStats(
  league: string,
  eventId: string
): Promise<MatchStatsResponse | null> {
  try {
    const response = await fetch(`/api/espn-summary?league=${encodeURIComponent(league)}&eventId=${eventId}`);
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}
