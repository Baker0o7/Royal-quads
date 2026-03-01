import { cn } from './utils';

export function Spinner({ className }: { className?: string }) {
  return (
    <div className={cn(
      'w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin',
      className
    )} />
  );
}

export function LoadingScreen({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="p-12 text-center text-stone-400 animate-pulse text-sm">{text}</div>
  );
}

export function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="p-3 bg-red-50 text-red-700 text-sm rounded-xl border border-red-200">
      {message}
    </div>
  );
}

export function StepHeader({ step, title }: { step: number; title: string }) {
  return (
    <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
      <span className="bg-stone-200 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
        {step}
      </span>
      {title}
    </h2>
  );
}

interface StatusBadgeProps {
  status: 'available' | 'rented' | 'maintenance';
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const styles = {
    available:   'bg-emerald-100 text-emerald-700',
    rented:      'bg-amber-100   text-amber-700',
    maintenance: 'bg-red-100     text-red-700',
  };
  return (
    <span className={cn('px-3 py-1 rounded-full text-xs font-bold uppercase', styles[status], className)}>
      {status}
    </span>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center p-8 bg-white rounded-3xl border border-stone-200 text-stone-500 text-sm">
      {message}
    </div>
  );
}

export function SectionCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('bg-white p-5 rounded-3xl border border-stone-200 shadow-sm', className)}>
      {children}
    </div>
  );
}
