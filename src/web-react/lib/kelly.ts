export type KellyRiskMode = 'passive' | 'moderate' | 'aggressive';
export type OneX2Outcome = 'home' | 'draw' | 'away';

export const KELLY_RISK_MODES: Record<KellyRiskMode, { label: string; multiplier: number; description: string }> = {
  passive: { label: 'Conservative', multiplier: 0.25, description: 'Quarter Kelly — Low risk, ~50% growth' },
  moderate: { label: 'Balanced', multiplier: 0.5, description: 'Half Kelly — ~75% growth, moderate variance' },
  aggressive: { label: 'Aggressive', multiplier: 1, description: 'Full Kelly — Maximum growth, high variance' },
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
  confidencePercent?: number;
}

export interface KellyResult {
  status: 'valid' | 'invalid' | 'no-edge' | 'below-threshold' | 'below-minimum' | 'over-exposure';
  message: string;
  modelProbability: number;
  rawMarketProbability: number;
  fairMarketProbability: number;
  edge: number;
  expectedValue: number;
  fullKellyFraction: number;
  selectedKellyFraction: number;
  recommendedStake: number;
  potentialProfit: number;
  growthRate: number;
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

function calculateGrowthRate(stake: number, odds: number, prob: number): number {
  if (stake <= 0 || odds <= 1 || prob <= 0 || prob >= 1) return 0;
  const winAmount = stake * (odds - 1);
  const loseAmount = stake;
  return prob * Math.log(1 + winAmount / 1000) + (1 - prob) * Math.log(1 - loseAmount / 1000);
}

export function calculateKelly(input: KellyInput): KellyResult {
  const confidence = input.confidencePercent ? input.confidencePercent / 100 : 1;
  const modelProbability = (input.modelProbabilityPercent / 100) * confidence;
  const rawMarketProbability = 1 / input.decimalOdds;
  const invalid = (message: string): KellyResult => ({
    status: 'invalid', message, modelProbability, rawMarketProbability: Number.isFinite(rawMarketProbability) ? rawMarketProbability : 0,
    fairMarketProbability: input.fairMarketProbability, edge: 0, expectedValue: 0, fullKellyFraction: 0, selectedKellyFraction: 0,
    recommendedStake: 0, potentialProfit: 0, growthRate: 0, wasCapped: false,
  });

  if (!Number.isFinite(input.bankroll) || input.bankroll <= 0) return invalid('Enter a bankroll greater than zero.');
  if (!Number.isFinite(input.decimalOdds) || input.decimalOdds <= 1) return invalid('Enter decimal odds greater than 1.00.');
  if (!Number.isFinite(modelProbability) || modelProbability < 0 || modelProbability > 1) return invalid('The model probability is invalid.');
  if (!Number.isFinite(input.fairMarketProbability) || input.fairMarketProbability < 0 || input.fairMarketProbability > 1) return invalid('Fair market probability is invalid.');
  if (!Number.isFinite(input.minimumStakeUnit) || input.minimumStakeUnit <= 0) return invalid('Set a valid minimum stake unit.');

  const netOdds = input.decimalOdds - 1;
  const edge = modelProbability - input.fairMarketProbability;
  const expectedValue = (modelProbability * input.decimalOdds) - 1;
  const fullKellyFraction = (netOdds * modelProbability - (1 - modelProbability)) / netOdds;
  const selectedKellyFraction = Math.max(0, fullKellyFraction * KELLY_RISK_MODES[input.riskMode].multiplier);
  const rawStake = input.bankroll * selectedKellyFraction;

  const maxStakeByBankroll = input.bankroll * 0.025;
  const effectiveMax = input.maximumStake && input.maximumStake > 0
    ? Math.min(input.maximumStake, maxStakeByBankroll)
    : maxStakeByBankroll;
  const cappedStake = Math.min(rawStake, effectiveMax);
  const recommendedStake = floorToUnit(cappedStake, input.minimumStakeUnit);
  const potentialProfit = recommendedStake * (input.decimalOdds - 1);
  const growthRate = calculateGrowthRate(recommendedStake, input.decimalOdds, modelProbability);

  const base = {
    modelProbability, rawMarketProbability, fairMarketProbability: input.fairMarketProbability,
    edge, expectedValue, fullKellyFraction, selectedKellyFraction, recommendedStake,
    potentialProfit, growthRate, wasCapped: cappedStake < rawStake,
  };

  if (fullKellyFraction <= 0) return { ...base, status: 'no-edge', message: 'No positive edge. Model probability must exceed market fair probability.', recommendedStake: 0, potentialProfit: 0 };
  if (edge * 100 < input.minimumEdgePercent) return { ...base, status: 'below-threshold', message: `Edge (${(edge * 100).toFixed(1)}%) below minimum (${input.minimumEdgePercent}%). Increase confidence or skip.`, recommendedStake: 0, potentialProfit: 0 };
  if (recommendedStake < input.minimumStakeUnit) return { ...base, status: 'below-minimum', message: 'Stake below minimum increment. Edge too small for this bankroll.', recommendedStake: 0, potentialProfit: 0 };
  if (selectedKellyFraction > 0.10) return { ...base, status: 'over-exposure', message: 'Kelly recommends >10% of bankroll. Reduce risk mode or skip.', recommendedStake: floorToUnit(effectiveMax, input.minimumStakeUnit), potentialProfit: floorToUnit(effectiveMax, input.minimumStakeUnit) * (input.decimalOdds - 1) };

  return { ...base, status: 'valid', message: recommendedStake < rawStake ? 'Stake capped at 2.5% of bankroll.' : 'Ready to place.' };
}

export function calculatePortfolioExposure(bets: { stake: number; odds: number }[], bankroll: number): {
  totalExposure: number;
  exposurePercent: number;
  maxPotentialLoss: number;
  isOverExposed: boolean;
} {
  const totalExposure = bets.reduce((sum, b) => sum + b.stake, 0);
  const exposurePercent = bankroll > 0 ? (totalExposure / bankroll) * 100 : 0;
  const maxPotentialLoss = totalExposure;
  return {
    totalExposure,
    exposurePercent,
    maxPotentialLoss,
    isOverExposed: exposurePercent > 20,
  };
}
