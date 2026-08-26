import { useEffect } from 'react';
import { X } from 'lucide-react';
import { LeagueList } from './LeagueList';
import type { Fixture, League } from '../types';

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  leagues: League[];
  activeCode: string | null;
  counts: Record<string, number>;
  onSelect: (code: string | null) => void;
  fixturesByLeague?: Record<string, Fixture[]>;
  onSelectGame?: (fixture: Fixture) => void;
}

export function MobileMenu({ open, onClose, leagues, activeCode, counts, onSelect, fixturesByLeague, onSelectGame }: MobileMenuProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="League filter menu">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Close menu"
        onClick={onClose}
      />
      <aside className="glass absolute left-0 top-0 flex h-full w-[min(100%,20rem)] flex-col border-y-0 border-l-0 shadow-xl">
        <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: 'var(--border-glass)' }}>
          <span className="font-display text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Filter by competition
          </span>
          <button
            type="button"
            onClick={onClose}
            className="glass flex size-8 items-center justify-center"
            aria-label="Close menu"
          >
            <X className="size-4" style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <LeagueList
            leagues={leagues}
            activeCode={activeCode}
            counts={counts}
            onSelect={onSelect}
            onItemSelect={onClose}
            fixturesByLeague={fixturesByLeague}
            onSelectGame={(f) => {
              onClose();
              onSelectGame?.(f);
            }}
          />
        </div>
      </aside>
    </div>
  );
}
