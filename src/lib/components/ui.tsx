import React from 'react';

export function Spinner({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-block w-5 h-5 rounded-full border-2 spinner ${className}`}
      style={{ borderColor: 'var(--t-border)', borderTopColor: 'var(--t-accent)' }} />
  );
}

export function LoadingScreen({ text = 'Loading…' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <Spinner />
      <p className="text-sm font-mono" style={{ color: 'var(--t-muted)' }}>{text}</p>
    </div>
  );
}

export function ErrorMessage({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div className="p-3.5 rounded-xl text-sm font-body"
      style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)' }}>
      ⚠ {message}
    </div>
  );
}

export function SuccessMessage({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div className="p-3.5 rounded-xl text-sm"
      style={{ background: 'rgba(34,197,94,0.1)', color: '#16a34a', border: '1px solid rgba(34,197,94,0.25)' }}>
      ✓ {message}
    </div>
  );
}

export function StepHeader({ step, title }: { step: number; title: string }) {
  return (
    <h2 className="text-base font-semibold mb-3 flex items-center gap-3" style={{ color: 'var(--t-text)' }}>
      <span className="w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center shrink-0 accent-gradient shadow-sm">
        {step}
      </span>
      {title}
    </h2>
  );
}

export function StatusBadge({ status, className = '' }: { status: 'available' | 'rented' | 'maintenance'; className?: string }) {
  const styles = {
    available:   { bg: 'rgba(34,197,94,0.12)',  color: '#16a34a', border: 'rgba(34,197,94,0.3)',  dot: '#22c55e' },
    rented:      { bg: 'rgba(245,158,11,0.12)', color: '#b45309', border: 'rgba(245,158,11,0.3)', dot: '#f59e0b' },
    maintenance: { bg: 'rgba(239,68,68,0.12)',  color: '#dc2626', border: 'rgba(239,68,68,0.3)',  dot: '#ef4444' },
  }[status];
  return (
    <span className={`pill ${className}`}
      style={{ background: styles.bg, color: styles.color, borderColor: styles.border }}>
      <span className="w-1.5 h-1.5 rounded-full"
        style={{ background: styles.dot, animation: status === 'available' ? 'pulse 2s infinite' : undefined }} />
      {status}
    </span>
  );
}

export function EmptyState({ icon = '🏜️', message }: { icon?: string; message: string }) {
  return (
    <div className="text-center py-12 px-6 rounded-2xl t-card"
      style={{ color: 'var(--t-muted)' }}>
      <p className="text-2xl mb-2">{icon}</p>
      <p className="text-sm">{message}</p>
    </div>
  );
}

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl t-card shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function SectionCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <Card className={`p-5 ${className}`}>{children}</Card>;
}

export function Divider() {
  return <div className="h-px" style={{ background: 'var(--t-border)' }} />;
}
