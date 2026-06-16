// ============================================================================
// state.js — a tiny central store. No framework: just a plain object plus
// theme persistence. Keeping shared state here (rather than scattered globals)
// means one place owns "what theme are we in" and "what's the loaded profile".
// ============================================================================

import { CONFIG } from './config.js';

export const state = {
  /** @type {object | null} the normalised profile model from api.fetchProfile() */
  profile: null,
  /** @type {'light' | 'dark'} */
  theme: 'light',
};

/** Apply a theme to <html>, persist it, and update the toggle's label. */
export function applyTheme(theme) {
  state.theme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  try { localStorage.setItem(CONFIG.THEME_KEY, theme); } catch { /* non-fatal */ }

  const toggle = document.getElementById('theme-toggle');
  if (toggle) {
    const goingDark = theme === 'light';
    toggle.setAttribute(
      'aria-label',
      goingDark ? 'Switch to night watch (dark theme)' : 'Switch to daylight (light theme)'
    );
    toggle.setAttribute('aria-pressed', String(theme === 'dark'));
  }
}

/** Read the saved theme, falling back to the OS preference, then light. */
export function initTheme() {
  let saved = null;
  try { saved = localStorage.getItem(CONFIG.THEME_KEY); } catch { /* ignore */ }
  if (saved === 'light' || saved === 'dark') return applyTheme(saved);
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  applyTheme(prefersDark ? 'dark' : 'light');
}

/** Flip between the two themes. */
export function toggleTheme() {
  applyTheme(state.theme === 'light' ? 'dark' : 'light');
}
