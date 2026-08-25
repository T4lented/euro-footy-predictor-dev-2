/**
 * 12-Factor Predictive Analysis Vector
 * Calculates standardized scores (0-10) and multiplier adjustments for each factor dimension.
 * Calibrated to maintain a neutral 5.0 baseline without artificial home-bias distortion.
 */

export const FACTOR_WEIGHTS = {
  teamQualityForm: 0.20,
  personnelAvailability: 0.12,
  tacticalAdvantage: 0.10,
  motivationalContext: 0.08,
  environmental: 0.04,
  statisticalUnderlying: 0.10,
  externalCongestion: 0.06,
  psychologicalDynamics: 0.04,
  strategicDepth: 0.04,
  travellingLogistics: 0.04,
  historicalBaseline: 0.08,
  opponentH2HSpecific: 0.10
};

export const FACTOR_METADATA = {
  teamQualityForm: {
    name: 'Team Quality & Recent Form',
    icon: '📈',
    description: 'Elo rating disparity, rolling 5-game point tally, and goal momentum.'
  },
  personnelAvailability: {
    name: 'Personnel & Squad Availability',
    icon: '🩺',
    description: 'Key player availability, injuries, suspensions, and crucial absences.'
  },
  tacticalAdvantage: {
    name: 'Tactical & Situational Matchup',
    icon: '♟️',
    description: 'Style match-ups (pressing vs low block), set-piece proficiency vs vulnerability.'
  },
  motivationalContext: {
    name: 'Motivation & Contextual Stakes',
    icon: '🎯',
    description: 'Title race, derby tension, European qualification stakes, or rotation risk.'
  },
  environmental: {
    name: 'Environmental Conditions',
    icon: '🌦️',
    description: 'Weather, pitch condition, stadium altitude, and surface familiarity.'
  },
  statisticalUnderlying: {
    name: 'Underlying Statistical Quality',
    icon: '📊',
    description: 'Expected Goals (xG vs xGA) per 90, big chances created, box control.'
  },
  externalCongestion: {
    name: 'Schedule Rest & Congestion',
    icon: '⏱️',
    description: 'Rest days differential, multi-week match density, referee profile.'
  },
  psychologicalDynamics: {
    name: 'Psychological Dynamics & Mentality',
    icon: '🧠',
    description: 'Comeback mentality, crowd pressure index, and pressure handling.'
  },
  strategicDepth: {
    name: 'Strategic Bench Depth',
    icon: '🔄',
    description: 'Impact of 5-substitution era, bench quality, late-game goal efficiency (75-90+).'
  },
  travellingLogistics: {
    name: 'Travelling & Logistics',
    icon: '✈️',
    description: 'Travel distance (km), away fan presence, and travel fatigue.'
  },
  historicalBaseline: {
    name: 'Historical Multi-Season Baseline',
    icon: '🏛️',
    description: 'Multi-season win rates, long-term stability, and tier consistency.'
  },
  opponentH2HSpecific: {
    name: 'Opponent-Specific H2H & Venue Record',
    icon: '⚔️',
    description: 'Direct historical record between the two teams and venue-specific stadium records.'
  }
};

/**
 * Evaluates all 12 factors for both Home and Away teams (centered neutrally at 5.0)
 */
export function evaluateAllFactors(homeTeam, awayTeam, h2h = {}, league = {}) {
  // 1. Team Quality & Form (0-10, centered at 5.0)
  const eloDiff = (homeTeam.elo || 1600) - (awayTeam.elo || 1600);
  const formDiff = (homeTeam.formPoints || 7) - (awayTeam.formPoints || 7);
  const qHome = Math.min(10, Math.max(1, 5.0 + (eloDiff / 100) + (formDiff * 0.25)));
  const qAway = Math.min(10, Math.max(1, 5.0 - (eloDiff / 100) - (formDiff * 0.25)));

  // 2. Personnel Availability (0-10, full squad ~ 6.0)
  const homeInjuriesCount = (homeTeam.injuries?.length || 0) + (homeTeam.suspensions?.length || 0);
  const awayInjuriesCount = (awayTeam.injuries?.length || 0) + (awayTeam.suspensions?.length || 0);
  const pHome = Math.min(10, Math.max(2, 6.0 - homeInjuriesCount * 0.8));
  const pAway = Math.min(10, Math.max(2, 6.0 - awayInjuriesCount * 0.8));

  // 3. Tactical & Situational Advantage (0-10, centered at 5.0)
  const homeSetPieceEdge = (homeTeam.setPieceOffense || 7.0) - (awayTeam.setPieceDefense || 7.0);
  const awaySetPieceEdge = (awayTeam.setPieceOffense || 7.0) - (homeTeam.setPieceDefense || 7.0);
  const possDiff = (homeTeam.possessionAvg || 50) - (awayTeam.possessionAvg || 50);
  const tHome = Math.min(10, Math.max(2, 5.0 + homeSetPieceEdge * 0.4 + possDiff * 0.03));
  const tAway = Math.min(10, Math.max(2, 5.0 + awaySetPieceEdge * 0.4 - possDiff * 0.03));

  // 4. Motivational & Context (0-10, symmetric for both)
  const derbyBonus = h2h.derbyOrRivalry ? 0.8 : 0.0;
  const mHome = Math.min(10, Math.max(2, 5.0 + derbyBonus));
  const mAway = Math.min(10, Math.max(2, 5.0 + derbyBonus));

  // 5. Environmental Factors (0-10, calibrated altitude effect)
  const altDiff = (homeTeam.altitudeMeters || 0) - (awayTeam.altitudeMeters || 0);
  const altBonus = altDiff > 350 ? 0.5 : 0.0;
  const eHome = Math.min(10, Math.max(2, 5.0 + altBonus));
  const eAway = Math.min(10, Math.max(2, 5.0 - altBonus * 0.5));

  // 6. Underlying Statistical (0-10, centered at 5.0)
  const homeNetXG = (homeTeam.xGCreatedPer90 || 1.3) - (homeTeam.xGConcededPer90 || 1.3);
  const awayNetXG = (awayTeam.xGCreatedPer90 || 1.3) - (awayTeam.xGConcededPer90 || 1.3);
  const xgDiff = homeNetXG - awayNetXG;
  const sHome = Math.min(10, Math.max(2, 5.0 + xgDiff * 1.5));
  const sAway = Math.min(10, Math.max(2, 5.0 - xgDiff * 1.5));

  // 7. External / Schedule Rest & Congestion (0-10, centered at 5.0)
  const restDiff = (homeTeam.restDays || 6) - (awayTeam.restDays || 6);
  const cHome = Math.min(10, Math.max(2, 5.0 + restDiff * 0.4));
  const cAway = Math.min(10, Math.max(2, 5.0 - restDiff * 0.4));

  // 8. Psychological Dynamics (0-10, centered at 5.0)
  const psychDiff = (homeTeam.psychologicalRating || 7.5) - (awayTeam.psychologicalRating || 7.5);
  const psHome = Math.min(10, Math.max(2, 5.0 + psychDiff * 0.4));
  const psAway = Math.min(10, Math.max(2, 5.0 - psychDiff * 0.4));

  // 9. Strategic Depth (0-10, centered at ~5.0)
  const dHome = Math.min(10, Math.max(2, (homeTeam.benchDepthRating || 7.0) / 1.4));
  const dAway = Math.min(10, Math.max(2, (awayTeam.benchDepthRating || 7.0) / 1.4));

  // 10. Travelling & Logistics (0-10, centered at 5.0 to avoid double home advantage)
  const trHome = 5.0;
  const trAway = 5.0;

  // 11. Historical Multi-Season Baseline (0-10, centered around ~5.0)
  const hHome = Math.min(10, Math.max(2, (homeTeam.multiSeasonWinRate || 0.48) * 10));
  const hAway = Math.min(10, Math.max(2, (awayTeam.multiSeasonWinRate || 0.48) * 10));

  // 12. Opponent-Specific H2H & Venue Record (0-10, centered at 5.0)
  const totalH2H = h2h.totalMatches || 0;
  let h2hScoreHome = 5.0;
  let h2hScoreAway = 5.0;
  if (totalH2H > 0) {
    const hWinRate = (h2h.homeWins || 0) / totalH2H;
    const aWinRate = (h2h.awayWins || 0) / totalH2H;
    const hDiff = hWinRate - aWinRate;
    h2hScoreHome = Math.min(10, Math.max(2, 5.0 + hDiff * 3.5));
    h2hScoreAway = Math.min(10, Math.max(2, 5.0 - hDiff * 3.5));
  }

  const factors = {
    teamQualityForm: { home: Number(qHome.toFixed(1)), away: Number(qAway.toFixed(1)), weight: FACTOR_WEIGHTS.teamQualityForm },
    personnelAvailability: { home: Number(pHome.toFixed(1)), away: Number(pAway.toFixed(1)), weight: FACTOR_WEIGHTS.personnelAvailability },
    tacticalAdvantage: { home: Number(tHome.toFixed(1)), away: Number(tAway.toFixed(1)), weight: FACTOR_WEIGHTS.tacticalAdvantage },
    motivationalContext: { home: Number(mHome.toFixed(1)), away: Number(mAway.toFixed(1)), weight: FACTOR_WEIGHTS.motivationalContext },
    environmental: { home: Number(eHome.toFixed(1)), away: Number(eAway.toFixed(1)), weight: FACTOR_WEIGHTS.environmental },
    statisticalUnderlying: { home: Number(sHome.toFixed(1)), away: Number(sAway.toFixed(1)), weight: FACTOR_WEIGHTS.statisticalUnderlying },
    externalCongestion: { home: Number(cHome.toFixed(1)), away: Number(cAway.toFixed(1)), weight: FACTOR_WEIGHTS.externalCongestion },
    psychologicalDynamics: { home: Number(psHome.toFixed(1)), away: Number(psAway.toFixed(1)), weight: FACTOR_WEIGHTS.psychologicalDynamics },
    strategicDepth: { home: Number(dHome.toFixed(1)), away: Number(dAway.toFixed(1)), weight: FACTOR_WEIGHTS.strategicDepth },
    travellingLogistics: { home: Number(trHome.toFixed(1)), away: Number(trAway.toFixed(1)), weight: FACTOR_WEIGHTS.travellingLogistics },
    historicalBaseline: { home: Number(hHome.toFixed(1)), away: Number(hAway.toFixed(1)), weight: FACTOR_WEIGHTS.historicalBaseline },
    opponentH2HSpecific: { home: Number(h2hScoreHome.toFixed(1)), away: Number(h2hScoreAway.toFixed(1)), weight: FACTOR_WEIGHTS.opponentH2HSpecific }
  };

  // Compute composite multiplier (normalized around 1.0)
  let homeWeightedSum = 0;
  let awayWeightedSum = 0;

  for (const [, val] of Object.entries(factors)) {
    homeWeightedSum += (val.home / 5.0) * val.weight;
    awayWeightedSum += (val.away / 5.0) * val.weight;
  }

  return {
    factors,
    homeMultiplier: homeWeightedSum,
    awayMultiplier: awayWeightedSum
  };
}
