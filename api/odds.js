const requests = new Map();
const REQUEST_WINDOW_MS = 60_000;
const REQUEST_LIMIT = 12;

function sameOrigin(req) {
  const origin = req.headers.origin;
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  if (!origin || !host) return true;
  try { return new URL(origin).host === host; } catch { return false; }
}

function permit(ip) {
  const now = Date.now();
  const entry = requests.get(ip);
  if (!entry || entry.resetAt < now) { requests.set(ip, { count: 1, resetAt: now + REQUEST_WINDOW_MS }); return true; }
  if (entry.count >= REQUEST_LIMIT) return false;
  entry.count += 1;
  return true;
}

const SPORT_MAP = {
  'soccer_epl': 'soccer_epl',
  'soccer_spain_la_liga': 'soccer_spain_la_liga',
  'soccer_germany_bundesliga': 'soccer_germany_bundesliga',
  'soccer_italy_serie_a': 'soccer_italy_serie_a',
  'soccer_france_ligue_one': 'soccer_france_ligue_one',
  'soccer_netherlands_eredivisie': 'soccer_netherlands_eredivisie',
  'soccer_uefa_champs_league': 'soccer_uefa_champs_league',
  'soccer_uefa_europa_league': 'soccer_uefa_europa_league',
  'soccer_uefa_europa_conference_league': 'soccer_uefa_europa_conference_league',
  'soccer_england_efl_cup': 'soccer_england_efl_cup',
  'soccer_spain_copa_del_rey': 'soccer_spain_copa_del_rey',
  'soccer_italy_coppa_italia': 'soccer_italy_coppa_italia',
  'soccer_germany_dfb_pokal': 'soccer_germany_dfb_pokal',
  'soccer_france_copa': 'soccer_france_copa',
  'soccer_england_fa_cup': 'soccer_england_fa_cup',
};

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!sameOrigin(req)) return res.status(403).json({ error: 'Cross-origin request rejected' });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(req.query.date || ''))) return res.status(400).json({ error: 'Invalid date format' });
  if (!permit(req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 'unknown')) return res.status(429).json({ error: 'Refresh limit reached; try again shortly.' });

  if (!process.env.ODDS_API_KEY) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ mode: 'manual-only', events: [], message: 'Manual decimal odds are available. A server-side odds provider key has not been configured.' });
  }

  try {
    const date = String(req.query.date);
    const sport = String(req.query.sport || 'soccer_epl');
    const regions = String(req.query.regions || 'eu,uk');
    const markets = String(req.query.markets || 'h2h');

    const sportKey = SPORT_MAP[sport] || sport;
    const url = new URL(`https://api.the-odds-api.com/v4/sports/${sportKey}/odds`);
    url.searchParams.set('apiKey', process.env.ODDS_API_KEY);
    url.searchParams.set('regions', regions);
    url.searchParams.set('markets', markets);
    url.searchParams.set('oddsFormat', 'decimal');
    url.searchParams.set('dateFormat', 'iso');

    const upstream = await fetch(url, { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(9000) });
    if (!upstream.ok) throw new Error(`Provider status ${upstream.status}`);

    const payload = await upstream.json();
    const events = Array.isArray(payload) ? payload : [];

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=900');
    return res.status(200).json({ mode: 'provider', events, sport: sportKey, fetchedAt: new Date().toISOString() });
  } catch {
    return res.status(502).json({ error: 'Live odds are temporarily unavailable. Enter decimal odds manually.' });
  }
}