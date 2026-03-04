import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ── Haptic feedback (Capacitor / Android) ─────────────────────────────────────
export function haptic(style: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'light') {
  try {
    // Navigator vibrate API (works on Android Chrome + WebView)
    const patterns = { light: [10], medium: [20], heavy: [40], success: [10, 50, 10], warning: [30, 40, 30], error: [50, 40, 50] };
    navigator.vibrate?.(patterns[style]);
  } catch {}
}
