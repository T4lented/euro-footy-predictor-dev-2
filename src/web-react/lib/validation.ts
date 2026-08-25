const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function sanitizeSearchQuery(raw: string, maxLen = 100): string {
  return raw.trim().slice(0, maxLen);
}

export function isValidDateString(value: string): boolean {
  if (!DATE_RE.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}
