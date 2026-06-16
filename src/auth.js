// ============================================================================
// auth.js — sign in (HTTP Basic), keep the JWT in memory + localStorage, log out.
// ----------------------------------------------------------------------------
// Flow:  identifier + password  →  base64("id:pw")  →  POST with
//        `Authorization: Basic …`  →  body is the JWT string.
// The token then lives in a module variable (fast, in-memory) AND localStorage
// (survives a refresh). Logout clears both.
// ============================================================================

import { CONFIG } from './config.js';
import { isTokenValid } from './jwt.js';

// In-memory copy — the source of truth for the running tab.
let tokenInMemory = null;

/** @returns {string | null} the current JWT, rehydrated from storage if needed. */
export function getToken() {
  if (tokenInMemory) return tokenInMemory;
  try {
    tokenInMemory = localStorage.getItem(CONFIG.TOKEN_KEY);
  } catch {
    tokenInMemory = null; // storage can throw in private-mode / sandboxed frames
  }
  return tokenInMemory;
}

/** Persist a token to memory + localStorage. @param {string} token */
function storeToken(token) {
  tokenInMemory = token;
  try { localStorage.setItem(CONFIG.TOKEN_KEY, token); } catch { /* non-fatal */ }
}

/** Forget the token everywhere. */
export function clearToken() {
  tokenInMemory = null;
  try { localStorage.removeItem(CONFIG.TOKEN_KEY); } catch { /* non-fatal */ }
}

/** @returns {boolean} true when a non-expired token is available. */
export function isAuthenticated() {
  return isTokenValid(getToken());
}

/**
 * Sign in with a username-or-email + password using HTTP Basic auth.
 * On success the response body is the raw JWT (sometimes JSON-quoted).
 * Throws an Error with a specific, user-facing message on any failure.
 *
 * @param {string} identifier  username OR email
 * @param {string} password
 * @returns {Promise<string>}  the stored JWT
 */
export async function signIn(identifier, password) {
  // btoa needs latin1; encode first so accented identifiers don't throw.
  const credentials = btoa(unescape(encodeURIComponent(`${identifier}:${password}`)));

  let response;
  try {
    response = await fetch(CONFIG.SIGNIN_URL, {
      method: 'POST',
      headers: { Authorization: `Basic ${credentials}` },
    });
  } catch {
    // Network error / CORS / offline — never leave the user on a blank page.
    throw new Error('Could not reach the server. Check your connection and try again.');
  }

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error('Those credentials were not accepted. Check your username/email and password.');
    }
    if (response.status === 429) {
      throw new Error('Too many attempts. Wait a moment, then try again.');
    }
    throw new Error(`Sign-in failed (HTTP ${response.status}). Please try again.`);
  }

  const raw = (await response.text()).trim().replace(/^"|"$/g, '');
  if (!raw || !isTokenValid(raw)) {
    throw new Error('The server returned an invalid session token. Please try again.');
  }

  storeToken(raw);
  return raw;
}

/** End the session (clears memory + localStorage). */
export function signOut() {
  clearToken();
}
