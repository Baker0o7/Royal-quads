import type { User } from '../types';

declare global {
  interface Window {
    _gsiReady?: boolean;
    _gsiInitialized?: boolean;
    onGoogleLibraryLoad?: () => void;
    google?: {
      accounts: {
        id: {
          initialize:        (config: object) => void;
          prompt:            (cb?: (n: PromptNotification) => void) => void;
          renderButton:      (el: HTMLElement, config: object) => void;
          disableAutoSelect: () => void;
          cancel:            () => void;
        };
      };
    };
  }
}

interface PromptNotification {
  isNotDisplayed:    () => boolean;
  isSkippedMoment:   () => boolean;
  isDismissedMoment: () => boolean;
  getNotDisplayedReason: () => string;
  getSkippedReason:      () => string;
  getDismissedReason:    () => string;
}

export interface GoogleProfile {
  sub:     string;
  name:    string;
  email:   string;
  picture: string;
}

// ── Decode Google JWT ────────────────────────────────────────────────────────
export function decodeGoogleJwt(token: string): GoogleProfile {
  const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
  const json = decodeURIComponent(
    atob(b64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
  );
  return JSON.parse(json) as GoogleProfile;
}

// ── Upsert user from Google profile ─────────────────────────────────────────
export function googleProfileToUser(
  profile: GoogleProfile
): User & { googleId: string; avatarUrl: string; email: string } {
  type StoredUser = User & { googleId?: string; password?: string; avatarUrl?: string; email?: string };
  const stored = JSON.parse(localStorage.getItem('rq:users') || '[]') as StoredUser[];

  let user = stored.find(u => u.googleId === profile.sub);
  if (user) {
    user.name = profile.name; user.avatarUrl = profile.picture; user.email = profile.email;
    localStorage.setItem('rq:users', JSON.stringify(stored));
    return { ...user, googleId: profile.sub, avatarUrl: profile.picture, email: profile.email };
  }

  const seq = JSON.parse(localStorage.getItem('rq:user_seq') || '0') + 1;
  localStorage.setItem('rq:user_seq', String(seq));
  const newUser: StoredUser = {
    id: seq, name: profile.name, phone: '', role: 'user',
    password: '', googleId: profile.sub, avatarUrl: profile.picture, email: profile.email,
  };
  localStorage.setItem('rq:users', JSON.stringify([...stored, newUser]));
  return { ...newUser, googleId: profile.sub, avatarUrl: profile.picture, email: profile.email };
}

export type GoogleCallback = (user: User & { googleId: string; avatarUrl: string; email: string }) => void;

// ── Client ID (baked in by Vite at build time) ───────────────────────────────
export function getClientId(): string {
  const id: string = process.env.GOOGLE_CLIENT_ID as string;
  return typeof id === 'string' ? id : '';
}
export function isGoogleEnabled(): boolean { return getClientId().length > 0; }

// ── Wait for GSI SDK — event + poll + immediate ───────────────────────────────
export function waitForGSI(timeoutMs = 12_000): Promise<boolean> {
  if (window.google?.accounts?.id) return Promise.resolve(true);

  return new Promise(resolve => {
    let done = false;
    const finish = (v: boolean) => {
      if (done) return; done = true;
      clearInterval(poll); clearTimeout(timer);
      window.removeEventListener('gsi-ready', onEvent);
      resolve(v);
    };
    const poll  = setInterval(() => { if (window.google?.accounts?.id) finish(true); }, 200);
    const timer = setTimeout(() => finish(false), timeoutMs);
    const onEvent = () => finish(true);
    window.addEventListener('gsi-ready', onEvent, { once: true });
  });
}

// ── Initialize GSI (idempotent) ───────────────────────────────────────────────
let _cb: GoogleCallback | null = null;

export function initGoogleSignIn(onSuccess: GoogleCallback): boolean {
  const clientId = getClientId();
  if (!clientId || !window.google?.accounts?.id) return false;
  _cb = onSuccess;

  if (!window._gsiInitialized) {
    window._gsiInitialized = true;
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (response: { credential: string }) => {
        if (_cb) _cb(googleProfileToUser(decodeGoogleJwt(response.credential)));
      },
      auto_select: false,
      cancel_on_tap_outside: true,
      use_fedcm_for_prompt: false, // force classic popup, not FedCM
      itp_support: true,
    });
  } else {
    // Re-use existing init but update callback
    _cb = onSuccess;
  }
  return true;
}

// ── Trigger Google sign-in popup (no iframe — works in WebViews) ─────────────
// Uses google.accounts.id.prompt() which opens a full popup/redirect
// instead of renderButton which injects a blocked iframe.
export function triggerGoogleSignIn(onSuccess: GoogleCallback): boolean {
  if (!initGoogleSignIn(onSuccess)) return false;
  _cb = onSuccess;
  window.google!.accounts.id.prompt((notification: PromptNotification) => {
    if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
      // One-Tap was suppressed (e.g. WebView, browser policy, user dismissed before)
      // Fall back to the OAuth popup flow
      openOAuthPopup(onSuccess);
    }
  });
  return true;
}

// ── OAuth popup fallback ─────────────────────────────────────────────────────
// Opens a real browser window to Google OAuth.
// Works even when One-Tap is blocked (WebViews, Firefox, Safari ITP).
function openOAuthPopup(onSuccess: GoogleCallback) {
  const clientId = getClientId();
  if (!clientId) return;

  const nonce = Math.random().toString(36).slice(2);
  const params = new URLSearchParams({
    client_id:     clientId,
    redirect_uri:  `${window.location.origin}/oauth-callback.html`,
    response_type: 'id_token',
    scope:         'openid email profile',
    nonce,
    prompt:        'select_account',
  });

  const w = 480, h = 600;
  const left = Math.max(0, (screen.width  - w) / 2);
  const top  = Math.max(0, (screen.height - h) / 2);
  const popup = window.open(
    `https://accounts.google.com/o/oauth2/v2/auth?${params}`,
    'google-signin',
    `width=${w},height=${h},left=${left},top=${top},toolbar=no,menubar=no`
  );

  if (!popup) {
    // Popup blocked — fall back to same-tab redirect
    sessionStorage.setItem('rq:oauth_nonce', nonce);
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}&redirect_uri=${encodeURIComponent(window.location.href)}`;
    return;
  }

  // Listen for postMessage from the popup callback page
  const handler = (e: MessageEvent) => {
    if (e.origin !== window.location.origin) return;
    if (e.data?.type === 'google-oauth' && e.data?.credential) {
      window.removeEventListener('message', handler);
      popup.close();
      try {
        const profile = decodeGoogleJwt(e.data.credential);
        onSuccess(googleProfileToUser(profile));
      } catch {}
    }
  };
  window.addEventListener('message', handler);

  // Clean up if popup closed without completing
  const checkClosed = setInterval(() => {
    if (popup.closed) { clearInterval(checkClosed); window.removeEventListener('message', handler); }
  }, 1000);
}

// ── Sign out ──────────────────────────────────────────────────────────────────
export function googleSignOut(): void {
  try { window.google?.accounts?.id?.disableAutoSelect?.(); } catch {}
  window._gsiInitialized = false;
}
