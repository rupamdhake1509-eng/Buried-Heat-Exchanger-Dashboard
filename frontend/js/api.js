async function request(url, options) {
  const res = await fetch(url, options);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `${url} -> ${res.status}`);
  return body;
}

export const api = {
  health: () => request('/api/health'),

  readings: (limit = 100) => request(`/api/readings?limit=${limit}`),
  addReading: (reading) => request('/api/readings', post(reading)),
  importCsv: (csv) => request('/api/readings/import', post({ csv })),
  clearReadings: () => request('/api/readings', { method: 'DELETE' }),
  sensorStatus: () => request('/api/sensors/status'),

  config: () => request('/api/config'),
  saveConfig: (cfg) => request('/api/config', put(cfg))
};

function post(body) {
  return { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}
function put(body) {
  return { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}
