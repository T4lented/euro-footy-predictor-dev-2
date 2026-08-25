import { LEAGUE_LIST } from '../src/config/leagues.js';

const VALID_LEAGUES = new Set(LEAGUE_LIST.map(l => l.espnCode).filter(Boolean));

export default async function handler(req, res) {
  const { league, date } = req.query;

  if (!league || !VALID_LEAGUES.has(String(league))) {
    return res.status(400).json({ error: 'Invalid or missing league code' });
  }

  if (date && !/^\d{8}$/.test(String(date))) {
    return res.status(400).json({ error: 'Invalid date format. Use YYYYMMDD.' });
  }

  const url = date
    ? `https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/scoreboard?dates=${date}`
    : `https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/scoreboard`;

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
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    return res.status(200).json(data);
  } catch {
    return res.status(502).json({ error: 'Upstream unavailable' });
  }
}
