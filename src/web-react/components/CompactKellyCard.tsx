import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import type { Fixture } from '../types';
import { LeagueLogo } from './LeagueLogo';
import {
  calculateKelly,
  calculateNoVigMarket,
  type KellyRiskMode,
  type OneX2Odds,
  type OneX2Outcome,
} from '../lib/kelly';
import { formatCurrency, type CurrencyCode } from '../lib/portfolio';
import { fetchOddsForFixture } from '../services/oddsService';

const OUTCOMES: { id: OneX2Outcome; label: string; color: string }[] = [
  { id: 'home', label: 'H', color: 'var(--win)' },
  { id: 'draw', label: 'D', color: 'var(--draw)' },
  { id: 'away', label: 'A', color: 'var(--lose)' },
];

function toNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

interface CompactKellyCardProps {
  fixture: Fixture;
  bankroll: number;
  riskMode: KellyRiskMode;
  minimumEdgePercent: number;
  minimumStakeUnit: number;
  maximumStake?: number;
  currency: CurrencyCode;
  onStage: (bet: {
    fixtureId: string;
    fixtureLabel: string;
    selection: OneX2Outcome;
    odds: OneX2Odds;
    modelProbabilityPercent: number;
    recommendedStake: number;
    riskMode: KellyRiskMode;
  }) => void;
}

export function CompactKellyCard({
  fixture,
  bankroll,
  riskMode,
  minimumEdgePercent,
  minimumStakeUnit,
  maximumStake,
  currency,
  onStage,
}: CompactKellyCardProps) {
  const [odds, setOdds] = useState<OneX2Odds>({ home: 0, draw: 0, away: 0 });
  const [outcome, setOutcome] = useState<OneX2Outcome>('home');
  const [fetchingOdds, setFetchingOdds] = useState(false);
  const [oddsSource, setOddsSource] = useState<string | null>(null);

  useEffect(() => {
    setOdds({ home: 0, draw: 0, away: 0 });
    setOutcome('home');
    setOddsSource(null);

    async function autoFetch() {
      setFetchingOdds(true);
      try {
        const result = await fetchOddsForFixture(
          { homeTeam: fixture.homeTeam, awayTeam: fixture.awayTeam, leagueCode: fixture.leagueCode }
        );
        if (result.odds) {
          setOdds(result.odds);
          setOddsSource(result.source);
        } else {
          setOddsSource(null);
        }
      } catch {
        setOddsSource(null);
      } finally {
        setFetchingOdds(false);
      }
    }
    autoFetch();
  }, [fixture.id, fixture.homeTeam, fixture.awayTeam, fixture.leagueCode]);

  const probabilities = {
    home: fixture.prediction.probabilities.homeWin,
    draw: fixture.prediction.probabilities.draw,
    away: fixture.prediction.probabilities.awayWin,
  };

  const market = calculateNoVigMarket(odds);
  const calculation = calculateKelly({
    bankroll,
    decimalOdds: odds[outcome],
    modelProbabilityPercent: probabilities[outcome],
    fairMarketProbability: market?.fair[outcome] ?? Number.NaN,
    riskMode,
    minimumEdgePercent,
    minimumStakeUnit,
    maximumStake,
  });

  const isPreMatch = !fixture.live || fixture.live.state === 'pre';
  const canStage = isPreMatch && calculation.status === 'valid' && odds[outcome] > 1;

  return (
    <div className="glass p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--text-muted)' }}>
            <LeagueLogo logo={fixture.leagueLogo} flag={fixture.flag} name={fixture.leagueName} className="size-3 shrink-0" />
            <span>{fixture.leagueName}</span>
            <span>·</span>
            <span>{fixture.time}</span>
          </p>
          <p className="mt-0.5 truncate text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            {fixture.homeTeam} vs {fixture.awayTeam}
          </p>
        </div>
        {fetchingOdds && <RefreshCw className="size-3 shrink-0 animate-spin" style={{ color: 'var(--accent)' }} />}
      </div>

      <div className="mt-2 grid grid-cols-3 gap-1.5">
        {OUTCOMES.map((item) => {
          const active = outcome === item.id;
          return (
            <div key={item.id}>
              <div className="flex items-center justify-between">
                <span
                  className="cursor-pointer rounded px-1.5 py-0.5 font-mono text-[10px] font-bold"
                  style={{
                    backgroundColor: active ? item.color : 'transparent',
                    color: active ? 'white' : item.color,
                    opacity: active ? 1 : 0.6,
                  }}
                  onClick={() => setOutcome(item.id)}
                >
                  {item.label}
                </span>
                <span className="font-mono text-[9px]" style={{ color: 'var(--text-muted)' }}>
                  {probabilities[item.id].toFixed(0)}%
                </span>
              </div>
              <input
                type="number"
                min="1.01"
                step="0.01"
                value={odds[item.id] || ''}
                onChange={(e) => setOdds((c) => ({ ...c, [item.id]: toNumber(e.target.value) }))}
                placeholder="0.00"
                className="mt-0.5 w-full rounded border bg-transparent px-1.5 py-1 font-mono text-xs tabular"
                style={{
                  borderColor: active ? item.color : 'var(--border-glass-strong)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
          );
        })}
      </div>

      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          {calculation.status === 'valid' ? (
            <p className="font-mono text-sm font-bold tabular" style={{ color: 'var(--win)' }}>
              {formatCurrency(calculation.recommendedStake, currency)}
            </p>
          ) : (
            <p className="font-mono text-[10px]" style={{ color: 'var(--text-muted)' }}>
              {calculation.message}
            </p>
          )}
        </div>
        <button
          type="button"
          disabled={!canStage}
          onClick={() =>
            onStage({
              fixtureId: fixture.id,
              fixtureLabel: `${fixture.homeTeam} vs ${fixture.awayTeam}`,
              selection: outcome,
              odds,
              modelProbabilityPercent: probabilities[outcome],
              recommendedStake: calculation.recommendedStake,
              riskMode,
            })
          }
          className="shrink-0 rounded px-2 py-1 text-[10px] font-semibold transition-opacity disabled:cursor-not-allowed disabled:opacity-30"
          style={{ backgroundColor: 'var(--accent)', color: 'white' }}
        >
          Stage
        </button>
      </div>

      {market && (
        <p className="mt-1 font-mono text-[9px]" style={{ color: 'var(--text-muted)' }}>
          Overround {market.overroundPercent.toFixed(1)}% · Edge {calculation.edge > 0 ? `${(calculation.edge * 100).toFixed(1)}%` : '—'}
        </p>
      )}
    </div>
  );
}
