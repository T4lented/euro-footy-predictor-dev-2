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
    const url = new URL('https://api.odds-api.io/v3/events');
    url.searchParams.set('apiKey', process.env.ODDS_API_KEY);
    url.searchParams.set('sport', 'football');
    url.searchParams.set('from', `${date}T00:00:00Z`);
    url.searchParams.set('to', `${date}T23:59:59Z`);
    const upstream = await fetch(url, { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(9000) });
    if (!upstream.ok) throw new Error(`Provider status ${upstream.status}`);
    const payload = await upstream.json();
    const events = Array.isArray(payload) ? payload : Array.isArray(payload?.events) ? payload.events : [];
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=900');
    return res.status(200).json({ mode: 'provider', events, fetchedAt: new Date().toISOString() });
  } catch {
    return res.status(502).json({ error: 'Live odds are temporarily unavailable. Enter decimal odds manually.' });
  }
}
