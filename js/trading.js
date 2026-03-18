// ═══════════════════════════════════════════════════════
// TRADING — DCA, getOrderQty, executeSingleOrder, updatePort, addLog
// ═══════════════════════════════════════════════════════

const fmt = n => '$' + Math.round(n).toLocaleString('en-US');
const fmtB = n => n.toFixed(4) + ' BTC';

// ── Amount calculation ──
function getOrderQty(side) {
  if (amountMode === 'pct') {
    const pct = parseInt(document.getElementById('pct-slider').value) / 100;
    if (side === 'buy') { const usd = cash * pct; return { qty: usd / price, usdValue: usd }; }
    else { const qty = btc * pct; return { qty, usdValue: qty * price }; }
  } else if (amountMode === 'btc') {
    const qty = parseFloat(document.getElementById('btc-input').value) || 0;
    return { qty, usdValue: qty * price };
  } else {
    const usd = parseFloat(document.getElementById('usd-input').value) || 0;
    return { qty: usd / price, usdValue: usd };
  }
}

// ── DCA price range calculation ──
function getDcaPrices(type) {
  const n = dcaSteps;
  if (n === 1) return [price];
  if (dcaUseRange && dcaPriceFrom > 0 && dcaPriceTo > 0) {
    const lo2 = Math.min(dcaPriceFrom, dcaPriceTo);
    const hi2 = Math.max(dcaPriceFrom, dcaPriceTo);
    if (type === 'buy') return Array.from({ length: n }, (_, i) => hi2 - (hi2 - lo2) * (i / (n - 1)));
    else return Array.from({ length: n }, (_, i) => lo2 + (hi2 - lo2) * (i / (n - 1)));
  }
  // Default ±0.5% per step
  if (type === 'buy') return Array.from({ length: n }, (_, i) => price * (1 - (i * 0.005)));
  else return Array.from({ length: n }, (_, i) => price * (1 + (i * 0.005)));
}

function buildDcaOrders(type, totalQty) {
  const prices = getDcaPrices(type);
  return prices.map(p => ({ type, qty: totalQty / dcaSteps, targetPrice: p }));
}

// ── DCA preview rendering ──
function renderDcaPreview() {
  const preview = document.getElementById('dca-preview');
  if (!price) { preview.innerHTML = ''; return; }
  const sb = getOrderQty('buy'), ss = getOrderQty('sell');

  if (dcaSteps === 1) {
    const buyUsd = sb ? sb.usdValue : 0, sellUsd = ss ? ss.usdValue : 0;
    preview.innerHTML = `<div class="dca-row"><span class="dca-row-label">${t('singleOrder')}</span><span class="dca-row-val">${fmt(Math.round(buyUsd))} / ${fmt(Math.round(sellUsd))}</span></div>`;
    return;
  }

  const buyPrices = getDcaPrices('buy');
  const sellPrices = getDcaPrices('sell');
  const buyQPerStep = sb && sb.qty > 0 ? sb.qty / dcaSteps : 0;
  const sellQPerStep = ss && ss.qty > 0 ? ss.qty / dcaSteps : 0;

  let html = `<table class="dca-table"><thead><tr><th>#</th><th style="color:#4ade80;">Buy $</th><th style="color:#4ade80;">BTC</th><th style="color:#a78bfa;">Sell $</th><th style="color:#a78bfa;">BTC</th></tr></thead><tbody>`;
  for (let i = 0; i < dcaSteps; i++) {
    html += `<tr><td>${i + 1}</td><td class="dca-td-buy">${fmt(Math.round(buyPrices[i]))}</td><td class="dca-td-buy">${buyQPerStep > 0 ? buyQPerStep.toFixed(5) : '—'}</td><td class="dca-td-sell">${fmt(Math.round(sellPrices[i]))}</td><td class="dca-td-sell">${sellQPerStep > 0 ? sellQPerStep.toFixed(5) : '—'}</td></tr>`;
  }
  html += `</tbody></table>`;

  const avgBuyExec = buyPrices.reduce((a, b) => a + b, 0) / dcaSteps;
  const avgSellExec = sellPrices.reduce((a, b) => a + b, 0) / dcaSteps;
  const totalSellProceeds = sellQPerStep > 0 ? sellPrices.reduce((a, p) => a + p * sellQPerStep, 0) : 0;
  const costBasis = avgBuy > 0 && ss && ss.qty > 0 ? avgBuy * ss.qty : 0;
  const sellPnl = costBasis > 0 ? totalSellProceeds - costBasis : null;

  html += `<div class="dca-pnl-row">`;
  if (buyQPerStep > 0) html += `<span class="dca-pnl-label">Avg buy: <strong style="color:#4ade80;">${fmt(Math.round(avgBuyExec))}</strong></span>`;
  if (sellQPerStep > 0 && sellPnl !== null) {
    const pos = sellPnl >= 0;
    const pct = ((sellPnl / costBasis) * 100).toFixed(1);
    html += `<span class="dca-pnl-label">P&L: <span class="dca-pnl-val ${pos ? 'dca-pnl-pos' : 'dca-pnl-neg'}">${pos ? '+' : ''}${fmt(Math.round(sellPnl))} (${pos ? '+' : ''}${pct}%)</span></span>`;
  } else if (sellQPerStep > 0) {
    html += `<span class="dca-pnl-label">Avg sell: <strong style="color:#a78bfa;">${fmt(Math.round(avgSellExec))}</strong></span>`;
  }
  html += `</div>`;
  preview.innerHTML = html;
}

function updateAmountDisplay() {
  if (!price) return;
  const bq = getOrderQty('buy'), sq = getOrderQty('sell');
  const u = bq ? bq.usdValue : (sq ? sq.usdValue : 0);
  const tv = document.getElementById('tval');
  if (tv) tv.textContent = fmt(u);
  renderDcaPreview();
}

// ── Order execution ──
function executeSingleOrder(type, qty) {
  if (type === 'buy') {
    const cost = qty * price * 1.0008;
    if (cost > cash + 1) { addLog(t('insufficient')); return; }
    cash -= cost; totalCost += cost; btc += qty; avgBuy = totalCost / btc;
    addLog('✅ BUY ' + fmtB(qty) + ' @ ' + fmt(price) + ' = ' + fmt(cost));
  } else {
    if (qty > btc + .0001) { addLog(t('btcInsuff')); return; }
    const proc = qty * price * .9992;
    btc = Math.max(0, btc - qty); cash += proc;
    if (btc < .0001) { btc = 0; totalCost = 0; avgBuy = 0; } else totalCost = avgBuy * btc;
    addLog('🔴 SELL ' + fmtB(qty) + ' @ ' + fmt(price) + ' = ' + fmt(proc));
  }
  updatePort();
}

// ── Portfolio ──
function updatePort() {
  const bv = btc * price, tot = cash + bv, pnl = tot - INIT, pp = (pnl / INIT) * 100;
  document.getElementById('liq-cash').textContent = fmt(cash);
  document.getElementById('liq-btc').textContent = btc.toFixed(4);
  document.getElementById('liq-btcval').textContent = '≈ ' + fmt(bv);
  document.getElementById('p-cash').textContent = fmt(cash);
  document.getElementById('p-btc').textContent = fmtB(btc);
  document.getElementById('p-bval').textContent = fmt(bv);
  document.getElementById('p-tot').textContent = fmt(tot);
  const pe = document.getElementById('p-pnl'), sg = pnl >= 0 ? '+' : '';
  pe.textContent = sg + fmt(pnl) + ' (' + sg + pp.toFixed(2) + '%)';
  pe.style.color = pnl >= 0 ? '#4ade80' : '#f87171';
  document.getElementById('p-avg').textContent = avgBuy > 0 ? fmt(avgBuy) : '—';
}

// ── Trade log ──
function addLog(msg) {
  const log = document.getElementById('tlog');
  const d = new Date();
  const tm = [d.getHours(), d.getMinutes(), d.getSeconds()].map(x => x.toString().padStart(2, '0')).join(':');
  const placeholder = log.querySelector('[data-i18n="noTrades"]');
  if (placeholder) placeholder.remove();
  const item = document.createElement('div');
  item.className = 'li';
  item.textContent = tm + ' — ' + msg;
  log.insertBefore(item, log.firstChild);
}

// ── Buy/Sell button listeners ──
document.getElementById('bbuy').addEventListener('click', () => {
  const o = getOrderQty('buy');
  if (!o || o.qty <= 0) { addLog(t('invalidAmt')); return; }
  if (dcaSteps === 1) {
    executeSingleOrder('buy', o.qty);
  } else {
    pendingDcaOrders = buildDcaOrders('buy', o.qty);
    addLog(`🔀 ${t('dcaBuy')} — ${dcaSteps} ${t('staggeredOrders')}`);
    const f = pendingDcaOrders.shift();
    executeSingleOrder(f.type, f.qty);
  }
});

document.getElementById('bsell').addEventListener('click', () => {
  const o = getOrderQty('sell');
  if (!o || o.qty <= 0) { addLog(t('invalidAmt')); return; }
  if (dcaSteps === 1) {
    executeSingleOrder('sell', o.qty);
  } else {
    pendingDcaOrders = buildDcaOrders('sell', o.qty);
    addLog(`🔀 ${t('dcaSell')} — ${dcaSteps} ${t('staggeredOrdersSell')}`);
    const f = pendingDcaOrders.shift();
    executeSingleOrder(f.type, f.qty);
  }
});

// ── Amount mode controls ──
document.querySelectorAll('.mode-tab').forEach(tb => tb.addEventListener('click', function () {
  amountMode = this.dataset.mode;
  document.querySelectorAll('.mode-tab').forEach(x => x.classList.remove('act'));
  this.classList.add('act');
  document.getElementById('mode-pct').style.display = amountMode === 'pct' ? 'block' : 'none';
  document.getElementById('mode-btc').style.display = amountMode === 'btc' ? 'block' : 'none';
  document.getElementById('mode-usd').style.display = amountMode === 'usd' ? 'block' : 'none';
  updateAmountDisplay();
}));

document.getElementById('pct-slider').addEventListener('input', function () {
  document.getElementById('pct-val-disp').textContent = this.value + '%';
  updateAmountDisplay();
});

document.querySelectorAll('.qbtn').forEach(b => b.addEventListener('click', function () {
  const pct = parseInt(this.dataset.pct);
  if (pct === 100) {
    document.getElementById('pct-slider').value = 100;
    document.getElementById('pct-val-disp').textContent = '100%';
    updateAmountDisplay();
    document.getElementById('bbuy').click();
  } else if (pct === -100) {
    document.getElementById('pct-slider').value = 100;
    document.getElementById('pct-val-disp').textContent = '100%';
    updateAmountDisplay();
    document.getElementById('bsell').click();
  } else {
    document.getElementById('pct-slider').value = Math.abs(pct);
    document.getElementById('pct-val-disp').textContent = Math.abs(pct) + '%';
    updateAmountDisplay();
  }
}));

document.querySelectorAll('.dca-step-btn').forEach(b => b.addEventListener('click', function () {
  dcaSteps = parseInt(this.dataset.steps);
  document.querySelectorAll('.dca-step-btn').forEach(x => x.classList.remove('act'));
  this.classList.add('act');
  renderDcaPreview();
}));

document.getElementById('btc-input').addEventListener('input', updateAmountDisplay);
document.getElementById('usd-input').addEventListener('input', updateAmountDisplay);

document.getElementById('dca-use-range-chk').addEventListener('change', function () {
  dcaUseRange = this.checked;
  document.getElementById('dca-range-inputs').style.display = dcaUseRange ? 'grid' : 'none';
  renderDcaPreview();
});

document.getElementById('dca-price-from').addEventListener('input', function () {
  dcaPriceFrom = parseFloat(this.value) || 0;
  renderDcaPreview();
});

document.getElementById('dca-price-to').addEventListener('input', function () {
  dcaPriceTo = parseFloat(this.value) || 0;
  renderDcaPreview();
});
