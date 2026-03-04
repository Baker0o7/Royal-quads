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
          prompt:            (cb?: (n: { isNotDisplayed: () => boolean; isSkippedMoment: () => boolean }) => void) => void;
          renderButton:      (el: HTMLElement, config: object) => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}

export interface GoogleProfile {
  sub:     string;
  name:    string;
  email:   string;
  picture: string;
}

// ── Decode JWT returned by GSI ───────────────────────────────────────────────
export function decodeGoogleJwt(token: string): GoogleProfile {
  const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
  const json = decodeURIComponent(
    atob(b64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
  );
  return JSON.parse(json) as GoogleProfile;
}

// ── Upsert Google user in local users store ──────────────────────────────────
export function googleProfileToUser(
  profile: GoogleProfile
): User & { googleId: string; avatarUrl: string; email: string } {
  type StoredUser = User & { googleId?: string; password?: string; avatarUrl?: string; email?: string };
  const stored = JSON.parse(localStorage.getItem('rq:users') || '[]') as StoredUser[];

  // Returning user — update name/avatar in case they changed
  let user = stored.find(u => u.googleId === profile.sub);
  if (user) {
    user.name      = profile.name;
    user.avatarUrl = profile.picture;
    user.email     = profile.email;
    localStorage.setItem('rq:users', JSON.stringify(stored));
    return { ...user, googleId: profile.sub, avatarUrl: profile.picture, email: profile.email };
  }

  // New user — register them
  const seq = JSON.parse(localStorage.getItem('rq:user_seq') || '0') + 1;
  localStorage.setItem('rq:user_seq', String(seq));

  const newUser: StoredUser = {
    id: seq, name: profile.name, phone: '', role: 'user',
    password: '', googleId: profile.sub,
    avatarUrl: profile.picture, email: profile.email,
  };
  localStorage.setItem('rq:users', JSON.stringify([...stored, newUser]));
  return { ...newUser, googleId: profile.sub, avatarUrl: profile.picture, email: profile.email };
}

export type GoogleCallback = (user: User & { googleId: string; avatarUrl: string; email: string }) => void;

// ── Wait for the GSI SDK to be ready ────────────────────────────────────────
// index.html sets window._gsiReady = true and fires 'gsi-ready' event
// via the onGoogleLibraryLoad callback that GSI calls itself.
export function waitForGSI(timeoutMs = 10_000): Promise<boolean> {
  // Already loaded
  if (window._gsiReady && window.google?.accounts?.id) return Promise.resolve(true);

  return new Promise(resolve => {
    const timer = setTimeout(() => {
      window.removeEventListener('gsi-ready', handler);
      resolve(false); // timed out — GSI unavailable
    }, timeoutMs);

    const handler = () => {
      clearTimeout(timer);
      resolve(true);
    };

    window.addEventListener('gsi-ready', handler, { once: true });
  });
}

// ── Get the client ID (baked in at build time) ───────────────────────────────
// We cannot use `process.env.X` at runtime — Vite replaces it with the literal
// value at build time. An empty string means it wasn't set in .env.
export function getClientId(): string {
  // process.env.GOOGLE_CLIENT_ID is replaced by Vite at build time
  const id: string = process.env.GOOGLE_CLIENT_ID as string;
  return typeof id === 'string' ? id : '';
}

export function isGoogleEnabled(): boolean {
  return getClientId().length > 0;
}

// ── Initialize GSI (idempotent — safe to call multiple times) ─────────────────
let _callback: GoogleCallback | null = null;

export function initGoogleSignIn(onSuccess: GoogleCallback): boolean {
  const clientId = getClientId();
  if (!clientId || !window.google?.accounts?.id) return false;

  // Keep callback reference for re-initialization after signOut
  _callback = onSuccess;

  // Only initialize once per page load unless we need to update the callback
  if (!window._gsiInitialized) {
    window._gsiInitialized = true;
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (response: { credential: string }) => {
        if (_callback) {
          const profile = decodeGoogleJwt(response.credential);
          _callback(googleProfileToUser(profile));
        }
      },
      auto_select: false,
      cancel_on_tap_outside: true,
      use_fedcm_for_prompt: false, // disable FedCM to keep classic popup
    });
  }
  return true;
}

// ── Render the official Google button into a DOM element ──────────────────────
// Must be called AFTER waitForGSI() resolves.
export function renderGoogleButton(elementId: string, onSuccess: GoogleCallback): boolean {
  const el = document.getElementById(elementId);
  if (!el || !window.google?.accounts?.id) return false;

  if (!initGoogleSignIn(onSuccess)) return false;
  _callback = onSuccess; // always update callback

  // Use the parent's width or a sensible default — never 0
  const width = el.getBoundingClientRect().width || el.offsetWidth || 320;

  window.google.accounts.id.renderButton(el, {
    type: 'standard',
    theme: 'outline',
    size: 'large',
    shape: 'pill',
    width: Math.min(Math.max(width, 200), 400),
    text: 'continue_with',
    logo_alignment: 'left',
  });
  return true;
}

// ── Sign out ──────────────────────────────────────────────────────────────────
export function googleSignOut(): void {
  try {
    window.google?.accounts?.id?.disableAutoSelect?.();
    window._gsiInitialized = false; // allow re-init on next sign-in
  } catch {}
}
