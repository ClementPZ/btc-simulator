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
    tradeHistory.push({ type: 'buy', pnl: 0, price });
    addLog('BUY ' + fmtB(qty) + ' @ ' + fmt(price) + ' = ' + fmt(cost));
  } else {
    if (qty > btc + .0001) { addLog(t('btcInsuff')); return; }
    const proc = qty * price * .9992;
    const tradePnl = avgBuy > 0 ? (price - avgBuy) * qty : 0;
    btc = Math.max(0, btc - qty); cash += proc;
    if (btc < .0001) { btc = 0; totalCost = 0; avgBuy = 0; } else totalCost = avgBuy * btc;
    tradeHistory.push({ type: 'sell', pnl: tradePnl, price });
    addLog('SELL ' + fmtB(qty) + ' @ ' + fmt(price) + ' = ' + fmt(proc));
  }
  updatePort();
  updateTraderProfile();
  // Mark next pending DCA as triggered in queue
  if (pendingDcaOrders.length > 0) {
    markQueueOrderTriggered(pendingDcaOrders[0].targetPrice);
  }
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

// ── Fear & Greed ──
let fgScore = 0, fgName = '';
async function fetchFearGreed() {
  try {
    const r = await fetch('https://api.alternative.me/fng/?limit=8');
    if (!r.ok) return;
    const d = await r.json();
    const entries = d.data;
    if (!entries || entries.length === 0) return;
    const now  = entries[0];
    const prev = entries[1] || now;
    const weekAvg = Math.round(entries.slice(0,7).reduce((s,e) => s + parseInt(e.value), 0) / Math.min(entries.length, 7));
    fgScore = parseInt(now.value);
    fgName  = now.value_classification;
    const nameColor = fgScore < 25 ? '#f87171' : fgScore < 46 ? '#facc15' : fgScore < 75 ? '#c8920a' : '#4ade80';
    document.getElementById('fg-score').textContent = fgScore;
    const nameEl = document.getElementById('fg-name');
    nameEl.textContent = fgName;
    nameEl.style.color = nameColor;
    document.getElementById('fg-prev').textContent = prev.value;
    document.getElementById('fg-week').textContent = weekAvg;
    // Animate needle: score 0-100 maps to -90deg (fear) ... +90deg (greed)
    const deg = (fgScore / 100) * 180 - 90;
    const needle = document.getElementById('fg-needle');
    if (needle) needle.setAttribute('transform', 'rotate(' + deg + ' 80 80)');
  } catch(e) {}
}
fetchFearGreed();
setInterval(fetchFearGreed, 300000);

// ── Trader profile ──
let tradeHistory = [];
function updateTraderProfile() {
  const els = {
    style:   document.getElementById('tp-style'),
    trades:  document.getElementById('tp-trades'),
    winrate: document.getElementById('tp-winrate'),
    best:    document.getElementById('tp-best'),
    worst:   document.getElementById('tp-worst'),
    risk:    document.getElementById('tp-risk'),
  };
  if (!els.style) return;
  const n = tradeHistory.length;
  els.trades.textContent = n;
  if (n === 0) { els.style.textContent = 'New'; return; }
  const wins = tradeHistory.filter(t => t.pnl > 0).length;
  const wr = Math.round((wins / n) * 100);
  els.winrate.textContent = wr + '%';
  const pnls = tradeHistory.map(t => t.pnl);
  const best  = Math.max(...pnls);
  const worst = Math.min(...pnls);
  els.best.textContent  = best  > 0 ? '+' + fmt(Math.round(best))  : '—';
  els.worst.textContent = worst < 0 ? '−' + fmt(Math.round(Math.abs(worst))) : '—';
  const buys = tradeHistory.filter(t => t.type === 'buy').length;
  const style = n < 3 ? 'Learning' : buys / n > 0.7 ? 'Accumulator' : buys / n < 0.3 ? 'Seller' : wr > 60 ? 'Strategist' : 'Active';
  els.style.textContent = style;
  if (price > 0) {
    const bv = btc * price, tot = cash + bv;
    const riskPct = tot > 0 ? Math.round((bv / tot) * 100) : 0;
    els.risk.style.width = riskPct + '%';
  }
}

// ── Order confirm modal ──
let pendingOrderAction = null;

function showOrderConfirm(type, qty, usdValue, dcaCount) {
  return new Promise(resolve => {
    const isBuy = type === 'buy';
    const colClass = isBuy ? 'oc-val-buy' : 'oc-val-sell';
    document.getElementById('oc-title').textContent = isBuy ? 'Confirm BUY order' : 'Confirm SELL order';
    const typeEl = document.getElementById('oc-type');
    typeEl.textContent = isBuy ? 'BUY BTC' : 'SELL BTC';
    typeEl.className = 'oc-val ' + colClass;
    document.getElementById('oc-qty').textContent = qty.toFixed(6) + ' BTC';
    document.getElementById('oc-price').textContent = fmt(price);
    document.getElementById('oc-total').textContent = fmt(Math.round(usdValue));
    const dcaRow = document.getElementById('oc-dca-row');
    if (dcaCount > 1) {
      dcaRow.style.display = 'flex';
      document.getElementById('oc-dca').textContent = dcaCount + ' staggered orders';
    } else { dcaRow.style.display = 'none'; }
    // Fear & Greed context
    const fgEl = document.getElementById('oc-fg-score');
    const fgColor = fgScore < 25 ? '#f87171' : fgScore < 46 ? '#facc15' : fgScore < 75 ? '#c8920a' : '#4ade80';
    fgEl.textContent = fgScore > 0 ? fgScore + ' — ' + fgName : '—';
    fgEl.style.color = fgColor;
    const confirmBtn = document.getElementById('oc-confirm');
    confirmBtn.className = 'oc-confirm ' + (isBuy ? 'oc-confirm-buy' : 'oc-confirm-sell');
    confirmBtn.textContent = isBuy ? 'BUY BTC' : 'SELL BTC';
    document.getElementById('order-confirm-overlay').classList.remove('hidden');
    const onConfirm = () => { cleanup(); resolve(true); };
    const onCancel  = () => { cleanup(); resolve(false); };
    function cleanup() {
      document.getElementById('order-confirm-overlay').classList.add('hidden');
      confirmBtn.removeEventListener('click', onConfirm);
      document.getElementById('oc-cancel').removeEventListener('click', onCancel);
    }
    confirmBtn.addEventListener('click', onConfirm);
    document.getElementById('oc-cancel').addEventListener('click', onCancel);
  });
}

// ── DCA queue rendering ──
let dcaQueueOrders = []; // { type, qty, targetPrice, triggered, id }
let dcaQueueIdCounter = 0;

function renderDcaQueue() {
  const wrap = document.getElementById('dca-queue');
  const list = document.getElementById('dca-queue-list');
  if (!dcaQueueOrders.length) { wrap.style.display = 'none'; return; }
  wrap.style.display = 'flex';
  list.innerHTML = '';
  dcaQueueOrders.forEach((order, i) => {
    const row = document.createElement('div');
    row.className = 'dca-order-row' + (order.triggered ? ' triggered' : '');
    row.dataset.id = order.id;
    const typeClass = order.type === 'buy' ? 'dca-order-type-buy' : 'dca-order-type-sell';
    row.innerHTML =
      '<span class="dca-order-idx">' + (i+1) + '</span>' +
      '<span class="' + typeClass + '">' + order.type.toUpperCase() + '</span>' +
      '<span class="dca-order-price">' + fmt(Math.round(order.targetPrice)) + '</span>' +
      (order.triggered
        ? '<span class="dca-order-check">✓</span>'
        : '<button class="dca-order-cancel" data-id="' + order.id + '">×</button>');
    list.appendChild(row);
  });
  list.querySelectorAll('.dca-order-cancel').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id);
      dcaQueueOrders = dcaQueueOrders.filter(o => o.id !== id);
      // also remove from pendingDcaOrders by index match
      const remaining = dcaQueueOrders.filter(o => !o.triggered);
      pendingDcaOrders = remaining.map(o => ({ type: o.type, qty: o.qty, targetPrice: o.targetPrice }));
      renderDcaQueue();
      addLog('Order #' + (id) + ' cancelled');
    });
  });
}

function markQueueOrderTriggered(targetPrice) {
  const order = dcaQueueOrders.find(o => !o.triggered && Math.abs(o.targetPrice - targetPrice) < 1);
  if (order) { order.triggered = true; renderDcaQueue(); }
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

// ── Buy/Sell button listeners (with confirm modal) ──
async function handleTrade(type) {
  const o = getOrderQty(type);
  if (!o || o.qty <= 0) { addLog(t('invalidAmt')); return; }
  const confirmed = await showOrderConfirm(type, o.qty, o.usdValue, dcaSteps);
  if (!confirmed) return;
  if (dcaSteps === 1) {
    executeSingleOrder(type, o.qty);
  } else {
    const orders = buildDcaOrders(type, o.qty);
    // Populate visual queue
    dcaQueueOrders = orders.map(ord => ({ ...ord, triggered: false, id: ++dcaQueueIdCounter }));
    renderDcaQueue();
    pendingDcaOrders = [...orders];
    addLog('DCA ' + type.toUpperCase() + ' — ' + dcaSteps + ' orders queued');
    const f = pendingDcaOrders.shift();
    markQueueOrderTriggered(f.targetPrice);
    executeSingleOrder(f.type, f.qty);
  }
}

document.getElementById('bbuy').addEventListener('click', () => handleTrade('buy'));
document.getElementById('bsell').addEventListener('click', () => handleTrade('sell'));

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

document.getElementById('dca-range-toggle').addEventListener('click', function () {
  dcaUseRange = !dcaUseRange;
  document.getElementById('dca-range-inputs').style.display = dcaUseRange ? 'grid' : 'none';
  this.classList.toggle('act', dcaUseRange);
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
