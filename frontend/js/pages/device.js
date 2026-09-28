import { api } from '../api.js';

const FIELDS = ['ambientTemp', 'soilTemp', 'roomTemp', 'humidity', 'velocity', 'fanWatts'];

export async function init(root) {
  await loadSettings(root);
  await loadSensors(root);

  root.querySelector('#save-settings').addEventListener('click', () => saveSettings(root));
  root.querySelector('#add-reading').addEventListener('click', () => addReading(root));
  root.querySelector('#import-csv').addEventListener('click', () => importCsv(root));
  root.querySelector('#clear-readings').addEventListener('click', () => clearAll(root));
}

async function loadSettings(root) {
  const cfg = await api.config();
  root.querySelector('#c-deviceName').value = cfg.deviceName || '';
  root.querySelector('#c-location').value = cfg.location || '';
  root.querySelector('#c-targetTemp').value = cfg.targetTemp ?? 24;

  const seg = root.querySelector('#fan-segmented');
  [...seg.children].forEach(btn => {
    btn.classList.toggle('active', btn.dataset.val === (cfg.fanSpeed || 'medium'));
    btn.addEventListener('click', () => {
      [...seg.children].forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
}

async function saveSettings(root) {
  const msg = root.querySelector('#settings-msg');
  const fanSpeed = root.querySelector('#fan-segmented .active')?.dataset.val || 'medium';
  const body = {
    deviceName: root.querySelector('#c-deviceName').value,
    location: root.querySelector('#c-location').value,
    targetTemp: root.querySelector('#c-targetTemp').value,
    fanSpeed
  };
  try {
    await api.saveConfig(body);
    msg.textContent = 'Saved.'; msg.style.color = '#3d6b45';
  } catch (e) {
    msg.textContent = e.message; msg.style.color = '#a13a2b';
  }
}

async function loadSensors(root) {
  const { sensors, connectedCount, total } = await api.sensorStatus();
  const badge = root.querySelector('#conn-badge');
  badge.textContent = `${connectedCount} / ${total} connected`;
  badge.className = `pill ${connectedCount ? 'on' : 'off'}`;

  root.querySelector('#sensor-grid').innerHTML = sensors.map(s => `
    <div class="sensor ${s.connected ? 'live' : ''}">
      <div class="row"><b>${s.label}</b><span class="pill ${s.connected ? 'on' : 'off'}">${s.connected ? 'Connected' : 'Not connected'}</span></div>
      ${s.connected
        ? `<div class="value">${s.value}${s.unit}</div><div class="meta">${new Date(s.timestamp).toLocaleString()}</div>`
        : `<div class="meta" style="margin-top:8px">Waiting for a reading…</div>`}
    </div>`).join('');
}

async function addReading(root) {
  const msg = root.querySelector('#add-msg');
  const body = {};
  FIELDS.forEach(f => {
    const v = root.querySelector(`#f-${f}`).value;
    if (v !== '') body[f] = v;
  });
  body.source = 'manual';
  try {
    await api.addReading(body);
    msg.textContent = 'Saved.'; msg.style.color = '#3d6b45';
    FIELDS.forEach(f => { root.querySelector(`#f-${f}`).value = ''; });
    await loadSensors(root);
  } catch (e) {
    msg.textContent = e.message; msg.style.color = '#a13a2b';
  }
}

async function importCsv(root) {
  const msg = root.querySelector('#import-msg');
  const csv = root.querySelector('#csv-text').value.trim();
  if (!csv) { msg.textContent = 'Paste some rows first.'; msg.style.color = '#a13a2b'; return; }
  try {
    const r = await api.importCsv(csv);
    msg.textContent = `Imported ${r.saved} row(s).`; msg.style.color = '#3d6b45';
    root.querySelector('#csv-text').value = '';
    await loadSensors(root);
  } catch (e) {
    msg.textContent = e.message; msg.style.color = '#a13a2b';
  }
}

async function clearAll(root) {
  if (!confirm('Delete every stored reading? This cannot be undone.')) return;
  await api.clearReadings();
  await loadSensors(root);
}
