import { useMemo, useState } from 'react';
import { Copy, ExternalLink, Share2, X } from 'lucide-react';
import type { Fixture } from '../types';
import { BOOKMAKERS, buildSlipItems, formatSlipText, generatePredictionCode, totalOdds } from '../lib/betting';

interface BetSlipModalProps {
  open: boolean;
  fixtures: Fixture[];
  dateStr: string;
  onClose: () => void;
}

export function BetSlipModal({ open, fixtures, dateStr, onClose }: BetSlipModalProps) {
  const [stake, setStake] = useState(100);
  const [copied, setCopied] = useState(false);

  const items = useMemo(() => buildSlipItems(fixtures), [fixtures]);
  const code = useMemo(() => generatePredictionCode(items, dateStr), [items, dateStr]);
  const odds = useMemo(() => totalOdds(items), [items]);
  const slipText = useMemo(() => formatSlipText(items, code, dateStr), [items, code, dateStr]);

  if (!open) return null;

  async function copySlip() {
    try {
      await navigator.clipboard.writeText(slipText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 backdrop-blur-sm sm:items-center sm:p-6"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
      onClick={onClose}
    >
      <div
        className="glass-strong my-8 w-full max-w-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b p-4" style={{ borderColor: 'var(--border-glass)' }}>
          <div>
            <h3 className="font-display text-base font-bold" style={{ color: 'var(--text-primary)' }}>
              🎯 Prediction Slip
            </h3>
            <p className="font-mono text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
              {dateStr} · {items.length} pick{items.length === 1 ? '' : 's'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="glass glass-hover flex size-8 items-center justify-center"
            aria-label="Close bet slip"
          >
            <X className="size-4" style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>

        <div className="space-y-4 p-4">
          {items.length === 0 ? (
            <p className="py-6 text-center text-xs" style={{ color: 'var(--text-secondary)' }}>
              Tick games with the checkboxes on fixture cards to build a slip.
            </p>
          ) : (
            <>
              <ul className="space-y-2">
                {items.map((i) => (
                  <li key={i.fixtureId} className="glass px-3 py-2 text-xs">
                    <p className="truncate font-medium" style={{ color: 'var(--text-primary)' }}>{i.matchLabel}</p>
                    <div className="mt-0.5 flex items-center justify-between font-mono text-[10px]">
                      <span style={{ color: 'var(--win)' }}>{i.pick.toUpperCase()}</span>
                      <span className="tabular" style={{ color: 'var(--text-muted)' }}>@ {i.odds.toFixed(2)} ({i.probability}%)</span>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="grid grid-cols-3 gap-2 text-center font-mono">
                <div className="glass px-2 py-2">
                  <p className="text-sm font-bold tabular" style={{ color: 'var(--text-primary)' }}>{odds.toFixed(2)}</p>
                  <p className="text-[9px] uppercase" style={{ color: 'var(--text-muted)' }}>Total odds</p>
                </div>
                <div className="glass px-2 py-2">
                  <input
                    type="number"
                    min={50}
                    step={50}
                    value={stake}
                    onChange={(e) => setStake(Math.max(0, Number(e.target.value)))}
                    className="w-full border-none bg-transparent text-center text-sm font-bold outline-none tabular"
                    style={{ color: 'var(--text-primary)' }}
                    aria-label="Stake amount"
                  />
                  <p className="text-[9px] uppercase" style={{ color: 'var(--text-muted)' }}>Stake (₦)</p>
                </div>
                <div className="glass px-2 py-2">
                  <p className="text-sm font-bold tabular" style={{ color: 'var(--win)' }}>
                    ₦{Math.round(stake * odds).toLocaleString()}
                  </p>
                  <p className="text-[9px] uppercase" style={{ color: 'var(--text-muted)' }}>Potential</p>
                </div>
              </div>

              <div className="glass flex items-center justify-between gap-2 px-3 py-2.5">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                    Prediction code (ours — not a bookie booking code)
                  </p>
                  <p className="font-mono text-lg font-bold tracking-wider" style={{ color: 'var(--accent-text)' }}>{code}</p>
                </div>
                <button
                  onClick={copySlip}
                  className={`glass glass-hover flex shrink-0 items-center gap-1.5 border px-3 py-1.5 font-mono text-[10px] uppercase tracking-wide transition-colors ${copied ? 'ring-1' : ''}`}
                  style={{ borderColor: copied ? 'var(--win)' : 'var(--border-glass)', color: copied ? 'var(--win)' : 'var(--text-primary)' }}
                >
                  <Copy className="size-3.5" />
                  {copied ? 'Copied!' : 'Copy slip'}
                </button>
              </div>

              <a
                href={`https://wa.me/?text=${encodeURIComponent(slipText)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="glass glass-hover flex w-full items-center justify-center gap-2 py-2 font-mono text-[11px] uppercase tracking-wide transition-colors"
                style={{ color: 'var(--accent-text)' }}
              >
                <Share2 className="size-4" />
                Share on WhatsApp
              </a>

              <div>
                <p className="mb-1.5 font-mono text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                  Add these picks manually at:
                </p>
                <div className="flex flex-wrap gap-2">
                  {BOOKMAKERS.map((b) => (
                    <a
                      key={b.name}
                      href={b.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="glass glass-hover flex items-center gap-1 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-wide transition-colors"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {b.name}
                      <ExternalLink className="size-3" />
                    </a>
                  ))}
                </div>
              </div>

              <p className="text-center text-[9px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                Odds are model-implied estimates, not bookmaker offers. Real booking codes require each operator's own API. 18+. Bet responsibly.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
