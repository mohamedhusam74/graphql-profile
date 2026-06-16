// ============================================================================
// radarChart.js — Plot 5. Demonstrated skills as a radar / spider plot. Each
// axis is a skill; the filled polygon is the best level reached on each.
// ============================================================================

import { svg, color, emptyPlot, bindTip } from './svg.js';

const SIZE = 320;
const R = 110;
const RINGS = 4;

/** Vertex for axis `i` of `n` at radius fraction `frac` (0 at 12 o'clock). */
function vertex(cx, cy, i, n, frac) {
  const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
  return [cx + R * frac * Math.cos(angle), cy + R * frac * Math.sin(angle)];
}

/**
 * @param {HTMLElement} mount
 * @param {Array<{label: string, value: number}>} skills
 */
export function drawSkills(mount, skills) {
  mount.replaceChildren();
  if (!skills || skills.length < 3) {
    mount.append(emptyPlot('Not enough skills to plot a radar yet.'));
    return;
  }

  const accent = color('--accent', '#9a6a2f');
  const rule = color('--rule', 'rgba(0,0,0,.15)');
  const faint = color('--ink-faint');
  const ink = color('--ink');

  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const n = skills.length;
  // Skill amounts are percentages; scale to 100 (or the max if someone exceeds it).
  const scaleMax = Math.max(100, ...skills.map((s) => s.value));

  const root = svg('svg', { viewBox: `0 0 ${SIZE} ${SIZE}`, role: 'img', 'aria-label': 'Skills radar' });

  // concentric rings
  for (let ring = 1; ring <= RINGS; ring++) {
    const frac = ring / RINGS;
    const pts = skills.map((_, i) => vertex(cx, cy, i, n, frac).join(',')).join(' ');
    root.append(svg('polygon', { points: pts, fill: 'none', stroke: rule, 'stroke-width': 1 }));
  }

  // axes + labels
  skills.forEach((skill, i) => {
    const [ex, ey] = vertex(cx, cy, i, n, 1);
    root.append(svg('line', { x1: cx, y1: cy, x2: ex, y2: ey, stroke: rule, 'stroke-width': 1 }));
    const [lx, ly] = vertex(cx, cy, i, n, 1.16);
    root.append(svg('text', {
      x: lx, y: ly + 3,
      'text-anchor': lx < cx - 4 ? 'end' : lx > cx + 4 ? 'start' : 'middle',
      'font-family': 'var(--font-ui)', 'font-size': 10, fill: faint,
    }, skill.label));
  });

  // data polygon
  const dataPts = skills.map((s, i) => vertex(cx, cy, i, n, Math.min(1, s.value / scaleMax)));
  root.append(svg('polygon', {
    points: dataPts.map((p) => p.join(',')).join(' '),
    fill: accent, 'fill-opacity': 0.22, stroke: accent, 'stroke-width': 2, 'stroke-linejoin': 'round',
  }));

  // vertices with tooltips
  skills.forEach((skill, i) => {
    const [px, py] = dataPts[i];
    const dot = svg('circle', { cx: px, cy: py, r: 4, fill: accent });
    bindTip(dot, `<b>${skill.label}</b><br>${Math.round(skill.value)}%`);
    root.append(dot);
  });

  // centre dot
  root.append(svg('circle', { cx, cy, r: 2, fill: ink }));

  mount.append(root);
}
