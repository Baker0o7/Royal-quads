import type { User } from '../types';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: object) => void;
          prompt: (callback?: (notification: { isNotDisplayed: () => boolean; isSkippedMoment: () => boolean }) => void) => void;
          renderButton: (element: HTMLElement, config: object) => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}

export interface GoogleProfile {
  sub: string;      // Google user ID
  name: string;
  email: string;
  picture: string;
}

// Decode JWT credential from Google
export function decodeGoogleJwt(token: string): GoogleProfile {
  const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
  const json = decodeURIComponent(
    atob(base64)
      .split('')
      .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  );
  return JSON.parse(json) as GoogleProfile;
}

// Find or create a local user from a Google profile
export function googleProfileToUser(profile: GoogleProfile): User & { googleId: string; avatarUrl?: string } {
  const stored = JSON.parse(localStorage.getItem('rq:users') || '[]') as Array<User & { googleId?: string; password?: string; avatarUrl?: string }>;

  // Check if Google account already exists
  let user = stored.find(u => u.googleId === profile.sub);
  if (user) {
    // Update name/avatar in case they changed
    user.name = profile.name;
    user.avatarUrl = profile.picture;
    localStorage.setItem('rq:users', JSON.stringify(stored));
    return { ...user, googleId: profile.sub };
  }

  // Check if phone account exists with same email (not applicable here, but keep for future)
  // Create new Google user
  const seq = JSON.parse(localStorage.getItem('rq:user_seq') || '0') + 1;
  localStorage.setItem('rq:user_seq', String(seq));

  const newUser = {
    id: seq,
    name: profile.name,
    phone: '',          // Google users have no phone initially
    role: 'user' as const,
    password: '',
    googleId: profile.sub,
    avatarUrl: profile.picture,
  };
  localStorage.setItem('rq:users', JSON.stringify([...stored, newUser]));
  return newUser;
}

export function initGoogleSignIn(
  onSuccess: (user: User & { googleId: string; avatarUrl?: string }) => void
) {
  const clientId = (process.env.GOOGLE_CLIENT_ID as string) || '';
  if (!clientId || !window.google?.accounts?.id) return false;

  window.google.accounts.id.initialize({
    client_id: clientId,
    callback: (response: { credential: string }) => {
      const profile = decodeGoogleJwt(response.credential);
      const user = googleProfileToUser(profile);
      onSuccess(user);
    },
    auto_select: false,
    cancel_on_tap_outside: true,
  });
  return true;
}

export function renderGoogleButton(
  elementId: string,
  onSuccess: (user: User & { googleId: string; avatarUrl?: string }) => void
) {
  const el = document.getElementById(elementId);
  if (!el || !window.google?.accounts?.id) return false;

  initGoogleSignIn(onSuccess);
  window.google.accounts.id.renderButton(el, {
    type: 'standard',
    theme: 'outline',
    size: 'large',
    shape: 'rectangular',
    width: el.offsetWidth || 300,
    text: 'continue_with',
  });
  return true;
}
