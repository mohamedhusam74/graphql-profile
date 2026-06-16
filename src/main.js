// ============================================================================
// main.js — the controller. Decides which view to show, loads the profile,
// renders every section, and wires logout / theme / resize. Entry point loaded
// as <script type="module"> from index.html.
// ============================================================================

import { isAuthenticated, signOut } from './auth.js';
import { fetchProfile, SessionExpiredError } from './api.js';
import { state, initTheme, toggleTheme } from './state.js';
import { h } from './ui/dom.js';
import { initLogin } from './ui/login.js';
import { renderIdentity } from './ui/identity.js';
import { renderExperience } from './ui/experience.js';
import { renderAuditSummary, renderGrades } from './ui/auditsGrades.js';
import { renderStatistics } from './ui/statistics.js';

const loginView = document.getElementById('login-view');
const profileView = document.getElementById('profile-view');
const profileError = document.getElementById('profile-error');

let redrawCharts = null;     // set after statistics render, reused on resize/theme
let resizeTimer = null;

// ── View switching ────────────────────────────────────────────────────────
function showLogin() {
  profileView.hidden = true;
  loginView.hidden = false;
}
function showProfile() {
  loginView.hidden = true;
  profileView.hidden = false;
  loadProfile();
}

// ── Toast ───────────────────────────────────────────────────────────────────
let toastTimer = null;
function toast(message) {
  const el = document.getElementById('toast');
  el.textContent = message;
  el.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('is-visible'), 4000);
}

// ── Loading skeletons ─────────────────────────────────────────────────────
function skeletonSheet(...widths) {
  return h('div', { class: 'sheet', style: 'padding:1.4rem' },
    ...widths.map((w) => h('div', { class: 'skeleton', style: `height:1rem;width:${w};margin:.5rem 0;border-radius:3px` })));
}
function setLoadingState() {
  profileError.hidden = true;
  document.getElementById('identity-card').replaceChildren(skeletonSheet('40%', '25%', '60%', '50%'));
  document.getElementById('experience-grid').replaceChildren(skeletonSheet('30%', '70%'));
  document.getElementById('audit-summary').replaceChildren(skeletonSheet('40%', '55%'));
  document.getElementById('grades-list').replaceChildren(skeletonSheet('80%', '80%', '80%'));
  for (const id of ['chart-xp-line', 'chart-xp-bars', 'chart-passfail', 'chart-audit', 'chart-skills']) {
    document.getElementById(id).replaceChildren(h('div', { class: 'skeleton', style: 'height:180px;width:100%;border-radius:4px' }));
  }
}

// ── Reveal-on-scroll ────────────────────────────────────────────────────────
function observeReveals() {
  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) { entry.target.classList.add('is-in'); io.unobserve(entry.target); }
    }
  }, { threshold: 0.08 });
  document.querySelectorAll('#profile-view .reveal').forEach((el) => io.observe(el));
}

// ── Load + render the profile ───────────────────────────────────────────────
async function loadProfile() {
  setLoadingState();
  try {
    const profile = await fetchProfile();
    state.profile = profile;

    document.getElementById('masthead-meta').textContent = `@${profile.user.login} · Level ${profile.level}`;

    renderIdentity(document.getElementById('identity-card'), profile);
    renderExperience(document.getElementById('experience-grid'), profile);
    renderAuditSummary(document.getElementById('audit-summary'), profile);
    renderGrades(document.getElementById('grades-list'), profile);
    redrawCharts = renderStatistics(profile);

    observeReveals();
  } catch (err) {
    if (err instanceof SessionExpiredError) {
      signOut();
      showLogin();
      toast('Your session expired — please sign in again.');
      return;
    }
    profileError.textContent = err.message || 'Something went wrong loading your logbook.';
    profileError.hidden = false;
  }
}

// ── Global wiring ─────────────────────────────────────────────────────────
function wire() {
  document.getElementById('logout-btn').addEventListener('click', () => {
    signOut();
    state.profile = null;
    redrawCharts = null;
    showLogin();
    toast('Signed out.');
  });

  document.getElementById('theme-toggle').addEventListener('click', () => {
    toggleTheme();
    if (redrawCharts) redrawCharts(); // charts read theme colours at draw time
  });

  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { if (redrawCharts) redrawCharts(); }, 250);
  });

  initLogin(() => showProfile());
}

// ── Boot ────────────────────────────────────────────────────────────────────
document.documentElement.classList.add('js'); // enables the reveal-on-scroll hiding
initTheme();
wire();
if (isAuthenticated()) showProfile();
else showLogin();
