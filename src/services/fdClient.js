export function parseKeys(rawValue) {
  return String(rawValue || '')
    .split(',')
    .map((k) => k.trim())
    .filter((k) => k.length > 0 && !k.startsWith('your_'));
}

const RETRYABLE_STATUSES = new Set([403, 429, 500, 502, 503]);

export class AllKeysFailedError extends Error {
  constructor(statusCode, message) {
    super(message || 'All Football-Data.org keys failed');
    this.name = 'AllKeysFailedError';
    this.statusCode = statusCode || 502;
  }
}

export async function fdFetch(path, rawKeys, options = {}) {
  const keys = parseKeys(rawKeys);
  if (keys.length === 0) {
    throw Object.assign(new AllKeysFailedError(503, 'No Football-Data.org API key configured'), { noKey: true });
  }

  const url = path.startsWith('http')
    ? path
    : `https://api.football-data.org/v4/${String(path).replace(/^\//, '')}`;

  let lastStatus = 0;

  for (let i = 0; i < keys.length; i++) {
    try {
      const res = await fetch(url, {
        headers: { 'X-Auth-Token': keys[i] },
        signal: options.signal
      });

      if (res.ok) return res;

      lastStatus = res.status;
      if (!RETRYABLE_STATUSES.has(res.status)) {
        throw Object.assign(new AllKeysFailedError(res.status, `Football-Data.org returned ${res.status}`), { fatalStatus: res.status });
      }
    } catch (err) {
      if (err instanceof AllKeysFailedError && err.fatalStatus) throw err;
      lastStatus = lastStatus || 502;
      if (i === keys.length - 1) throw new AllKeysFailedError(502);
    }
  }

  throw new AllKeysFailedError(lastStatus || 502);
}
