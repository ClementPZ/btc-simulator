// ═══════════════════════════════════════════════════════
// CHART — TradingView Lightweight Charts v5.1
// OHLC candlesticks + timeframes 1s/1m/5m/15m/1h/4h/1D/1W/1M
// ═══════════════════════════════════════════════════════

// ── TF config ──
const TF_CONFIG = {
  '1s':  { ms: 1000,         label: '1s',  hist: false },
  '1m':  { ms: 60000,        label: '1m',  hist: false },
  '5m':  { ms: 300000,       label: '5m',  hist: false },
  '15m': { ms: 900000,       label: '15m', hist: false },
  '1h':  { ms: 3600000,      label: '1h',  hist: false },
  '4h':  { ms: 14400000,     label: '4h',  hist: false },
  '1D':  { ms: 86400000,     label: '1D',  hist: false },
  '2020': { hist: true },
  '2021': { hist: true },
  '2022': { hist: true },
  '2023': { hist: true },
  '2024': { hist: true },
  '2025': { hist: true },
  '2026': { hist: true },
};

// Current state
let currentTF = '1m';

// Live candle aggregation
// candle buffer: map of tf -> { currentCandle, candles[] }
const candleBuffers = {};
Object.keys(TF_CONFIG).filter(k => !TF_CONFIG[k].hist).forEach(tf => {
  candleBuffers[tf] = { currentCandle: null, candles: [] };
});

// liveHist kept for legacy compat (app.js may reference it)
let liveHist = [];

// ── Chart init ──
const chartContainer = document.getElementById('chartContainer');

const tvChart = LightweightCharts.createChart(chartContainer, {
  width: chartContainer.clientWidth,
  height: 220,
  layout: {
    background: { color: '#18181b' },
    textColor: '#a1a1aa',
    fontFamily: "'Courier New', Courier, monospace",
  },
  grid: {
    vertLines: { color: 'rgba(255,255,255,0.04)' },
    horzLines: { color: 'rgba(255,255,255,0.04)' },
  },
  crosshair: {
    mode: LightweightCharts.CrosshairMode.Normal,
  },
  rightPriceScale: {
    borderColor: '#2a2a30',
    textColor: '#71717a',
    scaleMargins: { top: 0.1, bottom: 0.1 },
  },
  timeScale: {
    borderColor: '#2a2a30',
    textColor: '#71717a',
    timeVisible: true,
    secondsVisible: true,
  },
  handleScroll: true,
  handleScale: true,
});

const candleSeries = tvChart.addCandlestickSeries({
  // v4 API — compatible with lightweight-charts@4.2.0
  upColor: '#4ade80',
  downColor: '#f87171',
  borderUpColor: '#4ade80',
  borderDownColor: '#f87171',
  wickUpColor: '#4ade80',
  wickDownColor: '#f87171',
});

// Responsive resize
const resizeObserver = new ResizeObserver(entries => {
  if (entries[0]) {
    const { width } = entries[0].contentRect;
    tvChart.applyOptions({ width });
  }
});
resizeObserver.observe(chartContainer);

// ── OHLC helpers ──
function floorToTF(timestampMs, tfMs) {
  return Math.floor(timestampMs / tfMs) * tfMs;
}

function makeCandle(t, o, h, l, c) {
  return { time: Math.floor(t / 1000), open: o, high: h, low: l, close: c };
}

// Feed a new price into live TF buffers
function feedPrice(p, nowMs) {
  liveHist.push(+p.toFixed(0));
  if (liveHist.length > 500) liveHist.shift();

  Object.keys(candleBuffers).forEach(tf => {
    const tfMs = TF_CONFIG[tf].ms;
    const buf = candleBuffers[tf];
    const bucketTs = floorToTF(nowMs, tfMs);

    if (!buf.currentCandle || buf.currentCandle._bucketTs !== bucketTs) {
      // Close previous candle
      if (buf.currentCandle) {
        const { _bucketTs, ...cleanCandle } = buf.currentCandle;
        buf.candles.push(cleanCandle);
        if (buf.candles.length > 1000) buf.candles.shift();
      }
      // Open new candle
      buf.currentCandle = {
        _bucketTs: bucketTs,
        time: Math.floor(bucketTs / 1000),
        open: p, high: p, low: p, close: p
      };
    } else {
      // Update current candle
      buf.currentCandle.high = Math.max(buf.currentCandle.high, p);
      buf.currentCandle.low = Math.min(buf.currentCandle.low, p);
      buf.currentCandle.close = p;
    }

    // Live update the chart if this TF is active
    if (tf === currentTF) {
      const { _bucketTs, ...display } = buf.currentCandle;
      renderLiveUpdate(display, buf.candles);
    }
  });
}

// Update chart with live candle (upsert last candle)
function renderLiveUpdate(currentCandle, closedCandles) {
  const all = [...closedCandles, currentCandle];
  // Deduplicate by time (keep last)
  const map = new Map();
  all.forEach(c => map.set(c.time, c));
  const sorted = Array.from(map.values()).sort((a, b) => a.time - b.time);
  candleSeries.setData(sorted);
  tvChart.timeScale().scrollToRealTime();
}

// ── Historical OHLC from monthly data ──
function buildHistOHLC(yearKey) {
  const h = HIST[yearKey];
  if (!h) return [];
  const data = h.d;
  const year = parseInt(yearKey);
  const result = [];

  for (let i = 0; i < data.length; i++) {
    const month = i; // 0-indexed
    const date = new Date(Date.UTC(year, month, 1));
    const nextDate = new Date(Date.UTC(year, month + 1, 1));
    const tSec = Math.floor(date.getTime() / 1000);

    const open = i === 0 ? data[0] : data[i - 1];
    const close = data[i];
    // Synthesize H/L with ±8% range
    const high = Math.max(open, close) * (1 + 0.04 + Math.random() * 0.06);
    const low = Math.min(open, close) * (1 - 0.04 - Math.random() * 0.06);

    result.push({ time: tSec, open, high, low, close });
  }
  return result;
}

// ── switchTF ──
function switchTF(tf) {
  currentTF = tf;

  // Update button states
  document.querySelectorAll('.tft').forEach(btn => {
    btn.classList.toggle('act', btn.dataset.tf === tf);
  });

  if (TF_CONFIG[tf] && TF_CONFIG[tf].hist) {
    // Historical year view
    const ohlc = buildHistOHLC(tf);
    candleSeries.setData(ohlc);
    tvChart.timeScale().fitContent();
  } else {
    // Live TF view
    const buf = candleBuffers[tf];
    if (!buf) return;
    const all = buf.currentCandle
      ? [...buf.candles, (() => { const { _bucketTs, ...c } = buf.currentCandle; return c; })()]
      : [...buf.candles];

    if (all.length === 0) {
      candleSeries.setData([]);
    } else {
      const map = new Map();
      all.forEach(c => map.set(c.time, c));
      const sorted = Array.from(map.values()).sort((a, b) => a.time - b.time);
      candleSeries.setData(sorted);
      tvChart.timeScale().scrollToRealTime();
    }
  }
}

// ── TF button listeners ──
document.querySelectorAll('.tft').forEach(btn => {
  btn.addEventListener('click', () => switchTF(btn.dataset.tf));
});

// Init with default TF
switchTF(currentTF);
