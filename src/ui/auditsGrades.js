// ============================================================================
// auditsGrades.js — fol. III. Left: the audit ratio summary (given vs received).
// Right: the recent-grades ledger (most recent projects, pass/fail tagged).
// ============================================================================

import { h } from './dom.js';
import { formatBytes } from '../api.js';

function formatRatio(ratio) {
  if (!Number.isFinite(ratio)) return '∞';
  return ratio.toFixed(2);
}

/**
 * @param {HTMLElement} mount
 * @param {object} profile
 */
export function renderAuditSummary(mount, profile) {
  const { up, down, ratio } = profile.audit;
  const healthClass = !Number.isFinite(ratio) || ratio >= 1 ? 'is-good' : 'is-low';

  const lines = h('ul', { class: 'audit__lines' },
    h('li', {},
      h('span', { class: 'swatch swatch--given' }),
      'Given',
      h('b', {}, formatBytes(up))),
    h('li', {},
      h('span', { class: 'swatch swatch--received' }),
      'Received',
      h('b', {}, formatBytes(down))),
  );

  const card = h('div', { class: 'audit sheet' },
    h('div', { class: 'audit__label' }, 'Audit ratio'),
    h('div', { class: `audit__value ${healthClass}` }, formatRatio(ratio)),
    lines,
  );

  mount.replaceChildren(card);
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, { year: '2-digit', month: 'short', day: 'numeric' });
}

function gradeRow(entry) {
  return h('li', { class: 'grades__row' },
    h('span', { class: 'grades__name', title: entry.name }, entry.name),
    h('span', { class: `grades__tag ${entry.pass ? 'is-pass' : 'is-fail'}` }, entry.pass ? 'Pass' : 'Fail'),
    h('span', { class: 'grades__date' }, formatDate(entry.date)),
  );
}

/**
 * @param {HTMLElement} mount
 * @param {object} profile
 */
export function renderGrades(mount, profile) {
  const ledger = profile.gradeLedger || [];

  // Show every project, newest first, in a scrollable well so the card stays a
  // sensible height no matter how many projects there are.
  const body = ledger.length
    ? h('div', { class: 'grades__scroll' },
        h('ul', { class: 'grades__list' }, ...ledger.map(gradeRow)))
    : h('p', { class: 'plot__empty' }, 'No graded projects yet.');

  const card = h('div', { class: 'grades sheet' },
    h('div', { class: 'grades__title' },
      'All projects',
      h('span', { class: 'grades__count' }, String(ledger.length))),
    body,
  );

  mount.replaceChildren(card);
}
