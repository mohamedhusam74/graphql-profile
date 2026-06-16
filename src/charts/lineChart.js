// ============================================================================
// lineChart.js — Plot 1. Cumulative XP over time as a filled voyage track.
// ============================================================================

import { svg, color, emptyPlot, bindTip } from './svg.js';
import { formatBytes } from '../api.js';

const W = 640;
const H = 260;
const PAD = { top: 18, right: 18, bottom: 30, left: 60 };

/**
 * @param {HTMLElement} mount
 * @param {Array<{date: Date, cumulative: number}>} series
 */
export function drawXpLine(mount, series) {
  mount.replaceChildren();
  if (!series || series.length < 2) {
    mount.append(emptyPlot('Not enough XP history to plot yet.'));
    return;
  }

  const ink = color('--ink');
  const faint = color('--ink-faint');
  const rule = color('--rule', 'rgba(0,0,0,.15)');
  const accent = color('--accent', '#9a6a2f');

  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const t0 = series[0].date.getTime();
  const t1 = series[series.length - 1].date.getTime();
  const span = t1 - t0 || 1;
  const maxXP = series[series.length - 1].cumulative || 1;

  const x = (date) => PAD.left + ((date.getTime() - t0) / span) * innerW;
  const y = (value) => PAD.top + innerH - (value / maxXP) * innerH;

  const root = svg('svg', {
    viewBox: `0 0 ${W} ${H}`,
    role: 'img',
    'aria-label': `Cumulative XP reaching ${formatBytes(maxXP)}`,
  });

  // horizontal gridlines + y labels (4 steps)
  for (let i = 0; i <= 4; i++) {
    const value = (maxXP / 4) * i;
    const gy = y(value);
    root.append(svg('line', { x1: PAD.left, y1: gy, x2: W - PAD.right, y2: gy, stroke: rule, 'stroke-width': 1 }));
    root.append(svg('text', {
      x: PAD.left - 8, y: gy + 3, 'text-anchor': 'end',
      'font-family': 'var(--font-mono)', 'font-size': 10, fill: faint,
    }, formatBytes(value)));
  }

  // area + line path
  const linePts = series.map((p) => `${x(p.date)},${y(p.cumulative)}`);
  const areaD = `M ${x(series[0].date)},${y(0)} L ${linePts.join(' L ')} L ${x(series[series.length - 1].date)},${y(0)} Z`;
  root.append(svg('path', { d: areaD, fill: accent, 'fill-opacity': 0.12, stroke: 'none' }));
  root.append(svg('path', {
    d: `M ${linePts.join(' L ')}`,
    fill: 'none', stroke: accent, 'stroke-width': 2,
    'stroke-linejoin': 'round', 'stroke-linecap': 'round',
  }));

  // hover dots (thin out so we don't render thousands of nodes)
  const step = Math.max(1, Math.floor(series.length / 60));
  for (let i = 0; i < series.length; i += step) {
    const p = series[i];
    const dot = svg('circle', { cx: x(p.date), cy: y(p.cumulative), r: 7, fill: 'transparent' });
    bindTip(dot, `<b>${formatBytes(p.cumulative)}</b><br>${p.date.toLocaleDateString()}`);
    root.append(dot);
  }

  // baseline + endpoint marker
  root.append(svg('line', { x1: PAD.left, y1: y(0), x2: W - PAD.right, y2: y(0), stroke: ink, 'stroke-width': 1 }));
  const last = series[series.length - 1];
  root.append(svg('circle', { cx: x(last.date), cy: y(last.cumulative), r: 3.5, fill: accent }));

  // start/end date labels
  root.append(svg('text', {
    x: PAD.left, y: H - 8, 'text-anchor': 'start',
    'font-family': 'var(--font-mono)', 'font-size': 10, fill: faint,
  }, series[0].date.toLocaleDateString(undefined, { year: '2-digit', month: 'short' })));
  root.append(svg('text', {
    x: W - PAD.right, y: H - 8, 'text-anchor': 'end',
    'font-family': 'var(--font-mono)', 'font-size': 10, fill: faint,
  }, last.date.toLocaleDateString(undefined, { year: '2-digit', month: 'short' })));

  mount.append(root);
}
