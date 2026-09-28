import { api } from '../api.js';

let chart;

export async function init(root) {
  const { total, readings } = await api.readings(500);
  const empty = root.querySelector('#empty-state');
  const body = root.querySelector('#history-body');

  if (!total) { empty.style.display = 'block'; body.style.display = 'none'; return; }
  empty.style.display = 'none';
  body.style.display = 'block';

  drawChart(root.querySelector('#history-chart'), readings);

  const rows = [...readings].reverse().map(r => `
    <tr>
      <td>${new Date(r.timestamp).toLocaleString()}</td>
      <td>${r.roomTemp ?? '—'}</td><td>${r.ambientTemp ?? '—'}</td><td>${r.soilTemp ?? '—'}</td>
      <td>${r.humidity ?? '—'}</td><td>${r.velocity ?? '—'}</td><td>${r.fanWatts ?? '—'}</td>
      <td>${r.source ?? '—'}</td>
    </tr>`).join('');
  root.querySelector('#reading-body').innerHTML = rows;
}

function drawChart(canvas, readings) {
  if (typeof Chart === 'undefined' || !canvas) return;
  const labels = readings.map(r => new Date(r.timestamp).toLocaleString());
  const series = (key, label, color) => ({
    label, data: readings.map(r => r[key] ?? null), borderColor: color,
    borderWidth: 2, spanGaps: true, tension: 0.25, pointRadius: 2
  });
  chart = new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [
        series('roomTemp', 'Indoor', '#b5502f'),
        series('ambientTemp', 'Outdoor', '#a8631f'),
        series('soilTemp', 'Ground', '#3d5943')
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: { legend: { position: 'bottom' } },
      scales: { x: { ticks: { maxTicksLimit: 6 } }, y: { title: { display: true, text: '°C' } } }
    }
  });
}

export function destroy() { if (chart) chart.destroy(); }
