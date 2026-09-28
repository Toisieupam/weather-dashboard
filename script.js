const apiKey = "YOUR_OPENWEATHERMAP_API_KEY";
const fallbackCity = "Hanoi";

const cityInput = document.getElementById("cityInput");
const searchForm = document.getElementById("searchForm");
const heroPanel = document.getElementById("heroPanel");
const cityNameEl = document.getElementById("cityName");
const dateLabelEl = document.getElementById("dateLabel");
const statusPillEl = document.getElementById("statusPill");
const conditionIconEl = document.getElementById("conditionIcon");
const conditionTextEl = document.getElementById("conditionText");
const currentTempEl = document.getElementById("currentTemp");
const feelsLikeEl = document.getElementById("feelsLike");
const humidityEl = document.getElementById("humidity");
const windEl = document.getElementById("wind");
const pressureEl = document.getElementById("pressure");
const visibilityEl = document.getElementById("visibility");
const sunriseEl = document.getElementById("sunrise");
const sunsetEl = document.getElementById("sunset");
const aqiBadgeEl = document.getElementById("aqiBadge");
const aqiTextEl = document.getElementById("aqiText");
const forecastListEl = document.getElementById("forecastList");

const weatherIcons = {
  clear: "☀️",
  cloudy: "☁️",
  rainy: "🌧️",
  storm: "⛈️",
  snow: "❄️",
  mist: "🌫️",
  default: "🌤️"
};

function formatTime(unixTimestamp, timezoneOffset = 0) {
  const local = new Date((unixTimestamp + timezoneOffset) * 1000);
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(local);
}

function formatDate(unixTimestamp, timezoneOffset = 0) {
  const local = new Date((unixTimestamp + timezoneOffset) * 1000);
  return new Intl.DateTimeFormat("vi-VN", {
    weekday: "short",
    day: "2-digit",
    month: "short"
  }).format(local);
}

function toTitleCase(value) {
  return value
    .toLowerCase()
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getSkyTheme(condition = "") {
  const normalized = condition.toLowerCase();

  if (normalized.includes("clear") || normalized.includes("sunny")) return "sunny";
  if (normalized.includes("rain") || normalized.includes("drizzle")) return "rainy";
  if (normalized.includes("cloud")) return "cloudy";
  if (normalized.includes("storm") || normalized.includes("thunder")) return "rainy";
  if (normalized.includes("snow")) return "cloudy";
  if (normalized.includes("mist") || normalized.includes("fog")) return "cloudy";
  if (normalized.includes("night")) return "night";
  return "sunny";
}

function getWeatherIcon(main, description = "") {
  const text = `${main} ${description}`.toLowerCase();

  if (text.includes("clear") || text.includes("sunny")) return weatherIcons.clear;
  if (text.includes("rain") || text.includes("drizzle")) return weatherIcons.rainy;
  if (text.includes("storm") || text.includes("thunder")) return weatherIcons.storm;
  if (text.includes("snow")) return weatherIcons.snow;
  if (text.includes("mist") || text.includes("fog") || text.includes("haze")) return weatherIcons.mist;
  if (text.includes("cloud")) return weatherIcons.cloudy;
  return weatherIcons.default;
}

function getAqiLevel(aqi) {
  if (aqi <= 50) return { label: "Good", color: "#74dba2" };
  if (aqi <= 100) return { label: "Moderate", color: "#ffd166" };
  if (aqi <= 150) return { label: "Unhealthy for sensitive groups", color: "#ff9f43" };
  if (aqi <= 200) return { label: "Unhealthy", color: "#ff6b6b" };
  return { label: "Very unhealthy", color: "#c77dff" };
}

async function fetchJSON(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  return response.json();
}

async function fetchWeather(city) {
  if (!apiKey || apiKey === "YOUR_OPENWEATHERMAP_API_KEY") {
    throw new Error("Vui lòng thay YOUR_OPENWEATHERMAP_API_KEY bằng khóa API OpenWeatherMap của bạn.");
  }

  const weatherURL = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric&lang=vi`;
  const forecastURL = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric&lang=vi`;
  const airURL = `https://api.openweathermap.org/data/2.5/air_pollution?lat=0&lon=0&appid=${apiKey}`;

  const weatherData = await fetchJSON(weatherURL);
  const forecastData = await fetchJSON(forecastURL);

  const lat = weatherData.coord.lat;
  const lon = weatherData.coord.lon;

  const airData = await fetchJSON(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`);

  return { weatherData, forecastData, airData };
}

function renderCurrentWeather(data) {
  const { weatherData, airData } = data;
  const weather = weatherData.weather[0];
  const main = weatherData.main;
  const wind = weatherData.wind;
  const timezone = weatherData.timezone || 0;
  const aqi = airData.list?.[0]?.main?.aqi ?? 0;
  const skyTheme = getSkyTheme(weather.main);

  cityNameEl.textContent = `${weatherData.name}, ${weatherData.sys.country}`;
  dateLabelEl.textContent = formatDate(weatherData.dt, timezone);
  statusPillEl.textContent = toTitleCase(weather.main);
  conditionTextEl.textContent = toTitleCase(weather.description);
  currentTempEl.textContent = `${Math.round(main.temp)}°`;
  feelsLikeEl.textContent = `Cảm giác như ${Math.round(main.feels_like)}°`;
  humidityEl.textContent = `${main.humidity}%`;
  windEl.textContent = `${Math.round(wind.speed * 3.6)} km/h`;
  pressureEl.textContent = `${main.pressure} hPa`;
  visibilityEl.textContent = `${(weatherData.visibility / 1000).toFixed(1)} km`;
  sunriseEl.textContent = formatTime(weatherData.sys.sunrise, timezone);
  sunsetEl.textContent = formatTime(weatherData.sys.sunset, timezone);

  conditionIconEl.textContent = getWeatherIcon(weather.main, weather.description);
  heroPanel.className = `hero-panel ${skyTheme}`;

  const aqiInfo = getAqiLevel(aqi);
  aqiBadgeEl.textContent = aqi;
  aqiBadgeEl.style.background = `linear-gradient(135deg, ${aqiInfo.color}, rgba(255,255,255,0.2))`;
  aqiTextEl.textContent = aqiInfo.label;
}

function renderForecast(data) {
  const { forecastData } = data;
  const dailyMap = new Map();

  forecastData.list.forEach((item) => {
    const dateKey = new Date(item.dt * 1000).toISOString().slice(0, 10);
    if (!dailyMap.has(dateKey)) {
      dailyMap.set(dateKey, item);
    }
  });

  const days = Array.from(dailyMap.values()).slice(0, 5);
  forecastListEl.innerHTML = days
    .map((item) => {
      const weather = item.weather[0];
      const dayLabel = new Intl.DateTimeFormat("vi-VN", { weekday: "short" }).format(new Date(item.dt * 1000));
      const high = Math.round(item.main.temp_max);
      const low = Math.round(item.main.temp_min);
      const icon = getWeatherIcon(weather.main, weather.description);

      return `
        <div class="forecast-item">
          <div class="day">${dayLabel}</div>
          <div class="forecast-icon">${icon}</div>
          <div class="forecast-temp">${high}° / ${low}°</div>
          <div class="forecast-desc">${toTitleCase(weather.description)}</div>
        </div>
      `;
    })
    .join("");
}

async function loadWeather(city) {
  try {
    const data = await fetchWeather(city);
    renderCurrentWeather(data);
    renderForecast(data);
    cityInput.value = city;
  } catch (error) {
    alert(error.message);
  }
}

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const city = cityInput.value.trim();
  if (!city) {
    cityInput.focus();
    return;
  }
  loadWeather(city);
});

loadWeather(fallbackCity);
