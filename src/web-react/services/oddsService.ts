import type { OneX2Odds } from '../lib/kelly';

interface OddsEvent {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: {
    key: string;
    title: string;
    markets: {
      key: string;
      outcomes: {
        name: string;
        price: number;
        point?: number;
      }[];
    }[];
  }[];
}

interface OddsResponse {
  mode: 'provider' | 'manual-only';
  events: OddsEvent[];
  sport?: string;
  fetchedAt?: string;
  message?: string;
}

const LEAGUE_TO_SPORT: Record<string, string> = {
  'PL': 'soccer_epl',
  'PD': 'soccer_spain_la_liga',
  'SA': 'soccer_italy_serie_a',
  'BL': 'soccer_germany_bundesliga',
  'FL1': 'soccer_france_ligue_one',
  'DED': 'soccer_netherlands_eredivisie',
  'PPL': 'soccer_portugal_liga',
  'BPL': 'soccer_belgium_first_division',
  'SP': 'soccer_scotland Premiership',
  'TSL': 'soccer_turkey_super_lig',
  'UCL': 'soccer_uefa_champs_league',
  'UEL': 'soccer_uefa_europa_league',
  'UECL': 'soccer_uefa_europa_conference_league',
  'FAC': 'soccer_england_fa_cup',
  'CDR': 'soccer_spain_copa_del_rey',
  'CI': 'soccer_italy_coppa_italia',
  'DFB': 'soccer_germany_dfb_pokal',
  'CDF': 'soccer_france_copa',
  'KNVB': 'soccer_netherlands_cup',
  'TDP': 'soccer_portugal_cup',
  'BCP': 'soccer_belgium_cup',
  'SCO': 'soccer_scotland_cup',
  'TKC': 'soccer_turkey_cup',
};

function normalizeTeamName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function findMatchingEvent(events: OddsEvent[], homeTeam: string, awayTeam: string): OddsEvent | undefined {
  const home = normalizeTeamName(homeTeam);
  const away = normalizeTeamName(awayTeam);

  return events.find(event => {
    const eventHome = normalizeTeamName(event.home_team);
    const eventAway = normalizeTeamName(event.away_team);
    return (eventHome === home && eventAway === away) ||
           (eventHome === away && eventAway === home);
  });
}

function extractOneX2Odds(event: OddsEvent): OneX2Odds | null {
  for (const bookmaker of event.bookmakers) {
    const h2hMarket = bookmaker.markets.find(m => m.key === 'h2h');
    if (!h2hMarket) continue;

    const homeOutcome = h2hMarket.outcomes.find(o => o.name === event.home_team || o.name === 'Home');
    const drawOutcome = h2hMarket.outcomes.find(o => o.name === 'Draw');
    const awayOutcome = h2hMarket.outcomes.find(o => o.name === event.away_team || o.name === 'Away');

    if (homeOutcome && drawOutcome && awayOutcome) {
      return {
        home: homeOutcome.price,
        draw: drawOutcome.price,
        away: awayOutcome.price,
      };
    }
  }

  return null;
}

export async function fetchOddsForFixture(
  fixture: { homeTeam: string; awayTeam: string; leagueCode?: string },
  date: string
): Promise<{ odds: OneX2Odds | null; source: string }> {
  try {
    const sport = fixture.leagueCode ? LEAGUE_TO_SPORT[fixture.leagueCode] || 'soccer_epl' : 'soccer_epl';
    const response = await fetch(`/api/odds?date=${date}&sport=${sport}`);

    if (!response.ok) {
      return { odds: null, source: 'api-error' };
    }

    const data: OddsResponse = await response.json();

    if (data.mode === 'manual-only' || !data.events?.length) {
      return { odds: null, source: data.mode };
    }

    const matchingEvent = findMatchingEvent(data.events, fixture.homeTeam, fixture.awayTeam);
    if (!matchingEvent) {
      return { odds: null, source: 'no-match' };
    }

    const odds = extractOneX2Odds(matchingEvent);
    return { odds, source: matchingEvent.bookmakers[0]?.title || 'unknown' };
  } catch {
    return { odds: null, source: 'fetch-error' };
  }
}

export async function fetchAllOddsForDate(date: string, sport: string = 'soccer_epl'): Promise<OddsEvent[]> {
  try {
    const response = await fetch(`/api/odds?date=${date}&sport=${sport}`);

    if (!response.ok) {
      return [];
    }

    const data: OddsResponse = await response.json();

    if (data.mode === 'manual-only' || !data.events?.length) {
      return [];
    }

    return data.events;
  } catch {
    return [];
  }
}