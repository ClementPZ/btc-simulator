// ═══════════════════════════════════════════════════════
// CHART — TradingView Lightweight Charts v4.2
// Two-axis: Granularity (candle size) × Range (window)
// Multi-select years, custom date picker, Binance klines preload
// ═══════════════════════════════════════════════════════

// ── Granularity config ──
// ms = bucket size in ms for live buffers
// binance = Binance klines interval string
// preloadLimit = how many candles to preload at boot
// histMs = bucket size for HIST aggregation (null = monthly)
const GRAN_CONFIG = {
  '1m':  { ms: 60000,      live: true,  binance: '1m',  preloadLimit: 60,  histMs: 60000      },
  '15m': { ms: 900000,     live: true,  binance: '15m', preloadLimit: 48,  histMs: 900000     },
  '1h':  { ms: 3600000,    live: true,  binance: '1h',  preloadLimit: 24,  histMs: 3600000    },
  '12h': { ms: 43200000,   live: true,  binance: '12h', preloadLimit: 14,  histMs: 43200000   },
  '1D':  { ms: 86400000,   live: true,  binance: '1d',  preloadLimit: 30,  histMs: 86400000   },
  '1W':  { ms: 604800000,  live: false, binance: null,  preloadLimit: 0,   histMs: 604800000  },
  '1M':  { ms: null,       live: false, binance: null,  preloadLimit: 0,   histMs: null       },
};

// ── Range config ──
// live  = real-time buffer only
// days  = last N days
// months = last N months
// years = array of year strings (multi-select)
// custom = use customFrom / customTo
const RANGE_CONFIG = {
  'live':   { live: true },
  '1D':     { days: 1 },
  '1W':     { days: 7 },
  '1M':     { months: 1 },
  '3M':     { months: 3 },
  '1Y':     { months: 12 },
  'custom': { custom: true },
  '2020':   { years: ['2020'] },
  '2021':   { years: ['2021'] },
  '2022':   { years: ['2022'] },
  '2023':   { years: ['2023'] },
  '2024':   { years: ['2024'] },
  '2025':   { years: ['2025'] },
  '2026':   { years: ['2026'] },
};

// ── State ──
let currentGran  = '1D';
let activeRanges = new Set(['live']); // multi-select for years, single otherwise
let customFrom   = null; // Date object
let customTo     = null; // Date object
let currentTF    = currentGran; // legacy alias
const TF_CONFIG  = GRAN_CONFIG; // legacy alias

// ── Live candle buffers ──
const candleBuffers = {};
Object.keys(GRAN_CONFIG).filter(k => GRAN_CONFIG[k].live).forEach(g => {
  candleBuffers[g] = { currentCandle: null, candles: [] };
});
let liveHist = [];

// ── Chart init ──
const chartContainer = document.getElementById('chartContainer');
const tvChart = LightweightCharts.createChart(chartContainer, {
  width: chartContainer.clientWidth,
  height: 300,
  layout: { background: { color: '#18181b' }, textColor: '#a1a1aa', fontFamily: "'Courier New', Courier, monospace" },
  grid:   { vertLines: { color: 'rgba(255,255,255,0.04)' }, horzLines: { color: 'rgba(255,255,255,0.04)' } },
  crosshair: { mode: LightweightCharts.CrosshairMode.Normal },
  rightPriceScale: { borderColor: '#2a2a30', textColor: '#71717a', scaleMargins: { top: 0.08, bottom: 0.08 } },
  timeScale: { borderColor: '#2a2a30', textColor: '#71717a', timeVisible: true, secondsVisible: false },
  handleScroll: true, handleScale: true,
});
const candleSeries = tvChart.addCandlestickSeries({
  upColor: '#4ade80', downColor: '#f87171',
  borderUpColor: '#4ade80', borderDownColor: '#f87171',
  wickUpColor: '#4ade80', wickDownColor: '#f87171',
});
new ResizeObserver(entries => {
  if (entries[0]) tvChart.applyOptions({ width: entries[0].contentRect.width });
}).observe(chartContainer);

// ── Helpers ──
function floorToTF(ms, bucketMs) { return Math.floor(ms / bucketMs) * bucketMs; }

// ── Binance klines preload ──
// Fills candleBuffers[gran].candles with historical klines from Binance public API
async function preloadKlines(gran) {
  const cfg = GRAN_CONFIG[gran];
  if (!cfg || !cfg.binance || cfg.preloadLimit === 0) return;
  try {
    const url = `https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=${cfg.binance}&limit=${cfg.preloadLimit}`;
    const res  = await fetch(url);
    if (!res.ok) return;
    const raw  = await res.json();
    // Binance klines: [openTime, open, high, low, close, ...]
    const candles = raw.map(k => ({
      time:  Math.floor(k[0] / 1000),
      open:  parseFloat(k[1]),
      high:  parseFloat(k[2]),
      low:   parseFloat(k[3]),
      close: parseFloat(k[4]),
    }));
    candleBuffers[gran].candles = candles;
    // If this gran is active and range is live, render immediately
    if (gran === currentGran && activeRanges.has('live')) renderChart();
  } catch (e) { /* silently ignore */ }
}

// ── Feed live price into buffers ──
function feedPrice(p, nowMs) {
  liveHist.push(+p.toFixed(0));
  if (liveHist.length > 500) liveHist.shift();

  Object.keys(candleBuffers).forEach(gran => {
    const granMs = GRAN_CONFIG[gran].ms;
    const buf    = candleBuffers[gran];
    const bucket = floorToTF(nowMs, granMs);
    if (!buf.currentCandle || buf.currentCandle._b !== bucket) {
      if (buf.currentCandle) {
        const { _b, ...c } = buf.currentCandle;
        buf.candles.push(c);
        if (buf.candles.length > 3000) buf.candles.shift();
      }
      buf.currentCandle = { _b: bucket, time: Math.floor(bucket / 1000), open: p, high: p, low: p, close: p };
    } else {
      buf.currentCandle.high  = Math.max(buf.currentCandle.high,  p);
      buf.currentCandle.low   = Math.min(buf.currentCandle.low,   p);
      buf.currentCandle.close = p;
    }
  });

  if (activeRanges.has('live') && candleBuffers[currentGran]) {
    _pushLiveToChart();
  }
}

function _pushLiveToChart() {
  const buf = candleBuffers[currentGran];
  if (!buf || !buf.currentCandle) return;
  const { _b, ...cur } = buf.currentCandle;
  const all    = [...buf.candles, cur];
  const map    = new Map(); all.forEach(c => map.set(c.time, c));
  const sorted = Array.from(map.values()).sort((a,b) => a.time - b.time);
  candleSeries.setData(sorted);
  tvChart.timeScale().scrollToRealTime();
}

// ── HIST aggregation ──
// Build monthly candles from HIST data for given year list
function buildMonthlyCandles(years) {
  const result = [];
  for (const y of years) {
    const h = HIST[y]; if (!h) continue;
    const data = h.d, year = parseInt(y);
    for (let i = 0; i < data.length; i++) {
      const tSec  = Math.floor(Date.UTC(year, i, 1) / 1000);
      const open  = i === 0 ? data[0] : data[i-1];
      const close = data[i];
      const swing = Math.abs(close - open);
      const high  = Math.max(open, close) + swing * (0.15 + Math.random() * 0.25);
      const low   = Math.min(open, close) - swing * (0.15 + Math.random() * 0.25);
      result.push({ time: tSec, open, high: Math.max(high,open,close), low: Math.min(low,open,close), close });
    }
  }
  const map = new Map(); result.forEach(c => map.set(c.time, c));
  return Array.from(map.values()).sort((a,b) => a.time - b.time);
}

// Aggregate monthly → finer granularity via day-level interpolation
function aggregateToGran(monthly, granMs) {
  if (!granMs) return monthly;
  const map = new Map();
  for (const m of monthly) {
    const monthMs     = m.time * 1000;
    const daysInMonth = new Date(Date.UTC(
      new Date(monthMs).getUTCFullYear(),
      new Date(monthMs).getUTCMonth() + 1, 0
    )).getUTCDate();
    for (let d = 0; d < daysInMonth; d++) {
      const dayMs  = monthMs + d * 86400000;
      const bucket = floorToTF(dayMs, granMs);
      const t      = Math.floor(bucket / 1000);
      const frac   = d / daysInMonth;
      // Smooth price walk along month's open→close with intra-month volatility
      const trend = m.open + (m.close - m.open) * frac;
      const vol   = (m.high - m.low) * 0.12;
      const p     = trend + (Math.random() - 0.5) * vol;
      if (!map.has(t)) {
        map.set(t, { time: t, open: p, high: p, low: p, close: p });
      } else {
        const c = map.get(t);
        c.high  = Math.max(c.high,  p);
        c.low   = Math.min(c.low,   p);
        c.close = p;
      }
    }
  }
  return Array.from(map.values()).sort((a,b) => a.time - b.time);
}

// ── Compute active year list from activeRanges ──
function getActiveYears() {
  return [...activeRanges].filter(r => /^\d{4}$/.test(r));
}

// ── isLiveMode ──
function isLiveMode() {
  return activeRanges.has('live') && activeRanges.size === 1;
}

// ── Main render ──
function renderChart() {
  const granCfg = GRAN_CONFIG[currentGran];

  // LIVE mode
  if (isLiveMode()) {
    if (!granCfg.live || !candleBuffers[currentGran]) { candleSeries.setData([]); return; }
    _pushLiveToChart();
    return;
  }

  // CUSTOM range
  if (activeRanges.has('custom') && customFrom && customTo) {
    const fromSec = Math.floor(customFrom.getTime() / 1000);
    const toSec   = Math.floor(customTo.getTime()   / 1000);
    const years   = Object.keys(HIST).filter(y => {
      const yStart = Math.floor(Date.UTC(parseInt(y), 0, 1) / 1000);
      const yEnd   = Math.floor(Date.UTC(parseInt(y)+1, 0, 1) / 1000);
      return yEnd >= fromSec && yStart <= toSec;
    });
    let ohlc = buildMonthlyCandles(years);
    ohlc = granCfg.histMs ? aggregateToGran(ohlc, granCfg.histMs) : ohlc;
    ohlc = ohlc.filter(c => c.time >= fromSec && c.time <= toSec);
    candleSeries.setData(ohlc);
    tvChart.timeScale().fitContent();
    return;
  }

  // YEAR multi-select
  const years = getActiveYears();
  if (years.length > 0) {
    const monthly = buildMonthlyCandles(years.sort());
    const ohlc    = granCfg.histMs ? aggregateToGran(monthly, granCfg.histMs) : monthly;
    candleSeries.setData(ohlc);
    tvChart.timeScale().fitContent();
    return;
  }

  // RELATIVE ranges: 1D / 1W / 1M / 3M / 1Y
  const nowMs = Date.now();
  let cutoffMs = nowMs;
  const r = [...activeRanges][0];
  if (!r) return;
  if (RANGE_CONFIG[r]) {
    const rc = RANGE_CONFIG[r];
    if (rc.days)   cutoffMs = nowMs - rc.days   * 86400000;
    if (rc.months) { const d = new Date(nowMs); d.setMonth(d.getMonth() - rc.months); cutoffMs = d.getTime(); }
  }
  const cutoffSec = Math.floor(cutoffMs / 1000);
  const allYears  = Object.keys(HIST).sort();
  const monthly   = buildMonthlyCandles(allYears);
  let   ohlc      = granCfg.histMs ? aggregateToGran(monthly, granCfg.histMs) : monthly;
  ohlc = ohlc.filter(c => c.time >= cutoffSec);
  candleSeries.setData(ohlc);
  tvChart.timeScale().fitContent();
}

// ── setGran ──
function setGran(gran) {
  currentGran = gran;
  currentTF   = gran;
  document.querySelectorAll('.tft-gran').forEach(b => b.classList.toggle('act', b.dataset.gran === gran));
  renderChart();
  // Preload in background if live-capable
  if (GRAN_CONFIG[gran] && GRAN_CONFIG[gran].binance) preloadKlines(gran);
}

// ── setRange — handles multi-select for years, exclusive for others ──
function setRange(range) {
  const isYear   = /^\d{4}$/.test(range);
  const isCustom = range === 'custom';

  if (isYear) {
    // Toggle year; clear non-year, non-custom ranges
    activeRanges.delete('live');
    activeRanges.delete('1D'); activeRanges.delete('1W'); activeRanges.delete('1M');
    activeRanges.delete('3M'); activeRanges.delete('1Y'); activeRanges.delete('custom');
    if (activeRanges.has(range)) { activeRanges.delete(range); }
    else                          { activeRanges.add(range);    }
    if (activeRanges.size === 0) activeRanges.add('live'); // fallback
  } else if (isCustom) {
    activeRanges.clear();
    activeRanges.add('custom');
    // Show date picker
    document.getElementById('custom-range-picker').classList.add('visible');
    _updateRangeButtons();
    return;
  } else {
    // Exclusive: live / 1D / 1W / 1M / 3M / 1Y
    activeRanges.clear();
    activeRanges.add(range);
    document.getElementById('custom-range-picker').classList.remove('visible');
  }
  _updateRangeButtons();
  renderChart();
}

function _updateRangeButtons() {
  document.querySelectorAll('.tft-range').forEach(b => {
    b.classList.toggle('act', activeRanges.has(b.dataset.range));
  });
}

// ── Custom range apply ──
document.getElementById('custom-range-apply').addEventListener('click', () => {
  const from = document.getElementById('custom-from').value;
  const to   = document.getElementById('custom-to').value;
  if (!from || !to) return;
  customFrom = new Date(from);
  customTo   = new Date(to + 'T23:59:59Z');
  document.getElementById('custom-range-picker').classList.remove('visible');
  renderChart();
});
document.getElementById('custom-range-cancel').addEventListener('click', () => {
  document.getElementById('custom-range-picker').classList.remove('visible');
  if (!customFrom) { activeRanges.clear(); activeRanges.add('live'); _updateRangeButtons(); }
});

// ── Button listeners ──
document.querySelectorAll('.tft-gran').forEach(b  => b.addEventListener('click', () => setGran(b.dataset.gran)));
document.querySelectorAll('.tft-range').forEach(b => b.addEventListener('click', () => setRange(b.dataset.range)));

// Legacy
function switchTF(tf) { setGran(tf); }

// ── Init: preload + render ──
preloadKlines(currentGran);
setGran(currentGran);
_updateRangeButtons();
