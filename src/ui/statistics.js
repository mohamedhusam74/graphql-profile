// ============================================================================
// statistics.js — fol. IV. Mounts the five SVG plots and returns a `redraw`
// function. main.js calls redraw on resize and on theme toggle, so the charts
// re-read the (theme-dependent) CSS colours and re-fit the viewport.
// ============================================================================

import { drawXpBars } from '../charts/barChart.js';
import { drawPassFail } from '../charts/donutChart.js';
import { drawAudit } from '../charts/auditChart.js';
import { drawSkills } from '../charts/radarChart.js';

/**
 * @param {object} profile
 * @returns {() => void} redraw  re-renders every plot from the same profile.
 */
export function renderStatistics(profile) {
  const mounts = {
    bars: document.getElementById('chart-xp-bars'),
    passfail: document.getElementById('chart-passfail'),
    audit: document.getElementById('chart-audit'),
    skills: document.getElementById('chart-skills'),
  };

  const redraw = () => {
    if (mounts.bars) drawXpBars(mounts.bars, profile.topProjects);
    if (mounts.passfail) drawPassFail(mounts.passfail, profile.pass, profile.fail);
    if (mounts.audit) drawAudit(mounts.audit, profile.audit.up, profile.audit.down);
    if (mounts.skills) drawSkills(mounts.skills, profile.skills);
  };

  redraw();
  return redraw;
}
