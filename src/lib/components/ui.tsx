import { cn } from '../utils';

export function Spinner({ className }: { className?: string }) {
  return (
    <div className={cn('w-5 h-5 rounded-full border-2 border-current/20 border-t-current animate-spin', className)} />
  );
}

export function LoadingScreen({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="p-16 text-center">
      <Spinner className="mx-auto mb-3 text-[#c9972a]" />
      <p className="text-[#7a6e60] dark:text-[#a09070] text-sm font-mono">{text}</p>
    </div>
  );
}

export function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="p-3.5 bg-red-50 dark:bg-red-900/15 text-red-700 dark:text-red-400 text-sm rounded-xl border border-red-200/70 dark:border-red-800/50 font-body">
      ⚠ {message}
    </div>
  );
}

export function StepHeader({ step, title }: { step: number; title: string }) {
  return (
    <h2 className="text-base font-semibold mb-3 flex items-center gap-3 text-[#1a1612] dark:text-[#f5f0e8]">
      <span className="w-6 h-6 rounded-full bg-gradient-to-br from-[#c9972a] to-[#8a6010] text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-sm">
        {step}
      </span>
      {title}
    </h2>
  );
}

export function StatusBadge({ status, className }: { status: 'available' | 'rented' | 'maintenance'; className?: string }) {
  const cfg = {
    available:   { dot: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200/50 dark:border-emerald-800/50' },
    rented:      { dot: 'bg-amber-500',   text: 'text-amber-700   dark:text-amber-400',   bg: 'bg-amber-50   dark:bg-amber-900/20   border-amber-200/50   dark:border-amber-800/50'   },
    maintenance: { dot: 'bg-red-500',     text: 'text-red-700     dark:text-red-400',     bg: 'bg-red-50     dark:bg-red-900/20     border-red-200/50     dark:border-red-800/50'     },
  }[status];

  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border', cfg.bg, cfg.text, className)}>
      <span className={cn('w-1.5 h-1.5 rounded-full', cfg.dot, status === 'available' && 'animate-pulse')} />
      {status}
    </span>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-12 px-6 bg-[#f5f0e8]/50 dark:bg-[#1a1612]/50 rounded-2xl border border-[#c9b99a]/20 dark:border-[#c9b99a]/10">
      <p className="text-[#7a6e60] dark:text-[#a09070] text-sm">{message}</p>
    </div>
  );
}

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn(
      'bg-white/70 dark:bg-[#1a1612]/70 rounded-2xl border border-[#c9b99a]/25 dark:border-[#c9b99a]/10',
      'shadow-[0_2px_16px_rgba(26,22,18,0.06)] dark:shadow-[0_2px_16px_rgba(0,0,0,0.3)]',
      'backdrop-blur-sm',
      className
    )}>
      {children}
    </div>
  );
}

// alias
export const SectionCard = Card;
