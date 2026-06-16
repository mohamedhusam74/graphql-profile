// ============================================================================
// identity.js — fol. I. The navigator's nameplate: monogram, name, handle, and
// a small ledger of identity facts pulled from the user record + attrs blob.
// ============================================================================

import { h } from './dom.js';

/** Pick the first present, non-empty value from the attrs blob. */
function attr(attrs, ...keys) {
  for (const key of keys) {
    const value = attrs?.[key];
    if (value != null && String(value).trim() !== '') return String(value).trim();
  }
  return null;
}

/** Build a full name from attrs, falling back to the login. */
function fullName(user) {
  const first = attr(user.attrs, 'firstName', 'first_name');
  const last = attr(user.attrs, 'lastName', 'last_name');
  const joined = [first, last].filter(Boolean).join(' ');
  return joined || user.login;
}

/** Two-letter monogram for the round plate. */
function monogram(name, login) {
  const parts = (name || login || '?').trim().split(/\s+/);
  const letters = parts.length >= 2 ? parts[0][0] + parts[parts.length - 1][0] : (login || '?').slice(0, 2);
  return letters.toUpperCase();
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function row(term, detail) {
  return h('div', { class: 'ledger__row' }, h('dt', {}, term), h('dd', {}, detail));
}

/**
 * @param {HTMLElement} mount
 * @param {object} profile  the normalised model from api.fetchProfile()
 */
export function renderIdentity(mount, profile) {
  const { user } = profile;
  const name = fullName(user);
  const email = attr(user.attrs, 'email');
  const campus = attr(user.attrs, 'campus');

  const ledger = h('dl', { class: 'ledger' },
    row('Login', user.login),
    row('User ID', String(user.id ?? profile.userId ?? '—')),
    email && row('Email', email),
    campus && row('Campus', campus),
    row('Enrolled', formatDate(user.createdAt)),
  );

  const card = h('div', { class: 'id-card sheet' },
    h('div', { class: 'id-card__mono', 'aria-hidden': 'true' }, monogram(name, user.login)),
    h('div', { class: 'id-card__body' },
      h('div', { class: 'id-card__name' }, name),
      h('div', { class: 'id-card__handle' }, `@${user.login}`),
      h('div', { style: 'margin-top:.6rem' },
        h('span', { class: 'level-badge' }, `Level ${profile.level}`)),
      ledger,
    ),
  );

  mount.replaceChildren(card);
}
