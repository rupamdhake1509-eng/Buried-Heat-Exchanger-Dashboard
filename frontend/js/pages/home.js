import { api } from '../api.js';

export async function init(root) {
  const [cfg, { readings }] = await Promise.all([api.config(), api.readings(1)]);
  const latest = readings[readings.length - 1] || null;

  root.querySelector('#hero-name').textContent = cfg.deviceName || cfg.location || 'Your system';

  setupPower(root, cfg);
  setupTarget(root, cfg);

  if (!latest) {
    root.querySelector('#hero-temp').textContent = '--';
    root.querySelector('#hero-status').textContent = 'Waiting for a reading…';
    root.querySelector('#no-data-card').style.display = 'block';
    return;
  }

  const set = (id, val, meta) => {
    const el = root.querySelector('#' + id);
    if (val == null) { el.textContent = 'No data'; el.classList.add('empty'); }
    else { el.textContent = val; el.classList.remove('empty'); }
    const m = root.querySelector('#' + id + '-meta');
    if (m) m.textContent = meta || '';
  };

  const when = new Date(latest.timestamp).toLocaleString();
  root.querySelector('#hero-temp').textContent = latest.roomTemp != null ? latest.roomTemp : '--';
  root.querySelector('#hero-status').textContent = latest.roomTemp != null
    ? `Last updated ${when}` : `Last reading logged ${when}, but no indoor temperature in it`;

  set('s-ambient', latest.ambientTemp != null ? latest.ambientTemp + '°' : null, when);
  set('s-soil', latest.soilTemp != null ? latest.soilTemp + '°' : null, when);
  set('s-humidity', latest.humidity != null ? latest.humidity + '%' : null, when);
}

function setupPower(root, cfg) {
  const input = root.querySelector('#power-switch');
  const label = root.querySelector('#power-label');
  input.checked = !!cfg.power;
  label.textContent = cfg.power ? 'On' : 'Off';
  input.addEventListener('change', async () => {
    label.textContent = input.checked ? 'On' : 'Off';
    await api.saveConfig({ power: input.checked });
  });
}

function setupTarget(root, cfg) {
  const val = root.querySelector('#target-val');
  let target = cfg.targetTemp ?? 24;
  val.textContent = target + '°';

  const update = async (delta) => {
    target = Math.max(15, Math.min(32, target + delta));
    val.textContent = target + '°';
    await api.saveConfig({ targetTemp: target });
  };
  root.querySelector('#target-up').addEventListener('click', () => update(1));
  root.querySelector('#target-down').addEventListener('click', () => update(-1));
}
