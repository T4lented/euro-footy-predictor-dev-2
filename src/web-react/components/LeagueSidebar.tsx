import { LeagueList } from './LeagueList';
import type { Fixture, League } from '../types';

interface LeagueSidebarProps {
  leagues: League[];
  activeCode: string | null;
  counts: Record<string, number>;
  onSelect: (code: string | null) => void;
  fixturesByLeague?: Record<string, Fixture[]>;
  onSelectGame?: (fixture: Fixture) => void;
}

export function LeagueSidebar({ leagues, activeCode, counts, onSelect, fixturesByLeague, onSelectGame }: LeagueSidebarProps) {
  return (
    <aside className="glass hidden shrink-0 border-y-0 border-l-0 lg:block lg:w-64">
      <div className="sticky top-[73px] max-h-[calc(100vh-73px)] overflow-y-auto p-4">
        <LeagueList
          leagues={leagues}
          activeCode={activeCode}
          counts={counts}
          onSelect={onSelect}
          fixturesByLeague={fixturesByLeague}
          onSelectGame={onSelectGame}
        />
      </div>
    </aside>
  );
}
