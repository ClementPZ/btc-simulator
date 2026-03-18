// ═══════════════════════════════════════════════════════
// WS — Binance WebSocket + CoinGecko polling + fallback
// ═══════════════════════════════════════════════════════
// Strategy:
// 1. Binance WS  wss://data-stream.binance.vision  (free, no auth, production-grade)
// 2. CoinGecko REST polling every 15s              (free, no auth, fallback)
// 3. Pure simulation                               (last resort)

let ws = null;
let wsReconnectTimer = null;
let wsConnected = false;
let pollingInterval = null;
let reconnectDelay = 2000; // exponential backoff: 2s → 4s → 8s → max 30s

function setStatus(mode) {
  const s = document.getElementById('ws-status');
  const l = document.getElementById('ws-label');
  const src = document.getElementById('price-source');
  if (mode === 'connecting') {
    s.className = 'ws-status'; l.textContent = t('connecting'); src.textContent = t('livePrice');
  } else if (mode === 'live-ws') {
    s.className = 'ws-status connected'; l.textContent = 'Live · Binance'; src.textContent = t('livePrice');
  } else if (mode === 'live-poll') {
    s.className = 'ws-status connected'; l.textContent = 'Live · CoinGecko'; src.textContent = t('livePrice');
  } else {
    s.className = 'ws-status simulated'; l.textContent = t('simulated'); src.textContent = t('livePrice');
  }
}

function applyLivePrice(p) {
  if (!p || p <= 0) return;
  livePrice = p;
  if (price === 0) {
    OPEN = p; hi = p; lo = p; price = p;
    document.getElementById('m-open').textContent = fmt(p);
  } else if (priceMode === 'live') {
    price = p;
  }
}

// ── FALLBACK: CoinGecko REST polling ──
function startPolling() {
  if (pollingInterval) return;
  setStatus('live-poll');
  const poll = () => {
    fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&precision=2')
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(d => {
        const p = d?.bitcoin?.usd;
        if (p > 0) { applyLivePrice(p); setStatus('live-poll'); } else fallbackSim();
      })
      .catch(() => fallbackSim());
  };
  poll();
  pollingInterval = setInterval(poll, 15000);
}

// ── PRIMARY: Binance public market stream ──
function connectWS() {
  if (wsReconnectTimer) { clearTimeout(wsReconnectTimer); wsReconnectTimer = null; }
  if (ws) { try { ws.close(); } catch (e) {} ws = null; }
  wsConnected = false;
  setStatus('connecting');
  try {
    ws = new WebSocket('wss://data-stream.binance.vision/ws/btcusdt@miniTicker');
    ws.onopen = () => {
      wsConnected = true;
      reconnectDelay = 2000;
      if (pollingInterval) { clearInterval(pollingInterval); pollingInterval = null; }
      setStatus('live-ws');
    };
    ws.onmessage = e => {
      try {
        const d = JSON.parse(e.data);
        // miniTicker: { c = close/last price, o, h, l, v, q }
        if (d.c) { applyLivePrice(parseFloat(d.c)); }
      } catch (err) {}
    };
    ws.onerror = () => {
      wsConnected = false;
      if (!pollingInterval) startPolling();
    };
    ws.onclose = () => {
      wsConnected = false;
      if (!pollingInterval) startPolling();
      wsReconnectTimer = setTimeout(() => {
        reconnectDelay = Math.min(reconnectDelay * 2, 30000);
        connectWS();
      }, reconnectDelay);
    };
  } catch (err) {
    startPolling();
  }
}

function fallbackSim() {
  if (price === 0) {
    price = 74382; OPEN = 74382; hi = 74382; lo = 74382; livePrice = 74382;
    document.getElementById('m-open').textContent = fmt(74382);
  }
  setStatus('sim');
}
