// ── Notification system ───────────────────────────────────────────────────────

export type NotifType =
  | 'ride_started'
  | 'ride_complete'
  | 'overtime'
  | 'deposit_due'
  | 'prebook_confirmed'
  | 'prebook_reminder'
  | 'waiver_signed'
  | 'info';

export interface AppNotif {
  id:        string;
  type:      NotifType;
  title:     string;
  body:      string;
  timestamp: string;
  read:      boolean;
  link?:     string;
}

const KEY = 'rq:notifications';

function load(): AppNotif[] {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}
function save(n: AppNotif[]) {
  try { localStorage.setItem(KEY, JSON.stringify(n.slice(0, 60))); }
  catch (e) { console.warn('[notifications] localStorage save failed:', e); }
}

export const notifications = {
  getAll: (): AppNotif[] => load().sort((a, b) => b.timestamp.localeCompare(a.timestamp)),
  getUnreadCount: (): number => load().filter(n => !n.read).length,

  add: (type: NotifType, title: string, body: string, link?: string): AppNotif => {
    const n: AppNotif = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
      type, title, body, timestamp: new Date().toISOString(), read: false, link,
    };
    save([n, ...load()]);
    // Browser notification if permission granted
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      try { new Notification(title, { body, icon: '/logo.png', tag: n.id }); } catch {}
    }
    return n;
  },

  markRead: (id: string) => save(load().map(n => n.id === id ? { ...n, read: true } : n)),
  markAllRead: () => save(load().map(n => ({ ...n, read: true }))),
  remove: (id: string) => save(load().filter(n => n.id !== id)),
  clear: () => save([]),

  requestPermission: async () => {
    if (typeof Notification === 'undefined') return 'denied';
    if (Notification.permission === 'default') {
      return await Notification.requestPermission();
    }
    return Notification.permission;
  },
};

// ── Notification icons ────────────────────────────────────────────────────────
export const NOTIF_ICONS: Record<NotifType, string> = {
  ride_started:       '🏍️',
  ride_complete:      '✅',
  overtime:           '⏰',
  deposit_due:        '💰',
  prebook_confirmed:  '📅',
  prebook_reminder:   '🔔',
  waiver_signed:      '🛡️',
  info:               'ℹ️',
};
