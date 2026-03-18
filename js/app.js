// ═══════════════════════════════════════════════════════
// APP — tick, controls listeners, init
// ═══════════════════════════════════════════════════════

function tick() {
  if (paused || price === 0) return;
  const v = vols[volMode];
  let drift = (Math.random() - .499) * price * v;

  if (priceMode === 'live') {
    if (livePrice > 0) price = livePrice + (Math.random() - .5) * livePrice * 0.0002;
  } else if (priceMode === 'sim_free') {
    if (shock !== 0) { drift += price * (shock / 100) * .18; shock *= .82; if (Math.abs(shock) < .05) shock = 0; }
    price += drift;
  } else if (priceMode === 'sim_return') {
    if (shock !== 0) { drift += price * (shock / 100) * .18; shock *= .82; if (Math.abs(shock) < .05) shock = 0; }
    price += drift;
    simReturnTimer--;
    if (simReturnTimer <= 0 && livePrice > 0) {
      const pull = (livePrice - price) * 0.05;
      price += pull;
      if (Math.abs(price - livePrice) < livePrice * 0.002) {
        price = livePrice;
        priceMode = 'live';
        document.getElementById('sim-banner').classList.add('hidden');
        addLog(t('backLiveLog'));
      }
    }
  }

  price = Math.max(10000, Math.min(500000, price));
  hi = Math.max(hi, price);
  lo = Math.min(lo, price);

  liveHist.push(+price.toFixed(0));
  if (liveHist.length > 120) liveHist.shift();

  const chg = price - OPEN, pct = OPEN > 0 ? (chg / OPEN) * 100 : 0;
  document.getElementById('pdisplay').textContent = fmt(price);
  const cd = document.getElementById('cdisplay'), sg = chg >= 0 ? '+' : '';
  cd.textContent = sg + Math.round(chg).toLocaleString() + ' (' + sg + pct.toFixed(2) + '%)';
  cd.className = 'price-chg ' + (chg >= 0 ? 'up' : 'dn');
  document.getElementById('m-high').textContent = fmt(hi);
  document.getElementById('m-low').textContent = fmt(lo);
  document.getElementById('m-cap').textContent = '$' + (price * SUPPLY / 1e12).toFixed(2) + 'T';

  if (currentTF === 'live') {
    chart.data.datasets[0].data = [...liveHist];
    chart.data.labels = liveHist.map(() => '');
    chart.update('none');
  }

  updateAmountDisplay();
  updatePort();

  // Execute pending DCA orders one per tick
  if (pendingDcaOrders.length > 0) {
    const order = pendingDcaOrders.shift();
    executeSingleOrder(order.type, order.qty);
    if (pendingDcaOrders.length > 0) addLog(`⏳ ${t('dcaRemaining')}: ${pendingDcaOrders.length}`);
  }
}

// ── Volatility controls ──
document.querySelectorAll('.vb').forEach(b => b.addEventListener('click', function () {
  document.querySelectorAll('.vb').forEach(x => x.classList.remove('act'));
  this.classList.add('act');
  volMode = this.dataset.v;
}));

// ── Pause / Resume ──
document.getElementById('pbtn').addEventListener('click', function () {
  paused = !paused;
  this.textContent = paused ? t('resume') : t('pause');
});

// ── Back to live ──
document.getElementById('sim-back-btn').addEventListener('click', () => {
  priceMode = 'live';
  shock = 0;
  pendingDcaOrders = [];
  rememberedSimMode = null;
  document.getElementById('sim-banner').classList.add('hidden');
  addLog(t('backLiveLog'));
});

// ── Init ──
function init() {
  applyLang();
  renderEvents('now');
  connectWS();
  setInterval(tick, 900);
  updatePort();
}

init();
