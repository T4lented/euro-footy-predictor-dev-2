import { Moon, Sun } from 'lucide-react';
import type { Theme } from '../hooks/useTheme';

interface ThemeToggleProps {
  theme: Theme;
  onToggle: () => void;
}

export function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  const isDark = theme === 'dark';
  return (
    <button
      onClick={onToggle}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      className="glass glass-hover flex size-9 shrink-0 items-center justify-center transition-colors"
      style={{ color: 'var(--text-secondary)' }}
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}
