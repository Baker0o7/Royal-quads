/**
 * Google Sign-In — web GSI on all platforms.
 *
 * Uses google.accounts.id.renderButton() which works in both browsers
 * and Capacitor Android WebViews (the GSI iframe is allowlisted via
 * capacitor.config.ts allowNavigation).
 *
 * The previous @codetrix-studio/capacitor-google-auth approach was removed
 * because that package only supports Capacitor ≤6 and the project uses Cap 8.
 */

import type { User } from '../types';

declare global {
  interface Window {
    _gsiCb?:          ((r: { credential: string }) => void) | null;
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

// ── Types ────────────────────────────────────────────────────────────────────
export interface GoogleProfile {
  sub: string; name: string; email: string; picture: string;
}

export type GoogleCallback = (
  user: User & { googleId: string; avatarUrl: string; email: string }
) => void;

// ── JWT decode ───────────────────────────────────────────────────────────────
export function decodeGoogleJwt(token: string): GoogleProfile {
  const b64  = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
  const pad  = b64 + '=='.slice(0, (4 - (b64.length % 4)) % 4);
  const json = decodeURIComponent(
    atob(pad).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
  );
  return JSON.parse(json) as GoogleProfile;
}

// ── Upsert user from Google profile ──────────────────────────────────────────
export function googleProfileToUser(
  p: GoogleProfile
): User & { googleId: string; avatarUrl: string; email: string } {
  type SU = User & { googleId?: string; password?: string; avatarUrl?: string; email?: string };
  const users = JSON.parse(localStorage.getItem('rq:users') || '[]') as SU[];
  let u = users.find(u => u.googleId === p.sub);
  if (u) {
    u.name = p.name; u.avatarUrl = p.picture; u.email = p.email;
    localStorage.setItem('rq:users', JSON.stringify(users));
  } else {
    const seq = Number(localStorage.getItem('rq:user_seq') || '0') + 1;
    localStorage.setItem('rq:user_seq', String(seq));
    u = { id: seq, name: p.name, phone: '', role: 'user', password: '',
          googleId: p.sub, avatarUrl: p.picture, email: p.email };
    localStorage.setItem('rq:users', JSON.stringify([...users, u]));
  }
  return { ...u, googleId: p.sub, avatarUrl: p.picture, email: p.email };
}

// ── Config ───────────────────────────────────────────────────────────────────
export function getClientId(): string {
  const id = process.env.GOOGLE_CLIENT_ID as string;
  return typeof id === 'string' && id.length > 10 ? id : '';
}
export function isGoogleEnabled(): boolean { return getClientId().length > 0; }

// ── Wait for GSI SDK ─────────────────────────────────────────────────────────
export function waitForGSI(ms = 12_000): Promise<boolean> {
  if (window.google?.accounts?.id) return Promise.resolve(true);
  return new Promise(resolve => {
    let done = false;
    const finish = (v: boolean) => {
      if (done) return; done = true;
      clearInterval(poll); clearTimeout(timer);
      window.removeEventListener('gsi-ready', onEvent);
      resolve(v);
    };
    const poll    = setInterval(() => { if (window.google?.accounts?.id) finish(true); }, 250);
    const timer   = setTimeout(() => finish(false), ms);
    const onEvent = () => finish(true);
    window.addEventListener('gsi-ready', onEvent, { once: true });
  });
}

// ── Initialise + render Google's button ──────────────────────────────────────
// Stores callback in window._gsiCb so re-mounts always use the fresh closure.
// initialize() is safe to call multiple times.
export function initAndRenderButton(el: HTMLElement, onSuccess: GoogleCallback): void {
  const clientId = getClientId();
  if (!clientId || !window.google?.accounts?.id) {
    throw new Error('Google Sign-In SDK not loaded');
  }

  window._gsiCb = (r: { credential: string }) => {
    try { onSuccess(googleProfileToUser(decodeGoogleJwt(r.credential))); }
    catch (err) { console.error('[GoogleAuth]', err); throw err; }
  };

  window.google.accounts.id.initialize({
    client_id:             clientId,
    callback:              (r: { credential: string }) => window._gsiCb?.(r),
    auto_select:           false,
    cancel_on_tap_outside: true,
    use_fedcm_for_prompt:  false,
    itp_support:           true,
  });

  const width = Math.min(Math.max(el.getBoundingClientRect().width || el.offsetWidth || 320, 200), 400);
  window.google.accounts.id.renderButton(el, {
    type: 'standard', theme: 'outline', size: 'large',
    shape: 'pill', width, text: 'continue_with', logo_alignment: 'left',
  });
}

// ── Sign out ─────────────────────────────────────────────────────────────────
export async function googleSignOut(): Promise<void> {
  window._gsiCb = null;
  try { window.google?.accounts?.id?.disableAutoSelect?.(); } catch {}
}
