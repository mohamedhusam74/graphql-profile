// ============================================================================
// experience.js — fol. II. The headline XP figure beside three readout tiles
// (level, projects passed, audit ratio).
// ============================================================================

import { h } from './dom.js';
import { formatBytes } from '../api.js';

function tile(label, value, note) {
  return h('div', { class: 'tile sheet' },
    h('div', { class: 'tile__label' }, label),
    h('div', { class: 'tile__value' }, value),
    note ? h('div', { class: 'tile__note' }, note) : null,
  );
}

/** Render the audit ratio to two decimals, or ∞ when nothing was received. */
function formatRatio(ratio) {
  if (!Number.isFinite(ratio)) return '∞';
  return ratio.toFixed(2);
}

/**
 * @param {HTMLElement} mount
 * @param {object} profile
 */
export function renderExperience(mount, profile) {
  const feature = h('div', { class: 'feature sheet' },
    h('div', { class: 'feature__label' }, 'Total XP'),
    h('div', { class: 'feature__value' }, formatBytes(profile.totalXP)),
    h('div', { class: 'feature__note' }, 'Earned across the main cursus, measured as data weight.'),
  );

  const tiles = h('div', { class: 'tiles' },
    tile('Level', String(profile.level), 'Current cursus level'),
    tile('Projects passed', String(profile.pass), 'Cleared for XP'),
    tile('Audit ratio', formatRatio(profile.audit.ratio), 'Given ÷ received'),
  );

  mount.replaceChildren(h('div', { class: 'feature-grid' }, feature, tiles));
}
