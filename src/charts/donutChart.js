// ============================================================================
// donutChart.js — Plot 3. Project pass / fail as a donut with the pass rate in
// the hole and a small legend below.
// ============================================================================

import { svg, color, emptyPlot, bindTip } from './svg.js';

const SIZE = 240;
const R = 92;
const STROKE = 30;

/** Point on the donut circle for a given fraction (0 at 12 o'clock, clockwise). */
function point(cx, cy, fraction) {
  const angle = fraction * Math.PI * 2 - Math.PI / 2;
  return [cx + R * Math.cos(angle), cy + R * Math.sin(angle)];
}

function arc(cx, cy, from, to) {
  const [x1, y1] = point(cx, cy, from);
  const [x2, y2] = point(cx, cy, to);
  const large = to - from > 0.5 ? 1 : 0;
  return `M ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2}`;
}

/**
 * @param {HTMLElement} mount
 * @param {number} pass
 * @param {number} fail
 */
export function drawPassFail(mount, pass, fail) {
  mount.replaceChildren();
  const total = pass + fail;
  if (!total) {
    mount.append(emptyPlot('No pass/fail data yet.'));
    return;
  }

  const passColor = color('--pass', '#2f6d5b');
  const failColor = color('--fail', '#b23a2e');
  const ink = color('--ink');
  const faint = color('--ink-faint');

  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const passFrac = pass / total;
  const rate = Math.round(passFrac * 100);

  const root = svg('svg', {
    viewBox: `0 0 ${SIZE} ${SIZE}`, role: 'img',
    'aria-label': `${pass} passed, ${fail} failed (${rate}% pass rate)`,
  });

  // pass arc (drawn first, from top, clockwise)
  if (pass > 0) {
    const passArc = svg('path', {
      d: arc(cx, cy, 0, passFrac >= 1 ? 0.9999 : passFrac),
      fill: 'none', stroke: passColor, 'stroke-width': STROKE, 'stroke-linecap': 'butt',
    });
    bindTip(passArc, `<b>${pass}</b> passed`);
    root.append(passArc);
  }
  // fail arc
  if (fail > 0) {
    const failArc = svg('path', {
      d: arc(cx, cy, passFrac, 0.9999),
      fill: 'none', stroke: failColor, 'stroke-width': STROKE, 'stroke-linecap': 'butt',
    });
    bindTip(failArc, `<b>${fail}</b> failed`);
    root.append(failArc);
  }

  // centre readout
  root.append(svg('text', {
    x: cx, y: cy - 2, 'text-anchor': 'middle',
    'font-family': 'var(--font-mono)', 'font-size': 34, 'font-weight': 600, fill: ink,
  }, `${rate}%`));
  root.append(svg('text', {
    x: cx, y: cy + 20, 'text-anchor': 'middle',
    'font-family': 'var(--font-ui)', 'font-size': 11, 'letter-spacing': 1.5, fill: faint,
  }, 'PASS RATE'));

  mount.append(root);

  // legend
  const legend = document.createElement('div');
  legend.className = 'plot__legend';
  legend.append(legendItem(passColor, 'Passed', pass), legendItem(failColor, 'Failed', fail));
  mount.append(legend);
}

function legendItem(swatch, label, value) {
  const item = document.createElement('div');
  item.className = 'plot__legend-item';
  const dot = document.createElement('i');
  dot.style.background = swatch;
  const text = document.createElement('span');
  text.textContent = `${label} `;
  const strong = document.createElement('b');
  strong.textContent = String(value);
  item.append(dot, text, strong);
  return item;
}
