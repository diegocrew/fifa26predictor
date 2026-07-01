/* Real-world actual results, used to auto-fill scores when a group/round is
   marked "Official results". null means not played yet / not confirmed.
   Group match order matches PAIR_INDEXES: [0v1, 0v2, 0v3, 1v2, 1v3, 2v3]
   against the team order in GROUPS[g] (js/data.js). Source: user-confirmed
   official fixture/results list, cross-checked 2026-07-01. */

const REAL_GROUP_RESULTS = {
  A: [{ hs: 2, as: 0 }, { hs: 1, as: 0 }, { hs: 3, as: 0 }, { hs: 1, as: 0 }, { hs: 1, as: 1 }, { hs: 2, as: 1 }],
  B: [{ hs: 2, as: 1 }, { hs: 4, as: 1 }, { hs: 1, as: 1 }, { hs: 1, as: 1 }, { hs: 6, as: 0 }, { hs: 3, as: 1 }],
  C: [{ hs: 1, as: 1 }, { hs: 3, as: 0 }, { hs: 3, as: 0 }, { hs: 1, as: 0 }, { hs: 4, as: 2 }, { hs: 1, as: 0 }],
  D: [{ hs: 2, as: 0 }, { hs: 4, as: 1 }, { hs: 2, as: 3 }, { hs: 0, as: 0 }, { hs: 2, as: 0 }, { hs: 1, as: 0 }],
  E: [{ hs: 2, as: 1 }, { hs: 1, as: 2 }, { hs: 7, as: 1 }, { hs: 1, as: 0 }, { hs: 2, as: 0 }, { hs: 0, as: 0 }],
  F: [{ hs: 2, as: 2 }, { hs: 5, as: 1 }, { hs: 3, as: 1 }, { hs: 1, as: 1 }, { hs: 4, as: 0 }, { hs: 5, as: 1 }],
  G: [{ hs: 1, as: 1 }, { hs: 0, as: 0 }, { hs: 5, as: 1 }, { hs: 1, as: 1 }, { hs: 3, as: 1 }, { hs: 2, as: 2 }],
  H: [{ hs: 0, as: 0 }, { hs: 1, as: 0 }, { hs: 4, as: 0 }, { hs: 2, as: 2 }, { hs: 0, as: 0 }, { hs: 1, as: 1 }],
  I: [{ hs: 4, as: 1 }, { hs: 3, as: 1 }, { hs: 3, as: 0 }, { hs: 3, as: 2 }, { hs: 4, as: 1 }, { hs: 5, as: 0 }],
  J: [{ hs: 2, as: 0 }, { hs: 3, as: 0 }, { hs: 3, as: 1 }, { hs: 3, as: 3 }, { hs: 3, as: 1 }, { hs: 2, as: 1 }],
  K: [{ hs: 0, as: 0 }, { hs: 1, as: 0 }, { hs: 3, as: 1 }, { hs: 1, as: 1 }, { hs: 5, as: 0 }, { hs: 3, as: 1 }],
  L: [{ hs: 4, as: 2 }, { hs: 0, as: 0 }, { hs: 2, as: 0 }, { hs: 2, as: 1 }, { hs: 1, as: 0 }, { hs: 1, as: 0 }]
};

// Keyed by knockout match id (see js/data.js R32_TEMPLATE etc.).
// aCode/bCode pin down the actual real teams for that match - needed because our
// simplified third-place-slotting algorithm doesn't reliably reproduce FIFA's true
// assignment (confirmed wrong in testing: e.g. it guessed Mexico would face DR Congo
// and England would face Ecuador, but the real draw is the other way around). Since
// the group stage is fully complete, the entire Round of 32 draw is already fixed and
// known - hs/as/winner/note are only filled in for matches that have actually been
// played; the rest just pin the two real teams so the bracket shows correctly ahead
// of kickoff. Source: official bracket graphic, confirmed 2026-07-01.
const REAL_KO_RESULTS = {
  73: { aCode: 'ZA', bCode: 'CA', hs: 0, as: 1, winner: 'CA' },
  74: { aCode: 'DE', bCode: 'PY', hs: 1, as: 1, winner: 'PY', note: 'Paraguay won 4-3 on penalties after extra time' },
  75: { aCode: 'NL', bCode: 'MA', hs: 1, as: 1, winner: 'MA', note: 'Morocco won 3-2 on penalties after extra time' },
  76: { aCode: 'BR', bCode: 'JP', hs: 2, as: 1, winner: 'BR' },
  77: { aCode: 'FR', bCode: 'SE', hs: 3, as: 0, winner: 'FR' },
  78: { aCode: 'CI', bCode: 'NO', hs: 1, as: 2, winner: 'NO' },
  79: { aCode: 'MX', bCode: 'EC', hs: 2, as: 0, winner: 'MX' },
  80: { aCode: 'ENG', bCode: 'CD', hs: 2, as: 1, winner: 'ENG' },
  81: { aCode: 'US', bCode: 'BA' },
  82: { aCode: 'BE', bCode: 'SN' },
  83: { aCode: 'PT', bCode: 'HR' },
  84: { aCode: 'ES', bCode: 'AT' },
  85: { aCode: 'CH', bCode: 'DZ' },
  86: { aCode: 'AR', bCode: 'CV' },
  87: { aCode: 'CO', bCode: 'GH' },
  88: { aCode: 'AU', bCode: 'EG' }
};
