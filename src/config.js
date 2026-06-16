// ============================================================================
// config.js — endpoints, storage key, and the GraphQL query catalogue.
// ----------------------------------------------------------------------------
// The project requires three *kinds* of GraphQL query. Each is tagged below so
// the requirement is auditable from the source (see CONCEPTS.md for the theory):
//
//   • NORMAL    — no arguments, just a selection set                → IDENTITY
//   • ARGUMENTS — $variables + where / order_by / limit             → most queries
//   • NESTED    — selecting a related object through a relationship → RESULTS, XP_TRANSACTIONS
// ============================================================================

export const CONFIG = Object.freeze({
  SIGNIN_URL:  'https://learn.reboot01.com/api/auth/signin',
  GRAPHQL_URL: 'https://learn.reboot01.com/api/graphql-engine/v1/graphql',
  TOKEN_KEY:   'logbook.jwt',
  THEME_KEY:   'logbook.theme',
});

export const QUERIES = Object.freeze({
  // ── NORMAL QUERY ─────────────────────────────────────────────────────────
  // No arguments. The Bearer token scopes the result to the authed user, so
  // `user` returns a one-element array: the signed-in navigator.
  IDENTITY: `query Identity {
    user {
      id
      login
      attrs
      createdAt
    }
  }`,

  // ── QUERY WITH ARGUMENTS (+ NESTED relationship) ───────────────────────────
  // $userId variable, a where filter, ordering — and the nested `object`
  // relationship pulled in alongside each transaction.
  XP_TRANSACTIONS: `query XpTransactions($userId: Int!) {
    transaction(
      where: { userId: { _eq: $userId }, type: { _eq: "xp" } }
      order_by: { createdAt: asc }
    ) {
      amount
      path
      createdAt
      object { name type }
    }
  }`,

  // ── QUERY WITH ARGUMENTS ───────────────────────────────────────────────────
  // The platform encodes "level" as a transaction; the highest one on the main
  // cursus path is the current level. Piscines are excluded from level.
  LEVEL: `query Level($userId: Int!) {
    transaction(
      where: {
        userId: { _eq: $userId }
        type: { _eq: "level" }
        _and: [
          { path: { _like: "%bh-module%" } }
          { path: { _nlike: "%piscine%" } }
          { path: { _nlike: "%checkpoint%" } }
        ]
      }
      order_by: { amount: desc }
      limit: 1
    ) {
      amount
    }
  }`,

  // ── QUERY WITH ARGUMENTS (aggregate) ───────────────────────────────────────
  // Two aliased aggregates: XP "up" (audits you GAVE) and "down" (you RECEIVED).
  AUDITS: `query Audits($userId: Int!) {
    up: transaction_aggregate(
      where: { userId: { _eq: $userId }, type: { _eq: "up" } }
    ) { aggregate { sum { amount } } }
    down: transaction_aggregate(
      where: { userId: { _eq: $userId }, type: { _eq: "down" } }
    ) { aggregate { sum { amount } } }
  }`,

  // ── NESTED QUERY (+ ARGUMENTS) ─────────────────────────────────────────────
  // result → object is a relationship traversal: each grade is joined to the
  // exercise/project it belongs to. Mirrors the brief's `result { user {…} }`.
  RESULTS: `query Results($userId: Int!) {
    result(
      where: { userId: { _eq: $userId }, grade: { _is_null: false } }
      order_by: { createdAt: desc }
    ) {
      grade
      path
      createdAt
      object { name type }
    }
  }`,

  // ── QUERY WITH ARGUMENTS ───────────────────────────────────────────────────
  // Skills are transactions whose type is prefixed "skill_". Highest amount per
  // skill type wins (the platform reports the best demonstrated level).
  SKILLS: `query Skills($userId: Int!) {
    transaction(
      where: { userId: { _eq: $userId }, type: { _like: "skill_%" } }
      order_by: { amount: desc }
    ) {
      type
      amount
      path
    }
  }`,
});
