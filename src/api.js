// ============================================================================
// api.js — GraphQL transport (Bearer auth) + pure data aggregation.
// ----------------------------------------------------------------------------
// All transport goes through gqlRequest(). Everything below it is a pure
// function: data in → numbers out, no fetching, no DOM. That keeps the
// money-maths (XP totals, audit ratio, pass/fail) easy to reason about and
// verify against GraphiQL. See CONCEPTS.md / CODE_WALKTHROUGH.md.
// ============================================================================

import { CONFIG, QUERIES } from './config.js';
import { getToken } from './auth.js';
import { getUserId } from './jwt.js';

/** Raised on a 401 so the controller can bounce the user back to sign-in. */
export class SessionExpiredError extends Error {
  constructor() { super('Your session has expired. Please sign in again.'); this.name = 'SessionExpiredError'; }
}

/**
 * POST a { query, variables } document with the Bearer token.
 * @param {string} query
 * @param {Record<string, unknown>} [variables]
 * @returns {Promise<any>} the `data` object
 */
export async function gqlRequest(query, variables = {}) {
  const token = getToken();
  if (!token) throw new SessionExpiredError();

  let response;
  try {
    response = await fetch(CONFIG.GRAPHQL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ query, variables }),
    });
  } catch {
    throw new Error('Could not reach the GraphQL endpoint. Check your connection.');
  }

  if (response.status === 401) throw new SessionExpiredError();
  if (!response.ok) throw new Error(`GraphQL request failed (HTTP ${response.status}).`);

  const json = await response.json();
  if (json.errors?.length) throw new Error(json.errors[0].message || 'GraphQL returned an error.');
  return json.data;
}

// ── Pure helpers ────────────────────────────────────────────────────────────

/** A "main cursus" project lives under bh-module and is neither piscine nor checkpoint. */
export function isMainModuleProject(path) {
  if (!path) return false;
  return path.includes('bh-module') && !path.includes('piscine') && !path.includes('checkpoint');
}

/**
 * Looser scope for the `result` table. Graded project paths there don't reliably
 * carry the "bh-module" segment that XP transactions do, so requiring it dropped
 * every row and pass/fail came back 0. Here we only exclude piscine + checkpoint
 * noise and keep everything else, so the grades ledger and pass/fail populate.
 * (Kept separate from isMainModuleProject so XP totals stay exactly as verified.)
 */
export function isGradedProject(path) {
  if (!path) return false;
  return !path.includes('piscine') && !path.includes('checkpoint');
}

/**
 * Keep only main-cursus XP rows. Scoped by PATH only (not amount) so the total
 * equals a straight GraphiQL sum over type="xp" on the cursus — including any
 * 0 / negative correction rows the platform might record.
 */
export function moduleXP(transactions) {
  return transactions.filter((tx) => isMainModuleProject(tx.path));
}

/** Sum of XP (in bytes) across the given transactions. */
export function sumXP(transactions) {
  return transactions.reduce((total, tx) => total + tx.amount, 0);
}

/** Last path segment, or the one after the "…module…" segment, as a project name. */
export function projectName(path, fallback = '—') {
  if (!path) return fallback;
  const parts = path.split('/').filter(Boolean);
  const moduleIdx = parts.findIndex((seg) => seg.includes('module'));
  if (moduleIdx !== -1 && moduleIdx < parts.length - 1) return parts[moduleIdx + 1];
  return parts[parts.length - 1] || fallback;
}

/** Running cumulative XP series, ordered by date (input is already asc). */
export function cumulativeSeries(transactions) {
  let running = 0;
  return transactions.map((tx) => {
    running += tx.amount;
    return { date: new Date(tx.createdAt), amount: tx.amount, cumulative: running };
  });
}

/** Top N projects by total XP earned. */
export function xpByProject(transactions, limit = 8) {
  const totals = new Map();
  for (const tx of transactions) {
    // Prefer the nested object.name (a stable project id) over the path heuristic.
    const name = tx.object?.name || projectName(tx.path);
    totals.set(name, (totals.get(name) || 0) + tx.amount);
  }
  return [...totals.entries()]
    .map(([name, xp]) => ({ name, xp }))
    .sort((a, b) => b.xp - a.xp)
    .slice(0, limit);
}

/**
 * The authoritative set of PASSED project names: distinct projects that earned
 * positive XP (Plot 2's universe). XP is only granted for a project you cleared,
 * so this is the source of truth for passes — shared by the pass/fail counts and
 * the fol. III grades ledger so a project's Pass/Fail label is identical
 * everywhere (object.name identity, path heuristic as fallback).
 */
export function passedProjectNames(moduleTransactions = []) {
  return new Set(
    xpByProject(moduleTransactions, Infinity)
      .filter((p) => p.xp > 0)
      .map((p) => p.name)
  );
}

export function passFailCounts(results, moduleTransactions = []) {
  const passed = passedProjectNames(moduleTransactions);

  // Failed = a graded project (newest grade ≤ 0) that is not in the passed set.
  const latest = new Map();
  for (const r of results) {
    if (!isGradedProject(r.path)) continue;
    const name = r.object?.name || projectName(r.path);
    if (!latest.has(name)) latest.set(name, r.grade); // first seen = newest
  }
  let fail = 0;
  for (const [name, grade] of latest) {
    if (!passed.has(name) && grade <= 0) fail++;
  }

  return { pass: passed.size, fail, total: passed.size + fail };
}

/**
 * The fol. III "Recent grades" ledger — most-recent projects, newest first.
 *
 * Built primarily from the XP transactions (the same project set as Plot 2 and
 * "Projects passed"), because for many accounts the `result` table only holds a
 * couple of onboarding rows while the real projects live in XP. Every XP project
 * is a Pass, dated by its newest XP transaction. Genuinely failed projects — a
 * graded result ≤ 0 with no XP — and any result-only passes are merged in, so the
 * ledger never disagrees with the pass/fail counts.
 */
export function gradeLedger(moduleTransactions, results, limit = 8) {
  const rows = new Map(); // name -> { name, pass, date }

  for (const tx of moduleTransactions) {
    if (!(tx.amount > 0)) continue; // only XP-earning rows mark a pass
    const name = tx.object?.name || projectName(tx.path);
    const prev = rows.get(name);
    if (!prev) rows.set(name, { name, pass: true, date: tx.createdAt });
    else if (new Date(tx.createdAt) > new Date(prev.date)) prev.date = tx.createdAt;
  }

  // results arrive newest-first → first sighting of a name is its latest grade.
  for (const r of results) {
    if (!isGradedProject(r.path)) continue;
    const name = r.object?.name || projectName(r.path);
    if (rows.has(name)) continue; // already a pass via XP
    rows.set(name, { name, pass: r.grade > 0, date: r.createdAt });
  }

  return [...rows.values()]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, limit);
}

/** Best (max) demonstrated value per skill type, sorted desc. */
export function aggregateSkills(skillTransactions, limit = 6) {
  const best = new Map();
  for (const tx of skillTransactions) {
    const label = tx.type.replace(/^skill_/, '');
    best.set(label, Math.max(best.get(label) || 0, tx.amount));
  }
  return [...best.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

/** XP (bytes) → human string using the platform's base-1000 kB/MB convention. */
export function formatBytes(bytes) {
  const n = Number(bytes) || 0;
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(2)} MB`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(2)} kB`;
  return `${Math.round(n)} B`;
}

// ── Orchestration ────────────────────────────────────────────────────────────

/**
 * Fetch and normalise everything the profile needs.
 * 1) NORMAL identity query → authoritative userId (JWT sub is the fallback).
 * 2) the rest in parallel, all scoped by $userId.
 * @returns {Promise<object>} normalised profile model
 */
export async function fetchProfile() {
  const identityData = await gqlRequest(QUERIES.IDENTITY);
  const user = identityData.user?.[0];
  if (!user) throw new Error('No user record was returned for this session.');

  const userId = user.id ?? getUserId(getToken());
  if (!userId) throw new Error('Could not determine the user id for this session.');

  const [levelData, xpData, auditData, resultData, skillData] = await Promise.all([
    gqlRequest(QUERIES.LEVEL, { userId }),
    gqlRequest(QUERIES.XP_TRANSACTIONS, { userId }),
    gqlRequest(QUERIES.AUDITS, { userId }),
    gqlRequest(QUERIES.RESULTS, { userId }),
    gqlRequest(QUERIES.SKILLS, { userId }),
  ]);

  const moduleTx = moduleXP(xpData.transaction);
  const up = auditData.up.aggregate.sum.amount ?? 0;
  const down = auditData.down.aggregate.sum.amount ?? 0;
  const { pass, fail } = passFailCounts(resultData.result, moduleTx);

  return {
    user,
    userId,
    level: levelData.transaction[0]?.amount ?? 0,
    totalXP: sumXP(moduleTx),
    // ratio = given ÷ received; if you've given but never received, that's a
    // "perfect" (infinite) ratio, not zero — the UI renders Infinity as "∞".
    audit: { up, down, ratio: down > 0 ? up / down : up > 0 ? Infinity : 0 },
    pass,
    fail,
    cumulative: cumulativeSeries(moduleTx),
    topProjects: xpByProject(moduleTx, 8),
    skills: aggregateSkills(skillData.transaction, 6),
    gradeLedger: gradeLedger(moduleTx, resultData.result, Infinity), // fol. III — every project, scrollable
  };
}
