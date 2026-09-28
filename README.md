# Weather Dashboard

A modern, realistic 2D weather dashboard that fetches live data from the Open-Meteo public weather API.

## Features

- Search weather by city name
- Real-time current conditions and metrics
- Sunrise/sunset timing
- 5-day forecast cards
- Dynamic 2D sky visuals based on weather state
- Air quality indicator (when available)
- Works without a paid API key

## Run locally

1. Open the repository folder.
2. Start a simple local server:

```bash
python3 -m http.server 8000
```

3. Open the app in the browser:

```text
http://localhost:8000
```

## Files

- `index.html` — main dashboard structure
- `styles.css` — UI styling and 2D weather art
- `script.js` — API requests and rendering logic

## API source

This project uses the public Open-Meteo API:

- Geocoding: https://geocoding-api.open-meteo.com
- Weather: https://api.open-meteo.com
- Air quality: https://air-quality-api.open-meteo.com

No API key is required for the weather data used here.
