// ═══════════════════════════════════════════════════════
// DATA — HIST, EVTS, SUGGESTED
// ═══════════════════════════════════════════════════════

const HIST = {
  '2020': { d: [7200,8500,6500,7100,9000,10000,11000,11800,10500,13000,15000,19000,29000], c: '#3b82f6' },
  '2021': { d: [29000,33000,38000,50000,58000,64000,35000,40000,47000,43000,61000,68000,46000], c: '#22c55e' },
  '2022': { d: [46000,43000,39000,40000,38000,20000,19000,23000,20000,19000,16000,15500,16500], c: '#ef4444' },
  '2023': { d: [16500,21000,22500,28000,27000,30000,31000,29000,26000,27000,34000,37000,44500], c: '#f59e0b' },
  '2024': { d: [44500,50000,62000,73000,65000,68000,60000,56000,64000,67000,68000,99000,106000], c: '#8b5cf6' },
  '2025': { d: [106000,98000,86000,88000,95000,110000,122000,126000,115000,105000,90000,75000,73000], c: '#06b6d4' },
  '2026': { d: [73000,68000,60000,65000,70000,72000,74000], c: '#f59e0b' },
};

const SUGGESTED = {
  now: {
    bull: { n: 'FOMC dovish — dot plot 2 cuts', desc: 'Most likely scenario today: Powell signals Iran inflation as transitory. Dot plot → 2 cuts 2026. ~28% probability per CME FedWatch. Potential +$80k.', impact: '+12%' },
    bear: { n: 'FOMC hawkish + sell-the-news', desc: 'Most recurring pattern in 2025: BTC drops -5 to -8% in 48h post-FOMC, even when decision is expected. Iran war + WTI $97 reinforces this short-term bearish scenario.', impact: '-8%' }
  },
  past: {
    bull: { n: 'BlackRock/Fidelity Spot ETF', desc: 'Most structurally bullish event in recent history. $10B inflows in 2 months, permanent market change.', impact: '+25%' },
    bear: { n: 'FTX implosion', desc: 'Most destructive event of the cycle. $8B of client funds gone, total contagion, bottom at $15,479.', impact: '-25%' }
  },
  future: {
    bull: { n: 'US Federal SBR Law', desc: 'If Congress ratifies the Strategic Bitcoin Reserve: the US government becomes a structural buyer. 19 bills in 8 states.', impact: '+20%' },
    bear: { n: 'US Recession — jobs data', desc: '4.4% unemployment + 3 consecutive bad payroll months = priced recession. BTC correlated TradFi in generalized sell-off.', impact: '-20%' }
  }
};

const EVTS = {
  past: {
    bull: [
      { n: 'BlackRock/Fidelity Spot ETF', d: 'Jan 2024', s: +25, desc: 'SEC approves IBIT+FBTC. $10B in 2 months. Permanent structural change in crypto market.', src: 'SEC / BlackRock / CoinDesk', badge: 'ext' },
      { n: 'Trump — Strategic Bitcoin Reserve', d: 'Mar 2025', s: +18, desc: 'Executive order creating US SBR. The federal government becomes an official hodler.', src: 'WhiteHouse.gov / CNBC', badge: 'ext' },
      { n: 'ATH $126,296', d: 'Oct 6, 2025', s: +10, desc: 'All-time high. ETF inflows + institutional adoption + post-halving cycle. Cycle peak.', src: 'CoinDesk / Fortune', badge: 'ext' },
      { n: 'SVB collapse → BTC safe haven', d: 'Mar 2023', s: +12, desc: 'Silicon Valley Bank failure paradoxically bullish. Flight to alternative assets. BTC +30%.', src: 'FDIC / Reuters', badge: 'ext' },
      { n: 'Tesla + MicroStrategy BTC', d: 'Feb 2021', s: +20, desc: 'Tesla $1.5B + MSTR >70k BTC. Unprecedented institutional adoption.', src: 'SEC filings / CoinTelegraph', badge: 'ext' },
      { n: '3rd Halving', d: 'May 2020', s: +8, desc: '12.5 → 6.25 BTC/block. Catalyst for bull run to $29k end 2020.', src: 'Bitcoin.org / Forbes', badge: 'ext' },
    ],
    bear: [
      { n: 'FTX implosion', d: 'Nov 2022', s: -25, desc: '$8B of client funds gone. BTC → $15,479. Cycle bottom. Total contagion.', src: 'Financial Times / CoinDesk', badge: 'ext' },
      { n: 'Terra/Luna collapse', d: 'May 2022', s: -40, desc: '$40B in 72h. BTC -$16k. Celsius, Three Arrows Capital contaminated.', src: 'Bloomberg / WSJ', badge: 'ext' },
      { n: 'COVID crash', d: 'Mar 2020', s: -35, desc: 'BTC $10k → $4.9k in 48h. Generalized global panic.', src: 'Bloomberg / CoinDesk', badge: 'ext' },
      { n: 'China mining ban', d: 'May 2021', s: -30, desc: 'Beijing bans mining. Hashrate -50%. BTC loses $30k in 3 weeks.', src: 'Reuters / CNBC', badge: 'ext' },
      { n: '2022 Bear market', d: '2022', s: -20, desc: 'Aggressive Fed rate hikes. BTC correlated TradFi. -65% for the full year.', src: 'ARK Invest / Bloomberg', badge: 'ext' },
      { n: 'Post-ATH correction -46%', d: 'Q4 2025', s: -20, desc: 'Profit-taking post-$126k. BTC → $67k Feb 2026. Iran tensions + risk-off.', src: 'Caleb & Brown / CoinDesk', badge: 'ext' },
    ]
  },
  now: {
    bull: [
      { n: 'FOMC dovish — dot plot 2 cuts', d: 'Mar 18 · 2pm ET', s: +12, desc: 'Powell signals Iran as transitory. Dot plot → 2 cuts 2026. BTC could target $80k. Prob. 25-30% per MEXC/99BTC.', src: 'MEXC / 99Bitcoins / Kiplinger', badge: 'live' },
      { n: 'Nasdaq futures +0.51%', d: 'Mar 18 morning', s: +4, desc: 'Nasdaq fut. 25,180 (+0.51%). S&P +0.53%. If positive open → risk-on correlated BTC.', src: 'Yahoo Finance Markets', badge: 'live' },
      { n: 'Strategy (MSTR) +$1.57B BTC', d: 'Week Mar 16-20', s: +7, desc: 'MicroStrategy buys 22,337 BTC at $70,200/coin. Aggressive institutional accumulation continues.', src: 'TheStreet / Yahoo Finance', badge: 'live' },
      { n: 'Nasdaq × NYSE tokenize stocks', d: 'Mar 15, 2026', s: +9, desc: 'Nasdaq + ICE ally with crypto exchanges to tokenize $126T stock market on blockchain.', src: 'CoinDesk Mar 2026', badge: 'live' },
      { n: 'ETF inflows March +$1.3B', d: 'March 2026 YTD', s: +8, desc: 'First positive month since October on spot BTC ETFs. $250M on March 10 alone. Improving sentiment.', src: 'CoinDesk / Farside Investors', badge: 'live' },
      { n: 'Crypto access to Fed Reserve', d: 'Mar 5, 2026', s: +10, desc: 'Crypto industry accesses Federal Reserve payment system. Major legitimacy signal.', src: 'CoinDesk / MetaMask', badge: 'live' },
    ],
    bear: [
      { n: 'FOMC hawkish — 0 cuts 2026', d: 'Mar 18 · 2pm ET', s: -10, desc: 'Dot plot → 0 cuts, Powell cautious on Iran inflation. Sell-the-news. BTC fell after 7/8 FOMCs in 2025.', src: 'MEXC / Phemex / 99Bitcoins', badge: 'live' },
      { n: 'Iran war — WTI $97+', d: 'Mar 18 · CURRENT', s: -6, desc: 'Brent $103.50 (+3.2%). Inflationary pressure. Fed blocked. Potential risk-off on speculative assets.', src: 'Schwab / CoinDesk / TheStreet', badge: 'live' },
      { n: 'Sell-the-news FOMC pattern', d: 'Mar 18 · post 2pm', s: -7, desc: 'Historical pattern: BTC -5 to -8% in 48h post-announcement. Even expected = selling. 7/8 FOMCs 2025.', src: 'Phemex Research / MEXC Blog', badge: 'live' },
      { n: '$75k rejection — broken channel', d: 'Mar 18 · technical', s: -8, desc: 'BTC hit $75k and rejected within channel. Same pattern as late Feb before flush to $64k. Support: $72k.', src: 'Cryptonews / Yahoo Finance', badge: 'live' },
      { n: 'Powell succession — uncertainty', d: 'May 2026', s: -5, desc: 'Kevin Warsh (hawkish) nomination blocked by lawsuit. Each Powell speech amplified.', src: 'CNBC / Cointribune / Reuters', badge: 'live' },
      { n: 'Trump tariffs 15% — stagflation', d: 'Mar 2026', s: -6, desc: 'Global 15% tariffs + oil shock = stagflation risk. Worst case for risk assets.', src: 'MEXC / TheStreet / Kiplinger', badge: 'live' },
    ]
  },
  future: {
    bull: [
      { n: 'Breakout $80k post-dovish FOMC', d: 'Q2 2026', s: +15, desc: 'If BTC breaks $74k on volume after dovish signal: technically open to $80k then $90-100k.', src: 'Extrapolated CoinDesk / 99BTC', badge: 'fut' },
      { n: 'First Fed rate cut', d: 'Jun–Oct 2026', s: +12, desc: 'CME FedWatch priced June before Iran. JPMorgan: 1 cut 2026. Historically BTC rallies 2 weeks before.', src: 'CME FedWatch / JPMorgan', badge: 'fut' },
      { n: 'US Federal SBR Law', d: '2026', s: +20, desc: '19 SBR bills in 8 states. If Congress: US government = massive structural buyer. Inelastic demand.', src: 'Caleb & Brown / Congress.gov', badge: 'fut' },
      { n: 'Iran conflict resolution', d: 'Q2–Q3 2026', s: +10, desc: 'Hormuz reopens: oil drops, inflation eases, Fed cuts. Double bullish BTC potential +15-25%.', src: 'Extrapolated Reuters / Schwab', badge: 'fut' },
      { n: 'ATH > $150k bull case', d: '2026–2027', s: +25, desc: 'ARK Invest scenario: SBR + rate cuts + ETF inflows. Cycle not over. Bull case $200k+.', src: 'ARK Invest / Bitwise', badge: 'fut' },
      { n: 'Coinbase × Bybit official deal', d: 'Q2 2026', s: +8, desc: 'Partnership mentioned in pre-market. If official: exchange consolidation, rising institutional volume.', src: 'Extrapolated TheStreet Mar 2026', badge: 'fut' },
    ],
    bear: [
      { n: 'Iran war extension > 6 months', d: 'Q2–Q3 2026', s: -15, desc: 'Structural inflation, Fed blocked, possible US recession. BTC correlated TradFi in prolonged risk-off.', src: 'Extrapolated Schwab / Kiplinger', badge: 'fut' },
      { n: 'Warsh Fed chair — hawkish pivot', d: 'May 2026', s: -8, desc: 'Kevin Warsh (more hawkish) confirmed: 2026 rate re-pricing. Pressure on BTC and risk assets.', src: 'Extrapolated CNBC / TheStreet', badge: 'fut' },
      { n: 'US Recession — jobs data', d: 'Q2–Q3 2026', s: -20, desc: '4.4% unemployment + bad payrolls. If 3 bad months: priced recession. BTC generalized sell-off.', src: 'BLS / Fed Reserve / EBC Financial', badge: 'fut' },
      { n: 'Quantum computing — ECDSA', d: '2026–2028', s: -15, desc: 'IBM/Google quantum advances: theoretical risk on Bitcoin private keys. Long-term existential risk.', src: 'Christopher Wood CNBC / Nature', badge: 'fut' },
      { n: 'Strict stablecoin regulation', d: '2026', s: -8, desc: 'If GENIUS Act creates friction on USDT/USDC: reduced crypto liquidity, lower volumes.', src: 'Extrapolated Congress.gov / Bloomberg', badge: 'fut' },
      { n: '5th Halving — marginal impact', d: 'Apr 2028', s: -3, desc: 'Reward 3.125 → 1.5625. Weak supply impact: >95% mined. Disappoints if market expected strong rally.', src: 'Bitcoin.org / Spark Money', badge: 'fut' },
    ]
  }
};
