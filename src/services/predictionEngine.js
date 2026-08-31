/**
 * Comprehensive 12-Factor Poisson & Dixon-Coles Match Prediction Engine
 */

import { getTeamData } from '../data/teamsData.js';
import { getH2HData } from '../data/h2hData.js';
import { evaluateAllFactors, FACTOR_METADATA } from '../models/factors.js';
import { resolveLeagueConfig } from '../config/leagues.js';

// Poisson probability density function: P(k; lambda) = (lambda^k * e^-lambda) / k!
function factorial(n) {
  let res = 1;
  for (let i = 2; i <= n; i++) res *= i;
  return res;
}

function poisson(k, lambda) {
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
}

// Dixon-Coles low-score adjustment factor
function dixonColesTau(x, y, lambda, mu, rho = -0.05) {
  if (x === 0 && y === 0) return 1 - (lambda * mu * rho);
  if (x === 0 && y === 1) return 1 + (lambda * rho);
  if (x === 1 && y === 0) return 1 + (mu * rho);
  if (x === 1 && y === 1) return 1 - rho;
  return 1.0;
}

/**
 * Predicts match outcome using full 12-factor analysis and Poisson distribution
 * @param {string} homeTeamName - Home team name
 * @param {string} awayTeamName - Away team name
 * @param {string} leagueCode - League code
 * @param {object|null} espnH2H - Optional real H2H data from ESPN API
 * @param {object|null} formMap - Optional live form overrides keyed by team name
 */
function normalizeName(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function applyFormOverride(teamObj, formMap) {
  if (!formMap || !teamObj?.name) return;
  const target = normalizeName(teamObj.name);
  let match = formMap[teamObj.name] || formMap[target] || null;
  if (!match) {
    for (const [key, value] of Object.entries(formMap)) {
      const k = normalizeName(key);
      if (k === target || (target.length >= 4 && k.length >= 4 && (k.split(' ').includes(target) || target.split(' ').includes(k)))) {
        match = value;
        break;
      }
    }
  }
  if (!match || !Array.isArray(match.recentForm) || match.recentForm.length === 0) return;
  teamObj.recentForm = match.recentForm;
  if (typeof match.formPoints === 'number') {
    teamObj.formPoints = match.formPoints;
  } else {
    let decayBase = 0.85;
    let weightedPoints = 0;
    for (let i = 0; i < match.recentForm.length; i++) {
       const r = match.recentForm[i];
       const pts = r === 'W' ? 3 : r === 'D' ? 1 : 0;
       const weight = Math.pow(decayBase, match.recentForm.length - 1 - i);
       weightedPoints += pts * weight;
    }
    const maxDecayed = 3 * (1 - Math.pow(decayBase, match.recentForm.length)) / (1 - decayBase);
    const rescale = (match.recentForm.length * 3) / maxDecayed;
    teamObj.formPoints = weightedPoints * rescale;
  }
}

export function predictMatch(homeTeamName, awayTeamName, leagueCode = 'PL', espnH2H = null, formMap = null) {
  const league = resolveLeagueConfig(leagueCode);
  const homeTeam = getTeamData(homeTeamName, leagueCode);
  const awayTeam = getTeamData(awayTeamName, leagueCode);

  applyFormOverride(homeTeam, formMap);
  applyFormOverride(awayTeam, formMap);

  let h2h;
  if (espnH2H && espnH2H.totalMatches > 0) {
    h2h = espnH2H;
  } else {
    h2h = getH2HData(homeTeam.name, awayTeam.name, homeTeam, awayTeam);
  }

  const { factors, homeMultiplier, awayMultiplier } = evaluateAllFactors(homeTeam, awayTeam, h2h || {}, league);

  // 2. Base Expected Goals (xG) calculation
  // Natural historical European football goal split (54% Home Goals, 46% Away Goals)
  // Adjusted dynamically by the home team's home fortress rating to avoid double home advantage
  const leagueBase = league.avgGoalsPerGame || 2.75;
  const homeFortress = homeTeam.homeFortressRating || 7.5;
  const fortressAdjustment = (homeFortress - 7.5) * 0.01;
  const homePct = 0.54 + fortressAdjustment;
  const awayPct = 1.0 - homePct;

  const homeBasePortion = leagueBase * homePct;
  const awayBasePortion = leagueBase * awayPct;

  // Expected Goals (lambda for home, mu for away)
  let lambda = homeBasePortion *
    (homeTeam.attackRating || 1.0) *
    (awayTeam.defenseRating || 1.0) *
    homeMultiplier;

  let mu = awayBasePortion *
    (awayTeam.attackRating || 1.0) *
    (homeTeam.defenseRating || 1.0) *
    awayMultiplier;

  // Ensure reasonable football bounds (0.35 <= xG <= 4.2)
  lambda = Math.max(0.35, Math.min(4.2, lambda));
  mu = Math.max(0.30, Math.min(3.8, mu));

  // Dynamic Dixon-Coles Rho based on total expected goals
  const totalExpG = lambda + mu;
  const dynamicRho = Math.max(-0.15, Math.min(-0.02, -0.05 * (2.75 / totalExpG)));

  // 3. Compute 10x10 Scoreline Probability Matrix
  const MAX_GOALS = 9;
  let probHomeWin = 0;
  let probDraw = 0;
  let probAwayWin = 0;
  let probOver25 = 0;
  let probUnder25 = 0;
  let probBTTS = 0; // Both Teams to Score

  const scoreMatrix = [];

  for (let i = 0; i <= MAX_GOALS; i++) {
    for (let j = 0; j <= MAX_GOALS; j++) {
      const pHomeGoal = poisson(i, lambda);
      const pAwayGoal = poisson(j, mu);
      const tau = dixonColesTau(i, j, lambda, mu, dynamicRho);
      const pScore = pHomeGoal * pAwayGoal * tau;

      if (pScore > 0) {
        scoreMatrix.push({ home: i, away: j, prob: pScore });

        if (i > j) probHomeWin += pScore;
        else if (i === j) probDraw += pScore;
        else probAwayWin += pScore;

        if (i + j > 2.5) probOver25 += pScore;
        else probUnder25 += pScore;

        if (i > 0 && j > 0) probBTTS += pScore;
      }
    }
  }

  // 4. Normalize probabilities to sum exactly to 100%
  const total = probHomeWin + probDraw + probAwayWin;
  const homeWinPct = (probHomeWin / total) * 100;
  const drawPct = (probDraw / total) * 100;
  const awayWinPct = (probAwayWin / total) * 100;

  const totalOverUnder = probOver25 + probUnder25;
  const over25Pct = (probOver25 / totalOverUnder) * 100;
  const under25Pct = (probUnder25 / totalOverUnder) * 100;
  const bttsPct = (probBTTS / total) * 100;

  // 5. Sort most likely scorelines
  scoreMatrix.sort((a, b) => b.prob - a.prob);
  const topScorelines = scoreMatrix.slice(0, 5).map(s => ({
    score: `${s.home} - ${s.away}`,
    prob: (s.prob / total) * 100
  }));

  // 6. Highlight top contributing factors
  const factorKeys = Object.keys(factors);
  const factorDiffs = factorKeys.map(key => {
    const diff = factors[key].home - factors[key].away;
    return {
      key,
      name: FACTOR_METADATA[key]?.name || key,
      icon: FACTOR_METADATA[key]?.icon || '📌',
      diff,
      favors: diff > 0.5 ? 'HOME' : diff < -0.5 ? 'AWAY' : 'NEUTRAL',
      homeScore: factors[key].home,
      awayScore: factors[key].away,
      weight: factors[key].weight
    };
  });

  factorDiffs.sort((a, b) => Math.abs(b.diff * b.weight) - Math.abs(a.diff * a.weight));

  // Determine prediction confidence
  const maxPct = Math.max(homeWinPct, drawPct, awayWinPct);
  let confidence = 'Moderate';
  if (maxPct >= 62) confidence = 'Very High';
  else if (maxPct >= 50) confidence = 'High';
  else if (maxPct <= 40) confidence = 'Low (Contested)';

  return {
    homeTeam,
    awayTeam,
    league,
    h2h,
    expectedGoals: {
      home: Number(lambda.toFixed(2)),
      away: Number(mu.toFixed(2)),
      total: Number((lambda + mu).toFixed(2))
    },
    probabilities: {
      homeWin: Number(homeWinPct.toFixed(1)),
      draw: Number(drawPct.toFixed(1)),
      awayWin: Number(awayWinPct.toFixed(1)),
      over25: Number(over25Pct.toFixed(1)),
      under25: Number(under25Pct.toFixed(1)),
      btts: Number(bttsPct.toFixed(1))
    },
    topScorelines,
    confidence,
    factors,
    factorDiffs
  };
}
