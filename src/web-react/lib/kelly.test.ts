import { describe, expect, it } from 'vitest';
import { calculateKelly, calculateNoVigMarket, validateOneX2Probabilities } from './kelly';

describe('Kelly calculations for predictor probabilities', () => {
  it('converts the live percentage probability into correct full, half, and quarter Kelly sizes', () => {
    const base = {
      bankroll: 1000,
      decimalOdds: 2,
      modelProbabilityPercent: 55,
      fairMarketProbability: 0.5,
      minimumEdgePercent: 0,
      minimumStakeUnit: 0.01,
    };
    expect(calculateKelly({ ...base, riskMode: 'aggressive' }).recommendedStake).toBe(100);
    expect(calculateKelly({ ...base, riskMode: 'moderate' }).recommendedStake).toBe(50);
    expect(calculateKelly({ ...base, riskMode: 'passive' }).recommendedStake).toBe(25);
  });

  it('returns no stake at 1.01 odds with exactly 99% probability', () => {
    const result = calculateKelly({ bankroll: 1000, decimalOdds: 1.01, modelProbabilityPercent: 99, fairMarketProbability: 0.99, riskMode: 'moderate', minimumEdgePercent: 0, minimumStakeUnit: 0.01 });
    expect(result.status).toBe('no-edge');
    expect(result.recommendedStake).toBe(0);
  });

  it('blocks a positive calculation below the confidence threshold and rounds down capped stakes', () => {
    const belowThreshold = calculateKelly({ bankroll: 1000, decimalOdds: 2.1, modelProbabilityPercent: 49, fairMarketProbability: 0.485, riskMode: 'moderate', minimumEdgePercent: 1, minimumStakeUnit: 0.01 });
    const capped = calculateKelly({ bankroll: 1000, decimalOdds: 2, modelProbabilityPercent: 55, fairMarketProbability: 0.5, riskMode: 'aggressive', minimumEdgePercent: 0, minimumStakeUnit: 0.05, maximumStake: 47.63 });
    expect(belowThreshold.status).toBe('below-threshold');
    expect(capped.recommendedStake).toBe(47.6);
  });

  it('validates 1X2 model percentages and performs proportional no-vig diagnostics', () => {
    expect(validateOneX2Probabilities({ home: 48, draw: 27, away: 25 }).valid).toBe(true);
    expect(validateOneX2Probabilities({ home: 58, draw: 25, away: 30 }).valid).toBe(false);
    const market = calculateNoVigMarket({ home: 2, draw: 4, away: 4 });
    expect(market?.overroundPercent).toBeCloseTo(0, 8);
    expect(market?.fair.home).toBeCloseTo(0.5, 8);
  });
});
