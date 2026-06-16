// ============================================================================
// svg.js — shared helpers for the hand-built SVG charts: a namespaced element
// factory, a theme-colour reader (so charts re-colour on theme toggle), an
// empty-state placeholder, and one reusable hover tooltip appended to <body>.
// ============================================================================

const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * Build an SVG element. Children may be SVG nodes or text.
 * @param {string} tag
 * @param {Record<string, unknown>} [attrs]
 * @param {...(Node|string|number|null|false|Array)} children
 * @returns {SVGElement}
 */
export function svg(tag, attrs = {}, ...children) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs || {})) {
    if (value == null || value === false) continue;
    el.setAttribute(key, String(value));
  }
  for (const child of children.flat(Infinity)) {
    if (child == null || child === false) continue;
    el.append(child.nodeType ? child : document.createTextNode(String(child)));
  }
  return el;
}

/** Read a CSS custom property off <html> at draw time (theme-aware). */
export function color(name, fallback = '#16263a') {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

/** A centred "no data" placeholder for an empty plot. */
export function emptyPlot(message = 'No data yet.') {
  const div = document.createElement('div');
  div.className = 'plot__empty';
  div.textContent = message;
  return div;
}

// ── Shared hover tooltip ────────────────────────────────────────────────────
let tipEl = null;
function tooltip() {
  if (!tipEl) {
    tipEl = document.createElement('div');
    tipEl.className = 'chart-tip';
    document.body.appendChild(tipEl);
  }
  return tipEl;
}

/**
 * Show a tooltip while the pointer is over `node`.
 * @param {SVGElement} node
 * @param {string} html  trusted, app-built markup (never user input)
 */
export function bindTip(node, html) {
  node.style.cursor = 'pointer';
  const move = (event) => {
    const tip = tooltip();
    tip.style.left = `${event.clientX + 14}px`;
    tip.style.top = `${event.clientY + 14}px`;
  };
  node.addEventListener('pointerenter', (event) => {
    const tip = tooltip();
    tip.innerHTML = html;
    tip.classList.add('is-visible');
    move(event);
  });
  node.addEventListener('pointermove', move);
  node.addEventListener('pointerleave', () => tooltip().classList.remove('is-visible'));
}
