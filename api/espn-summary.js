import { checkRateLimit } from './_rateLimit.js';

export default async function handler(req, res) {
  const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: 'Rate limit exceeded. Try again later.' });
  }

  const { league, eventId } = req.query;

  if (!league || !/^[a-z0-9._-]+$/i.test(String(league))) {
    return res.status(400).json({ error: 'Invalid league code' });
  }

  if (!eventId || !/^\d+$/.test(String(eventId))) {
    return res.status(400).json({ error: 'Invalid event ID' });
  }

  const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/summary?event=${eventId}`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.espn.com/',
        'Origin': 'https://www.espn.com'
      },
      signal: AbortSignal.timeout(8000)
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'ESPN API error' });
    }

    const data = await response.json();

    const stats = extractMatchStats(data);
    const events = extractKeyEvents(data);
    const lineups = extractLineups(data);

    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');
    return res.status(200).json({ stats, events, lineups });
  } catch {
    return res.status(502).json({ error: 'Upstream unavailable' });
  }
}

function extractMatchStats(data) {
  const teams = data.boxscore?.teams;
  if (!teams || teams.length < 2) return null;

  const statKeys = [
    'possessionPct', 'totalShots', 'shotsOnTarget', 'shotPct',
    'wonCorners', 'foulsCommitted', 'yellowCards', 'redCards',
    'totalPasses', 'passPct', 'offsides', 'saves',
    'accuratePasses', 'totalTackles', 'effectiveTackles', 'tacklePct',
    'interceptions', 'blockedShots'
  ];

  const result = {};
  for (let i = 0; i < 2; i++) {
    const teamData = teams[i];
    const side = teamData.homeAway === 'home' ? 'home' : 'away';
    result[side] = {
      team: teamData.team?.displayName || teamData.team?.shortDisplayName || 'Unknown',
      logo: teamData.team?.logo,
      stats: {}
    };
    for (const stat of (teamData.statistics || [])) {
      if (statKeys.includes(stat.name)) {
        result[side].stats[stat.name] = stat.displayValue;
      }
    }
  }

  return result;
}

function extractKeyEvents(data) {
  return (data.keyEvents || []).map(e => ({
    type: e.type?.type || e.type?.text || 'unknown',
    text: e.text || '',
    clock: e.clock?.displayValue || '',
    period: e.period?.number || 0,
    team: e.team?.displayName || '',
    scorer: e.participants?.[0]?.athlete?.displayName || '',
    assist: e.participants?.[1]?.athlete?.displayName || '',
  }));
}

function extractLineups(data) {
  return (data.rosters || []).map(r => ({
    team: r.team?.displayName || 'Unknown',
    formation: r.formation || '',
    homeAway: r.homeAway || '',
    players: (r.roster || []).map(p => ({
      name: p.athlete?.displayName || '',
      number: p.jersey || '',
      position: p.position?.abbreviation || '',
      starter: p.starter || false,
      subbedIn: p.subbedIn || false,
      subbedOut: p.subbedOut || false,
    }))
  }));
}
