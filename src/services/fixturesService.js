/**
 * Fixtures Service - Real Live API Integration
 * Primary: ESPN Open Soccer Scoreboard API (100% Free, Keyless)
 * Secondary / Fallback: Football-Data.org API
 */
import { LEAGUES, LEAGUE_LIST, findLeague } from '../config/leagues.js';
import { predictMatch } from './predictionEngine.js';
import { fdFetch, parseKeys } from './fdClient.js';

const TEAM_LOGOS = {
  // Premier League
  'Arsenal': 'https://crests.football-data.org/57.png',
  'Aston Villa': 'https://crests.football-data.org/58.png',
  'AFC Bournemouth': 'https://crests.football-data.org/1044.png',
  'Bournemouth': 'https://crests.football-data.org/1044.png',
  'Brentford': 'https://crests.football-data.org/402.png',
  'Brighton and Hove Albion': 'https://crests.football-data.org/397.png',
  'Chelsea': 'https://crests.football-data.org/61.png',
  'Crystal Palace': 'https://crests.football-data.org/354.png',
  'Everton': 'https://crests.football-data.org/62.png',
  'Fulham': 'https://crests.football-data.org/63.png',
  'Ipswich Town': 'https://crests.football-data.org/349.png',
  'Leicester City': 'https://crests.football-data.org/338.png',
  'Liverpool': 'https://crests.football-data.org/64.png',
  'Manchester City': 'https://crests.football-data.org/65.png',
  'Manchester United': 'https://crests.football-data.org/66.png',
  'Newcastle United': 'https://crests.football-data.org/67.png',
  'Nottingham Forest': 'https://crests.football-data.org/675.png',
  'Southampton': 'https://crests.football-data.org/340.png',
  'Tottenham Hotspur': 'https://crests.football-data.org/73.png',
  'West Ham United': 'https://crests.football-data.org/563.png',
  'Wolverhampton Wanderers': 'https://crests.football-data.org/76.png',
  'Coventry City': 'https://crests.football-data.org/342.png',
  'Hull City': 'https://crests.football-data.org/394.png',
  'Leeds United': 'https://crests.football-data.org/341.png',
  'Sunderland': 'https://crests.football-data.org/356.png',
  'Burnley': 'https://crests.football-data.org/357.png',

  // La Liga
  'Real Madrid CF': 'https://crests.football-data.org/86.png',
  'Real Madrid': 'https://crests.football-data.org/86.png',
  'FC Barcelona': 'https://crests.football-data.org/81.png',
  'Club Atletico de Madrid': 'https://crests.football-data.org/78.png',
  'Atletico Madrid': 'https://crests.football-data.org/78.png',
  'Athletic Club': 'https://crests.football-data.org/77.png',
  'Athletic Bilbao': 'https://crests.football-data.org/77.png',
  'Real Sociedad de Futbol': 'https://crests.football-data.org/92.png',
  'Real Sociedad': 'https://crests.football-data.org/92.png',
  'Real Betis Balompie': 'https://crests.football-data.org/90.png',
  'Real Betis': 'https://crests.football-data.org/90.png',
  'Villarreal CF': 'https://crests.football-data.org/94.png',
  'Villarreal': 'https://crests.football-data.org/94.png',
  'Girona FC': 'https://crests.football-data.org/298.png',
  'Girona': 'https://crests.football-data.org/298.png',
  'Getafe CF': 'https://crests.football-data.org/82.png',
  'Getafe': 'https://crests.football-data.org/82.png',
  'Sevilla FC': 'https://crests.football-data.org/559.png',
  'Sevilla': 'https://crests.football-data.org/559.png',
  'RC Celta de Vigo': 'https://crests.football-data.org/88.png',
  'Celta Vigo': 'https://crests.football-data.org/88.png',
  'RCD Mallorca': 'https://crests.football-data.org/89.png',
  'Mallorca': 'https://crests.football-data.org/89.png',
  'CA Osasuna': 'https://crests.football-data.org/80.png',
  'Osasuna': 'https://crests.football-data.org/80.png',
  'Rayo Vallecano de Madrid': 'https://crests.football-data.org/87.png',
  'Rayo Vallecano': 'https://crests.football-data.org/87.png',
  'UD Las Palmas': 'https://crests.football-data.org/275.png',
  'Las Palmas': 'https://crests.football-data.org/275.png',
  'CD Leganes': 'https://crests.football-data.org/263.png',
  'Leganes': 'https://crests.football-data.org/263.png',
  'Deportivo Alaves': 'https://crests.football-data.org/263.png',
  'Alaves': 'https://crests.football-data.org/263.png',
  'RCD Espanyol de Barcelona': 'https://crests.football-data.org/87.png',
  'Espanyol': 'https://crests.football-data.org/87.png',
  'Real Valladolid CF': 'https://crests.football-data.org/358.png',
  'Real Valladolid': 'https://crests.football-data.org/358.png',
  'Valencia CF': 'https://crests.football-data.org/95.png',
  'Valencia': 'https://crests.football-data.org/95.png',

  // Bundesliga
  'FC Bayern München': 'https://crests.football-data.org/5.png',
  'FC Bayern Munich': 'https://crests.football-data.org/5.png',
  'Bayer 04 Leverkusen': 'https://crests.football-data.org/3.png',
  'Bayer Leverkusen': 'https://crests.football-data.org/3.png',
  'Borussia Dortmund': 'https://crests.football-data.org/4.png',
  'RB Leipzig': 'https://crests.football-data.org/721.png',
  'VfB Stuttgart': 'https://crests.football-data.org/10.png',
  'Eintracht Frankfurt': 'https://crests.football-data.org/69.png',
  'VfL Wolfsburg': 'https://crests.football-data.org/11.png',
  'SC Freiburg': 'https://crests.football-data.org/68.png',
  'Borussia Monchengladbach': 'https://crests.football-data.org/9.png',
  'SV Werder Bremen': 'https://crests.football-data.org/12.png',
  'Werder Bremen': 'https://crests.football-data.org/12.png',
  '1. FC Union Berlin': 'https://crests.football-data.org/723.png',
  '1. FC Heidenheim 1846': 'https://crests.football-data.org/726.png',
  '1. FC Heidenheim': 'https://crests.football-data.org/726.png',
  '1. FSV Mainz 05': 'https://crests.football-data.org/15.png',
  'FC Augsburg': 'https://crests.football-data.org/16.png',
  'TSG 1899 Hoffenheim': 'https://crests.football-data.org/2.png',
  'Hoffenheim': 'https://crests.football-data.org/2.png',
  'SV Darmstadt 98': 'https://crests.football-data.org/764.png',
  'Darmstadt 98': 'https://crests.football-data.org/764.png',
  '1. FC Koln': 'https://crests.football-data.org/1.png',
  'FC Koln': 'https://crests.football-data.org/1.png',
  'Holstein Kiel': 'https://crests.football-data.org/750.png',
  'FC St. Pauli': 'https://crests.football-data.org/28.png',
  'St. Pauli': 'https://crests.football-data.org/28.png',

  // Serie A
  'Inter': 'https://crests.football-data.org/108.png',
  'Inter Milan': 'https://crests.football-data.org/108.png',
  'AC Milan': 'https://crests.football-data.org/98.png',
  'Juventus FC': 'https://crests.football-data.org/109.png',
  'Juventus': 'https://crests.football-data.org/109.png',
  'SSC Napoli': 'https://crests.football-data.org/113.png',
  'Napoli': 'https://crests.football-data.org/113.png',
  'AS Roma': 'https://crests.football-data.org/112.png',
  'SS Lazio': 'https://crests.football-data.org/110.png',
  'Lazio': 'https://crests.football-data.org/110.png',
  'Atalanta BC': 'https://crests.football-data.org/115.png',
  'Atalanta': 'https://crests.football-data.org/115.png',
  'ACF Fiorentina': 'https://crests.football-data.org/114.png',
  'Fiorentina': 'https://crests.football-data.org/114.png',
  'Bologna FC 1909': 'https://crests.football-data.org/103.png',
  'Bologna': 'https://crests.football-data.org/103.png',
  'Torino FC': 'https://crests.football-data.org/117.png',
  'Torino': 'https://crests.football-data.org/117.png',
  'AC Monza': 'https://crests.football-data.org/1074.png',
  'Monza': 'https://crests.football-data.org/1074.png',
  'Genoa CFC': 'https://crests.football-data.org/106.png',
  'Genoa': 'https://crests.football-data.org/106.png',
  'US Lecce': 'https://crests.football-data.org/111.png',
  'Lecce': 'https://crests.football-data.org/111.png',
  'Cagliari Calcio': 'https://crests.football-data.org/104.png',
  'Cagliari': 'https://crests.football-data.org/104.png',
  'Udinese Calcio': 'https://crests.football-data.org/119.png',
  'Udinese': 'https://crests.football-data.org/119.png',
  'US Sassuolo': 'https://crests.football-data.org/116.png',
  'Sassuolo': 'https://crests.football-data.org/116.png',
  'Empoli FC': 'https://crests.football-data.org/105.png',
  'Empoli': 'https://crests.football-data.org/105.png',
  'Hellas Verona': 'https://crests.football-data.org/118.png',
  'Verona': 'https://crests.football-data.org/118.png',
  'Frosinone Calcio': 'https://crests.football-data.org/1067.png',
  'Frosinone': 'https://crests.football-data.org/1067.png',
  'US Salernitana 1919': 'https://crests.football-data.org/1069.png',
  'Salernitana': 'https://crests.football-data.org/1069.png',
  'Parma Calcio 1913': 'https://crests.football-data.org/110.png',
  'Parma': 'https://crests.football-data.org/110.png',
  'Venezia FC': 'https://crests.football-data.org/1090.png',
  'Venezia': 'https://crests.football-data.org/1090.png',
  'Como 1907': 'https://crests.football-data.org/1075.png',
  'Como': 'https://crests.football-data.org/1075.png',

  // Ligue 1
  'Paris Saint-Germain FC': 'https://crests.football-data.org/524.png',
  'Paris Saint-Germain': 'https://crests.football-data.org/524.png',
  'PSG': 'https://crests.football-data.org/524.png',
  'Olympique de Marseille': 'https://crests.football-data.org/516.png',
  'Marseille': 'https://crests.football-data.org/516.png',
  'AS Monaco': 'https://crests.football-data.org/525.png',
  'Monaco': 'https://crests.football-data.org/525.png',
  'Olympique Lyonnais': 'https://crests.football-data.org/523.png',
  'Lyon': 'https://crests.football-data.org/523.png',
  'LOSC Lille': 'https://crests.football-data.org/521.png',
  'Lille': 'https://crests.football-data.org/521.png',
  'OGC Nice': 'https://crests.football-data.org/522.png',
  'Nice': 'https://crests.football-data.org/522.png',
  'Stade Rennais': 'https://crests.football-data.org/528.png',
  'Rennes': 'https://crests.football-data.org/528.png',
  'RC Lens': 'https://crests.football-data.org/519.png',
  'Lens': 'https://crests.football-data.org/519.png',
  'Stade Brestois': 'https://crests.football-data.org/518.png',
  'Brest': 'https://crests.football-data.org/518.png',
  'RC Strasbourg': 'https://crests.football-data.org/530.png',
  'Strasbourg': 'https://crests.football-data.org/530.png',
  'FC Nantes': 'https://crests.football-data.org/526.png',
  'Nantes': 'https://crests.football-data.org/526.png',
  'Montpellier HSC': 'https://crests.football-data.org/517.png',
  'Montpellier': 'https://crests.football-data.org/517.png',
  'Toulouse FC': 'https://crests.football-data.org/511.png',
  'Toulouse': 'https://crests.football-data.org/511.png',
  'Stade de Reims': 'https://crests.football-data.org/527.png',
  'Reims': 'https://crests.football-data.org/527.png',
  'Le Havre': 'https://crests.football-data.org/520.png',
  'Le Havre AC': 'https://crests.football-data.org/520.png',

  // Eredivisie
  'PSV Eindhoven': 'https://crests.football-data.org/188.png',
  'Ajax Amsterdam': 'https://crests.football-data.org/182.png',
  'Ajax': 'https://crests.football-data.org/182.png',
  'Feyenoord': 'https://crests.football-data.org/189.png',
  'AZ Alkmaar': 'https://crests.football-data.org/183.png',
  'FC Twente': 'https://crests.football-data.org/191.png',
  'FC Utrecht': 'https://crests.football-data.org/190.png',
  'Vitesse Arnhem': 'https://crests.football-data.org/192.png',
  'Vitesse': 'https://crests.football-data.org/192.png',
  'SC Heerenveen': 'https://crests.football-data.org/193.png',
  'FC Groningen': 'https://crests.football-data.org/194.png',
  'Go Ahead Eagles': 'https://crests.football-data.org/195.png',
  'NAC Breda': 'https://crests.football-data.org/196.png',
  'NEC Nijmegen': 'https://crests.football-data.org/197.png',
  'NEC': 'https://crests.football-data.org/197.png',
  'Fortuna Sittard': 'https://crests.football-data.org/198.png',
  'PEC Zwolle': 'https://crests.football-data.org/199.png',
  'SBV Excelsior': 'https://crests.football-data.org/200.png',
  'Excelsior': 'https://crests.football-data.org/200.png',
  'FC Volendam': 'https://crests.football-data.org/201.png',
  'RKC Waalwijk': 'https://crests.football-data.org/202.png',
  'Heracles Almelo': 'https://crests.football-data.org/203.png',
  'Almere City': 'https://crests.football-data.org/204.png',

  // Primeira Liga
  'Sporting CP': 'https://crests.football-data.org/498.png',
  'SL Benfica': 'https://crests.football-data.org/1903.png',
  'Benfica': 'https://crests.football-data.org/1903.png',
  'FC Porto': 'https://crests.football-data.org/503.png',
  'Porto': 'https://crests.football-data.org/503.png',
  'SC Braga': 'https://crests.football-data.org/5613.png',
  'Braga': 'https://crests.football-data.org/5613.png',

  // Scottish Premiership
  'Celtic FC': 'https://crests.football-data.org/76.png',
  'Celtic': 'https://crests.football-data.org/76.png',
  'Rangers FC': 'https://crests.football-data.org/76.png',
  'Rangers': 'https://crests.football-data.org/76.png',
};

function getTeamLogo(teamName) {
  if (!teamName) return null;
  const trimmed = teamName.trim();
  if (TEAM_LOGOS[trimmed]) return TEAM_LOGOS[trimmed];
  const lower = trimmed.toLowerCase();
  for (const [key, url] of Object.entries(TEAM_LOGOS)) {
    if (key.toLowerCase() === lower) return url;
  }
  return null;
}

/**
 * Find the matching ESPN event for a fixture (for live data updates)
 */
function findMatchingEvent(fixture, events) {
  if (!events || !Array.isArray(events)) return null;

  const homeLower = fixture.homeTeam?.toLowerCase() || '';
  const awayLower = fixture.awayTeam?.toLowerCase() || '';

  return events.find(ev => {
    const comps = ev.competitions?.[0]?.competitors || [];
    const teams = comps.map(c => (c.team?.displayName || c.team?.name || '').toLowerCase());
    const homeMatch = teams.some(t => t.includes(homeLower) || homeLower.includes(t));
    const awayMatch = teams.some(t => t.includes(awayLower) || awayLower.includes(t));
    return homeMatch && awayMatch;
  }) || events.find(ev => {
    const comps = ev.competitions?.[0]?.competitors || [];
    const teams = comps.map(c => (c.team?.displayName || c.team?.name || '').toLowerCase());
    const homeMatch = teams.some(t => t.includes(homeLower.split(' ').pop()) || homeLower.split(' ').some(p => p.length > 3 && t.includes(p)));
    const awayMatch = teams.some(t => t.includes(awayLower.split(' ').pop()) || awayLower.split(' ').some(p => p.length > 3 && t.includes(p)));
    return homeMatch && awayMatch;
  }) || null;
}

const WANTED_STATS = ['Possession', 'Total Shots', 'Shots on Target', 'Shots on Goal', 'Corners', 'Fouls', 'Yellow Cards', 'Red Cards', 'Offsides', 'Passes', 'Pass Accuracy', 'Saves', 'Tackles', 'Interceptions'];

const STAT_NAME_MAP = {
  possessionPct: 'Possession',
  totalShots: 'Total Shots',
  shotsOnTarget: 'Shots on Target',
  shotPct: 'Shot Accuracy',
  wonCorners: 'Corners',
  foulsCommitted: 'Fouls',
  yellowCards: 'Yellow Cards',
  redCards: 'Red Cards',
  offsides: 'Offsides',
  totalPasses: 'Passes',
  passPct: 'Pass Accuracy',
  saves: 'Saves',
  totalTackles: 'Tackles',
  interceptions: 'Interceptions',
};

function extractMatchStats(comp, homeComp, awayComp) {
  const rows = [];
  const hs = Array.isArray(homeComp?.statistics) ? homeComp.statistics : [];
  const as = Array.isArray(awayComp?.statistics) ? awayComp.statistics : [];

  for (let i = 0; i < hs.length; i++) {
    const entry = hs[i];
    if (!entry || typeof entry !== 'object') continue;
    const rawName = entry.name || entry.label || '';
    const displayName = STAT_NAME_MAP[rawName] || rawName;
    if (!WANTED_STATS.some(w => displayName.toLowerCase().includes(w.toLowerCase()))) continue;
    const home = String(entry.displayValue ?? entry.homeDisplayValue ?? entry.home ?? '');
    const awayEntry = as.find(a => (a.name || a.label) === rawName) || as[i];
    const away = String(awayEntry?.displayValue ?? awayEntry?.awayDisplayValue ?? awayEntry?.away ?? '');
    if (home === '' && away === '') continue;
    rows.push({ name: displayName, home, away });
  }

  return rows.length > 0 ? rows : null;
}

export function formatDate(date) {
  return date.toISOString().split('T')[0];
}

let proxyDisabled = false;

/**
 * Primary source: ESPN Scoreboard API (free, no key)
 * Browser: same-origin Vercel proxy (avoids CORS)
 * CLI / Node: direct ESPN call (no CORS)
 */
async function fetchEspnFixtures(targetDate, targetLeagues, options = {}) {
  const dateYMD = targetDate ? targetDate.replace(/-/g, '') : null;
  const fixtures = [];
  const inBrowser = typeof window !== 'undefined';
  let okLeagues = 0;

  await Promise.allSettled(
    targetLeagues.map(async (league) => {
      let data = null;

      if (inBrowser && !proxyDisabled) {
        try {
          const proxyUrl = `/api/espn-proxy?league=${encodeURIComponent(league.espnCode)}${dateYMD ? `&date=${dateYMD}` : ''}`;
          const res = await fetch(proxyUrl);
          if (res.ok) {
            data = await res.json();
          } else {
            proxyDisabled = true;
          }
        } catch (err) {
          proxyDisabled = true;
        }
      }

      if (!data) {
        try {
          const url = dateYMD
            ? `https://site.api.espn.com/apis/site/v2/sports/soccer/${league.espnCode}/scoreboard?dates=${dateYMD}`
            : `https://site.api.espn.com/apis/site/v2/sports/soccer/${league.espnCode}/scoreboard`;

          const res = await fetch(url);
          if (!res.ok) return;
          data = await res.json();
        } catch (err) {
          return;
        }
      }

      okLeagues++;
      const events = data.events || [];
      let leagueMatchIndex = 1;

      for (const ev of events) {
          const comp = ev.competitions?.[0];
          if (!comp) continue;

          const homeComp = comp.competitors?.find(c => c.homeAway === 'home');
          const awayComp = comp.competitors?.find(c => c.homeAway === 'away');

          const homeName = homeComp?.team?.displayName || homeComp?.team?.name;
          const awayName = awayComp?.team?.displayName || awayComp?.team?.name;

          if (!homeName || !awayName) continue;

          const state = ev.status?.type?.state || 'pre';
          const liveInfo = {
            state,
            clock: state !== 'pre' ? (ev.status?.displayClock || ev.status?.type?.shortDetail || '') : undefined,
            period: ev.status?.period,
            homeScore: state !== 'pre' ? String(homeComp?.score ?? '') : undefined,
            awayScore: state !== 'pre' ? String(awayComp?.score ?? '') : undefined
          };

          const stats = extractMatchStats(comp, homeComp, awayComp);

          const homeLogo = homeComp?.team?.logo || homeComp?.team?.logos?.[0]?.href || getTeamLogo(homeName);
          const awayLogo = awayComp?.team?.logo || awayComp?.team?.logos?.[0]?.href || getTeamLogo(awayName);

          const timeStr = ev.date
            ? new Date(ev.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : 'TBD';

          const matchDateStr = ev.date
            ? formatDate(new Date(ev.date))
            : (targetDate || formatDate(new Date()));

          const stadium = comp.venue?.fullName || ev.venue?.displayName || `${homeName} Stadium`;
          const matchType = comp.type?.text || ev.season?.displayName || 'Official Match';

          const pred = predictMatch(homeName, awayName, league.code, null, options?.formMap || null);

          fixtures.push({
            id: `${league.code}-${String(leagueMatchIndex++).padStart(2, '0')}`,
            espnEventId: ev.id ? String(ev.id) : undefined,
            espnLeagueCode: league.espnCode,
            leagueCode: league.code,
            leagueName: league.name,
            leagueCountry: league.country,
            flag: league.flag,
            leagueLogo: league.logo,
            date: matchDateStr,
            time: timeStr,
            homeTeam: homeName,
            awayTeam: awayName,
            homeTeamLogo: homeLogo,
            awayTeamLogo: awayLogo,
            stadium,
            matchType,
            live: liveInfo,
            stats,
            prediction: pred
          });
        }
    })
  );

  return { fixtures, okLeagues, totalLeagues: targetLeagues.length };
}

/**
 * Secondary fallback: Football-Data.org API.
 * Browser: same-origin Vercel proxy (key stays server-side).
 * CLI / Node: direct call with FOOTBALL_DATA_API_KEY from the environment.
 */
async function fetchFootballDataOrgFixtures(dateStr) {
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch(`/api/fd-proxy?date=${encodeURIComponent(dateStr)}`);
      if (!res.ok) return null;
      const data = await res.json();
      return data.matches || [];
    } catch (err) {
      return null;
    }
  }

  return null;
}

/**
 * Main fixtures getter: Queries ESPN as primary, football-data.org as fallback
 */
export async function getDailyFixtures(dateStr = null, leagueFilter = null, options = {}) {
  if (dateStr && !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    throw new Error('Invalid date format. Use YYYY-MM-DD.');
  }

  const targetLeagues = leagueFilter
    ? [findLeague(leagueFilter)].filter(Boolean)
    : LEAGUE_LIST;

  if (targetLeagues.length === 0) {
    throw new Error(`Unknown league filter: "${leagueFilter}". Run "footy leagues" for available codes.`);
  }

  const { fixtures: espnFixtures, okLeagues, totalLeagues } = await fetchEspnFixtures(dateStr, targetLeagues, options);

  if (espnFixtures && espnFixtures.length > 0) {
    return {
      date: dateStr || formatDate(new Date()),
      provider: 'ESPN API (Live)',
      isLiveApi: true,
      totalFixtures: espnFixtures.length,
      fixtures: espnFixtures,
      message: ''
    };
  }

  if (dateStr) {
    const fbMatches = await fetchFootballDataOrgFixtures(dateStr);
    if (fbMatches && fbMatches.length > 0) {
      const results = [];
      const leagueIndices = {};

      for (const lm of fbMatches) {
        let leagueCode = lm.competition?.code;
        const FB_COMPETITION_MAP = {
          BL1: 'BL',
          CL: 'UCL',
          EL: 'UEL',
          ECL: 'UECL',
          EC: 'UECL',
          FAC: 'FAC',
          CDR: 'CDR',
          DFB: 'DFB',
          CDF: 'CDF'
        };
        leagueCode = FB_COMPETITION_MAP[leagueCode] || leagueCode;

        const league = LEAGUES[leagueCode];
        if (!league) continue;
        if (leagueFilter && league.code !== leagueFilter.toUpperCase()) continue;

        const homeName = lm.homeTeam?.name;
        const awayName = lm.awayTeam?.name;
        const timeStr = lm.utcDate
          ? new Date(lm.utcDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : 'TBD';

        if (!leagueIndices[league.code]) leagueIndices[league.code] = 1;
        const pred = predictMatch(homeName, awayName, league.code, null, options?.formMap || null);

        results.push({
          id: `${league.code}-${String(leagueIndices[league.code]++).padStart(2, '0')}`,
          leagueCode: league.code,
          leagueName: league.name,
          leagueCountry: league.country,
          flag: league.flag,
          leagueLogo: league.logo,
          date: dateStr,
          time: timeStr,
          homeTeam: homeName,
          awayTeam: awayName,
          homeTeamLogo: lm.homeTeam?.crest || getTeamLogo(homeName),
          awayTeamLogo: lm.awayTeam?.crest || getTeamLogo(awayName),
          stadium: lm.venue || `${homeName} Stadium`,
          matchType: lm.stage ? lm.stage.replace(/_/g, ' ') : 'Official Match',
          prediction: pred
        });
      }

      if (results.length > 0) {
        return {
          date: dateStr,
          provider: 'Football-Data.org (Live)',
          isLiveApi: true,
          totalFixtures: results.length,
          fixtures: results,
          message: ''
        };
      }
    }
  }

  return {
    date: dateStr || formatDate(new Date()),
    provider: 'ESPN API',
    isLiveApi: true,
    totalFixtures: 0,
    fixtures: [],
    message: okLeagues === 0 && totalLeagues > 0
      ? 'All proxy requests failed. Check API status or try refreshing.'
      : `No matches scheduled for ${dateStr || 'today'}.`
  };
}

export async function getFixtureById(id, dateStr = null) {
  const fixtures = await getDailyFixtures(dateStr);
  const fixture = fixtures.find(f => f.id === id);
  if (!fixture) throw new Error('Fixture ' + id + ' not found');
  return fixture;
}
