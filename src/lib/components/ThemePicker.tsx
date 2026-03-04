import React, { useState } from 'react';
import { Palette, Check, X, Moon, Sun } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { createPortal } from 'react-dom';
import { useTheme, THEMES } from '../ThemeContext';

export function ThemePicker() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  const current = THEMES.find(t => t.id === theme)!;

  const handleSelect = (id: typeof theme) => {
    setTheme(id);
    // Small delay so user sees the flash of the new theme before sheet closes
    setTimeout(() => setOpen(false), 120);
  };

  const modal = (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9998]"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
            onClick={() => setOpen(false)}
          />

          {/* Bottom sheet */}
          <motion.div
            key="sheet"
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 320, mass: 0.8 }}
            className="fixed bottom-0 left-0 right-0 z-[9999] mx-auto rounded-t-3xl shadow-2xl overflow-hidden"
            style={{
              maxWidth: '28rem',
              background: 'var(--t-bg)',
              borderTop: '1px solid var(--t-border)',
            }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full" style={{ background: 'var(--t-border)' }} />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-2 pb-4">
              <div>
                <h2 className="font-display font-bold text-lg" style={{ color: 'var(--t-text)' }}>
                  Choose Theme
                </h2>
                <p className="font-mono text-[10px] tracking-wider mt-0.5" style={{ color: 'var(--t-muted)' }}>
                  Active: {current.emoji} {current.label}
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center transition-opacity hover:opacity-70"
                style={{ background: 'var(--t-bg2)', color: 'var(--t-muted)' }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Grid */}
            <div className="px-5 pb-10 grid grid-cols-2 gap-2.5">
              {THEMES.map(t => {
                const active = theme === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => handleSelect(t.id)}
                    className="relative rounded-2xl p-3.5 text-left transition-all duration-150 active:scale-[0.96] overflow-hidden"
                    style={{
                      background: t.vars['--t-bg'],
                      border: `2px solid ${active ? t.vars['--t-accent'] : t.vars['--t-border']}`,
                      boxShadow: active
                        ? `0 0 0 1px ${t.vars['--t-accent']}, 0 4px 16px ${t.vars['--t-accent']}30`
                        : '0 1px 4px rgba(0,0,0,0.08)',
                    }}
                  >
                    {/* Color swatch strip */}
                    <div className="flex gap-1 mb-3 rounded-lg overflow-hidden h-2">
                      <div className="flex-1 rounded-full" style={{ background: t.vars['--t-accent'] }} />
                      <div className="flex-1 rounded-full" style={{ background: t.vars['--t-accent2'] }} />
                      <div className="flex-1 rounded-full" style={{ background: t.vars['--t-hero-from'] }} />
                    </div>

                    {/* Label row */}
                    <div className="flex items-center gap-2">
                      <span className="text-lg leading-none">{t.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-xs truncate" style={{ color: t.vars['--t-text'] }}>
                          {t.label}
                        </p>
                        <div className="flex items-center gap-1 mt-0.5" style={{ color: t.vars['--t-muted'] }}>
                          {t.dark
                            ? <Moon  className="w-2.5 h-2.5" />
                            : <Sun   className="w-2.5 h-2.5" />}
                          <span className="font-mono text-[9px]">{t.dark ? 'Dark' : 'Light'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Active checkmark */}
                    {active && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full flex items-center justify-center shadow-md"
                        style={{ background: t.vars['--t-accent'] }}
                      >
                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                      </motion.div>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        title={`Theme: ${current.label}`}
        className="p-2.5 rounded-xl transition-all duration-200 hover:opacity-70 active:scale-95 relative"
        style={{ color: 'var(--t-muted)' }}
      >
        <Palette style={{ width: 18, height: 18 }} />
        {/* Tiny accent dot showing current theme color */}
        <span
          className="absolute bottom-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
          style={{ background: 'var(--t-accent)' }}
        />
      </button>

      {/* Portal to body so z-index works correctly */}
      {typeof document !== 'undefined' && createPortal(modal, document.body)}
    </>
  );
}
