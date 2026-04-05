/**
 * Google Sign-In — web GSI for all platforms (browser + Capacitor WebView).
 */
import type { User } from '../types';

declare global {
  interface Window {
    _gsiCallback?: ((r: { credential: string }) => void) | null;
    onGoogleLibraryLoad?: () => void;
    google?: {
      accounts: {
        id: {
          initialize:        (cfg: object) => void;
          renderButton:      (el: HTMLElement, cfg: object) => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}

export interface GoogleProfile { sub: string; name: string; email: string; picture: string; }
export type GoogleUser = User & { googleId: string; avatarUrl: string; email: string };

export function decodeGoogleJwt(token: string): GoogleProfile {
  const b64  = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
  const pad  = b64 + '=='.slice((b64.length % 4) === 0 ? 4 : b64.length % 4);
  const json = decodeURIComponent(atob(pad).split('').map(c => '%' + c.charCodeAt(0).toString(16).padStart(2,'0')).join(''));
  return JSON.parse(json) as GoogleProfile;
}

export function upsertGoogleUser(p: GoogleProfile): GoogleUser {
  type SU = User & { googleId?: string; password?: string; avatarUrl?: string; email?: string };
  try {
    const users = JSON.parse(localStorage.getItem('rq:users') ?? '[]') as SU[];
    let u = users.find(x => x.googleId === p.sub);
    if (u) {
      u.name = p.name; u.avatarUrl = p.picture; u.email = p.email;
      localStorage.setItem('rq:users', JSON.stringify(users));
    } else {
      const seq = Number(localStorage.getItem('rq:user_seq') ?? '0') + 1;
      localStorage.setItem('rq:user_seq', String(seq));
      u = { id: seq, name: p.name, phone: '', role: 'user', password: '',
            googleId: p.sub, avatarUrl: p.picture, email: p.email };
      localStorage.setItem('rq:users', JSON.stringify([...users, u]));
    }
    return { ...u, googleId: p.sub, avatarUrl: p.picture, email: p.email };
  } catch (e) {
    console.error('[googleAuth] Failed to upsert user:', e);
    return { id: 0, name: p.name, phone: '', role: 'user', googleId: p.sub, avatarUrl: p.picture, email: p.email };
  }
}

export function getClientId(): string {
  const id = process.env.GOOGLE_CLIENT_ID as string;
  return typeof id === 'string' && id.length > 10 ? id : '';
}
export const isGoogleEnabled = (): boolean => getClientId().length > 0;

export function waitForGSI(ms = 15_000): Promise<boolean> {
  if (window.google?.accounts?.id) return Promise.resolve(true);
  return new Promise(resolve => {
    let done = false;
    const ok = (v: boolean) => { if (done) return; done = true; clearInterval(t); clearTimeout(d); resolve(v); };
    const t = setInterval(() => { if (window.google?.accounts?.id) ok(true); }, 200);
    const d = setTimeout(() => ok(false), ms);
    window.addEventListener('gsi-ready', () => ok(true), { once: true });
  });
}

export function renderGoogleButton(el: HTMLElement, onSuccess: (u: GoogleUser) => void): void {
  const clientId = getClientId();
  if (!clientId) throw new Error('GOOGLE_CLIENT_ID not configured');
  if (!window.google?.accounts?.id) throw new Error('GSI SDK not loaded');
  window._gsiCallback = (r: { credential: string }) => {
    try { onSuccess(upsertGoogleUser(decodeGoogleJwt(r.credential))); }
    catch (err) { console.error('[GSI]', err); }
  };
  window.google.accounts.id.initialize({
    client_id: clientId,
    callback: (r: { credential: string }) => window._gsiCallback?.(r),
    auto_select: false, cancel_on_tap_outside: true, itp_support: true,
  });
  const w = Math.min(400, Math.max(240, el.getBoundingClientRect().width || el.offsetWidth || 320));
  window.google.accounts.id.renderButton(el, {
    type: 'standard', theme: 'outline', size: 'large',
    shape: 'pill', width: w, text: 'continue_with', logo_alignment: 'left',
  });
}

// Keep old export name for backward compat
export const initAndRenderButton = (el: HTMLElement, cb: (u: GoogleUser) => void) => renderGoogleButton(el, cb);

export async function googleSignOut(): Promise<void> {
  window._gsiCallback = null;
  try { window.google?.accounts?.id?.disableAutoSelect(); } catch { /* noop */ }
}
