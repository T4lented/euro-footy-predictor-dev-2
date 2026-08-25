import { writeFile } from 'node:fs/promises';
import path from 'node:path';

const CONFIDENCE_RANKS = { 'Very High': 4, High: 3, Moderate: 2 };

export function filterFixturesByIds(fixtures, ids) {
  if (!ids || ids.length === 0) return fixtures;
  const wanted = new Set(ids.map(id => id.trim().toUpperCase()).filter(Boolean));
  return fixtures.filter(f => wanted.has(f.id.toUpperCase()));
}

export function sortByConfidenceDesc(fixtures) {
  return [...fixtures].sort((a, b) => {
    const ra = CONFIDENCE_RANKS[a.prediction?.confidence] || 1;
    const rb = CONFIDENCE_RANKS[b.prediction?.confidence] || 1;
    if (rb !== ra) return rb - ra;
    const pA = Math.max(a.prediction?.probabilities?.homeWin || 0, a.prediction?.probabilities?.awayWin || 0);
    const pB = Math.max(b.prediction?.probabilities?.homeWin || 0, b.prediction?.probabilities?.awayWin || 0);
    return pB - pA;
  });
}

function csvEscape(value) {
  const str = String(value ?? '');
  return `"${str.replace(/"/g, '""')}"`;
}

export function buildCsv(fixtures) {
  const headers = [
    'ID', 'Date', 'Time', 'League Code', 'League', 'Country',
    'Home Team', 'Away Team', 'Stadium', 'Status',
    'Home Win %', 'Draw %', 'Away Win %',
    'Over 2.5 %', 'Under 2.5 %', 'BTTS %',
    'xG Home', 'xG Away', 'Top Score', 'Top Score %', 'Confidence'
  ];

  const rows = fixtures.map(f => {
    const p = f.prediction || {};
    const probs = p.probabilities || {};
    const xg = p.expectedGoals || {};
    const top = (p.topScorelines && p.topScorelines[0]) || {};
    return [
      f.id, f.date, f.time, f.leagueCode, f.leagueName, f.leagueCountry,
      f.homeTeam, f.awayTeam, f.stadium, f.status || f.matchType || '',
      probs.homeWin ?? '', probs.draw ?? '', probs.awayWin ?? '',
      probs.over25 ?? '', probs.under25 ?? '', probs.btts ?? '',
      xg.home ?? '', xg.away ?? '', top.score ?? '', top.prob ?? '', p.confidence ?? ''
    ].map(csvEscape).join(',');
  });

  return [headers.join(','), ...rows].join('\r\n');
}

export async function exportFixtures(data, filePath, ids = null) {
  let fixtures = data.fixtures || [];
  if (ids && ids.length > 0) {
    fixtures = filterFixturesByIds(fixtures, ids);
    fixtures = sortByConfidenceDesc(fixtures);
  }

  if (fixtures.length === 0) {
    throw new Error('No fixtures match the selection. Run "footy" or "footy today" to see valid match IDs.');
  }

  const ext = path.extname(filePath).toLowerCase();
  const resolved = path.resolve(filePath);

  if (ext === '.csv') {
    await writeFile(resolved, buildCsv(fixtures), 'utf8');
  } else if (ext === '.json') {
    const payload = {
      date: data.date,
      provider: data.provider,
      exportedAt: new Date().toISOString(),
      totalFixtures: fixtures.length,
      fixtures
    };
    await writeFile(resolved, JSON.stringify(payload, null, 2), 'utf8');
  } else {
    throw new Error('Unsupported format. Use a .json or .csv file extension.');
  }

  return { filePath: resolved, format: ext.slice(1), count: fixtures.length };
}
