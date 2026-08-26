import { fdFetch } from '../src/services/fdClient.js';
import { checkRateLimit } from './_rateLimit.js';

export default async function handler(req, res) {
  const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: 'Rate limit exceeded. Try again later.' });
  }

  const { date } = req.query;

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(String(date))) {
    return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD.' });
  }

  try {
    const response = await fdFetch(
      `matches?dateFrom=${date}&dateTo=${date}`,
      process.env.FOOTBALL_DATA_API_KEY,
      { signal: AbortSignal.timeout(9000) }
    );

    const data = await response.json();
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    return res.status(200).json({ matches: data.matches || [] });
  } catch (err) {
    return res.status(err?.statusCode || 502).json({ error: 'Upstream unavailable' });
  }
}
