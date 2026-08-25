export type KellyRiskMode = 'passive' | 'moderate' | 'aggressive';
export type OneX2Outcome = 'home' | 'draw' | 'away';

export const KELLY_RISK_MODES: Record<KellyRiskMode, { label: string; multiplier: number; description: string }> = {
  passive: { label: 'Passive', multiplier: 0.25, description: 'Quarter Kelly' },
  moderate: { label: 'Moderate', multiplier: 0.5, description: 'Half Kelly' },
  aggressive: { label: 'Aggressive', multiplier: 1, description: 'Full Kelly' },
};

export type OneX2Odds = Record<OneX2Outcome, number>;
export type OneX2Probabilities = Record<OneX2Outcome, number>;

export interface KellyInput {
  bankroll: number;
  decimalOdds: number;
  modelProbabilityPercent: number;
  fairMarketProbability: number;
  riskMode: KellyRiskMode;
  minimumEdgePercent: number;
  minimumStakeUnit: number;
  maximumStake?: number;
}

export interface KellyResult {
  status: 'valid' | 'invalid' | 'no-edge' | 'below-threshold' | 'below-minimum';
  message: string;
  modelProbability: number;
  rawMarketProbability: number;
  fairMarketProbability: number;
  edge: number;
  fullKellyFraction: number;
  selectedKellyFraction: number;
  recommendedStake: number;
  wasCapped: boolean;
}

function floorToUnit(value: number, unit: number) {
  return Number((Math.floor((value + 0.0000001) / unit) * unit).toFixed(10));
}

export function validateOneX2Probabilities(probabilities: OneX2Probabilities, tolerance = 2) {
  const values = Object.values(probabilities);
  const total = values.reduce((sum, value) => sum + value, 0);
  const valid = values.every(value => Number.isFinite(value) && value >= 0 && value <= 100) && Math.abs(total - 100) <= tolerance;
  return { valid, total };
}

export function calculateNoVigMarket(odds: OneX2Odds): { fair: OneX2Probabilities; overroundPercent: number } | null {
  const values = Object.values(odds);
  if (!values.every(value => Number.isFinite(value) && value > 1)) return null;
  const raw = { home: 1 / odds.home, draw: 1 / odds.draw, away: 1 / odds.away };
  const total = raw.home + raw.draw + raw.away;
  return {
    fair: { home: raw.home / total, draw: raw.draw / total, away: raw.away / total },
    overroundPercent: (total - 1) * 100,
  };
}

export function calculateKelly(input: KellyInput): KellyResult {
  const modelProbability = input.modelProbabilityPercent / 100;
  const rawMarketProbability = 1 / input.decimalOdds;
  const invalid = (message: string): KellyResult => ({
    status: 'invalid', message, modelProbability, rawMarketProbability: Number.isFinite(rawMarketProbability) ? rawMarketProbability : 0,
    fairMarketProbability: input.fairMarketProbability, edge: 0, fullKellyFraction: 0, selectedKellyFraction: 0, recommendedStake: 0, wasCapped: false,
  });

  if (!Number.isFinite(input.bankroll) || input.bankroll <= 0) return invalid('Enter a bankroll greater than zero.');
  if (!Number.isFinite(input.decimalOdds) || input.decimalOdds <= 1) return invalid('Enter decimal odds greater than 1.00.');
  if (!Number.isFinite(modelProbability) || modelProbability < 0 || modelProbability > 1) return invalid('The model probability is invalid.');
  if (!Number.isFinite(input.fairMarketProbability) || input.fairMarketProbability < 0 || input.fairMarketProbability > 1) return invalid('Enter all three 1X2 odds to calculate the market comparison.');
  if (!Number.isFinite(input.minimumStakeUnit) || input.minimumStakeUnit <= 0) return invalid('Set a valid minimum stake unit.');

  const netOdds = input.decimalOdds - 1;
  const edge = modelProbability - input.fairMarketProbability;
  const fullKellyFraction = (netOdds * modelProbability - (1 - modelProbability)) / netOdds;
  const selectedKellyFraction = Math.max(0, fullKellyFraction * KELLY_RISK_MODES[input.riskMode].multiplier);
  const rawStake = input.bankroll * selectedKellyFraction;
  const cappedStake = input.maximumStake && input.maximumStake > 0 ? Math.min(rawStake, input.maximumStake) : rawStake;
  const recommendedStake = floorToUnit(cappedStake, input.minimumStakeUnit);
  const base = { modelProbability, rawMarketProbability, fairMarketProbability: input.fairMarketProbability, edge, fullKellyFraction, selectedKellyFraction, recommendedStake, wasCapped: cappedStake < rawStake };

  if (fullKellyFraction <= 0) return { ...base, status: 'no-edge', message: 'No positive edge is available at this model probability and price.', recommendedStake: 0 };
  if (edge * 100 < input.minimumEdgePercent) return { ...base, status: 'below-threshold', message: 'The edge is below your selected confidence threshold.', recommendedStake: 0 };
  if (recommendedStake < input.minimumStakeUnit) return { ...base, status: 'below-minimum', message: 'The calculated stake is below the selected stake increment.', recommendedStake: 0 };
  return { ...base, status: 'valid', message: cappedStake < rawStake ? 'Stake capped by your maximum stake setting.' : 'Review the actual odds and stake before saving.' };
}
