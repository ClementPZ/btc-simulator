// ═══════════════════════════════════════════════════════
// STATE — global variables
// ═══════════════════════════════════════════════════════

const SUPPLY = 19700000;
const INIT = 100000;
const vols = { low: .0004, med: .0011, high: .0026 };

let price = 0;
let OPEN = 0;
let hi = 0;
let lo = Infinity;
let paused = false;
let volMode = 'med';
let shock = 0;

// Portfolio
let cash = INIT;
let btc = 0;
let totalCost = 0;
let avgBuy = 0;

// Price modes: 'live' | 'sim_free' | 'sim_return'
let priceMode = 'live';
let livePrice = 0;
let simReturnTimer = 0;

// Amount / DCA
let amountMode = 'pct';
let dcaSteps = 1;
let dcaUseRange = false;
let dcaPriceFrom = 0;
let dcaPriceTo = 0;
let pendingDcaOrders = [];

// Remembered sim mode choice: 'free' | 'return' | null (ask each time)
let rememberedSimMode = null;

// Events
let currentCat = 'now';
let pendingEvent = null;
