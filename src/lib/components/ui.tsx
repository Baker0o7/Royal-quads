import { cn } from '../utils';

export function Spinner({ className }: { className?: string }) {
  return <div className={cn('w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin', className)} />;
}

export function LoadingScreen({ text = 'Loading...' }: { text?: string }) {
  return <div className="p-12 text-center text-stone-400 dark:text-stone-500 animate-pulse text-sm">{text}</div>;
}

export function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm rounded-xl border border-red-200 dark:border-red-800">
      {message}
    </div>
  );
}

export function StepHeader({ step, title }: { step: number; title: string }) {
  return (
    <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
      <span className="bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-200 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
        {step}
      </span>
      {title}
    </h2>
  );
}

export function StatusBadge({ status, className }: { status: 'available' | 'rented' | 'maintenance'; className?: string }) {
  const styles = {
    available:   'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400',
    rented:      'bg-amber-100   dark:bg-amber-900/40   text-amber-700   dark:text-amber-400',
    maintenance: 'bg-red-100     dark:bg-red-900/40     text-red-700     dark:text-red-400',
  };
  return (
    <span className={cn('px-3 py-1 rounded-full text-xs font-bold uppercase', styles[status], className)}>
      {status}
    </span>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center p-8 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400 text-sm">
      {message}
    </div>
  );
}

export function SectionCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('bg-white dark:bg-stone-900 p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm', className)}>
      {children}
    </div>
  );
}
