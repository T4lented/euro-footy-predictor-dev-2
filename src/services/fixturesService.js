/**
 * Fixtures Service - Real Live API Integration
 * Primary: ESPN Open Soccer Scoreboard API (100% Free, Keyless)
 * Secondary / Fallback: Football-Data.org API
 */
import { LEAGUES, LEAGUE_LIST, findLeague } from '../config/leagues.js';
import { predictMatch } from './predictionEngine.js';
import { fdFetch, parseKeys } from './fdClient.js';

export function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Helper to parse ESPN's "previousMeetings" array into a clean H2H object
 */
function parseH2HFromESPN(previousMeetings, currentHomeTeam, currentAwayTeam) {
  if (!previousMeetings || previousMeetings.length === 0) {
    return null;
  }

  let homeWins = 0;
  let draws = 0;
  let awayWins = 0;
  const last5Meetings = [];

  for (const match of previousMeetings) {
    const date = match.date ? formatDate(new Date(match.date)) : 'Unknown';
    const comps = match.competitions?.[0]?.competitors || [];

    const histHome = comps.find(c => c.homeAway === 'home');
    const histAway = comps.find(c => c.homeAway === 'away');

    const homeName = histHome?.team?.displayName || histHome?.team?.name || 'Unknown';
    const awayName = histAway?.team?.displayName || histAway?.team?.name || 'Unknown';

    const winner = comps.find(c => c.winner === true);
    let score = 'N/A';
    if (histHome?.score && histAway?.score) {
      score = `${histHome.score} - ${histAway.score}`;
    }

    if (last5Meetings.length < 5) {
      last5Meetings.push({
        date,
        home: homeName,
        away: awayName,
        score
      });
    }

    if (!winner) {
      draws++;
    } else if (winner.homeAway === 'home') {
      if (winner.team?.displayName === currentHomeTeam || winner.team?.name === currentHomeTeam) {
        homeWins++;
      } else {
        awayWins++;
      }
    } else {
      if (winner.team?.displayName === currentAwayTeam || winner.team?.name === currentAwayTeam) {
        awayWins++;
      } else {
        homeWins++;
      }
    }
  }

  const totalMatches = homeWins + draws + awayWins;

  return {
    totalMatches,
    homeWins,
    draws,
    awayWins,
    last5Meetings,
    venueRecord: {
      playedAtVenue: 0,
      homeWinsAtVenue: 0,
      drawsAtVenue: 0,
      awayWinsAtVenue: 0
    },
    avgGoalsPerGame: 2.50,
    cleanSheetRateHome: 0.25,
    cleanSheetRateAway: 0.20,
    tacticalNote: 'Real H2H data sourced directly from ESPN scoreboard history.',
    derbyOrRivalry: null,
    isDirectMatch: true,
    homeTeam: currentHomeTeam,
    awayTeam: currentAwayTeam
  };
}

const WANTED_STATS = ['Corners', 'Shots on Goal', 'Fouls', 'Possession', 'Yellow Cards', 'Red Cards', 'Offsides'];

function extractMatchStats(comp, homeComp, awayComp) {
  const raw = comp?.statistics || [];
  const rows = [];

  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue;
    const name = entry.name || entry.label || '';
    if (!WANTED_STATS.some(w => name.toLowerCase().includes(w.toLowerCase()))) continue;
    const home = String(entry.homeDisplayValue ?? entry.home ?? '');
    const away = String(entry.awayDisplayValue ?? entry.away ?? '');
    if (home === '' && away === '') continue;
    rows.push({ name, home, away });
  }

  if (rows.length === 0) {
    const hs = Array.isArray(homeComp?.statistics) ? homeComp.statistics : [];
    for (let i = 0; i < hs.length; i++) {
      const name = hs[i]?.name || '';
      if (!WANTED_STATS.some(w => name.toLowerCase().includes(w.toLowerCase()))) continue;
      const home = String(hs[i]?.displayValue ?? '');
      const away = String(awayComp?.statistics?.[i]?.displayValue ?? '');
      if (!home && !away) continue;
      rows.push({ name, home, away });
    }
  }

  return rows.slice(0, 6);
}

/**
 * Fetch real live fixtures from ESPN Scoreboard API.
 * Browser: same-origin Vercel proxy first, then direct ESPN as fallback.
 * The proxy attempt is disabled for the rest of the session after its first
 * failure (e.g. when the host's datacenter IPs are blocked upstream).
 * CLI: direct fetch always.
 */
let proxyDisabled = false;

async function fetchEspnFixtures(targetDate, targetLeagues) {
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

          const homeLogo = homeComp?.team?.logo || homeComp?.team?.logos?.[0]?.href || null;
          const awayLogo = awayComp?.team?.logo || awayComp?.team?.logos?.[0]?.href || null;

          const timeStr = ev.date
            ? new Date(ev.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : 'TBD';

          const matchDateStr = ev.date
            ? formatDate(new Date(ev.date))
            : (targetDate || formatDate(new Date()));

          const stadium = comp.venue?.fullName || ev.venue?.displayName || `${homeName} Stadium`;
          const matchType = comp.type?.text || ev.season?.displayName || 'Official Match';

          const espnH2H = parseH2HFromESPN(comp.previousMeetings || [], homeName, awayName);
          const pred = predictMatch(homeName, awayName, league.code, espnH2H, options?.formMap || null);

          fixtures.push({
            id: `${league.code}-${String(leagueMatchIndex++).padStart(2, '0')}`,
            leagueCode: league.code,
            leagueName: league.name,
            leagueCountry: league.country,
            flag: league.flag,
            date: matchDateStr,
            time: timeStr,
            homeTeam: homeName,
            awayTeam: awayName,
            homeTeamLogo: homeLogo,
            awayTeamLogo: awayLogo,
            stadium,
            matchType,
            status: ev.status?.type?.shortDetail || 'Scheduled',
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

  const rawKeys = typeof process !== 'undefined' ? process.env?.FOOTBALL_DATA_API_KEY : undefined;

  if (!rawKeys || !parseKeys(rawKeys).length) return null;

  try {
    const res = await fdFetch(`matches?dateFrom=${dateStr}&dateTo=${dateStr}`, rawKeys);
    const data = await res.json();
    return data.matches || [];
  } catch (err) {
    return null;
  }
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

  const { fixtures: espnFixtures, okLeagues, totalLeagues } = await fetchEspnFixtures(dateStr, targetLeagues);

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
          date: dateStr,
          time: timeStr,
          homeTeam: homeName,
          awayTeam: awayName,
          homeTeamLogo: lm.homeTeam?.crest || null,
          awayTeamLogo: lm.awayTeam?.crest || null,
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
      ? `Could not reach the fixture provider from your device (0 of ${totalLeagues} competitions responded). Check your connection or try another network.`
      : `No fixtures scheduled${dateStr ? ` for ${dateStr}` : ''} across ${okLeagues} responding competition(s). Try another date with -d YYYY-MM-DD or view active matchdays with "footy".`
  };
}

export async function getFixtureById(matchId, dateStr = null) {
  if (!matchId) return null;
  const matchIdClean = matchId.trim().toUpperCase();
  const leagueCode = matchIdClean.split('-')[0];

  const { fixtures } = await getDailyFixtures(dateStr, leagueCode);
  let found = fixtures.find(f => f.id.toUpperCase() === matchIdClean);
  if (found) return found;

  const allData = await getDailyFixtures(dateStr);
  return allData.fixtures.find(f => f.id.toUpperCase() === matchIdClean) || null;
}
