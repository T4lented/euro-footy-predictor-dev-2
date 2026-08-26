import { fdFetch, AllKeysFailedError } from '../src/services/fdClient.js';
import { checkRateLimit } from './_rateLimit.js';

const DAY_MS = 86400000;

export default async function handler(req, res) {
  const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: 'Rate limit exceeded. Try again later.' });
  }

  const { date, days = '35' } = req.query;

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(String(date))) {
    return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD.' });
  }

  const endDate = new Date(String(date) + 'T00:00:00Z');
  if (Number.isNaN(endDate.getTime())) {
    return res.status(400).json({ error: 'Invalid date' });
  }

  const spanDays = Math.min(60, Math.max(7, parseInt(String(days), 10) || 35));
  const chunks = [];
  let cursor = new Date(endDate.getTime() - spanDays * DAY_MS);

  while (cursor < endDate) {
    const from = cursor.toISOString().slice(0, 10);
    const chunkEnd = new Date(Math.min(cursor.getTime() + 9 * DAY_MS, endDate.getTime() - DAY_MS));
    const to = chunkEnd.toISOString().slice(0, 10);
    chunks.push({ from, to });
    cursor = new Date(chunkEnd.getTime() + DAY_MS);
  }

  const formMap = {};

  try {
    for (const chunk of chunks) {
      const response = await fdFetch(
        `matches?dateFrom=${chunk.from}&dateTo=${chunk.to}`,
        process.env.FOOTBALL_DATA_API_KEY,
        { signal: AbortSignal.timeout(9000) }
      );

      const payload = await response.json();
      const matches = (payload.matches || [])
        .filter((m) => m.status === 'FINISHED' && m.score?.fullTime?.home != null && m.score?.fullTime?.away != null)
        .sort((a, b) => String(a.utcDate).localeCompare(String(b.utcDate)));

      for (const m of matches) {
        const gh = m.score.fullTime.home;
        const ga = m.score.fullTime.away;
        const sides = [
          { team: m.homeTeam, side: 'home' },
          { team: m.awayTeam, side: 'away' }
        ];
        for (const { team, side } of sides) {
          const name = team?.name || team?.shortName;
          if (!name) continue;
          const entry = (formMap[name] = formMap[name] || { results: [], gd: 0 });
          if (gh > ga) {
            entry.results.push(side === 'home' ? 'W' : 'L');
            entry.gd += side === 'home' ? gh - ga : ga - gh;
          } else if (ga > gh) {
            entry.results.push(side === 'away' ? 'W' : 'L');
            entry.gd += side === 'away' ? ga - gh : gh - ga;
          } else {
            entry.results.push('D');
          }
        }
      }
    }

    const cleaned = {};
    for (const [name, entry] of Object.entries(formMap)) {
      if (entry.results.length === 0) continue;
      const recentForm = entry.results.slice(-5);
      cleaned[name] = {
        recentForm,
        formPoints: recentForm.reduce((acc, r) => acc + (r === 'W' ? 3 : r === 'D' ? 1 : 0), 0),
        goalDiff: entry.gd
      };
    }

    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200');
    return res.status(200).json({
      windowDays: spanDays,
      computedAt: new Date().toISOString(),
      form: cleaned
    });
  } catch (err) {
    return res
      .status(err instanceof AllKeysFailedError ? err.statusCode : 502)
      .json({ error: 'Upstream unavailable' });
  }
}
