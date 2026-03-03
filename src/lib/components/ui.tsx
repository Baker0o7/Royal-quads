import { cn } from '../utils';

export function Spinner({ className }: { className?: string }) {
  return (
    <div className={cn('w-5 h-5 rounded-full border-2 border-current/20 border-t-current animate-spin', className)} />
  );
}

export function LoadingScreen({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="p-16 text-center">
      <Spinner className="mx-auto mb-3" style={{ color: 'var(--t-accent)' } as React.CSSProperties} />
      <p className="text-sm font-mono" style={{ color: 'var(--t-muted)' }}>{text}</p>
    </div>
  );
}

export function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="p-3.5 rounded-xl border text-sm font-body"
      style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444', borderColor: 'rgba(239,68,68,0.2)' }}>
      ⚠ {message}
    </div>
  );
}

export function StepHeader({ step, title }: { step: number; title: string }) {
  return (
    <h2 className="text-base font-semibold mb-3 flex items-center gap-3" style={{ color: 'var(--t-text)' }}>
      <span className="w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-sm"
        style={{ background: `linear-gradient(135deg, var(--t-accent2), var(--t-accent))` }}>
        {step}
      </span>
      {title}
    </h2>
  );
}

export function StatusBadge({ status, className }: { status: 'available' | 'rented' | 'maintenance'; className?: string }) {
  const cfg = {
    available:   { dot: '#22c55e', color: '#16a34a', bg: 'rgba(34,197,94,0.10)',  border: 'rgba(34,197,94,0.25)' },
    rented:      { dot: '#f59e0b', color: '#d97706', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.25)' },
    maintenance: { dot: '#ef4444', color: '#dc2626', bg: 'rgba(239,68,68,0.10)',  border: 'rgba(239,68,68,0.25)' },
  }[status];
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border', className)}
      style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.border }}>
      <span className="w-1.5 h-1.5 rounded-full"
        style={{ background: cfg.dot, animation: status === 'available' ? 'pulse 2s infinite' : undefined }} />
      {status}
    </span>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-12 px-6 rounded-2xl border"
      style={{ background: 'color-mix(in srgb, var(--t-bg) 60%, transparent)', borderColor: 'var(--t-border)', color: 'var(--t-muted)' }}>
      <p className="text-sm">{message}</p>
    </div>
  );
}

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-2xl border backdrop-blur-sm shadow-sm', className)}
      style={{ background: 'var(--t-card)', borderColor: 'var(--t-border)' }}>
      {children}
    </div>
  );
}

export const SectionCard = Card;
