import type { User } from '../types';

declare global {
  interface Window {
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

export function decodeGoogleJwt(token: string): GoogleProfile {
  const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
  const json = decodeURIComponent(
    atob(b64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
  );
  return JSON.parse(json) as GoogleProfile;
}

export function googleProfileToUser(profile: GoogleProfile): User & { googleId: string; avatarUrl: string; email: string } {
  type StoredUser = User & { googleId?: string; password?: string; avatarUrl?: string; email?: string };
  const stored = JSON.parse(localStorage.getItem('rq:users') || '[]') as StoredUser[];

  let user = stored.find(u => u.googleId === profile.sub);
  if (user) {
    user.name     = profile.name;
    user.avatarUrl = profile.picture;
    user.email    = profile.email;
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

type GoogleCallback = (user: User & { googleId: string; avatarUrl: string; email: string }) => void;

export function initGoogleSignIn(onSuccess: GoogleCallback): boolean {
  const clientId = (process.env.GOOGLE_CLIENT_ID as string) || '';
  if (!clientId || !window.google?.accounts?.id) return false;

  window.google.accounts.id.initialize({
    client_id: clientId,
    callback: (response: { credential: string }) => {
      const profile = decodeGoogleJwt(response.credential);
      onSuccess(googleProfileToUser(profile));
    },
    auto_select: false,
    cancel_on_tap_outside: true,
  });
  return true;
}

/** Renders the official Google button — always white/light, best for light themes */
export function renderGoogleButton(elementId: string, onSuccess: GoogleCallback): boolean {
  const el = document.getElementById(elementId);
  if (!el || !window.google?.accounts?.id) return false;
  initGoogleSignIn(onSuccess);
  window.google.accounts.id.renderButton(el, {
    type: 'standard', theme: 'outline', size: 'large',
    shape: 'pill', width: Math.min(el.offsetWidth || 320, 320),
    text: 'continue_with',
  });
  return true;
}

/** Triggers the One-Tap / popup flow without rendering a button */
export function promptGoogleSignIn(onSuccess: GoogleCallback): boolean {
  if (!initGoogleSignIn(onSuccess)) return false;
  window.google!.accounts.id.prompt();
  return true;
}

export function googleSignOut(): void {
  try { window.google?.accounts?.id?.disableAutoSelect?.(); } catch {}
}

export const GOOGLE_ENABLED = !!(process.env.GOOGLE_CLIENT_ID as string);
