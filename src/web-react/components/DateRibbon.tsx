interface DateRibbonProps {
  dates: { label: string; sub: string; value: string }[];
  selected: string;
  onSelect: (value: string) => void;
}

export function DateRibbon({ dates, selected, onSelect }: DateRibbonProps) {
  return (
    <section className="glass border-x-0 border-t-0">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-2 px-4 py-2.5">
        {dates.map((d) => {
          const active = d.value === selected;
          return (
            <button
              key={d.value}
              type="button"
              onClick={() => onSelect(d.value)}
              className="flex shrink-0 flex-col items-center border px-3.5 py-1.5 transition-colors"
              style={
                active
                  ? { borderColor: 'var(--border-glass-strong)', backgroundColor: 'var(--accent-soft)', color: 'var(--text-primary)' }
                  : { borderColor: 'transparent', color: 'var(--text-secondary)' }
              }
            >
              <span className="text-xs font-semibold">{d.label}</span>
              <span className="font-mono text-[10px] tabular">{d.sub}</span>
            </button>
          );
        })}
        <div className="ml-auto w-full shrink-0 sm:w-auto">
          <input
            type="date"
            value={selected}
            onChange={(e) => onSelect(e.target.value)}
            aria-label="Pick a fixture date"
            className="glass w-full px-2.5 py-1.5 text-xs outline-none sm:w-auto"
            style={{ color: 'var(--text-primary)' }}
          />
        </div>
      </div>
    </section>
  );
}
