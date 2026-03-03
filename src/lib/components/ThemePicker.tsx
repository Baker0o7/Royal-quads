import { useState } from 'react';
import { Palette, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme, THEMES } from '../ThemeContext';

export function ThemePicker() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Choose theme"
        className="p-2.5 rounded-xl transition-all duration-200 hover:scale-105"
        style={{ color: 'var(--t-muted)' }}
      >
        <Palette style={{ width: 18, height: 18 }} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
              onClick={() => setOpen(false)}
            />

            {/* Sheet */}
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto rounded-t-3xl p-6 pb-10 shadow-2xl"
              style={{ background: 'var(--t-bg)', borderTop: '1px solid var(--t-border)' }}
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="font-display font-bold text-lg" style={{ color: 'var(--t-text)' }}>Choose Theme</h2>
                  <p className="font-mono text-[10px] uppercase tracking-wider mt-0.5" style={{ color: 'var(--t-muted)' }}>
                    {THEMES.length} themes available
                  </p>
                </div>
                <button onClick={() => setOpen(false)}
                  className="p-2 rounded-xl"
                  style={{ background: 'var(--t-bg2)', color: 'var(--t-muted)' }}>
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {THEMES.map(t => {
                  const active = theme === t.id;
                  return (
                    <button key={t.id} onClick={() => { setTheme(t.id); }}
                      className="relative p-3.5 rounded-2xl border text-left transition-all duration-150 active:scale-[0.97] overflow-hidden"
                      style={{
                        background: t.vars['--t-bg'],
                        borderColor: active ? t.vars['--t-accent'] : t.vars['--t-border'],
                        boxShadow: active ? `0 0 0 2px ${t.vars['--t-accent']}` : undefined,
                      }}>
                      {/* Mini preview strip */}
                      <div className="flex gap-1 mb-2.5">
                        {[t.vars['--t-accent'], t.vars['--t-accent2'], t.vars['--t-hero-from']].map((c, i) => (
                          <div key={i} className="h-2 rounded-full flex-1" style={{ background: c }} />
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{t.emoji}</span>
                        <div>
                          <p className="font-semibold text-xs" style={{ color: t.vars['--t-text'] }}>{t.label}</p>
                          <p className="font-mono text-[9px]" style={{ color: t.vars['--t-muted'] }}>
                            {t.dark ? 'Dark' : 'Light'}
                          </p>
                        </div>
                      </div>
                      {active && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                          style={{ background: t.vars['--t-accent'] }}>
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
