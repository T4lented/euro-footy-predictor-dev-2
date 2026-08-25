import { useEffect, useMemo, useRef, useState } from 'react';
import { Download, FileUp, Plus, Wallet, Trash2 } from 'lucide-react';
import {
  createPortfolio,
  formatCurrency,
  loadPortfolio,
  MINIMUM_STAKE_UNITS,
  parsePortfolio,
  portfolioMetrics,
  savePortfolio,
  type BetStatus,
  type CurrencyCode,
  type PortfolioState,
} from '../lib/portfolio';

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

function timeAgo(ts: number) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function PortfolioTrackerPage() {
  const [portfolio, setPortfolio] = useState<PortfolioState>(() => loadPortfolio());
  const [cashFlow, setCashFlow] = useState(0);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => { savePortfolio(portfolio); }, [portfolio]);

  const metrics = useMemo(() => portfolioMetrics(portfolio), [portfolio]);
  const currency = portfolio.settings.currency;

  function updateSettings(patch: Partial<PortfolioState['settings']>) {
    setPortfolio(current => ({ ...current, settings: { ...current.settings, ...patch } }));
  }

  function settle(id: string, status: Exclude<BetStatus, 'pending'>) {
    setPortfolio(current => ({
      ...current,
      bets: current.bets.map(bet =>
        bet.id === id ? { ...bet, status, settledAt: Date.now() } : bet
      ),
    }));
  }

  function removeBet(id: string) {
    setPortfolio(current => ({
      ...current,
      bets: current.bets.filter(bet => bet.id !== id),
    }));
  }

  function removeCashFlow(id: string) {
    setPortfolio(current => ({
      ...current,
      cashFlows: current.cashFlows.filter(cf => cf.id !== id),
    }));
  }

  function addCashFlow(kind: 'deposit' | 'withdrawal') {
    if (cashFlow <= 0) return;
    setPortfolio(current => ({
      ...current,
      cashFlows: [{ id: nextId(), kind, amount: cashFlow, createdAt: Date.now() }, ...current.cashFlows],
    }));
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

  function resetPortfolio() {
    if (confirm('This will clear all bets, cash flows, and settings. Are you sure?')) {
      setPortfolio(createPortfolio(portfolio.settings.currency));
    }
  }

  const pendingBets = portfolio.bets.filter(b => b.status === 'pending');
  const settledBets = portfolio.bets.filter(b => b.status !== 'pending');

  return (
    <div className="mx-auto w-full max-w-5xl p-4 sm:p-6">
      <div className="mb-6">
        <h2 className="font-display text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Portfolio Tracker</h2>
        <p className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
          Track your bets, manage your bankroll, and monitor performance. All data is stored locally in your browser.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Cash Balance', value: formatCurrency(metrics.cashBalance, currency), color: 'var(--text-primary)' },
          { label: 'Pending Exposure', value: formatCurrency(metrics.pendingExposure, currency), color: 'var(--lose)' },
          { label: 'Settled P/L', value: formatCurrency(metrics.profitLoss, currency), color: metrics.profitLoss >= 0 ? 'var(--win)' : 'var(--lose)' },
          { label: 'Return on Stakes', value: metrics.returnOnStakes === null ? '—' : percentage(metrics.returnOnStakes), color: metrics.returnOnStakes !== null && metrics.returnOnStakes >= 0 ? 'var(--win)' : 'var(--lose)' },
        ].map(({ label, value, color }) => (
          <div key={label} className="glass p-4">
            <p className="font-mono text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{label}</p>
            <p className="mt-1 font-mono text-lg font-bold tabular" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="glass p-4">
          <p className="mb-3 font-mono text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Bankroll Settings</p>
          <div className="space-y-3">
            <label className="block">
              <span className="mb-1 block font-mono text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Bankroll ({currency})</span>
              <input type="number" min="0" step={portfolio.settings.minimumStakeUnit} value={portfolio.settings.bankroll || ''}
                onChange={(e) => updateSettings({ bankroll: toNumber(e.target.value) })}
                className="w-full rounded border bg-transparent px-3 py-2 font-mono text-sm"
                style={{ borderColor: 'var(--border-glass-strong)', color: 'var(--text-primary)' }}
              />
            </label>
            <label className="block">
              <span className="mb-1 block font-mono text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Currency</span>
              <select value={currency}
                onChange={(e) => {
                  const next = e.target.value as CurrencyCode;
                  updateSettings({ currency: next, minimumStakeUnit: MINIMUM_STAKE_UNITS[next] });
                }}
                className="w-full rounded border bg-transparent px-3 py-2 font-mono text-sm"
                style={{ borderColor: 'var(--border-glass-strong)', color: 'var(--text-primary)' }}
              >
                <option value="GBP">GBP (£)</option>
                <option value="EUR">EUR (€)</option>
                <option value="USD">USD ($)</option>
                <option value="JPY">JPY (¥)</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block font-mono text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Minimum edge (%)</span>
              <input type="number" min="0" step="0.1" value={portfolio.settings.minimumEdgePercent}
                onChange={(e) => updateSettings({ minimumEdgePercent: toNumber(e.target.value) })}
                className="w-full rounded border bg-transparent px-3 py-2 font-mono text-sm"
                style={{ borderColor: 'var(--border-glass-strong)', color: 'var(--text-primary)' }}
              />
            </label>
            <label className="block">
              <span className="mb-1 block font-mono text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Maximum stake (optional)</span>
              <input type="number" min="0" step={portfolio.settings.minimumStakeUnit} value={portfolio.settings.maximumStake || ''}
                onChange={(e) => updateSettings({ maximumStake: toNumber(e.target.value) || undefined })}
                className="w-full rounded border bg-transparent px-3 py-2 font-mono text-sm"
                style={{ borderColor: 'var(--border-glass-strong)', color: 'var(--text-primary)' }}
              />
            </label>
          </div>
        </div>

        <div className="glass p-4">
          <p className="mb-3 font-mono text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Cash Flows</p>
          <div className="mb-3 flex gap-2">
            <input aria-label="Cash flow amount" type="number" min="0" step={portfolio.settings.minimumStakeUnit}
              value={cashFlow || ''} onChange={(e) => setCashFlow(toNumber(e.target.value))}
              placeholder="Amount"
              className="w-full rounded border bg-transparent px-3 py-2 font-mono text-sm"
              style={{ borderColor: 'var(--border-glass-strong)', color: 'var(--text-primary)' }}
            />
            <button onClick={() => addCashFlow('deposit')} className="glass shrink-0 px-3 py-2 text-xs font-semibold" style={{ color: 'var(--win)' }}>
              <Plus className="mr-1 inline size-3" />Deposit
            </button>
            <button onClick={() => addCashFlow('withdrawal')} className="glass shrink-0 px-3 py-2 text-xs font-semibold" style={{ color: 'var(--lose)' }}>
              Withdraw
            </button>
          </div>
          {portfolio.cashFlows.length > 0 && (
            <div className="max-h-48 space-y-1 overflow-y-auto">
              {portfolio.cashFlows.map((cf) => (
                <div key={cf.id} className="flex items-center justify-between rounded px-3 py-2 text-xs" style={{ backgroundColor: 'var(--surface)' }}>
                  <div>
                    <span className="font-semibold" style={{ color: cf.kind === 'deposit' ? 'var(--win)' : 'var(--lose)' }}>
                      {cf.kind === 'deposit' ? '+' : '-'}{formatCurrency(cf.amount, currency)}
                    </span>
                    <span className="ml-2" style={{ color: 'var(--text-muted)' }}>{timeAgo(cf.createdAt)}</span>
                  </div>
                  <button onClick={() => removeCashFlow(cf.id)} style={{ color: 'var(--text-muted)' }}>
                    <Trash2 className="size-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          {portfolio.cashFlows.length === 0 && (
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No cash flows recorded yet.</p>
          )}
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Wallet className="size-4" style={{ color: 'var(--text-secondary)' }} />
          <span className="font-display text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Bets ({portfolio.bets.length})
          </span>
        </div>
        <div className="flex gap-2">
          <button onClick={exportPortfolio} className="glass flex items-center gap-1.5 px-3 py-1.5 text-xs" style={{ color: 'var(--text-primary)' }}>
            <Download className="size-3.5" /> Export
          </button>
          <button onClick={() => fileInput.current?.click()} className="glass flex items-center gap-1.5 px-3 py-1.5 text-xs" style={{ color: 'var(--text-primary)' }}>
            <FileUp className="size-3.5" /> Import
          </button>
          <input ref={fileInput} type="file" accept="application/json" onChange={importPortfolio} className="hidden" />
          <button onClick={resetPortfolio} className="glass flex items-center gap-1.5 px-3 py-1.5 text-xs" style={{ color: 'var(--lose)' }}>
            <Trash2 className="size-3.5" /> Reset
          </button>
        </div>
      </div>

      {pendingBets.length > 0 && (
        <div className="mb-6">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
            Pending ({pendingBets.length})
          </p>
          <div className="space-y-2">
            {pendingBets.map((bet) => (
              <div key={bet.id} className="glass flex flex-wrap items-center justify-between gap-3 p-3">
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{bet.fixtureLabel}</p>
                  <p className="mt-0.5 font-mono text-xs tabular" style={{ color: 'var(--text-secondary)' }}>
                    {bet.selection.toUpperCase()} · {bet.actualOdds.toFixed(2)} · {formatCurrency(bet.actualStake, currency)}
                  </p>
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => settle(bet.id, 'won')} className="glass px-3 py-1.5 text-xs font-semibold" style={{ color: 'var(--win)' }}>Won</button>
                  <button onClick={() => settle(bet.id, 'lost')} className="glass px-3 py-1.5 text-xs font-semibold" style={{ color: 'var(--lose)' }}>Lost</button>
                  <button onClick={() => settle(bet.id, 'void')} className="glass px-3 py-1.5 text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Void</button>
                  <button onClick={() => removeBet(bet.id)} className="glass px-2 py-1.5" style={{ color: 'var(--text-muted)' }}>
                    <Trash2 className="size-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {settledBets.length > 0 && (
        <div>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
            Settled ({settledBets.length})
          </p>
          <div className="space-y-2">
            {settledBets.map((bet) => (
              <div key={bet.id} className="glass flex flex-wrap items-center justify-between gap-3 p-3 opacity-75">
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{bet.fixtureLabel}</p>
                  <p className="mt-0.5 font-mono text-xs tabular" style={{ color: 'var(--text-secondary)' }}>
                    {bet.selection.toUpperCase()} · {bet.actualOdds.toFixed(2)} · {formatCurrency(bet.actualStake, currency)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold" style={{
                    color: bet.status === 'won' ? 'var(--win)' : bet.status === 'lost' ? 'var(--lose)' : 'var(--text-secondary)'
                  }}>
                    {bet.status.toUpperCase()}
                  </span>
                  <span className="font-mono text-xs tabular" style={{
                    color: bet.status === 'won' ? 'var(--win)' : bet.status === 'lost' ? 'var(--lose)' : 'var(--text-secondary)'
                  }}>
                    {bet.status === 'won' ? `+${formatCurrency(bet.actualStake * (bet.actualOdds - 1), currency)}` :
                     bet.status === 'lost' ? `-${formatCurrency(bet.actualStake, currency)}` : '—'}
                  </span>
                  <button onClick={() => removeBet(bet.id)} style={{ color: 'var(--text-muted)' }}>
                    <Trash2 className="size-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {portfolio.bets.length === 0 && (
        <div className="glass p-8 text-center">
          <p className="font-display text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>No bets recorded</p>
          <p className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
            Use the Kelly Calculator to size and stage bets. They will appear here for tracking.
          </p>
        </div>
      )}

      <p className="mt-6 text-[11px] leading-5" style={{ color: 'var(--text-muted)' }}>
        <strong style={{ color: 'var(--text-secondary)' }}>Personal-use notice.</strong> This is a mathematical analysis and record-keeping tool, not a betting service. It does not place bets or determine whether betting is lawful in your jurisdiction.
      </p>
    </div>
  );
}