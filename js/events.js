// ═══════════════════════════════════════════════════════
// EVENTS — renderEvents, appendEvt, modal, applyEvent
// ═══════════════════════════════════════════════════════

const badgeLbl = () => ({ live: 'LIVE · Mar 18', fut: 'Future', ext: 'Historical' });
const badgeCls = { live: 'badge-live', fut: 'badge-fut', ext: 'badge-ext' };

function renderSuggested(cat) {
  const banner = document.getElementById('suggested-banner');
  const s = SUGGESTED[cat];
  if (!s) { banner.style.display = 'none'; return; }
  banner.style.display = 'flex';
  banner.innerHTML = `<div class="suggested-icon">💡</div><div class="suggested-body"><div class="suggested-label">${t('suggestedLabel')}</div><div class="suggested-title">Bull: ${s.bull.n} <span style="color:#4ade80;">${s.bull.impact}</span> &nbsp;|&nbsp; Bear: ${s.bear.n} <span style="color:#f87171;">${s.bear.impact}</span></div><div class="suggested-desc">${s.bull.desc}</div></div>`;
}

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
  document.getElementById('modal-remember-chk').checked = false;
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
