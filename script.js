const weatherCodes = {
  0: { label: 'Clear sky', icon: '☀️' },
  1: { label: 'Mainly clear', icon: '🌤️' },
  2: { label: 'Partly cloudy', icon: '⛅' },
  3: { label: 'Overcast', icon: '☁️' },
  45: { label: 'Foggy', icon: '🌫️' },
  48: { label: 'Depositing rime fog', icon: '🌫️' },
  51: { label: 'Light drizzle', icon: '🌦️' },
  53: { label: 'Drizzle', icon: '🌦️' },
  55: { label: 'Heavy drizzle', icon: '🌧️' },
  56: { label: 'Freezing drizzle', icon: '🌧️' },
  57: { label: 'Heavy freezing drizzle', icon: '🌧️' },
  61: { label: 'Slight rain', icon: '🌦️' },
  63: { label: 'Rain', icon: '🌧️' },
  65: { label: 'Heavy rain', icon: '🌧️' },
  66: { label: 'Freezing rain', icon: '🌧️' },
  67: { label: 'Heavy freezing rain', icon: '🌧️' },
  71: { label: 'Light snow', icon: '🌨️' },
  73: { label: 'Snow', icon: '❄️' },
  75: { label: 'Heavy snow', icon: '❄️' },
  77: { label: 'Snow grains', icon: '❄️' },
  80: { label: 'Rain showers', icon: '🌦️' },
  81: { label: 'Heavy showers', icon: '🌧️' },
  82: { label: 'Violent showers', icon: '⛈️' },
  85: { label: 'Snow showers', icon: '🌨️' },
  86: { label: 'Heavy snow showers', icon: '🌨️' },
  95: { label: 'Thunderstorm', icon: '⛈️' },
  96: { label: 'Thunderstorm with hail', icon: '⛈️' },
  99: { label: 'Severe thunderstorm', icon: '⛈️' }
};

const cityInput = document.getElementById('cityInput');
const searchForm = document.getElementById('searchForm');
const heroPanel = document.getElementById('heroPanel');
const cityNameEl = document.getElementById('cityName');
dateLabelEl = document.getElementById('dateLabel');
const statusPillEl = document.getElementById('statusPill');
const conditionIconEl = document.getElementById('conditionIcon');
const conditionTextEl = document.getElementById('conditionText');
const currentTempEl = document.getElementById('currentTemp');
const feelsLikeEl = document.getElementById('feelsLike');
const humidityEl = document.getElementById('humidity');
const windEl = document.getElementById('wind');
const pressureEl = document.getElementById('pressure');
const visibilityEl = document.getElementById('visibility');
const sunriseEl = document.getElementById('sunrise');
const sunsetEl = document.getElementById('sunset');
const aqiBadgeEl = document.getElementById('aqiBadge');
const aqiTextEl = document.getElementById('aqiText');
const forecastListEl = document.getElementById('forecastList');

const fallbackCity = 'Hanoi';

function formatTime(timestamp) {
  const date = new Date(timestamp);
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

function formatShortDate(timestamp) {
  const date = new Date(timestamp);
  return new Intl.DateTimeFormat('vi-VN', {
    weekday: 'short',
    day: '2-digit',
    month: 'short'
  }).format(date);
}

function getWeatherInfo(code) {
  return weatherCodes[code] || { label: 'Weather', icon: '🌤️' };
}

function getSkyClass(code) {
  const info = getWeatherInfo(code);
  const text = info.label.toLowerCase();
  if (text.includes('rain') || text.includes('drizzle') || text.includes('storm')) return 'rainy';
  if (text.includes('cloud') || text.includes('fog') || text.includes('overcast')) return 'cloudy';
  if (text.includes('snow')) return 'cloudy';
  return 'sunny';
}

function calcAqi(value) {
  if (value <= 50) return { label: 'Good', color: '#74dba2' };
  if (value <= 100) return { label: 'Moderate', color: '#ffd166' };
  if (value <= 150) return { label: 'Unhealthy for sensitive groups', color: '#ffb86c' };
  if (value <= 200) return { label: 'Unhealthy', color: '#ff7a7a' };
  return { label: 'Very unhealthy', color: '#c77dff' };
}

async function geocodeCity(city) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Không tìm thấy thành phố.');
  const data = await response.json();

  if (!data.results || data.results.length === 0) {
    throw new Error('Không tìm thấy thành phố này.');
  }

  const result = data.results[0];
  return {
    name: result.name,
    country: result.country || '',
    latitude: result.latitude,
    longitude: result.longitude,
    timezone: result.timezone || 'auto'
  };
}

async function fetchWeatherData(lat, lon, timezone) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,pressure_msl,wind_speed_10m,visibility&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset&timezone=${encodeURIComponent(timezone)}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Không thể tải dữ liệu thời tiết.');

  const data = await response.json();
  if (!data?.current || !data?.daily) {
    throw new Error('Dữ liệu thời tiết không hợp lệ.');
  }

  return data;
}

async function fetchAirQuality(lat, lon) {
  try {
    const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi`;
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = await response.json();
    return data.current?.us_aqi ?? null;
  } catch {
    return null;
  }
}

function renderCurrentWeather(data, cityInfo, aqiValue) {
  const current = data.current;
  const weatherInfo = getWeatherInfo(current.weather_code);
  const skyClass = getSkyClass(current.weather_code);
  heroPanel.className = `hero-panel ${skyClass}`;

  cityNameEl.textContent = `${cityInfo.name}${cityInfo.country ? ', ' + cityInfo.country : ''}`;
  dateLabelEl.textContent = formatShortDate(Date.now());
  statusPillEl.textContent = weatherInfo.label;
  conditionTextEl.textContent = weatherInfo.label;
  conditionIconEl.textContent = weatherInfo.icon;
  currentTempEl.textContent = `${Math.round(current.temperature_2m)}°`;
  feelsLikeEl.textContent = `Cảm giác như ${Math.round(current.apparent_temperature)}°`;
  humidityEl.textContent = `${Math.round(current.relative_humidity_2m)}%`;
  windEl.textContent = `${Math.round(current.wind_speed_10m * 3.6)} km/h`;
  pressureEl.textContent = `${Math.round(current.pressure_msl)} hPa`;
  visibilityEl.textContent = `${(current.visibility / 1000).toFixed(1)} km`;

  const sunrise = data.daily.sunrise?.[0];
  const sunset = data.daily.sunset?.[0];
  if (sunrise) sunriseEl.textContent = formatTime(new Date(sunrise).getTime());
  if (sunset) sunsetEl.textContent = formatTime(new Date(sunset).getTime());

  if (aqiValue !== null) {
    const aqi = calcAqi(aqiValue);
    aqiBadgeEl.textContent = aqiValue;
    aqiBadgeEl.style.background = `linear-gradient(135deg, ${aqi.color}, rgba(255,255,255,0.2))`;
    aqiTextEl.textContent = aqi.label;
  } else {
    aqiBadgeEl.textContent = 'N/A';
    aqiBadgeEl.style.background = 'linear-gradient(135deg, #9eb4c9, rgba(255,255,255,0.2))';
    aqiTextEl.textContent = 'Unavailable';
  }
}

function renderForecast(data) {
  const daily = data.daily;
  const days = Array.from({ length: 5 }).map((_, index) => ({
    code: daily.weather_code[index],
    min: daily.temperature_2m_min[index],
    max: daily.temperature_2m_max[index],
    date: daily.time[index]
  }));

  forecastListEl.innerHTML = days
    .map((day) => {
      const info = getWeatherInfo(day.code);
      const label = new Intl.DateTimeFormat('vi-VN', { weekday: 'short' }).format(new Date(day.date));
      return `
        <div class="forecast-item">
          <div class="day">${label}</div>
          <div class="forecast-icon">${info.icon}</div>
          <div class="forecast-temp">${Math.round(day.max)}° / ${Math.round(day.min)}°</div>
          <div class="forecast-desc">${info.label}</div>
        </div>
      `;
    })
    .join('');
}

async function loadWeather(city) {
  try {
    const cityInfo = await geocodeCity(city);
    const weatherData = await fetchWeatherData(cityInfo.latitude, cityInfo.longitude, cityInfo.timezone);
    const aqiValue = await fetchAirQuality(cityInfo.latitude, cityInfo.longitude);

    renderCurrentWeather(weatherData, cityInfo, aqiValue);
    renderForecast(weatherData);
    cityInput.value = cityInfo.name;
  } catch (error) {
    alert(error.message || 'Something went wrong.');
  }
}

searchForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const city = cityInput.value.trim();
  if (!city) {
    cityInput.focus();
    return;
  }
  loadWeather(city);
});

loadWeather(fallbackCity);
