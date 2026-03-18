// ═══════════════════════════════════════════════════════
// I18N
// ═══════════════════════════════════════════════════════
const LANGS = {
  en: {
    title: 'Bitcoin Simulator', subtitle: 'Wednesday March 18, 2026 · Educational simulation',
    connecting: 'Connecting…', livePrice: 'Live price', fomcPill: 'FOMC · 2pm ET today',
    mktCap: 'Market Cap', nasdaq: 'Nasdaq (close 17/3)', wti: 'WTI Oil', fedRate: 'Fed Rate',
    backToLive: '↩ Back to live price', twLabel: 'Liquidity & Order', cashAvail: 'Available Cash',
    readyInvest: 'USD · ready to invest', btcHeld: 'BTC held', mode: 'Mode', modePct: '% Portfolio',
    share: 'Share', allIn: 'ALL IN ▲', allOut: 'ALL OUT ▼', dcaTitle: 'Staggered DCA', orders: 'Orders:',
    totalOrder: 'Total order ≈ ', execute: 'Execute', buyBtc: '▲  BUY BTC', sellBtc: '▼  SELL BTC',
    marketPrice: 'Market price · educational simulation', open: 'Open', high: 'High 24h', low: 'Low 24h',
    dominance: 'BTC Dominance', updateBar: 'Live price via <strong>CoinCap WebSocket</strong> · Educational simulation',
    volatility: 'Sim. volatility', volLow: 'Calm', volMed: 'Normal', volHigh: 'Turbo', pause: '⏸ Pause', resume: '▶ Resume',
    evtTitle: 'Scenarios & Events — Bitcoin Impact', tabPast: 'Past', tabNow: 'Today 18/03', tabFut: 'Future',
    bullish: 'Bullish Scenarios', bearish: 'Bearish Scenarios', portfolio: 'Portfolio', cashUsd: 'Cash USD',
    btcHeld2: 'BTC held', btcValue: 'BTC value', total: 'Total', avgBuy: 'Avg. buy price',
    tradeLog: 'Trade log', noTrades: 'No trades yet.', footerSim: 'Educational simulation only · Not financial advice',
    footerSrc: 'Live price:', modalTitle: 'Event triggered', modeFree: '🚀 Free simulation',
    modeFreeSub: 'Price deviates freely — does not return to live',
    modeReturn: '🔄 Simulate then return to live',
    modeReturnSub: 'Price deviates for ~60s then converges back to real market price',
    rememberChoice: 'Apply this choice to all future events (until Back to live is pressed)',
    cancel: 'Cancel', suggestedLabel: 'Suggested scenario today',
    simFree: '🚀 Free sim', simReturn: '🔄 Sim + return', simActive: 'Simulation active',
    insufficient: '⚠️ Insufficient funds', btcInsuff: '⚠️ Insufficient BTC',
    invalidAmt: '⚠️ Invalid amount', dcaBuy: 'DCA BUY', dcaSell: 'DCA SELL',
    staggeredOrders: 'staggered orders (decreasing prices)', staggeredOrdersSell: 'staggered orders (increasing prices)',
    dcaRemaining: 'DCA: remaining orders', backLiveLog: '↩ Price re-synced with live market',
    wsConnected: '🔗 CoinCap WebSocket connected', wsFallback: '⚠️ WebSocket unavailable — simulation mode',
    reconnecting: 'Reconnecting in 5s…', simulated: 'Simulated (fallback)', liveLabel: 'Live · CoinCap',
    singleOrder: 'Single order', moreOrders: 'more orders…',
    dcaUseRange: 'Custom price range', dcaFrom: 'From ($)', dcaTo: 'To ($)',
  },
  fr: {
    title: 'Bitcoin Simulator', subtitle: 'Mercredi 18 mars 2026 · Simulation pédagogique',
    connecting: 'Connexion…', livePrice: 'Prix live', fomcPill: 'FOMC · 14h ET aujourd\'hui',
    mktCap: 'Market Cap', nasdaq: 'Nasdaq (clôt. 17/3)', wti: 'WTI Pétrole', fedRate: 'Taux Fed',
    backToLive: '↩ Retour au prix live', twLabel: 'Liquidités & Ordre', cashAvail: 'Cash disponible',
    readyInvest: 'USD · prêt à investir', btcHeld: 'BTC détenu', mode: 'Mode', modePct: '% Portefeuille',
    share: 'Part', allIn: 'ALL IN ▲', allOut: 'ALL OUT ▼', dcaTitle: 'DCA échelonné', orders: 'Ordres :',
    totalOrder: 'Total ordre ≈ ', execute: 'Exécuter', buyBtc: '▲  ACHETER BTC', sellBtc: '▼  VENDRE BTC',
    marketPrice: 'Prix marché · simulation pédagogique', open: 'Ouverture', high: 'Haut 24h', low: 'Bas 24h',
    dominance: 'Dominance BTC', updateBar: 'Prix live via <strong>CoinCap WebSocket</strong> · Simulation pédagogique',
    volatility: 'Volatilité sim.', volLow: 'Calme', volMed: 'Normale', volHigh: 'Turbo', pause: '⏸ Pause', resume: '▶ Reprendre',
    evtTitle: 'Scénarios & Événements — Impact Bitcoin', tabPast: 'Passé', tabNow: "Aujourd'hui 18/03", tabFut: 'Futur',
    bullish: 'Scénarios Haussiers', bearish: 'Scénarios Baissiers', portfolio: 'Portefeuille', cashUsd: 'Cash USD',
    btcHeld2: 'BTC détenu', btcValue: 'Valeur BTC', total: 'Total', avgBuy: 'Prix moy. achat',
    tradeLog: 'Journal des trades', noTrades: 'Aucun trade pour l\'instant.',
    footerSim: 'Simulation pédagogique uniquement · Pas un conseil financier',
    footerSrc: 'Prix live :', modalTitle: 'Événement déclenché', modeFree: '🚀 Simulation libre',
    modeFreeSub: 'Le prix dévie librement selon l\'impact — ne revient pas au live',
    modeReturn: '🔄 Simulation puis retour live',
    modeReturnSub: 'Le prix dévie pendant ~60s puis converge progressivement vers le prix réel',
    rememberChoice: 'Appliquer ce choix à tous les événements futurs (jusqu\'à \'Retour live\')',
    cancel: 'Annuler', suggestedLabel: 'Scénario suggéré aujourd\'hui',
    simFree: '🚀 Sim. libre', simReturn: '🔄 Sim. + retour', simActive: 'Simulation active',
    insufficient: '⚠️ Fonds insuff.', btcInsuff: '⚠️ BTC insuff.',
    invalidAmt: '⚠️ Montant invalide', dcaBuy: 'DCA ACHAT', dcaSell: 'DCA VENTE',
    staggeredOrders: 'ordres échelonnés (prix décroissants)', staggeredOrdersSell: 'ordres échelonnés (prix croissants)',
    dcaRemaining: 'DCA : ordres restants', backLiveLog: '↩ Prix resynchronisé avec le marché réel',
    wsConnected: '🔗 WebSocket CoinCap connecté', wsFallback: '⚠️ WebSocket indisponible — mode simulation',
    reconnecting: 'Reconnexion dans 5s…', simulated: 'Simulé (fallback)', liveLabel: 'Live · CoinCap',
    singleOrder: 'Ordre unique', moreOrders: 'ordres supplémentaires…',
    dcaUseRange: 'Plage de prix personnalisée', dcaFrom: 'Depuis ($)', dcaTo: 'Jusqu\'à ($)',
  },
  es: {
    title: 'Simulador Bitcoin', subtitle: 'Miércoles 18 marzo 2026 · Simulación educativa',
    connecting: 'Conectando…', livePrice: 'Precio en vivo', fomcPill: 'FOMC · 14h ET hoy',
    mktCap: 'Cap. mercado', nasdaq: 'Nasdaq (cierre 17/3)', wti: 'Petróleo WTI', fedRate: 'Tipo Fed',
    backToLive: '↩ Volver al precio real', twLabel: 'Liquidez & Orden', cashAvail: 'Efectivo disponible',
    readyInvest: 'USD · listo para invertir', btcHeld: 'BTC en cartera', mode: 'Modo', modePct: '% Cartera',
    share: 'Parte', allIn: 'TODO DENTRO ▲', allOut: 'TODO FUERA ▼', dcaTitle: 'DCA escalonado', orders: 'Órdenes:',
    totalOrder: 'Total orden ≈ ', execute: 'Ejecutar', buyBtc: '▲  COMPRAR BTC', sellBtc: '▼  VENDER BTC',
    marketPrice: 'Precio mercado · simulación educativa', open: 'Apertura', high: 'Máx 24h', low: 'Mín 24h',
    dominance: 'Dominancia BTC', updateBar: 'Precio en vivo via <strong>CoinCap WebSocket</strong> · Simulación educativa',
    volatility: 'Volatilidad sim.', volLow: 'Calma', volMed: 'Normal', volHigh: 'Turbo', pause: '⏸ Pausa', resume: '▶ Reanudar',
    evtTitle: 'Escenarios & Eventos — Impacto Bitcoin', tabPast: 'Pasado', tabNow: 'Hoy 18/03', tabFut: 'Futuro',
    bullish: 'Escenarios Alcistas', bearish: 'Escenarios Bajistas', portfolio: 'Cartera', cashUsd: 'Efectivo USD',
    btcHeld2: 'BTC en cartera', btcValue: 'Valor BTC', total: 'Total', avgBuy: 'Precio medio compra',
    tradeLog: 'Registro de operaciones', noTrades: 'Sin operaciones aún.',
    footerSim: 'Solo simulación educativa · No es asesoramiento financiero',
    footerSrc: 'Precio en vivo:', modalTitle: 'Evento activado', modeFree: '🚀 Simulación libre',
    modeFreeSub: 'El precio se desvía libremente — no regresa al precio real',
    modeReturn: '🔄 Simular y volver al precio real',
    modeReturnSub: 'El precio se desvía ~60s y luego converge gradualmente al precio real',
    rememberChoice: 'Aplicar esta elección a todos los eventos futuros (hasta pulsar Volver al precio real)',
    cancel: 'Cancelar', suggestedLabel: 'Escenario sugerido hoy',
    simFree: '🚀 Sim. libre', simReturn: '🔄 Sim. + vuelta', simActive: 'Simulación activa',
    insufficient: '⚠️ Fondos insuf.', btcInsuff: '⚠️ BTC insuf.',
    invalidAmt: '⚠️ Monto inválido', dcaBuy: 'DCA COMPRA', dcaSell: 'DCA VENTA',
    staggeredOrders: 'órdenes escalonadas (precios decrecientes)', staggeredOrdersSell: 'órdenes escalonadas (precios crecientes)',
    dcaRemaining: 'DCA: órdenes restantes', backLiveLog: '↩ Precio resincronizado con el mercado real',
    wsConnected: '🔗 WebSocket CoinCap conectado', wsFallback: '⚠️ WebSocket no disponible — modo simulación',
    reconnecting: 'Reconectando en 5s…', simulated: 'Simulado (fallback)', liveLabel: 'Live · CoinCap',
    singleOrder: 'Orden única', moreOrders: 'órdenes más…',
    dcaUseRange: 'Rango de precios personalizado', dcaFrom: 'Desde ($)', dcaTo: 'Hasta ($)',
  }
};

let lang = 'en';

function t(k) {
  return LANGS[lang][k] || LANGS.en[k] || k;
}

function applyLang() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const k = el.dataset.i18n;
    if (k === 'updateBar' || k === 'totalOrder') {
      el.innerHTML = t(k) + (k === 'totalOrder' ? '<strong id="tval">$0</strong>' : '');
    } else {
      el.textContent = t(k);
    }
  });
  const pb = document.getElementById('pbtn');
  if (pb) pb.textContent = paused ? t('resume') : t('pause');
  renderSuggested(currentCat);
  renderDcaPreview();
}

document.querySelectorAll('.lang-btn').forEach(b => b.addEventListener('click', function () {
  lang = this.dataset.lang;
  document.querySelectorAll('.lang-btn').forEach(x => x.classList.remove('act'));
  this.classList.add('act');
  applyLang();
}));
