import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export type ToastVariant = 'success' | 'error';

interface ToastProps {
  message: string;
  variant: ToastVariant;
  onDismiss: () => void;
}

export function Toast({ message, variant, onDismiss }: ToastProps) {
  const isSuccess = variant === 'success';
  const Icon = isSuccess ? CheckCircle2 : AlertCircle;
  const color = isSuccess ? 'var(--win)' : 'var(--lose)';

  return (
    <div
      role="status"
      aria-live="polite"
      className="glass fixed bottom-4 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-start gap-2.5 px-4 py-3 shadow-lg sm:bottom-6"
      style={{ borderColor: color }}
    >
      <Icon className="mt-0.5 size-4 shrink-0" style={{ color }} aria-hidden="true" />
      <p className="flex-1 text-left text-sm" style={{ color: 'var(--text-primary)' }}>
        {message}
      </p>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 p-0.5"
        aria-label="Dismiss notification"
      >
        <X className="size-4" style={{ color: 'var(--text-muted)' }} />
      </button>
    </div>
  );
}
