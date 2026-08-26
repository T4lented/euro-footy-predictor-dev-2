import { describe, expect, it } from 'vitest';
import { betProfitLoss, createPortfolio, parsePortfolio, portfolioMetrics, type PortfolioBet } from './portfolio';

const wonBet: PortfolioBet = {
  id: 'bet-1', fixtureId: 'fixture-1', fixtureLabel: 'Home vs Away', selection: 'home', oddsAtCalculation: 2,
  actualOdds: 2, calculatedStake: 10, actualStake: 10, modelProbabilityPercent: 55, riskMode: 'moderate', status: 'won', createdAt: 1,
};

describe('browser-local portfolio ledger', () => {
  it('keeps cash flows separate from performance while reserving pending exposure', () => {
    const state = createPortfolio('USD');
    state.settings.bankroll = 100;
    state.cashFlows = [{ id: 'cash-1', kind: 'deposit', amount: 20, createdAt: 1 }];
    state.bets = [wonBet, { ...wonBet, id: 'bet-2', status: 'pending', actualStake: 15 }];
    const metrics = portfolioMetrics(state);
    expect(metrics.profitLoss).toBe(10);
    expect(metrics.pendingExposure).toBe(15);
    expect(metrics.cashBalance).toBe(115);
  });

  it('calculates lost, void, and pending outcomes without fabricating returns', () => {
    expect(betProfitLoss({ ...wonBet, status: 'lost' })).toBe(-10);
    expect(betProfitLoss({ ...wonBet, status: 'void' })).toBe(0);
    expect(betProfitLoss({ ...wonBet, status: 'pending' })).toBe(0);
  });

  it('accepts only a valid versioned import', () => {
    expect(parsePortfolio(createPortfolio('NGN'))?.settings.currency).toBe('NGN');
    expect(parsePortfolio({ version: 1, settings: { currency: 'XYZ' }, bets: [], cashFlows: [] })).toBeNull();
  });
});
