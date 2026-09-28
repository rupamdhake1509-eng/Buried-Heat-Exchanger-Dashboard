# Smart Tube Cooling

A simple consumer dashboard for a buried-tube (earth-air) cooling system.
Node/Express backend stores your readings and settings; the frontend is a small
HTML/CSS/JS app. Nothing is invented — every number shown comes from a reading
you entered, imported, or a connected sensor sent in.

## Run it

```bash
cd backend
npm install
npm start
```

Open http://localhost:3000 — the backend serves the frontend too, so there's
only one thing to start.

## Pages

- **Home** — current indoor temperature, a power switch, target temperature,
  and outdoor/ground/humidity readings. Shows "No data" until something real
  comes in.
- **History** — a chart and table of every reading that's been logged.
- **My Device** — name your device, set a target temperature and fan speed,
  see which sensors are actually connected, log a reading by hand, import a
  CSV, or point an ESP32 at the API. Also lets you export or clear your data.

## API

| Method | Route | Purpose |
|---|---|---|
| GET | /api/health | server status |
| GET/PUT | /api/config | device name, location, power, target temp, fan speed |
| GET | /api/sensors/status | which sensors have reported in, and their last value |
| POST | /api/readings | add one reading, or an array of them |
| POST | /api/readings/import | import readings from CSV text |
| GET | /api/readings | list stored readings |
| GET | /api/readings/latest | most recent reading |
| GET | /api/readings/export.csv | download everything as CSV |
| DELETE | /api/readings | clear all stored readings |

## Connecting a sensor (e.g. ESP32)

```
POST /api/readings
Content-Type: application/json

{ "ambientTemp": 34.5, "soilTemp": 24.1, "roomTemp": 27.2, "source": "my-sensor" }
```
Fields you can send: `ambientTemp`, `soilTemp`, `roomTemp`, `humidity`, `velocity`, `fanWatts`.
Send only the ones your hardware actually measures — everything else stays blank.
