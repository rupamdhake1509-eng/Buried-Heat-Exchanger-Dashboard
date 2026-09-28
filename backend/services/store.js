// Very small file-based storage so there is no database to install.
const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..', 'data');

function load(name, fallback) {
  try { return JSON.parse(fs.readFileSync(path.join(DIR, name), 'utf8')); }
  catch { return fallback; }
}

function save(name, value) {
  fs.writeFileSync(path.join(DIR, name), JSON.stringify(value, null, 2));
}

module.exports = { load, save };
