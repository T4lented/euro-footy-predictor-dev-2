const RATE_LIMIT_MAP = new Map();
const WINDOW_MS = 60000;
const MAX_REQUESTS = 12;

export function checkRateLimit(ip) {
  const now = Date.now();
  const entry = RATE_LIMIT_MAP.get(ip);
  if (!entry || now - entry.start > WINDOW_MS) {
    RATE_LIMIT_MAP.set(ip, { start: now, count: 1 });
    return true;
  }
  entry.count++;
  if (entry.count > MAX_REQUESTS) return false;
  return true;
}

setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of RATE_LIMIT_MAP) {
    if (now - entry.start > WINDOW_MS * 2) RATE_LIMIT_MAP.delete(ip);
  }
}, WINDOW_MS * 2);
