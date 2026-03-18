// ═══════════════════════════════════════════════════════
// CHART — TradingView Lightweight Charts v5.1
// OHLC candlesticks + timeframes 1s/1m/5m/15m/1h/4h/1D/1W/1M
// ═══════════════════════════════════════════════════════

// ── Granularity config — candle size ──
// live TFs use real-time buffers; hist TFs aggregate HIST data
const GRAN_CONFIG = {
  '1s':  { ms: 1000,      live: true },
  '1m':  { ms: 60000,     live: true },
  '5m':  { ms: 300000,    live: true },
  '15m': { ms: 900000,    live: true },
  '1h':  { ms: 3600000,   live: true },
  '4h':  { ms: 14400000,  live: true },
  '1D':  { ms: 86400000,  live: true,  histMs: 86400000  },
  '1W':  { ms: 604800000, live: false, histMs: 604800000 },
  '1M':  { ms: null,      live: false, histMs: null      }, // monthly = 1 candle per month
};

// ── Range config — window of data to display ──
// live = show live buffers; months/year = slice from HIST
const RANGE_CONFIG = {
  'live': { live: true },
  '1D':   { months: null, days: 1   },
  '1W':   { months: null, days: 7   },
  '1M':   { months: 1               },
  '3M':   { months: 3               },
  '1Y':   { months: 12              },
  '2020': { year: '2020'            },
  '2021': { year: '2021'            },
  '2022': { year: '2022'            },
  '2023': { year: '2023'            },
  '2024': { year: '2024'            },
  '2025': { year: '2025'            },
  '2026': { year: '2026'            },
};

// Current state — two independent axes
let currentGran = '1D';   // candle granularity
let currentRange = 'live'; // data window

// Keep TF_CONFIG alias for live buffer keys (backward compat with feedPrice)
const TF_CONFIG = GRAN_CONFIG; // same object, alias
let currentTF = currentGran;   // alias for feedPrice live check

// Live candle aggregation buffers — only for live-capable granularities
const candleBuffers = {};
Object.keys(GRAN_CONFIG).filter(k => GRAN_CONFIG[k].live).forEach(gran => {
  candleBuffers[gran] = { currentCandle: null, candles: [] };
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

// ── Feed price into live buffers ──
function feedPrice(p, nowMs) {
  liveHist.push(+p.toFixed(0));
  if (liveHist.length > 500) liveHist.shift();

  Object.keys(candleBuffers).forEach(gran => {
    const granMs = GRAN_CONFIG[gran].ms;
    const buf = candleBuffers[gran];
    const bucketTs = floorToTF(nowMs, granMs);

    if (!buf.currentCandle || buf.currentCandle._bucketTs !== bucketTs) {
      if (buf.currentCandle) {
        const { _bucketTs, ...clean } = buf.currentCandle;
        buf.candles.push(clean);
        if (buf.candles.length > 2000) buf.candles.shift();
      }
      buf.currentCandle = { _bucketTs: bucketTs, time: Math.floor(bucketTs / 1000), open: p, high: p, low: p, close: p };
    } else {
      buf.currentCandle.high = Math.max(buf.currentCandle.high, p);
      buf.currentCandle.low  = Math.min(buf.currentCandle.low,  p);
      buf.currentCandle.close = p;
    }
  });

  // Live-update chart if range is live
  if (currentRange === 'live' && candleBuffers[currentGran]) {
    const buf = candleBuffers[currentGran];
    const { _bucketTs, ...display } = buf.currentCandle;
    const all = [...buf.candles, display];
    const map = new Map(); all.forEach(c => map.set(c.time, c));
    const sorted = Array.from(map.values()).sort((a,b) => a.time - b.time);
    candleSeries.setData(sorted);
    tvChart.timeScale().scrollToRealTime();
  }
}

// ── Build monthly candles from HIST ──
// Returns flat list sorted by time, scope filtered by yearFilter (optional)
function buildMonthlyCandles(yearFilter) {
  const result = [];
  const years = yearFilter ? [yearFilter] : Object.keys(HIST).sort();
  for (const y of years) {
    const h = HIST[y]; if (!h) continue;
    const data = h.d, year = parseInt(y);
    for (let i = 0; i < data.length; i++) {
      const tSec = Math.floor(Date.UTC(year, i, 1) / 1000);
      const open  = i === 0 ? data[0] : data[i-1];
      const close = data[i];
      const high  = Math.max(open, close) * (1 + 0.03 + Math.random() * 0.05);
      const low   = Math.min(open, close) * (1 - 0.03 - Math.random() * 0.05);
      result.push({ time: tSec, open, high, low, close });
    }
  }
  const map = new Map(); result.forEach(c => map.set(c.time, c));
  return Array.from(map.values()).sort((a,b) => a.time - b.time);
}

// Aggregate monthly candles into weekly or daily candles
function aggregateCandles(monthly, granMs) {
  if (!granMs) return monthly; // monthly gran = keep as-is
  const map = new Map();
  for (const m of monthly) {
    // distribute monthly data across days of the month (linear interpolation)
    const monthMs = m.time * 1000;
    const daysInMonth = new Date(new Date(monthMs).getUTCFullYear(), new Date(monthMs).getUTCMonth()+1, 0).getUTCDate();
    const dayMs = 86400000;
    // synthesize daily candles within the month
    for (let d = 0; d < daysInMonth; d++) {
      const dayTs = Math.floor((monthMs + d * dayMs) / granMs) * granMs;
      const t = Math.floor(dayTs / 1000);
      const frac = d / daysInMonth;
      const p = m.open + (m.close - m.open) * frac + (Math.random() - 0.5) * Math.abs(m.high - m.low) * 0.3;
      if (!map.has(t)) {
        map.set(t, { time: t, open: p, high: p, low: p, close: p });
      } else {
        const c = map.get(t);
        c.high  = Math.max(c.high, p);
        c.low   = Math.min(c.low,  p);
        c.close = p;
      }
    }
  }
  return Array.from(map.values()).sort((a,b) => a.time - b.time);
}

// ── Get cutoff timestamp for a range ──
function getRangeCutoff(rangeCfg) {
  const nowMs = Date.now();
  if (rangeCfg.days)   return Math.floor((nowMs - rangeCfg.days * 86400000) / 1000);
  if (rangeCfg.months) {
    const d = new Date(nowMs); d.setMonth(d.getMonth() - rangeCfg.months);
    return Math.floor(d.getTime() / 1000);
  }
  return null;
}

// ── Main render function ──
function renderChart() {
  const granCfg  = GRAN_CONFIG[currentGran];
  const rangeCfg = RANGE_CONFIG[currentRange];

  // — LIVE range: use real-time buffers —
  if (rangeCfg.live) {
    if (!granCfg.live || !candleBuffers[currentGran]) {
      candleSeries.setData([]); return;
    }
    const buf = candleBuffers[currentGran];
    const cur = buf.currentCandle ? [(() => { const { _bucketTs, ...c } = buf.currentCandle; return c; })()] : [];
    const all = [...buf.candles, ...cur];
    if (all.length === 0) { candleSeries.setData([]); return; }
    const map = new Map(); all.forEach(c => map.set(c.time, c));
    const sorted = Array.from(map.values()).sort((a,b) => a.time - b.time);
    candleSeries.setData(sorted);
    tvChart.timeScale().scrollToRealTime();
    return;
  }

  // — HIST range: build from HIST data —
  const yearFilter = rangeCfg.year || null;
  const monthly = buildMonthlyCandles(yearFilter);

  // Apply cutoff if range has days/months
  let filtered = monthly;
  const cutoff = getRangeCutoff(rangeCfg);
  if (cutoff) filtered = monthly.filter(c => c.time >= cutoff);

  // Aggregate to the chosen granularity
  let ohlc;
  if (!granCfg.histMs) {
    // Monthly gran — keep monthly candles
    ohlc = filtered;
  } else {
    ohlc = aggregateCandles(filtered, granCfg.histMs);
  }

  // Apply cutoff again after aggregation (for short ranges)
  if (cutoff) ohlc = ohlc.filter(c => c.time >= cutoff);

  candleSeries.setData(ohlc);
  tvChart.timeScale().fitContent();
}

// ── setGran / setRange ──
function setGran(gran) {
  currentGran = gran;
  currentTF = gran; // keep alias in sync
  document.querySelectorAll('.tft-gran').forEach(b => b.classList.toggle('act', b.dataset.gran === gran));
  renderChart();
}

function setRange(range) {
  currentRange = range;
  document.querySelectorAll('.tft-range').forEach(b => b.classList.toggle('act', b.dataset.range === range));
  renderChart();
}

// Legacy alias so app.js can still call switchTF for live gran switching
function switchTF(tf) { setGran(tf); }

// ── Button listeners ──
document.querySelectorAll('.tft-gran').forEach(b  => b.addEventListener('click',  () => setGran(b.dataset.gran)));
document.querySelectorAll('.tft-range').forEach(b => b.addEventListener('click', () => setRange(b.dataset.range)));

// Init
setGran(currentGran);
setRange(currentRange);
