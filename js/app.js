/* App state, standings/bracket resolution, and rendering. Vanilla JS, no build step. */

const STORAGE_KEY = 'fifa26predictor:v1';
const GROUP_LETTERS = Object.keys(GROUPS); // A..L
const PAIR_INDEXES = [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]];
const ALL_KO_IDS = [
  ...R32_TEMPLATE.map(m => m.id),
  ...R16_IDS, ...QF_IDS, ...SF_IDS, FINAL_ID, THIRD_PLACE_MATCH_ID
];

const KO_ROUND_KEYS = ['R32', 'R16', 'QF', 'SF', 'F', 'TP'];

const KO_MATCHES = {};
R32_TEMPLATE.forEach(m => { KO_MATCHES[m.id] = { round: 'R32', a: m.a, b: m.b }; });
R16_PAIRS.forEach((pair, i) => { KO_MATCHES[R16_IDS[i]] = { round: 'R16', a: { t: 'M', id: pair[0] }, b: { t: 'M', id: pair[1] } }; });
QF_PAIRS.forEach((pair, i) => { KO_MATCHES[QF_IDS[i]] = { round: 'QF', a: { t: 'M', id: pair[0] }, b: { t: 'M', id: pair[1] } }; });
SF_PAIRS.forEach((pair, i) => { KO_MATCHES[SF_IDS[i]] = { round: 'SF', a: { t: 'M', id: pair[0] }, b: { t: 'M', id: pair[1] } }; });
KO_MATCHES[FINAL_ID] = { round: 'F', a: { t: 'M', id: FINAL_PAIR[0] }, b: { t: 'M', id: FINAL_PAIR[1] } };
KO_MATCHES[THIRD_PLACE_MATCH_ID] = { round: 'TP', a: { t: 'ML', id: FINAL_PAIR[0] }, b: { t: 'ML', id: FINAL_PAIR[1] } };

// Team codes whose real Round of 32 third-place slot is already confirmed (from REAL_KO_RESULTS).
// Used so the generic slotting algorithm doesn't re-guess a team into a second, still-open match.
const KNOWN_THIRD_PLACE_SLOTS = {};
R32_TEMPLATE.forEach(m => {
  const real = REAL_KO_RESULTS[m.id];
  if (m.b.t === 'T' && real && real.bCode) KNOWN_THIRD_PLACE_SLOTS[real.bCode] = m.b.s;
});

let state = null;

function freshState() {
  const group = {};
  GROUP_LETTERS.forEach(g => {
    group[g] = PAIR_INDEXES.map(() => ({ hs: null, as: null }));
  });
  const ko = {};
  ALL_KO_IDS.forEach(id => { ko[id] = { hs: null, as: null, winner: null }; });
  const groupActual = {};
  GROUP_LETTERS.forEach(g => { groupActual[g] = false; });
  const koRoundActual = {};
  KO_ROUND_KEYS.forEach(r => { koRoundActual[r] = false; });
  return { group, ko, groupActual, koRoundActual };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return freshState();
    const parsed = JSON.parse(raw);
    const base = freshState();
    GROUP_LETTERS.forEach(g => {
      if (parsed.group && parsed.group[g]) base.group[g] = parsed.group[g];
      if (parsed.groupActual && g in parsed.groupActual) base.groupActual[g] = !!parsed.groupActual[g];
    });
    ALL_KO_IDS.forEach(id => {
      if (parsed.ko && parsed.ko[id]) base.ko[id] = parsed.ko[id];
    });
    KO_ROUND_KEYS.forEach(r => {
      if (parsed.koRoundActual && r in parsed.koRoundActual) base.koRoundActual[r] = !!parsed.koRoundActual[r];
    });
    return base;
  } catch (e) {
    return freshState();
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function computeStandings(g) {
  const teams = GROUPS[g];
  const table = {};
  teams.forEach(c => { table[c] = { code: c, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 }; });
  state.group[g].forEach((m, i) => {
    if (m.hs === null || m.as === null || m.hs === '' || m.as === '') return;
    const hs = Number(m.hs), as = Number(m.as);
    const [hi, ai] = PAIR_INDEXES[i];
    const home = table[teams[hi]], away = table[teams[ai]];
    home.p++; away.p++;
    home.gf += hs; home.ga += as;
    away.gf += as; away.ga += hs;
    if (hs > as) { home.w++; home.pts += 3; away.l++; }
    else if (hs < as) { away.w++; away.pts += 3; home.l++; }
    else { home.d++; away.d++; home.pts += 1; away.pts += 1; }
  });
  const arr = Object.values(table);
  arr.forEach(t => { t.gd = t.gf - t.ga; });
  arr.sort((x, y) => y.pts - x.pts || y.gd - x.gd || y.gf - x.gf || teams.indexOf(x.code) - teams.indexOf(y.code));
  return arr;
}

function isGroupComplete(g) {
  return state.group[g].every(m => m.hs !== null && m.as !== null && m.hs !== '' && m.as !== '');
}

function allGroupsComplete() {
  return GROUP_LETTERS.every(isGroupComplete);
}

function resolveGroupWinner(g) {
  return isGroupComplete(g) ? computeStandings(g)[0].code : null;
}

function resolveGroupRunnerUp(g) {
  return isGroupComplete(g) ? computeStandings(g)[1].code : null;
}

function thirdPlaceRows() {
  return GROUP_LETTERS.map(g => {
    if (!isGroupComplete(g)) return { group: g, complete: false };
    const third = computeStandings(g)[2];
    return { group: g, complete: true, ...third };
  });
}

function resolveThirdPlaceAssignment() {
  if (!allGroupsComplete()) return null;
  const rows = thirdPlaceRows().filter(r => r.complete);
  rows.sort((x, y) => y.pts - x.pts || y.gd - x.gd || y.gf - x.gf || x.group.localeCompare(y.group));
  const qualifiedGroups = rows.slice(0, 8).map(r => r.group);

  const assignment = new Array(8).fill(null);
  const remaining = [];
  qualifiedGroups.forEach(g => {
    const code = computeStandings(g)[2].code;
    const knownSlot = KNOWN_THIRD_PLACE_SLOTS[code];
    if (knownSlot !== undefined) assignment[knownSlot] = code;
    else remaining.push(g);
  });

  for (let slot = 0; slot < 8; slot++) {
    if (assignment[slot]) continue;
    let idx = remaining.findIndex(g => g !== THIRD_PLACE_SLOT_OPPONENT_GROUP[slot]);
    if (idx === -1) idx = 0;
    assignment[slot] = computeStandings(remaining.splice(idx, 1)[0])[2].code;
  }
  return assignment;
}

function resolveSpec(spec) {
  if (spec.t === 'W') {
    const code = resolveGroupWinner(spec.g);
    return { code, label: code ? TEAMS[code] : `Winner Group ${spec.g}` };
  }
  if (spec.t === 'R') {
    const code = resolveGroupRunnerUp(spec.g);
    return { code, label: code ? TEAMS[code] : `Runner-up Group ${spec.g}` };
  }
  if (spec.t === 'T') {
    const assignment = resolveThirdPlaceAssignment();
    const code = assignment ? assignment[spec.s] : null;
    return { code, label: code ? TEAMS[code] : `Best 3rd Place #${spec.s + 1}` };
  }
  if (spec.t === 'M') {
    const code = getKOWinner(spec.id);
    return { code, label: code ? TEAMS[code] : `Winner of Match ${spec.id}` };
  }
  if (spec.t === 'ML') {
    const code = getKOLoser(spec.id);
    return { code, label: code ? TEAMS[code] : `Loser of Match ${spec.id}` };
  }
  return { code: null, label: '?' };
}

function getKOMatchupTeams(id) {
  const round = KO_MATCHES[id].round;
  const real = REAL_KO_RESULTS[id];
  if (state.koRoundActual[round] && real && real.aCode && real.bCode) {
    return {
      a: { code: real.aCode, label: TEAMS[real.aCode] },
      b: { code: real.bCode, label: TEAMS[real.bCode] }
    };
  }
  const spec = KO_MATCHES[id];
  return { a: resolveSpec(spec.a), b: resolveSpec(spec.b) };
}

function getKOWinner(id) {
  const { a, b } = getKOMatchupTeams(id);
  const rec = state.ko[id];
  if (rec.winner && (rec.winner === a.code || rec.winner === b.code)) return rec.winner;
  return null;
}

function getKOLoser(id) {
  const { a, b } = getKOMatchupTeams(id);
  const w = getKOWinner(id);
  if (!w || !a.code || !b.code) return null;
  return w === a.code ? b.code : a.code;
}

/* ---------- Rendering ---------- */

function teamLabel(code, fallbackLabel) {
  if (code) return `<span class="flag">${flagEmoji(code)}</span> ${TEAMS[code]}`;
  return `<span class="pending">${fallbackLabel}</span>`;
}

function renderGroups() {
  const el = document.getElementById('groups-view');
  const cards = GROUP_LETTERS.map(g => {
    const standings = computeStandings(g);
    const rows = standings.map((t, i) => `
      <tr class="${i < 2 ? 'qualifies' : ''}">
        <td>${i + 1}</td>
        <td>${teamLabel(t.code)}</td>
        <td>${t.p}</td><td>${t.w}</td><td>${t.d}</td><td>${t.l}</td>
        <td>${t.gf}</td><td>${t.ga}</td><td>${t.gd}</td><td><strong>${t.pts}</strong></td>
      </tr>`).join('');

    const matches = GROUPS[g];
    const matchRows = PAIR_INDEXES.map((pair, i) => {
      const m = state.group[g][i];
      const homeCode = matches[pair[0]], awayCode = matches[pair[1]];
      return `
      <div class="match" data-group="${g}" data-idx="${i}">
        <div class="match-team">${teamLabel(homeCode)}</div>
        <input type="number" min="0" class="score home-score" value="${m.hs ?? ''}" placeholder="-">
        <span class="dash">:</span>
        <input type="number" min="0" class="score away-score" value="${m.as ?? ''}" placeholder="-">
        <div class="match-team away">${teamLabel(awayCode)}</div>
        <div class="match-actions">
          <button class="quick" data-pick="home">1-0</button>
          <button class="quick" data-pick="draw">Draw</button>
          <button class="quick" data-pick="away">0-1</button>
        </div>
      </div>`;
    }).join('');

    const isOfficial = state.groupActual[g];
    return `
    <div class="group-card ${isOfficial ? 'official' : ''}">
      <div class="group-header">
        <h3>Group ${g} ${isOfficial ? '<span class="official-badge">OFFICIAL</span>' : ''}</h3>
        <label class="official-toggle"><input type="checkbox" class="group-actual-check" data-group="${g}" ${isOfficial ? 'checked' : ''}> Official results</label>
      </div>
      <table class="standings">
        <thead><tr><th></th><th>Team</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GF</th><th>GA</th><th>GD</th><th>Pts</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="matches">${matchRows}</div>
    </div>`;
  }).join('');

  el.innerHTML = `
    <p class="hint">Toggle "Official results" on a group to auto-fill the real scores (where known) instead of typing them in yourself.</p>
    <div class="groups-grid">${cards}</div>`;

  el.querySelectorAll('.group-actual-check').forEach(cb => {
    cb.addEventListener('change', () => {
      const g = cb.dataset.group;
      state.groupActual[g] = cb.checked;
      if (cb.checked) {
        (REAL_GROUP_RESULTS[g] || []).forEach((r, i) => {
          if (r) { state.group[g][i].hs = r.hs; state.group[g][i].as = r.as; }
        });
      }
      saveState(); renderAll();
    });
  });

  el.querySelectorAll('.match').forEach(matchEl => {
    const g = matchEl.dataset.group;
    const idx = Number(matchEl.dataset.idx);
    const rec = state.group[g][idx];
    const homeInput = matchEl.querySelector('.home-score');
    const awayInput = matchEl.querySelector('.away-score');

    const commit = () => { saveState(); renderAll(); };

    homeInput.addEventListener('input', () => { rec.hs = homeInput.value === '' ? null : Number(homeInput.value); commit(); });
    awayInput.addEventListener('input', () => { rec.as = awayInput.value === '' ? null : Number(awayInput.value); commit(); });

    matchEl.querySelectorAll('.quick').forEach(btn => {
      btn.addEventListener('click', () => {
        const pick = btn.dataset.pick;
        if (pick === 'home') { rec.hs = 1; rec.as = 0; }
        else if (pick === 'away') { rec.hs = 0; rec.as = 1; }
        else { rec.hs = 1; rec.as = 1; }
        commit();
      });
    });
  });
}

function renderThirdPlace() {
  const el = document.getElementById('thirdplace-view');
  const rows = thirdPlaceRows();
  const complete = rows.filter(r => r.complete);
  complete.sort((x, y) => y.pts - x.pts || y.gd - x.gd || y.gf - x.gf || x.group.localeCompare(y.group));
  const pending = rows.filter(r => !r.complete);

  const completeRows = complete.map((r, i) => `
    <tr class="${i < 8 ? 'qualifies' : ''}">
      <td>${i + 1}</td>
      <td>Group ${r.group}</td>
      <td>${teamLabel(r.code)}</td>
      <td>${r.p}</td><td>${r.w}</td><td>${r.d}</td><td>${r.l}</td>
      <td>${r.gf}</td><td>${r.ga}</td><td>${r.gd}</td><td><strong>${r.pts}</strong></td>
    </tr>`).join('');

  const pendingRows = pending.map(r => `
    <tr class="pending-row">
      <td>-</td><td>Group ${r.group}</td><td colspan="8" class="pending">Group not finished yet</td>
    </tr>`).join('');

  el.innerHTML = `
    <p class="hint">The best 8 third-placed teams advance to the Round of 32. This table is only final once all 12 groups are complete.</p>
    <table class="standings wide">
      <thead><tr><th></th><th>Group</th><th>Team</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GF</th><th>GA</th><th>GD</th><th>Pts</th></tr></thead>
      <tbody>${completeRows}${pendingRows}</tbody>
    </table>`;
}

function renderKoMatch(id) {
  const { a, b } = getKOMatchupTeams(id);
  const rec = state.ko[id];
  const bothKnown = a.code && b.code;
  const winner = getKOWinner(id);
  const isOfficial = state.koRoundActual[KO_MATCHES[id].round];
  const real = REAL_KO_RESULTS[id];
  const note = isOfficial && real && real.note ? `<div class="ko-note">${real.note}</div>` : '';

  return `
    <div class="ko-match ${isOfficial ? 'official' : ''}" data-id="${id}">
      <div class="ko-team ${winner && winner === a.code ? 'winner' : ''} ${bothKnown ? 'clickable' : ''}" data-side="a">${teamLabel(a.code, a.label)}</div>
      <div class="ko-score-row">
        <input type="number" min="0" class="score ko-home" value="${rec.hs ?? ''}" placeholder="-" ${bothKnown ? '' : 'disabled'}>
        <span class="dash">:</span>
        <input type="number" min="0" class="score ko-away" value="${rec.as ?? ''}" placeholder="-" ${bothKnown ? '' : 'disabled'}>
      </div>
      <div class="ko-team ${winner && winner === b.code ? 'winner' : ''} ${bothKnown ? 'clickable' : ''}" data-side="b">${teamLabel(b.code, b.label)}</div>
      ${note}
    </div>`;
}

function renderKnockouts() {
  const el = document.getElementById('knockout-view');
  const columns = [
    { title: 'Round of 32', key: 'R32', ids: R32_TEMPLATE.map(m => m.id) },
    { title: 'Round of 16', key: 'R16', ids: R16_IDS },
    { title: 'Quarter-finals', key: 'QF', ids: QF_IDS },
    { title: 'Semi-finals', key: 'SF', ids: SF_IDS },
    { title: 'Final', key: 'F', ids: [FINAL_ID] },
    { title: '3rd Place Match', key: 'TP', ids: [THIRD_PLACE_MATCH_ID] }
  ];

  el.innerHTML = `
    <p class="hint">Round of 32 slots fill in once the relevant groups are complete. Third-place team slotting uses a simplified rule (see README) rather than FIFA's full official permutation table.</p>
    <div class="bracket">
      ${columns.map(col => {
        const isOfficial = state.koRoundActual[col.key];
        return `
        <div class="bracket-col">
          <h3>${col.title} ${isOfficial ? '<span class="official-badge">OFFICIAL</span>' : ''}</h3>
          <label class="official-toggle"><input type="checkbox" class="round-actual-check" data-round="${col.key}" ${isOfficial ? 'checked' : ''}> Official results</label>
          ${col.ids.map(renderKoMatch).join('')}
        </div>`;
      }).join('')}
    </div>`;

  el.querySelectorAll('.round-actual-check').forEach(cb => {
    cb.addEventListener('change', () => {
      const key = cb.dataset.round;
      state.koRoundActual[key] = cb.checked;
      if (cb.checked) {
        Object.keys(KO_MATCHES).forEach(idStr => {
          const id = Number(idStr);
          const r = REAL_KO_RESULTS[id];
          if (KO_MATCHES[id].round === key && r) {
            state.ko[id].hs = r.hs;
            state.ko[id].as = r.as;
            if (r.winner) state.ko[id].winner = r.winner;
          }
        });
      }
      saveState(); renderAll();
    });
  });

  el.querySelectorAll('.ko-match').forEach(matchEl => {
    const id = Number(matchEl.dataset.id);
    const rec = state.ko[id];
    const { a, b } = getKOMatchupTeams(id);
    const commit = () => { saveState(); renderAll(); };

    const homeInput = matchEl.querySelector('.ko-home');
    const awayInput = matchEl.querySelector('.ko-away');

    homeInput.addEventListener('input', () => { rec.hs = homeInput.value === '' ? null : Number(homeInput.value); commit(); });
    awayInput.addEventListener('input', () => { rec.as = awayInput.value === '' ? null : Number(awayInput.value); commit(); });

    matchEl.querySelectorAll('.ko-team.clickable').forEach(teamEl => {
      teamEl.addEventListener('click', () => {
        const side = teamEl.dataset.side;
        rec.winner = side === 'a' ? a.code : b.code;
        commit();
      });
    });
  });
}

function renderAll() {
  const active = document.activeElement;
  let restoreSelector = null;
  if (active && active.tagName === 'INPUT' && active.classList.contains('score')) {
    const groupParent = active.closest('.match');
    const koParent = active.closest('.ko-match');
    const side = active.classList.contains('home-score') || active.classList.contains('ko-home') ? 'home' : 'away';
    if (groupParent) {
      restoreSelector = `.match[data-group="${groupParent.dataset.group}"][data-idx="${groupParent.dataset.idx}"] .${side === 'home' ? 'home-score' : 'away-score'}`;
    } else if (koParent) {
      restoreSelector = `.ko-match[data-id="${koParent.dataset.id}"] .${side === 'home' ? 'ko-home' : 'ko-away'}`;
    }
  }

  renderGroups();
  renderThirdPlace();
  renderKnockouts();

  if (restoreSelector) {
    const el = document.querySelector(restoreSelector);
    if (el) { el.focus(); const v = el.value; el.setSelectionRange(v.length, v.length); }
  }
}

function setupTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  const views = {
    groups: document.getElementById('groups-view'),
    thirdplace: document.getElementById('thirdplace-view'),
    knockout: document.getElementById('knockout-view')
  };
  tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      tabs.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      Object.entries(views).forEach(([key, v]) => { v.hidden = key !== btn.dataset.tab; });
    });
  });
}

function setupReset() {
  document.getElementById('reset-btn').addEventListener('click', () => {
    if (!confirm('Reset all predictions and entered results? This cannot be undone.')) return;
    state = freshState();
    saveState();
    renderAll();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  state = loadState();
  setupTabs();
  setupReset();
  renderAll();
});
