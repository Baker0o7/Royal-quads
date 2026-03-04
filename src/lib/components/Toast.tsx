import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────
type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id:      string;
  type:    ToastType;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType, duration?: number) => void;
  success: (message: string) => void;
  error:   (message: string) => void;
  warning: (message: string) => void;
  info:    (message: string) => void;
}

// ── Context ───────────────────────────────────────────────────────────────────
const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

// ── Styles per type ───────────────────────────────────────────────────────────
const STYLES: Record<ToastType, { bg: string; border: string; color: string; icon: React.ReactNode }> = {
  success: {
    bg:     'rgba(22,163,74,0.12)',
    border: 'rgba(34,197,94,0.35)',
    color:  '#16a34a',
    icon:   <CheckCircle2 className="w-4 h-4 shrink-0" />,
  },
  error: {
    bg:     'rgba(239,68,68,0.12)',
    border: 'rgba(239,68,68,0.35)',
    color:  '#ef4444',
    icon:   <AlertTriangle className="w-4 h-4 shrink-0" />,
  },
  warning: {
    bg:     'rgba(245,158,11,0.12)',
    border: 'rgba(245,158,11,0.35)',
    color:  '#b45309',
    icon:   <AlertTriangle className="w-4 h-4 shrink-0" />,
  },
  info: {
    bg:     'color-mix(in srgb, var(--t-accent) 10%, transparent)',
    border: 'color-mix(in srgb, var(--t-accent) 30%, transparent)',
    color:  'var(--t-accent)',
    icon:   <Info className="w-4 h-4 shrink-0" />,
  },
};

// ── Single Toast item ─────────────────────────────────────────────────────────
function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const s = STYLES[toast.type];

  useEffect(() => {
    const t = setTimeout(() => onDismiss(toast.id), toast.duration ?? 3200);
    return () => clearTimeout(t);
  }, [toast, onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 60, scale: 0.94 }}
      animate={{ opacity: 1, y: 0,  scale: 1 }}
      exit={{   opacity: 0, y: 20,  scale: 0.94 }}
      transition={{ type: 'spring', damping: 28, stiffness: 340 }}
      className="flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg max-w-sm w-full mx-auto"
      style={{
        background:   s.bg,
        border:       `1px solid ${s.border}`,
        color:        s.color,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      {s.icon}
      <p className="flex-1 text-sm font-medium leading-snug">{toast.message}</p>
      <button onClick={() => onDismiss(toast.id)}
        className="shrink-0 opacity-60 hover:opacity-100 transition-opacity">
        <X className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
}

// ── Provider ──────────────────────────────────────────────────────────────────
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) =>
    setToasts(prev => prev.filter(t => t.id !== id)), []);

  const add = useCallback((message: string, type: ToastType = 'info', duration = 3200) => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
    setToasts(prev => [...prev.slice(-3), { id, type, message, duration }]);
  }, []);

  const ctx: ToastContextValue = {
    toast:   add,
    success: (m) => add(m, 'success'),
    error:   (m) => add(m, 'error', 4000),
    warning: (m) => add(m, 'warning'),
    info:    (m) => add(m, 'info'),
  };

  const stack = (
    <div className="fixed bottom-6 left-0 right-0 z-[99999] flex flex-col gap-2 px-4 pointer-events-none">
      <AnimatePresence mode="sync">
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} onDismiss={dismiss} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      {typeof document !== 'undefined' && createPortal(stack, document.body)}
    </ToastContext.Provider>
  );
}
