import type { KellyRiskMode, OneX2Outcome } from './kelly';

export type CurrencyCode = 'GBP' | 'EUR' | 'USD' | 'JPY';
export type BetStatus = 'pending' | 'won' | 'lost' | 'void';

export interface PortfolioSettings {
  bankroll: number;
  currency: CurrencyCode;
  minimumEdgePercent: number;
  minimumStakeUnit: number;
  maximumStake?: number;
  riskMode?: KellyRiskMode;
}

export interface PortfolioBet {
  id: string;
  fixtureId: string;
  fixtureLabel: string;
  selection: OneX2Outcome;
  oddsAtCalculation: number;
  actualOdds: number;
  calculatedStake: number;
  actualStake: number;
  modelProbabilityPercent: number;
  riskMode: KellyRiskMode;
  status: BetStatus;
  createdAt: number;
  settledAt?: number;
}

export interface CashFlow {
  id: string;
  kind: 'deposit' | 'withdrawal';
  amount: number;
  createdAt: number;
}

export interface PortfolioState {
  version: 1;
  settings: PortfolioSettings;
  bets: PortfolioBet[];
  cashFlows: CashFlow[];
  lastExportAt?: number;
}

export const PORTFOLIO_STORAGE_KEY = 'euro-footy-predictor-portfolio-v1';
export const MINIMUM_STAKE_UNITS: Record<CurrencyCode, number> = { GBP: 0.01, EUR: 0.01, USD: 0.01, JPY: 1 };

export function createPortfolio(currency: CurrencyCode = 'GBP'): PortfolioState {
  return { version: 1, settings: { bankroll: 0, currency, minimumEdgePercent: 1, minimumStakeUnit: MINIMUM_STAKE_UNITS[currency], riskMode: 'moderate' }, bets: [], cashFlows: [] };
}

export function loadPortfolio(): PortfolioState {
  try {
    const raw = localStorage.getItem(PORTFOLIO_STORAGE_KEY);
    return raw ? parsePortfolio(JSON.parse(raw)) ?? createPortfolio() : createPortfolio();
  } catch {
    return createPortfolio();
  }
}

export function savePortfolio(portfolio: PortfolioState) {
  localStorage.setItem(PORTFOLIO_STORAGE_KEY, JSON.stringify(portfolio));
}

export function parsePortfolio(value: unknown): PortfolioState | null {
  if (!value || typeof value !== 'object') return null;
  const data = value as Partial<PortfolioState>;
  if (data.version !== 1 || !data.settings || !Array.isArray(data.bets) || !Array.isArray(data.cashFlows)) return null;
  if (!['GBP', 'EUR', 'USD', 'JPY'].includes(data.settings.currency as string)) return null;
  if (!Number.isFinite(data.settings.bankroll) || !Number.isFinite(data.settings.minimumEdgePercent) || !Number.isFinite(data.settings.minimumStakeUnit)) return null;
  return data as PortfolioState;
}

export function betProfitLoss(bet: PortfolioBet) {
  if (bet.status === 'pending') return 0;
  if (bet.status === 'void') return 0;
  return bet.status === 'won' ? bet.actualStake * (bet.actualOdds - 1) : -bet.actualStake;
}

export function portfolioMetrics(portfolio: PortfolioState) {
  const deposits = portfolio.cashFlows.filter(item => item.kind === 'deposit').reduce((sum, item) => sum + item.amount, 0);
  const withdrawals = portfolio.cashFlows.filter(item => item.kind === 'withdrawal').reduce((sum, item) => sum + item.amount, 0);
  const pendingExposure = portfolio.bets.filter(item => item.status === 'pending').reduce((sum, item) => sum + item.actualStake, 0);
  const settled = portfolio.bets.filter(item => item.status !== 'pending');
  const profitLoss = settled.reduce((sum, item) => sum + betProfitLoss(item), 0);
  const stakes = settled.reduce((sum, item) => sum + item.actualStake, 0);
  return { cashBalance: portfolio.settings.bankroll + deposits - withdrawals + profitLoss - pendingExposure, pendingExposure, profitLoss, returnOnStakes: stakes > 0 ? profitLoss / stakes : null };
}

export function formatCurrency(value: number, currency: CurrencyCode) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: currency === 'JPY' ? 0 : 2 }).format(value);
}
