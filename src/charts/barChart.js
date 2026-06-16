// ============================================================================
// barChart.js — Plot 2. XP earned by project, as horizontal bars (project names
// are long, so horizontal reads better than vertical columns).
// ============================================================================

import { svg, color, emptyPlot, bindTip } from './svg.js';
import { formatBytes } from '../api.js';

const W = 640;
const ROW_H = 30;
const PAD = { top: 10, right: 70, bottom: 10, left: 150 };

/**
 * @param {HTMLElement} mount
 * @param {Array<{name: string, xp: number}>} projects
 */
export function drawXpBars(mount, projects) {
  mount.replaceChildren();
  if (!projects || !projects.length) {
    mount.append(emptyPlot('No project XP yet.'));
    return;
  }

  const accent = color('--accent', '#9a6a2f');
  const ink = color('--ink');
  const faint = color('--ink-faint');
  const sunk = color('--paper-sunk', 'rgba(0,0,0,.08)');

  const H = PAD.top + PAD.bottom + projects.length * ROW_H;
  const innerW = W - PAD.left - PAD.right;
  const maxXP = Math.max(...projects.map((p) => p.xp), 1);

  const root = svg('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': 'XP by project' });

  projects.forEach((project, i) => {
    const y = PAD.top + i * ROW_H + 4;
    const barH = ROW_H - 12;
    const barW = Math.max(2, (project.xp / maxXP) * innerW);

    // name label
    root.append(svg('text', {
      x: PAD.left - 10, y: y + barH / 2 + 4, 'text-anchor': 'end',
      'font-family': 'var(--font-ui)', 'font-size': 12, fill: ink,
    }, truncate(project.name, 22)));

    // track + bar
    root.append(svg('rect', { x: PAD.left, y, width: innerW, height: barH, rx: 2, fill: sunk }));
    const bar = svg('rect', { x: PAD.left, y, width: barW, height: barH, rx: 2, fill: accent });
    bindTip(bar, `<b>${project.name}</b><br>${formatBytes(project.xp)}`);
    root.append(bar);

    // value label
    root.append(svg('text', {
      x: PAD.left + barW + 8, y: y + barH / 2 + 4, 'text-anchor': 'start',
      'font-family': 'var(--font-mono)', 'font-size': 11, fill: faint,
    }, formatBytes(project.xp)));
  });

  mount.append(root);
}

function truncate(text, max) {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}
