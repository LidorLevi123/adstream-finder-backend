### AdStream Finder — Backend

A lightweight Node.js/Express backend that serves a simple API for reading analyzed domain data from a CSV, with an optional Puppeteer-based collector that can generate/update the dataset.

---

## Overview
- **Server**: Express with JSON and CORS middleware; serves static files from `public` when `NODE_ENV=production`.
- **API**: `GET /api/collector-data` returns the parsed CSV data as JSON.
- **Collector**: Launches headless Chromium via Puppeteer to analyze domains for streaming presence and Google Ads signals; outputs `data/collector-data.csv`.
- **Logging**: Structured logs written to `logs/backend.log` and printed to stdout.

---

## Requirements
- Node.js 18+ (required by recent Puppeteer versions)
- npm 8+

---

## Getting Started
```bash
# from repository root
cd backend
npm install
```

### Run in Development
```bash
npm run dev
```
- Starts the server with automatic reloads (nodemon) on the default port `3030` unless `PORT` is set.
- CORS is enabled for `http://localhost:5173` in development.

### Run in Production
On Windows (provided script):
```bash
npm run server:prod
```

Cross-platform (manual):
```bash
NODE_ENV=production node server.js
```

Environment variables:
- `PORT` (optional): server port, defaults to `3030`.
- `NODE_ENV` (optional): use `production` to serve static assets from `public`.

> Store any sensitive values as environment variables rather than hard-coding them. [[memory:6179656]]

---

## API
### GET `/api/collector-data`
Returns the content of `data/collector-data.csv` parsed as JSON.

Response shape (array of records):
```json
[
  {
    "domain": "example.com",
    "hasStreaming": true,
    "hasAds": false,
    "error": "" // optional; present when a domain failed to analyze
  }
]
```

Example request:
```bash
curl http://localhost:3030/api/collector-data
```

Notes:
- If the CSV file does not exist, the API responds with HTTP 500 and a descriptive error.

---

## Collector (optional)
The collector analyzes a predefined list of domains concurrently (with a concurrency cap) and writes results to `data/collector-data.csv`.

How it works at a glance:
- Launches headless Chromium via Puppeteer
- Intercepts requests to collect URLs and skip heavy assets
- Detects streaming by looking for `.m3u8`/`.mpd`, known platforms, or video elements
- Detects Google Ads via network requests and common DOM patterns
- Writes consolidated results to CSV

To run the collector once:
1. Open `server.js` and locate the call near the server startup:
   ```js
   // collectorService.initiateCollector()
   ```
2. Uncomment that line.
3. Start the server (dev or prod). When finished, the CSV will be written to `data/collector-data.csv`, and the browser instance will close.
4. Re-comment the line to avoid running the collector every time the server starts.

Output CSV columns:
- `domain` (string)
- `hasStreaming` (boolean)
- `hasAds` (boolean)
- `error` (string; optional)

Performance & resource notes:
- The first Puppeteer run downloads a local Chromium build; this can take time and disk space.
- Network-heavy operation; consider reducing the domain list or concurrency if needed.

---

## Project Structure
```
backend/
  data/
    collector-data.csv         # CSV output (seed/sample included)
  logs/
    backend.log                # Rolling log file (auto-created)
  public/                      # Static assets served in production
  services/
    collector.service.js       # Puppeteer-based domain analyzer
    csv.service.js             # CSV read/write helpers
    logger.service.js          # File+console logger
  server.js                    # Express app and API route
  package.json
```

---

## Scripts
```json
{
  "start": "node server.js",            // run server
  "dev": "nodemon server.js",           // dev mode with reload
  "server:prod": "set NODE_ENV=production&node server.js" // Windows production
}
```

---

## Dependencies
- **express**: HTTP server and routing
- **cors**: Cross-origin resource sharing
- **puppeteer**: Headless Chromium automation for collection
- **p-limit**: Concurrency control for async tasks
- **csv-parse**: CSV parsing to JSON
- **csv-writer**: CSV writing for collector output
- Dev: **nodemon** for hot reloading in development

---

## Logging
- Logs are written to stdout and appended to `logs/backend.log`.
- Format: `timestamp - LEVEL - message | meta`.

---

## Troubleshooting
- "Port already in use": set a different `PORT` or stop the conflicting process.
- Puppeteer fails to launch: ensure Node 18+, sufficient disk space, and that your environment allows Chromium to run headless. On first run, Puppeteer may need to download Chromium.
- CORS blocked in development: the server allows `http://localhost:5173` by default; adjust as needed in `server.js`.

---

## License
MIT (or project default). Update as appropriate.


