/**
 * Google Sign-In
 *
 *  WEB  — google.accounts.id.renderButton()
 *         Google renders their own button; OAuth is handled entirely by
 *         Google's servers. Credential arrives via callback.
 *         No redirect URI registration needed.
 *
 *  NATIVE (Capacitor Android) — @codetrix-studio/capacitor-google-auth
 *         Calls the native Google Sign-In SDK — no WebView restrictions.
 */

import type { User } from '../types';

declare global {
  interface Window {
    _gsiCb?:          ((r: { credential: string }) => void) | null;
    _gsiInitialized?: boolean;
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
    Capacitor?: {
      isNativePlatform?: () => boolean;
      getPlatform?:      () => string;
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
  const pad  = b64 + '=='.slice(0, (4 - b64.length % 4) % 4);
  const json = decodeURIComponent(
    atob(pad).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
  );
  return JSON.parse(json) as GoogleProfile;
}

// ── Upsert user ──────────────────────────────────────────────────────────────
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

export function isCapacitorNative(): boolean {
  return typeof window !== 'undefined'
    && typeof window.Capacitor !== 'undefined'
    && window.Capacitor.isNativePlatform?.() === true;
}

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

// ── WEB: initialise GSI with a callback, then render button ──────────────────
// Called every time the button component mounts so the callback is always fresh.
// GSI's initialize() updates the stored callback on repeated calls.
export function initAndRenderButton(el: HTMLElement, onSuccess: GoogleCallback): void {
  const clientId = getClientId();
  if (!clientId || !window.google?.accounts?.id) {
    throw new Error('GSI SDK not loaded');
  }

  // Store callback globally so we can update it without re-rendering
  window._gsiCb = (r: { credential: string }) => {
    try {
      const profile = decodeGoogleJwt(r.credential);
      onSuccess(googleProfileToUser(profile));
    } catch (err) {
      console.error('[GoogleAuth] JWT decode error', err);
      throw err;
    }
  };

  // (Re-)initialize with current callback — safe to call multiple times
  window.google.accounts.id.initialize({
    client_id:             clientId,
    callback:              (r: { credential: string }) => window._gsiCb?.(r),
    auto_select:           false,
    cancel_on_tap_outside: true,
    use_fedcm_for_prompt:  false,
    itp_support:           true,
  });

  // Render (or re-render) the button — GSI replaces the div's children
  const width = Math.min(Math.max(el.getBoundingClientRect().width || el.offsetWidth || 320, 200), 400);
  window.google.accounts.id.renderButton(el, {
    type:           'standard',
    theme:          'outline',
    size:           'large',
    shape:          'pill',
    width,
    text:           'continue_with',
    logo_alignment: 'left',
  });
}

// ── NATIVE: Capacitor Android native sign-in ─────────────────────────────────
export async function nativeGoogleSignIn(onSuccess: GoogleCallback): Promise<void> {
  const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth');

  await GoogleAuth.initialize({
    clientId:           getClientId(),
    scopes:             ['profile', 'email'],
    grantOfflineAccess: false,
  });

  const result = await GoogleAuth.signIn();

  const idToken: string | undefined =
    (result as any).idToken ||
    (result as any).authentication?.idToken;

  if (idToken) {
    onSuccess(googleProfileToUser(decodeGoogleJwt(idToken)));
    return;
  }

  // Plugin returned profile object directly (some versions)
  if (result.email && result.name) {
    onSuccess(googleProfileToUser({
      sub:     result.id || result.email,
      name:    result.name,
      email:   result.email,
      picture: (result as any).imageUrl || (result as any).image?.url || '',
    }));
    return;
  }

  throw new Error('Google Sign-In did not return a usable credential');
}

// ── Sign out ─────────────────────────────────────────────────────────────────
export async function googleSignOut(): Promise<void> {
  window._gsiCb = null;
  try { window.google?.accounts?.id?.disableAutoSelect?.(); } catch {}

  if (isCapacitorNative()) {
    try {
      const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth');
      await GoogleAuth.signOut();
    } catch {}
  }
}
