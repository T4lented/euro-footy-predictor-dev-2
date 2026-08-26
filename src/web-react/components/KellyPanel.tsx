import { Download, FileUp, Plus, ShieldCheck, Wallet, X, RefreshCw } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Fixture } from '../types';
import {
  calculateKelly,
  calculateNoVigMarket,
  KELLY_RISK_MODES,
  type KellyRiskMode,
  type OneX2Odds,
  type OneX2Outcome,
  validateOneX2Probabilities,
} from '../lib/kelly';
import {
  createPortfolio,
  formatCurrency,
  loadPortfolio,
  MINIMUM_STAKE_UNITS,
  parsePortfolio,
  portfolioMetrics,
  savePortfolio,
  type BetStatus,
  type PortfolioBet,
  type PortfolioState,
} from '../lib/portfolio';
import { fetchOddsForFixture } from '../services/oddsService';

const OUTCOMES: { id: OneX2Outcome; label: string }[] = [
  { id: 'home', label: 'Home win' },
  { id: 'draw', label: 'Draw' },
  { id: 'away', label: 'Away win' },
];

function nextId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function toNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function percentage(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

interface KellyPanelProps {
  fixture: Fixture;
}

export function KellyPanel({ fixture }: KellyPanelProps) {
  const [portfolio, setPortfolio] = useState<PortfolioState>(() => loadPortfolio());
  const [odds, setOdds] = useState<OneX2Odds>({ home: 0, draw: 0, away: 0 });
  const [outcome, setOutcome] = useState<OneX2Outcome>('home');
  const [riskMode, setRiskMode] = useState<KellyRiskMode>('moderate');
  const [stagedBet, setStagedBet] = useState<Omit<PortfolioBet, 'actualOdds' | 'actualStake' | 'status'> | null>(null);
  const [actualOdds, setActualOdds] = useState(0);
  const [actualStake, setActualStake] = useState(0);
  const [cashFlow, setCashFlow] = useState(0);
  const [oddsSource, setOddsSource] = useState<string | null>(null);
  const [fetchingOdds, setFetchingOdds] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => { savePortfolio(portfolio); }, [portfolio]);
  useEffect(() => {
    setOdds({ home: 0, draw: 0, away: 0 });
    setOutcome('home');
    setStagedBet(null);
    setOddsSource(null);

    async function autoFetchOdds() {
      setFetchingOdds(true);
      try {
        console.log('[Odds] Fetching for:', fixture.homeTeam, 'vs', fixture.awayTeam, 'league:', fixture.leagueCode);
        const result = await fetchOddsForFixture(
          { homeTeam: fixture.homeTeam, awayTeam: fixture.awayTeam, leagueCode: fixture.leagueCode }
        );
        console.log('[Odds] Result:', result);

        if (result.odds) {
          setOdds(result.odds);
          setOddsSource(`Live from ${result.source}`);
        } else {
          setOddsSource(result.source === 'manual-only' ? 'No API key configured' : 'No live odds available');
        }
      } catch (err) {
        console.error('[Odds] Fetch error:', err);
        setOddsSource('Failed to fetch odds');
      } finally {
        setFetchingOdds(false);
      }
    }

    autoFetchOdds();
  }, [fixture.id, fixture.homeTeam, fixture.awayTeam, fixture.leagueCode]);

  const probabilities = {
    home: fixture.prediction.probabilities.homeWin,
    draw: fixture.prediction.probabilities.draw,
    away: fixture.prediction.probabilities.awayWin,
  };
  const validation = validateOneX2Probabilities(probabilities);
  const market = calculateNoVigMarket(odds);
  const calculation = calculateKelly({
    bankroll: portfolio.settings.bankroll,
    decimalOdds: odds[outcome],
    modelProbabilityPercent: probabilities[outcome],
    fairMarketProbability: market?.fair[outcome] ?? Number.NaN,
    riskMode,
    minimumEdgePercent: portfolio.settings.minimumEdgePercent,
    minimumStakeUnit: portfolio.settings.minimumStakeUnit,
    maximumStake: portfolio.settings.maximumStake,
  });
  const metrics = useMemo(() => portfolioMetrics(portfolio), [portfolio]);
  const currency = portfolio.settings.currency;

  function updateSettings(patch: Partial<PortfolioState['settings']>) {
    setPortfolio(current => ({ ...current, settings: { ...current.settings, ...patch } }));
  }

  function stageBet() {
    if (calculation.status !== 'valid') return;
    const draft = {
      id: nextId(),
      fixtureId: fixture.id,
      fixtureLabel: `${fixture.homeTeam} vs ${fixture.awayTeam}`,
      selection: outcome,
      oddsAtCalculation: odds[outcome],
      calculatedStake: calculation.recommendedStake,
      modelProbabilityPercent: probabilities[outcome],
      riskMode,
      createdAt: Date.now(),
    };
    setStagedBet(draft);
    setActualOdds(draft.oddsAtCalculation);
    setActualStake(draft.calculatedStake);
  }

  function confirmBet() {
    if (!stagedBet || actualOdds <= 1 || actualStake <= 0) return;
    setPortfolio(current => ({ ...current, bets: [{ ...stagedBet, actualOdds, actualStake, status: 'pending' }, ...current.bets] }));
    setStagedBet(null);
  }

  function settle(id: string, status: Exclude<BetStatus, 'pending'>) {
    setPortfolio(current => ({ ...current, bets: current.bets.map(bet => bet.id === id ? { ...bet, status, settledAt: Date.now() } : bet) }));
  }

  function addCashFlow(kind: 'deposit' | 'withdrawal') {
    if (cashFlow <= 0) return;
    setPortfolio(current => ({ ...current, cashFlows: [{ id: nextId(), kind, amount: cashFlow, createdAt: Date.now() }, ...current.cashFlows] }));
    setCashFlow(0);
  }

  function exportPortfolio() {
    const next = { ...portfolio, lastExportAt: Date.now() };
    setPortfolio(next);
    const url = URL.createObjectURL(new Blob([JSON.stringify(next, null, 2)], { type: 'application/json' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `euro-footy-portfolio-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function importPortfolio(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = parsePortfolio(JSON.parse(String(reader.result)));
        if (parsed) setPortfolio(parsed);
      } catch { /* Keep the current portfolio when an import is invalid. */ }
    };
    reader.readAsText(file);
    event.target.value = '';
  }

  const outcomeLabel = outcome === 'home' ? fixture.homeTeam : outcome === 'away' ? fixture.awayTeam : 'Draw';
  const isPreMatch = !fixture.live || fixture.live.state === 'pre';

  return (
    <section className="border-t pt-5" style={{ borderColor: 'var(--border-glass)' }}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Kelly workspace · manual-first</p>
          <h4 className="mt-1 font-display text-base font-bold" style={{ color: 'var(--text-primary)' }}>Size one 1X2 selection with your actual odds</h4>
          <p className="mt-1 max-w-xl text-xs leading-5" style={{ color: 'var(--text-secondary)' }}>The existing game menu opens this panel for the selected fixture. Enter all three decimal odds to compare the model with a no-vig market, then confirm the real stake before it reaches your local portfolio.</p>
        </div>
        <span className="glass inline-flex items-center gap-1.5 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}><ShieldCheck className="size-3.5" /> Local only</span>
      </div>

      {!isPreMatch && <div className="glass mt-4 p-3 text-xs" style={{ color: 'var(--draw)' }}>Kelly sizing is intentionally restricted to pre-match prices. This fixture is live or finished, so no stake can be staged.</div>}
      {!validation.valid && <div className="glass mt-4 p-3 text-xs" style={{ color: 'var(--lose)' }}>The Home/Draw/Away model probabilities total {validation.total.toFixed(1)}%, not 100%. Check the source model before using this calculation.</div>}

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {OUTCOMES.map(item => {
          const active = outcome === item.id;
          const team = item.id === 'home' ? fixture.homeTeam : item.id === 'away' ? fixture.awayTeam : 'Draw';
          return <button key={item.id} type="button" onClick={() => setOutcome(item.id)} className="glass p-3 text-left transition-colors" style={{ borderColor: active ? 'var(--accent)' : 'var(--border-glass)', backgroundColor: active ? 'var(--accent-tint)' : undefined }}>
            <p className="font-mono text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{item.label}</p>
            <p className="mt-1 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{team}</p>
            <p className="mt-1 font-mono text-xs tabular" style={{ color: item.id === 'home' ? 'var(--win)' : item.id === 'draw' ? 'var(--draw)' : 'var(--lose)' }}>Model {probabilities[item.id].toFixed(1)}%</p>
          </button>;
        })}
      </div>

      <div className="glass mt-4 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-display text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Decimal odds</p>
            <p className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
              {fetchingOdds ? 'Fetching live odds...' : oddsSource || 'Enter odds manually'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
              {market ? `Market overround ${market.overroundPercent.toFixed(1)}%` : 'Enter all three prices'}
            </span>
            {fetchingOdds && (
              <RefreshCw className="size-3.5 animate-spin" style={{ color: 'var(--accent)' }} />
            )}
          </div>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {OUTCOMES.map(item => <label key={item.id} className="block"><span className="mb-1 block font-mono text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{item.label}</span><input aria-label={`${item.label} decimal odds`} type="number" min="1.01" step="0.01" value={odds[item.id] || ''} onChange={event => setOdds(current => ({ ...current, [item.id]: toNumber(event.target.value) }))} className="w-full rounded border bg-transparent px-3 py-2 font-mono text-sm tabular" style={{ borderColor: 'var(--border-glass-strong)', color: 'var(--text-primary)' }} /></label>)}
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="glass p-4">
          <div className="grid grid-cols-2 gap-2">
            {[
              ['Model chance', `${probabilities[outcome].toFixed(1)}%`],
              ['No-vig market', market ? percentage(market.fair[outcome]) : '—'],
              ['Displayed edge', market ? percentage(calculation.edge) : '—'],
              ['Full Kelly', market ? percentage(Math.max(0, calculation.fullKellyFraction)) : '—'],
            ].map(([label, value]) => <div key={label} className="glass p-2.5"><p className="font-mono text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{label}</p><p className="mt-1 font-mono text-sm font-bold tabular" style={{ color: label === 'Displayed edge' && calculation.edge > 0 ? 'var(--win)' : 'var(--text-primary)' }}>{value}</p></div>)}
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label><span className="mb-1 block font-mono text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Bankroll ({currency})</span><input type="number" min="0" step={portfolio.settings.minimumStakeUnit} value={portfolio.settings.bankroll || ''} onChange={event => updateSettings({ bankroll: toNumber(event.target.value) })} className="w-full rounded border bg-transparent px-3 py-2 font-mono text-sm" style={{ borderColor: 'var(--border-glass-strong)', color: 'var(--text-primary)' }} /></label>
            <label><span className="mb-1 block font-mono text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Minimum edge (%)</span><input type="number" min="0" step="0.1" value={portfolio.settings.minimumEdgePercent} onChange={event => updateSettings({ minimumEdgePercent: toNumber(event.target.value) })} className="w-full rounded border bg-transparent px-3 py-2 font-mono text-sm" style={{ borderColor: 'var(--border-glass-strong)', color: 'var(--text-primary)' }} /></label>
            <label><span className="mb-1 block font-mono text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Maximum stake (optional)</span><input type="number" min="0" step={portfolio.settings.minimumStakeUnit} value={portfolio.settings.maximumStake || ''} onChange={event => updateSettings({ maximumStake: toNumber(event.target.value) || undefined })} className="w-full rounded border bg-transparent px-3 py-2 font-mono text-sm" style={{ borderColor: 'var(--border-glass-strong)', color: 'var(--text-primary)' }} /></label>
            <label><span className="mb-1 block font-mono text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Currency</span><select value={currency} onChange={event => { const next = event.target.value as PortfolioState['settings']['currency']; updateSettings({ currency: next, minimumStakeUnit: MINIMUM_STAKE_UNITS[next] }); }} className="w-full rounded border bg-transparent px-3 py-2 font-mono text-sm" style={{ borderColor: 'var(--border-glass-strong)', color: 'var(--text-primary)' }}><option value="GBP">GBP (£)</option><option value="EUR">EUR (€)</option><option value="USD">USD ($)</option><option value="JPY">JPY (¥)</option></select></label>
          </div>
        </div>

        <div className="glass p-4">
          <p className="font-mono text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Risk setting</p>
          <div className="mt-2 space-y-2">{(Object.keys(KELLY_RISK_MODES) as KellyRiskMode[]).map(mode => <button key={mode} type="button" onClick={() => setRiskMode(mode)} className="glass flex w-full items-center justify-between gap-3 p-2.5 text-left" style={{ borderColor: riskMode === mode ? 'var(--accent)' : 'var(--border-glass)', backgroundColor: riskMode === mode ? 'var(--accent-tint)' : undefined }}><span><span className="block text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{KELLY_RISK_MODES[mode].label}</span><span className="block text-[11px]" style={{ color: 'var(--text-secondary)' }}>{KELLY_RISK_MODES[mode].description}</span></span><span className="font-mono text-xs tabular" style={{ color: 'var(--accent-strong)' }}>{KELLY_RISK_MODES[mode].multiplier}×</span></button>)}</div>
          <div className="mt-3 rounded p-4" style={{ backgroundColor: calculation.status === 'valid' && isPreMatch ? 'var(--accent-tint-strong)' : 'var(--surface)', border: '1px solid var(--border-glass)' }}><p className="font-mono text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>Suggested stake</p><p className="mt-1 font-mono text-3xl font-bold tabular" style={{ color: 'var(--text-primary)' }}>{formatCurrency(isPreMatch ? calculation.recommendedStake : 0, currency)}</p><p className="mt-2 text-xs leading-5" style={{ color: 'var(--text-secondary)' }}>{isPreMatch ? calculation.message : 'Pre-match-only guardrail: live and finished fixtures cannot be staged.'}</p></div>
          <button type="button" disabled={!isPreMatch || calculation.status !== 'valid'} onClick={stageBet} className="mt-3 flex w-full items-center justify-center gap-2 rounded px-3 py-2 text-xs font-semibold transition-opacity disabled:cursor-not-allowed disabled:opacity-40" style={{ backgroundColor: 'var(--accent)', color: 'white' }}><Plus className="size-3.5" /> Stage bet for confirmation</button>
        </div>
      </div>

      {stagedBet && <div className="glass mt-4 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-display text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Confirm actual placement</p><p className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>Calculated {formatCurrency(stagedBet.calculatedStake, currency)} on {outcomeLabel} at {stagedBet.oddsAtCalculation.toFixed(2)}. Save the actual price and stake instead of assuming the estimate.</p></div><button type="button" aria-label="Cancel staged bet" onClick={() => setStagedBet(null)} style={{ color: 'var(--text-secondary)' }}><X className="size-4" /></button></div><div className="mt-3 grid gap-3 sm:grid-cols-3"><label><span className="mb-1 block font-mono text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Actual odds</span><input type="number" min="1.01" step="0.01" value={actualOdds || ''} onChange={event => setActualOdds(toNumber(event.target.value))} className="w-full rounded border bg-transparent px-3 py-2 font-mono text-sm" style={{ borderColor: 'var(--border-glass-strong)', color: 'var(--text-primary)' }} /></label><label><span className="mb-1 block font-mono text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Actual stake</span><input type="number" min={portfolio.settings.minimumStakeUnit} step={portfolio.settings.minimumStakeUnit} value={actualStake || ''} onChange={event => setActualStake(toNumber(event.target.value))} className="w-full rounded border bg-transparent px-3 py-2 font-mono text-sm" style={{ borderColor: 'var(--border-glass-strong)', color: 'var(--text-primary)' }} /></label><button type="button" disabled={actualOdds <= 1 || actualStake <= 0} onClick={confirmBet} className="self-end rounded px-3 py-2 text-xs font-semibold disabled:opacity-40" style={{ backgroundColor: 'var(--accent)', color: 'white' }}>Save pending bet</button></div></div>}

      <div className="glass mt-4 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="flex items-center gap-1.5 font-display text-sm font-semibold" style={{ color: 'var(--text-primary)' }}><Wallet className="size-4" /> Local portfolio</p><p className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>Stored only in this browser. It does not sync across devices unless you export and import it yourself.</p></div><div className="flex gap-2"><button type="button" onClick={exportPortfolio} className="glass flex items-center gap-1.5 px-2.5 py-1.5 text-xs" style={{ color: 'var(--text-primary)' }}><Download className="size-3.5" /> Export</button><button type="button" onClick={() => fileInput.current?.click()} className="glass flex items-center gap-1.5 px-2.5 py-1.5 text-xs" style={{ color: 'var(--text-primary)' }}><FileUp className="size-3.5" /> Import</button><input ref={fileInput} type="file" accept="application/json" onChange={importPortfolio} className="hidden" /></div></div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">{[['Cash', formatCurrency(metrics.cashBalance, currency)], ['Exposure', formatCurrency(metrics.pendingExposure, currency)], ['Settled P/L', formatCurrency(metrics.profitLoss, currency)], ['ROS', metrics.returnOnStakes === null ? '—' : percentage(metrics.returnOnStakes)]].map(([label, value]) => <div key={label} className="glass p-2.5"><p className="font-mono text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{label}</p><p className="mt-1 font-mono text-sm font-bold tabular" style={{ color: 'var(--text-primary)' }}>{value}</p></div>)}</div>
        <div className="mt-3 flex flex-wrap gap-2"><input aria-label="Cash flow amount" type="number" min="0" step={portfolio.settings.minimumStakeUnit} value={cashFlow || ''} onChange={event => setCashFlow(toNumber(event.target.value))} placeholder="Cash flow" className="w-32 rounded border bg-transparent px-2.5 py-1.5 font-mono text-xs" style={{ borderColor: 'var(--border-glass-strong)', color: 'var(--text-primary)' }} /><button type="button" onClick={() => addCashFlow('deposit')} className="glass px-2.5 py-1.5 text-xs" style={{ color: 'var(--text-primary)' }}>Deposit</button><button type="button" onClick={() => addCashFlow('withdrawal')} className="glass px-2.5 py-1.5 text-xs" style={{ color: 'var(--text-primary)' }}>Withdraw</button></div>
        {portfolio.bets.length > 0 && <div className="mt-4 space-y-2">{portfolio.bets.slice(0, 5).map(bet => <div key={bet.id} className="glass flex flex-wrap items-center justify-between gap-2 p-2.5 text-xs"><div><p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{bet.fixtureLabel} · {bet.selection.toUpperCase()}</p><p className="mt-0.5 font-mono tabular" style={{ color: 'var(--text-secondary)' }}>{bet.actualOdds.toFixed(2)} · {formatCurrency(bet.actualStake, currency)} · {bet.status}</p></div>{bet.status === 'pending' && <div className="flex gap-1"><button type="button" onClick={() => settle(bet.id, 'won')} className="glass px-2 py-1" style={{ color: 'var(--win)' }}>Won</button><button type="button" onClick={() => settle(bet.id, 'lost')} className="glass px-2 py-1" style={{ color: 'var(--lose)' }}>Lost</button><button type="button" onClick={() => settle(bet.id, 'void')} className="glass px-2 py-1" style={{ color: 'var(--text-secondary)' }}>Void</button></div>}</div>)}</div>}
      </div>

      <p className="mt-4 text-[11px] leading-5" style={{ color: 'var(--text-muted)' }}><strong style={{ color: 'var(--text-secondary)' }}>Personal-use notice.</strong> By using this workspace, you confirm that you meet the age requirements where you live. It is a mathematical analysis and record-keeping tool, not a betting service. It does not place bets or determine whether betting is lawful in your jurisdiction.</p>
    </section>
  );
}
