// ============================================================================
// dom.js — a tiny hyperscript helper. `h(tag, attrs, ...children)` builds a real
// DOM node so the renderers can compose markup without innerHTML string-glue
// (which is both an XSS foot-gun and impossible to attach listeners to).
// ============================================================================

/**
 * Build an HTML element.
 * @param {string} tag
 * @param {Record<string, unknown>} [attrs]  class, style, dataset, on-handlers, booleans
 * @param {...(Node|string|number|null|false|Array)} children
 * @returns {HTMLElement}
 */
export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);

  for (const [key, value] of Object.entries(attrs || {})) {
    if (value == null || value === false) continue;

    if (key === 'class') el.className = value;
    else if (key === 'style') el.setAttribute('style', value);
    else if (key === 'dataset') Object.assign(el.dataset, value);
    else if (key === 'html') el.innerHTML = value; // only for trusted, app-built strings
    else if (key.startsWith('on') && typeof value === 'function') {
      el.addEventListener(key.slice(2).toLowerCase(), value);
    } else {
      el.setAttribute(key, value === true ? '' : String(value));
    }
  }

  append(el, children);
  return el;
}

/** Append a (possibly nested) list of children, coercing primitives to text. */
export function append(el, children) {
  for (const child of children.flat(Infinity)) {
    if (child == null || child === false) continue;
    el.append(child.nodeType ? child : document.createTextNode(String(child)));
  }
}
