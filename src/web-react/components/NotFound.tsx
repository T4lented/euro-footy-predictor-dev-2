export function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>
        404
      </p>
      <h1 className="mt-2 font-display text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
        Page not found
      </h1>
      <p className="mt-2 max-w-sm text-sm" style={{ color: 'var(--text-secondary)' }}>
        This pitch doesn&apos;t exist. Head back to today&apos;s fixtures and predictions.
      </p>
      <a
        href="/"
        className="glass mt-6 px-5 py-2.5 text-sm font-semibold transition-colors"
        style={{ color: 'var(--accent-text)' }}
      >
        Back to fixtures
      </a>
    </div>
  );
}
