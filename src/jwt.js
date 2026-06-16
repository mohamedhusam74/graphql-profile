// ============================================================================
// jwt.js — read (never verify) a JSON Web Token on the client.
// ----------------------------------------------------------------------------
// A JWT is three base64url segments joined by dots: header.payload.signature.
// We only ever DECODE the middle (payload) segment to read its claims — the
// signature is the server's business; the client cannot and must not "trust"
// it. See CONCEPTS.md for the full header/payload/signature explanation.
// ============================================================================

/**
 * base64url → string. JWT uses URL-safe base64 ('-'/'_' instead of '+'/'/')
 * and drops '=' padding, so we restore both before handing it to atob().
 * @param {string} segment
 * @returns {string}
 */
function decodeBase64Url(segment) {
  const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  // decodeURIComponent(escape(...)) makes atob UTF-8 safe (names with accents).
  return decodeURIComponent(
    Array.prototype.map
      .call(atob(padded), (c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  );
}

/**
 * Decode a token's payload claims, or null if the token is malformed.
 * @param {string} token
 * @returns {Record<string, unknown> | null}
 */
export function decodePayload(token) {
  try {
    const parts = String(token).split('.');
    if (parts.length !== 3) return null;
    return JSON.parse(decodeBase64Url(parts[1]));
  } catch {
    return null;
  }
}

/**
 * Is the token present, well-formed, and not past its `exp` claim?
 * `exp` is seconds since the Unix epoch; Date.now() is milliseconds.
 * @param {string | null | undefined} token
 * @returns {boolean}
 */
export function isTokenValid(token) {
  if (!token) return false;
  const payload = decodePayload(token);
  if (!payload || typeof payload.exp !== 'number') return false;
  return payload.exp > Math.floor(Date.now() / 1000);
}

/**
 * Pull the numeric user id out of the token's `sub` claim.
 * reboot01 encodes sub as "login:userId" (e.g. "navigator:1234"); some tenants
 * use a plain id. We handle both, and the caller still prefers `user.id` from
 * the API as the authoritative source — this is a decode demo + fallback.
 * @param {string} token
 * @returns {number | null}
 */
export function getUserId(token) {
  const payload = decodePayload(token);
  if (!payload) return null;
  const sub = payload.sub;
  if (typeof sub === 'number') return sub;
  if (typeof sub === 'string') {
    const tail = sub.includes(':') ? sub.split(':').pop() : sub;
    const id = parseInt(tail, 10);
    return Number.isNaN(id) ? null : id;
  }
  return null;
}
