import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { createPortal } from 'react-dom';
import { Bell, X, Trash2, CheckCheck } from 'lucide-react';
import { notifications, NOTIF_ICONS, type AppNotif } from '../notifications';
import { useNavigate } from 'react-router-dom';

function timeAgo(ts: string): string {
  const s = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (s < 60)  return 'just now';
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
}

export function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen]     = useState(false);
  const [items, setItems]   = useState<AppNotif[]>([]);
  const [unread, setUnread] = useState(0);

  const refresh = () => {
    setItems(notifications.getAll());
    setUnread(notifications.getUnreadCount());
  };

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 3000);
    return () => clearInterval(t);
  }, []);

  const handleOpen = () => { setOpen(true); refresh(); };
  const handleRead = (n: AppNotif) => {
    notifications.markRead(n.id);
    refresh();
    if (n.link) { setOpen(false); navigate(n.link); }
  };
  const handleMarkAll = () => { notifications.markAllRead(); refresh(); };
  const handleDelete  = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    notifications.remove(id);
    refresh();
  };
  const handleClear = () => { notifications.clear(); refresh(); };

  const panel = (
    <AnimatePresence>
      {open && (
        <>
          <motion.div key="bd" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998]"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
            onClick={() => setOpen(false)} />

          <motion.div key="panel"
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 320 }}
            className="fixed bottom-0 left-0 right-0 z-[9999] mx-auto rounded-t-3xl shadow-2xl overflow-hidden"
            style={{ maxWidth: '28rem', background: 'var(--t-bg)', borderTop: '1px solid var(--t-border)', maxHeight: '75vh', display: 'flex', flexDirection: 'column' }}>

            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full" style={{ background: 'var(--t-border)' }} />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 shrink-0"
              style={{ borderBottom: '1px solid var(--t-border)' }}>
              <div>
                <h2 className="font-display font-bold text-base" style={{ color: 'var(--t-text)' }}>Notifications</h2>
                {unread > 0 && (
                  <p className="font-mono text-[10px]" style={{ color: 'var(--t-muted)' }}>{unread} unread</p>
                )}
              </div>
              <div className="flex gap-2">
                {unread > 0 && (
                  <button onClick={handleMarkAll}
                    className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1.5 rounded-lg transition-opacity hover:opacity-70"
                    style={{ background: 'color-mix(in srgb, var(--t-accent) 12%, transparent)', color: 'var(--t-accent)' }}>
                    <CheckCheck className="w-3 h-3" /> Mark all read
                  </button>
                )}
                {items.length > 0 && (
                  <button onClick={handleClear}
                    className="p-1.5 rounded-lg transition-opacity hover:opacity-70"
                    style={{ background: 'var(--t-bg2)', color: 'var(--t-muted)' }}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
                <button onClick={() => setOpen(false)}
                  className="p-1.5 rounded-lg"
                  style={{ background: 'var(--t-bg2)', color: 'var(--t-muted)' }}>
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="overflow-y-auto flex-1 pb-8">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <Bell className="w-10 h-10" style={{ color: 'var(--t-border)' }} />
                  <p className="text-sm font-medium" style={{ color: 'var(--t-muted)' }}>No notifications yet</p>
                </div>
              ) : (
                items.map(n => (
                  <motion.div key={n.id} layout
                    onClick={() => handleRead(n)}
                    className="flex items-start gap-3 px-5 py-4 cursor-pointer transition-colors"
                    style={{
                      background: n.read ? 'transparent' : 'color-mix(in srgb, var(--t-accent) 5%, transparent)',
                      borderBottom: '1px solid var(--t-border)',
                    }}>
                    <span className="text-xl shrink-0 mt-0.5">{NOTIF_ICONS[n.type]}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-sm leading-snug" style={{ color: 'var(--t-text)' }}>
                          {n.title}
                        </p>
                        {!n.read && (
                          <span className="w-2 h-2 rounded-full shrink-0 mt-1.5"
                            style={{ background: 'var(--t-accent)' }} />
                        )}
                      </div>
                      <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--t-muted)' }}>{n.body}</p>
                      <p className="font-mono text-[10px] mt-1.5" style={{ color: 'var(--t-muted)', opacity: 0.6 }}>
                        {timeAgo(n.timestamp)}
                      </p>
                    </div>
                    <button onClick={e => handleDelete(n.id, e)}
                      className="shrink-0 p-1 rounded-lg transition-opacity hover:opacity-70 mt-0.5"
                      style={{ color: 'var(--t-muted)' }}>
                      <X className="w-3 h-3" />
                    </button>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <button onClick={handleOpen}
        className="relative p-2.5 rounded-xl transition-all hover:opacity-70"
        style={{ color: 'var(--t-muted)' }}>
        <Bell style={{ width: 18, height: 18 }} />
        <AnimatePresence>
          {unread > 0 && (
            <motion.span key="badge" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
              className="absolute top-1.5 right-1.5 min-w-[16px] h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white px-1"
              style={{ background: '#ef4444', lineHeight: 1 }}>
              {unread > 9 ? '9+' : unread}
            </motion.span>
          )}
        </AnimatePresence>
      </button>
      {typeof document !== 'undefined' && createPortal(panel, document.body)}
    </>
  );
}
