import { createContext, useContext, useEffect, useState } from 'react';

export type ThemeId =
  | 'desert'      // warm sand + gold (original light)
  | 'midnight'    // deep charcoal (original dark)
  | 'ocean'       // cool teal + navy
  | 'forest'      // deep green + earth
  | 'sunset'      // coral + amber + deep plum
  | 'arctic'      // crisp white + ice blue + slate
  | 'volcanic'    // obsidian + magma orange
  | 'rose'        // blush pink + warm cream + rose gold;

export interface ThemeDef {
  id: ThemeId;
  label: string;
  emoji: string;
  dark: boolean;
  // CSS var values applied to :root
  vars: {
    '--t-bg':        string;
    '--t-bg2':       string;
    '--t-card':      string;
    '--t-border':    string;
    '--t-text':      string;
    '--t-muted':     string;
    '--t-accent':    string;
    '--t-accent2':   string;
    '--t-hero-from': string;
    '--t-hero-to':   string;
    '--t-btn-bg':    string;
    '--t-btn-text':  string;
  };
}

export const THEMES: ThemeDef[] = [
  {
    id: 'desert', label: 'Desert', emoji: '🏜️', dark: false,
    vars: {
      '--t-bg':        '#f5f0e8',
      '--t-bg2':       '#e8dfc9',
      '--t-card':      'rgba(255,255,255,0.70)',
      '--t-border':    'rgba(201,185,154,0.30)',
      '--t-text':      '#1a1612',
      '--t-muted':     '#7a6e60',
      '--t-accent':    '#c9972a',
      '--t-accent2':   '#e8b84b',
      '--t-hero-from': '#2d2318',
      '--t-hero-to':   '#0d0b09',
      '--t-btn-bg':    '#1a1612',
      '--t-btn-text':  '#ffffff',
    },
  },
  {
    id: 'midnight', label: 'Midnight', emoji: '🌑', dark: true,
    vars: {
      '--t-bg':        '#0d0b09',
      '--t-bg2':       '#1a1612',
      '--t-card':      'rgba(26,22,18,0.75)',
      '--t-border':    'rgba(201,185,154,0.12)',
      '--t-text':      '#f5f0e8',
      '--t-muted':     '#a09070',
      '--t-accent':    '#c9972a',
      '--t-accent2':   '#e8b84b',
      '--t-hero-from': '#2d2318',
      '--t-hero-to':   '#0d0b09',
      '--t-btn-bg':    '#f5f0e8',
      '--t-btn-text':  '#1a1612',
    },
  },
  {
    id: 'ocean', label: 'Ocean', emoji: '🌊', dark: false,
    vars: {
      '--t-bg':        '#eef6fb',
      '--t-bg2':       '#d4ecf7',
      '--t-card':      'rgba(255,255,255,0.75)',
      '--t-border':    'rgba(56,152,190,0.20)',
      '--t-text':      '#0c2d3f',
      '--t-muted':     '#4a7a95',
      '--t-accent':    '#0ea5e9',
      '--t-accent2':   '#38bdf8',
      '--t-hero-from': '#0c4a6e',
      '--t-hero-to':   '#0c2d3f',
      '--t-btn-bg':    '#0c2d3f',
      '--t-btn-text':  '#ffffff',
    },
  },
  {
    id: 'forest', label: 'Forest', emoji: '🌿', dark: true,
    vars: {
      '--t-bg':        '#0d1a0f',
      '--t-bg2':       '#142018',
      '--t-card':      'rgba(20,32,24,0.80)',
      '--t-border':    'rgba(74,163,94,0.18)',
      '--t-text':      '#e8f5eb',
      '--t-muted':     '#6b9b78',
      '--t-accent':    '#4ade80',
      '--t-accent2':   '#86efac',
      '--t-hero-from': '#14532d',
      '--t-hero-to':   '#052e16',
      '--t-btn-bg':    '#e8f5eb',
      '--t-btn-text':  '#0d1a0f',
    },
  },
  {
    id: 'sunset', label: 'Sunset', emoji: '🌅', dark: true,
    vars: {
      '--t-bg':        '#1a0a1a',
      '--t-bg2':       '#2d1030',
      '--t-card':      'rgba(45,16,48,0.75)',
      '--t-border':    'rgba(251,113,133,0.18)',
      '--t-text':      '#fde8ec',
      '--t-muted':     '#c084a0',
      '--t-accent':    '#fb7185',
      '--t-accent2':   '#f97316',
      '--t-hero-from': '#7c1d3f',
      '--t-hero-to':   '#1a0a1a',
      '--t-btn-bg':    '#fde8ec',
      '--t-btn-text':  '#1a0a1a',
    },
  },
  {
    id: 'arctic', label: 'Arctic', emoji: '❄️', dark: false,
    vars: {
      '--t-bg':        '#f0f7ff',
      '--t-bg2':       '#dbeeff',
      '--t-card':      'rgba(255,255,255,0.85)',
      '--t-border':    'rgba(96,165,250,0.22)',
      '--t-text':      '#0f2444',
      '--t-muted':     '#5585a8',
      '--t-accent':    '#3b82f6',
      '--t-accent2':   '#60a5fa',
      '--t-hero-from': '#1e3a5f',
      '--t-hero-to':   '#0f2444',
      '--t-btn-bg':    '#0f2444',
      '--t-btn-text':  '#ffffff',
    },
  },
  {
    id: 'volcanic', label: 'Volcanic', emoji: '🌋', dark: true,
    vars: {
      '--t-bg':        '#0f0a08',
      '--t-bg2':       '#1c1008',
      '--t-card':      'rgba(28,16,8,0.80)',
      '--t-border':    'rgba(251,87,34,0.18)',
      '--t-text':      '#fff1ec',
      '--t-muted':     '#a06050',
      '--t-accent':    '#fb5722',
      '--t-accent2':   '#fdba74',
      '--t-hero-from': '#7c2d12',
      '--t-hero-to':   '#0f0a08',
      '--t-btn-bg':    '#fff1ec',
      '--t-btn-text':  '#0f0a08',
    },
  },
  {
    id: 'rose', label: 'Rose', emoji: '🌸', dark: false,
    vars: {
      '--t-bg':        '#fff5f7',
      '--t-bg2':       '#ffe4ea',
      '--t-card':      'rgba(255,255,255,0.80)',
      '--t-border':    'rgba(244,114,182,0.22)',
      '--t-text':      '#3b0a1f',
      '--t-muted':     '#9d6070',
      '--t-accent':    '#f43f8e',
      '--t-accent2':   '#fb7bb8',
      '--t-hero-from': '#831843',
      '--t-hero-to':   '#3b0a1f',
      '--t-btn-bg':    '#3b0a1f',
      '--t-btn-text':  '#ffffff',
    },
  },
];

interface ThemeContextType {
  theme: ThemeId;
  themeDef: ThemeDef;
  setTheme: (id: ThemeId) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'desert',
  themeDef: THEMES[0],
  setTheme: () => {},
});

function applyTheme(def: ThemeDef) {
  const root = document.documentElement;
  // dark class
  if (def.dark) root.classList.add('dark');
  else root.classList.remove('dark');
  // CSS vars
  Object.entries(def.vars).forEach(([k, v]) => root.style.setProperty(k, v));
  // data-theme for any future CSS selectors
  root.setAttribute('data-theme', def.id);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeId] = useState<ThemeId>(() => {
    try {
      const stored = localStorage.getItem('rq:theme') as ThemeId;
      if (THEMES.find(t => t.id === stored)) return stored;
    } catch {}
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'midnight' : 'desert';
  });

  const themeDef = THEMES.find(t => t.id === themeId) ?? THEMES[0];

  useEffect(() => {
    applyTheme(themeDef);
    localStorage.setItem('rq:theme', themeId);
  }, [themeId, themeDef]);

  return (
    <ThemeContext.Provider value={{ theme: themeId, themeDef, setTheme: setThemeId }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
