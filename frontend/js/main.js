import { api } from './api.js';
import * as home from './pages/home.js';
import * as history from './pages/history.js';
import * as device from './pages/device.js';

const routes = {
  'home':    { title: 'Home',      sub: 'Your cooling system, right now', page: home },
  'history': { title: 'History',   sub: 'Readings your system has logged over time', page: history },
  'device':  { title: 'My Device', sub: 'Settings, sensors, and connecting your hardware', page: device }
};

const view = document.getElementById('view');
let current = null;

async function go() {
  const name = location.hash.replace('#/', '') || 'home';
  const key = routes[name] ? name : 'home';
  const route = routes[key];

  if (current && current.destroy) current.destroy();
  current = null;

  try {
    view.innerHTML = await fetch(`pages/${key}.html`).then(r => r.text());
  } catch {
    view.innerHTML = '<div class="card">Could not load this page.</div>';
    return;
  }

  document.getElementById('page-title').textContent = route.title;
  document.getElementById('page-sub').textContent = route.sub;
  document.title = `${route.title} · Smart Tube Cooling`;
  document.querySelectorAll('#nav a').forEach(a =>
    a.classList.toggle('active', a.getAttribute('href') === `#/${key}`));
  window.scrollTo(0, 0);

  if (route.page) {
    current = route.page;
    try { await route.page.init(view); }
    catch (err) {
      console.error(err);
      view.insertAdjacentHTML('afterbegin', '<div class="note">Can\'t reach the server. Start it with <code>npm start</code> in the backend folder.</div>');
    }
  }
}

async function checkServer() {
  const el = document.getElementById('api-status');
  try {
    await api.health();
    el.innerHTML = '<span class="dot"></span>Connected';
    el.className = 'status ok';
  } catch {
    el.innerHTML = '<span class="dot"></span>Offline';
    el.className = 'status bad';
  }
}

window.addEventListener('hashchange', go);
checkServer();
go();
