// ═══════════════════════════════════════════════════════
// CHART — Chart.js logic, switchTF, liveHist
// ═══════════════════════════════════════════════════════

let liveHist = [];
let currentTF = 'live';

const ctx = document.getElementById('btcChart').getContext('2d');
const chart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: [],
    datasets: [{
      data: [],
      borderColor: '#F7931A',
      backgroundColor: 'rgba(247,147,26,0.08)',
      borderWidth: 1.5,
      pointRadius: 0,
      fill: true,
      tension: 0.3
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: c => '$' + Math.round(c.parsed.y).toLocaleString() } }
    },
    scales: {
      x: { display: false },
      y: {
        ticks: { font: { size: 9 }, color: '#71717a', callback: v => '$' + Math.round(v / 1000) + 'k' },
        grid: { color: 'rgba(255,255,255,0.05)' }
      }
    }
  }
});

function switchTF(tf) {
  currentTF = tf;
  document.querySelectorAll('.tft').forEach(t2 => t2.classList.toggle('act', t2.dataset.tf === tf));
  if (tf === 'live') {
    chart.data.datasets[0].borderColor = '#F7931A';
    chart.data.datasets[0].backgroundColor = 'rgba(247,147,26,0.08)';
    chart.data.datasets[0].data = [...liveHist];
    chart.data.labels = liveHist.map(() => '');
    chart.options.scales.x.display = false;
  } else {
    const h = HIST[tf];
    chart.data.datasets[0].borderColor = h.c;
    chart.data.datasets[0].backgroundColor = h.c + '18';
    chart.data.datasets[0].data = h.d;
    chart.data.labels = h.d.map((_, i) => 'M' + (i + 1));
    chart.options.scales.x.display = true;
    chart.options.scales.x.ticks = { font: { size: 9 }, color: '#71717a' };
  }
  chart.update();
}

document.querySelectorAll('.tft').forEach(t2 => t2.addEventListener('click', () => switchTF(t2.dataset.tf)));
