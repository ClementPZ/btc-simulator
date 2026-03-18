// ═══════════════════════════════════════════════════════
// EVENTS — renderEvents, appendEvt, modal, applyEvent
// ═══════════════════════════════════════════════════════

const badgeLbl = () => ({ live: 'LIVE · Mar 18', fut: 'Future', ext: 'Historical' });
const badgeCls = { live: 'badge-live', fut: 'badge-fut', ext: 'badge-ext' };

function renderMostProbable(cat) {
  const el = document.getElementById('most-probable');
  const s = SUGGESTED[cat];
  if (!s) { el.classList.remove('visible'); return; }
  el.classList.add('visible');
  el.innerHTML = `
    <button class="mp-card mp-card-bull" onclick="handleEventClick({n:${JSON.stringify(s.bull.n)},desc:${JSON.stringify(s.bull.desc)},s:${parseInt(s.bull.impact)}}, true)">
      <div class="mp-tag">★ Most probable — Bullish</div>
      <div class="mp-name">${s.bull.n}</div>
      <div class="mp-desc">${s.bull.desc}</div>
      <div class="mp-foot"><span class="mp-impact">${s.bull.impact}</span></div>
    </button>
    <button class="mp-card mp-card-bear" onclick="handleEventClick({n:${JSON.stringify(s.bear.n)},desc:${JSON.stringify(s.bear.desc)},s:${parseInt(s.bear.impact)}}, false)">
      <div class="mp-tag">★ Most probable — Bearish</div>
      <div class="mp-name">${s.bear.n}</div>
      <div class="mp-desc">${s.bear.desc}</div>
      <div class="mp-foot"><span class="mp-impact">${s.bear.impact}</span></div>
    </button>
  `;
}
function renderSuggested(cat) { renderMostProbable(cat); }

function renderEvents(cat) {
  currentCat = cat;
  document.querySelectorAll('.ctab').forEach(b => {
    b.className = 'ctab';
    if (b.dataset.cat === cat) b.classList.add('act-' + cat);
  });
  ['col-bull', 'col-bear'].forEach(id => document.getElementById(id).innerHTML = '');
  EVTS[cat].bull.forEach(e => appendEvt('col-bull', e, true));
  EVTS[cat].bear.forEach(e => appendEvt('col-bear', e, false));
  renderSuggested(cat);
}

function appendEvt(col, e, bull) {
  const c = document.getElementById(col);
  const b = document.createElement('button');
  b.className = 'evt ' + (bull ? 'evt-bull' : 'evt-bear');
  const sg = e.s > 0 ? '+' : '';
  const bl = badgeLbl();
  b.innerHTML = `<div class="evt-head"><span class="evt-name ${bull ? 'evt-name-up' : 'evt-name-dn'}">${e.n}</span><span class="evt-badge ${badgeCls[e.badge || 'ext']}">${bl[e.badge || 'ext']}</span></div><div class="evt-desc">${e.desc}</div><div class="evt-foot"><span class="evt-impact ${bull ? 'evt-imp-up' : 'evt-imp-dn'}">${sg}${e.s}%</span><span class="evt-src">${e.src}</span></div>`;
  b.addEventListener('click', () => handleEventClick(e, bull));
  c.appendChild(b);
}

function handleEventClick(e, bull) {
  if (rememberedSimMode !== null) {
    applyEvent(e, bull, rememberedSimMode);
    return;
  }
  pendingEvent = { e, bull };
  document.getElementById('modal-evt-name').textContent = e.n;
  document.getElementById('modal-evt-desc').textContent = e.desc + ' Impact: ' + (e.s > 0 ? '+' : '') + e.s + '%';
  document.getElementById('modal-remember-chk').checked = true;
  document.getElementById('modal-remember-wrap').style.display = 'flex';
  document.getElementById('modal-overlay').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
  pendingEvent = null;
}

function applyEvent(e, bull, mode) {
  shock += e.s;
  priceMode = mode === 'free' ? 'sim_free' : 'sim_return';
  if (mode === 'return') simReturnTimer = 66;
  // Show sim-pill in header, hide live-pill
  const simPill = document.getElementById('sim-pill');
  const livePill = document.getElementById('live-pill');
  const simText = document.getElementById('sim-pill-text');
  if (simText) simText.textContent = (mode === 'free' ? t('simFree') : t('simReturn')) + ' — ' + e.n + ' (' + (e.s > 0 ? '+' : '') + e.s + '%)';
  if (simPill) simPill.classList.add('visible');
  if (livePill) livePill.style.display = 'none';
  const sg = e.s > 0 ? '+' : '';
  addLog((bull ? '🟢 BULL' : '🔴 BEAR') + ' [' + (mode === 'free' ? 'free' : 'return') + '] — ' + e.n + ' (' + sg + e.s + '%)');
}

// ── Modal listeners ──
document.getElementById('modal-diverge').addEventListener('click', () => {
  if (!pendingEvent) return;
  const remember = document.getElementById('modal-remember-chk').checked;
  if (remember) rememberedSimMode = 'free';
  applyEvent(pendingEvent.e, pendingEvent.bull, 'free');
  closeModal();
});

document.getElementById('modal-return').addEventListener('click', () => {
  if (!pendingEvent) return;
  const remember = document.getElementById('modal-remember-chk').checked;
  if (remember) rememberedSimMode = 'return';
  applyEvent(pendingEvent.e, pendingEvent.bull, 'return');
  closeModal();
});

document.getElementById('modal-cancel').addEventListener('click', closeModal);

document.getElementById('modal-overlay').addEventListener('click', e => {
  if (e.target === e.currentTarget) closeModal();
});

// ── Event category tabs ──
document.querySelectorAll('.ctab').forEach(b => b.addEventListener('click', () => renderEvents(b.dataset.cat)));
