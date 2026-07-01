/* Real 2026 FIFA World Cup data: 48 teams, 12 groups of 4.
   Group draw verified against public reporting (NBC Sports / Wikipedia, June 2026). */

const TEAMS = {
  MX: 'Mexico', ZA: 'South Africa', KR: 'South Korea', CZ: 'Czechia',
  CH: 'Switzerland', CA: 'Canada', BA: 'Bosnia and Herzegovina', QA: 'Qatar',
  BR: 'Brazil', MA: 'Morocco', SCT: 'Scotland', HT: 'Haiti',
  US: 'United States', AU: 'Australia', PY: 'Paraguay', TR: 'Türkiye',
  DE: 'Germany', CI: "Côte d'Ivoire", EC: 'Ecuador', CW: 'Curaçao',
  NL: 'Netherlands', JP: 'Japan', SE: 'Sweden', TN: 'Tunisia',
  BE: 'Belgium', EG: 'Egypt', IR: 'Iran', NZ: 'New Zealand',
  ES: 'Spain', CV: 'Cabo Verde', UY: 'Uruguay', SA: 'Saudi Arabia',
  FR: 'France', NO: 'Norway', SN: 'Senegal', IQ: 'Iraq',
  AR: 'Argentina', AT: 'Austria', DZ: 'Algeria', JO: 'Jordan',
  CO: 'Colombia', PT: 'Portugal', CD: 'DR Congo', UZ: 'Uzbekistan',
  ENG: 'England', HR: 'Croatia', GH: 'Ghana', PA: 'Panama'
};

const GROUPS = {
  A: ['MX', 'ZA', 'KR', 'CZ'],
  B: ['CH', 'CA', 'BA', 'QA'],
  C: ['BR', 'MA', 'SCT', 'HT'],
  D: ['US', 'AU', 'PY', 'TR'],
  E: ['DE', 'CI', 'EC', 'CW'],
  F: ['NL', 'JP', 'SE', 'TN'],
  G: ['BE', 'EG', 'IR', 'NZ'],
  H: ['ES', 'CV', 'UY', 'SA'],
  I: ['FR', 'NO', 'SN', 'IQ'],
  J: ['AR', 'AT', 'DZ', 'JO'],
  K: ['CO', 'PT', 'CD', 'UZ'],
  L: ['ENG', 'HR', 'GH', 'PA']
};

// Special flag sequences for teams without their own ISO country code.
const SPECIAL_FLAGS = {
  ENG: '\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}',
  SCT: '\u{1F3F4}\u{E0067}\u{E0062}\u{E0073}\u{E0063}\u{E0074}\u{E007F}'
};

function flagEmoji(code) {
  if (SPECIAL_FLAGS[code]) return SPECIAL_FLAGS[code];
  const iso = { CI: 'CI', CW: 'CW', CV: 'CV', CD: 'CD' }[code] || code;
  return [...iso.toUpperCase()].map(c => String.fromCodePoint(127397 + c.charCodeAt(0))).join('');
}

// Fixed Round of 32 template. W=group winner, R=group runner-up, T=best-third-place slot.
// This mirrors the official "no redraws" 2026 bracket skeleton; the exact slot a given
// third-place team lands in (see THIRD_PLACE_SLOTS below) is a simplified approximation,
// not FIFA's full published permutation table - see README for details.
const R32_TEMPLATE = [
  { id: 73, a: { t: 'R', g: 'A' }, b: { t: 'R', g: 'B' } },
  { id: 74, a: { t: 'W', g: 'E' }, b: { t: 'T', s: 0 } },
  { id: 75, a: { t: 'W', g: 'F' }, b: { t: 'R', g: 'C' } },
  { id: 76, a: { t: 'W', g: 'C' }, b: { t: 'R', g: 'F' } },
  { id: 77, a: { t: 'W', g: 'I' }, b: { t: 'T', s: 1 } },
  { id: 78, a: { t: 'R', g: 'E' }, b: { t: 'R', g: 'I' } },
  { id: 79, a: { t: 'W', g: 'A' }, b: { t: 'T', s: 2 } },
  { id: 80, a: { t: 'W', g: 'L' }, b: { t: 'T', s: 3 } },
  { id: 81, a: { t: 'W', g: 'D' }, b: { t: 'T', s: 4 } },
  { id: 82, a: { t: 'W', g: 'G' }, b: { t: 'T', s: 5 } },
  { id: 83, a: { t: 'R', g: 'K' }, b: { t: 'R', g: 'L' } },
  { id: 84, a: { t: 'W', g: 'H' }, b: { t: 'R', g: 'J' } },
  { id: 85, a: { t: 'W', g: 'B' }, b: { t: 'T', s: 6 } },
  { id: 86, a: { t: 'W', g: 'J' }, b: { t: 'R', g: 'H' } },
  { id: 87, a: { t: 'W', g: 'K' }, b: { t: 'T', s: 7 } },
  { id: 88, a: { t: 'R', g: 'D' }, b: { t: 'R', g: 'G' } }
];

// Which group's winner each third-place slot faces (used to avoid a team meeting its own group winner).
const THIRD_PLACE_SLOT_OPPONENT_GROUP = ['E', 'I', 'A', 'L', 'D', 'G', 'B', 'K'];

// Standard sequential single-elimination progression from R32 -> R16 -> QF -> SF -> Final.
const R16_PAIRS = [[73, 74], [75, 76], [77, 78], [79, 80], [81, 82], [83, 84], [85, 86], [87, 88]];
const R16_IDS = [89, 90, 91, 92, 93, 94, 95, 96];
const QF_PAIRS = [[89, 90], [91, 92], [93, 94], [95, 96]];
const QF_IDS = [97, 98, 99, 100];
const SF_PAIRS = [[97, 98], [99, 100]];
const SF_IDS = [101, 102];
const FINAL_PAIR = [101, 102];
const FINAL_ID = 103;
const THIRD_PLACE_MATCH_ID = 104;
