import { Image as ImageIcon, Ticket, X } from 'lucide-react';

interface SelectionBarProps {
  count: number;
  onExportPng: () => void;
  onClear: () => void;
  slipCount: number;
  onOpenSlip: () => void;
}

export function SelectionBar({ count, onExportPng, onClear, slipCount, onOpenSlip }: SelectionBarProps) {
  if (count === 0 && slipCount === 0) return null;

  return (
    <div className="fixed bottom-5 left-1/2 z-40 -translate-x-1/2">
      <div className="glass-strong flex items-center gap-2 px-3 py-2 shadow-2xl">
        {count > 0 && (
          <>
            <span className="px-1 font-mono text-[11px] uppercase tracking-wide" style={{ color: 'var(--text-primary)' }}>
              {count} selected
            </span>
            <button
              onClick={onExportPng}
              className="flex items-center gap-1.5 border px-3 py-1.5 font-mono text-[10px] uppercase tracking-wide transition-colors"
              style={{ borderColor: 'var(--accent)', color: 'var(--text-primary)' }}
            >
              <ImageIcon className="size-3.5" />
              Export PNG
            </button>
            <button
              onClick={onClear}
              className="glass glass-hover p-1 transition-colors"
              style={{ color: 'var(--text-secondary)' }}
              aria-label="Clear selection"
            >
              <X className="size-3.5" />
            </button>
          </>
        )}
        {slipCount > 0 && (
          <>
            {count > 0 && <span style={{ color: 'var(--border-glass-strong)' }}>|</span>}
            <button
              onClick={onOpenSlip}
              className="flex items-center gap-1.5 border px-3 py-1.5 font-mono text-[10px] uppercase tracking-wide transition-colors"
              style={{ borderColor: 'var(--win)', color: 'var(--text-primary)' }}
            >
              <Ticket className="size-3.5" />
              Bet Slip ({slipCount})
            </button>
          </>
        )}
      </div>
    </div>
  );
}
