// ============================================================================
// auditChart.js — Plot 4. Audits given vs received, as two compared bars in the
// platform's give/receive colours (verdigris / signal-red).
// ============================================================================

import { svg, color, emptyPlot, bindTip } from './svg.js';
import { formatBytes } from '../api.js';

const W = 360;
const H = 200;
const PAD = { top: 26, right: 24, bottom: 24, left: 24 };

/**
 * @param {HTMLElement} mount
 * @param {number} up    bytes given
 * @param {number} down  bytes received
 */
export function drawAudit(mount, up, down) {
  mount.replaceChildren();
  if (!up && !down) {
    mount.append(emptyPlot('No audit activity yet.'));
    return;
  }

  const given = color('--pass', '#2f6d5b');
  const received = color('--fail', '#b23a2e');
  const faint = color('--ink-faint');
  const ink = color('--ink');

  const max = Math.max(up, down, 1);
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const gap = 48;
  const barW = (innerW - gap) / 2;

  const root = svg('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': 'Audits given vs received' });

  const bars = [
    { label: 'Given', value: up, fill: given, x: PAD.left },
    { label: 'Received', value: down, fill: received, x: PAD.left + barW + gap },
  ];

  const baseY = PAD.top + innerH;
  root.append(svg('line', { x1: PAD.left, y1: baseY, x2: W - PAD.right, y2: baseY, stroke: faint, 'stroke-width': 1 }));

  for (const bar of bars) {
    const barH = Math.max(2, (bar.value / max) * innerH);
    const y = baseY - barH;
    const rect = svg('rect', { x: bar.x, y, width: barW, height: barH, rx: 3, fill: bar.fill });
    bindTip(rect, `<b>${bar.label}</b><br>${formatBytes(bar.value)}`);
    root.append(rect);

    root.append(svg('text', {
      x: bar.x + barW / 2, y: y - 8, 'text-anchor': 'middle',
      'font-family': 'var(--font-mono)', 'font-size': 12, 'font-weight': 600, fill: ink,
    }, formatBytes(bar.value)));
    root.append(svg('text', {
      x: bar.x + barW / 2, y: baseY + 16, 'text-anchor': 'middle',
      'font-family': 'var(--font-ui)', 'font-size': 11, 'letter-spacing': 1, fill: faint,
    }, bar.label));
  }

  mount.append(root);
}
