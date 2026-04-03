const axios = require('axios');

const getWeatherData = async (city) => {
  try {
    // 1. Geocoding (City Name -> Coordinates) using FREE Nominatim API
    const geoUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}&limit=1`;
    const geoRes = await axios.get(geoUrl, { headers: { 'User-Agent': 'SkyStay-App' } });
    
    if (!geoRes.data || geoRes.data.length === 0) throw new Error('City not found');
    
    const { lat, lon } = geoRes.data[0];

    // 2. Weather Data using FREE Open-Meteo API (No Key Required)
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=relativehumidity_2m,windspeed_10m`;
    const weatherRes = await axios.get(weatherUrl);
    
    const current = weatherRes.data.current_weather;
    
    // Map Open-Meteo codes to human readable conditions
    const conditionMap = {
      0: 'Clear sky',
      1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
      45: 'Fog', 48: 'Depositing rime fog',
      51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle',
      61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
      71: 'Slight snow', 73: 'Moderate snow', 75: 'Heavy snow',
      80: 'Slight rain showers', 81: 'Moderate rain showers', 82: 'Violent rain showers',
      95: 'Thunderstorm', 96: 'Thunderstorm with slight hail', 99: 'Thunderstorm with heavy hail'
    };

    // Map to icon codes (roughly)
    const iconMap = {
      0: '01d', 1: '02d', 2: '03d', 3: '04d',
      45: '50d', 48: '50d',
      51: '09d', 53: '09d', 55: '09d',
      61: '10d', 63: '10d', 65: '10d',
      80: '09d', 81: '09d', 82: '09d',
      95: '11d'
    };

    return {
      temp: Math.round(current.temperature),
      condition: conditionMap[current.weathercode] || 'Cloudy',
      icon: iconMap[current.weathercode] || '03d',
      humidity: weatherRes.data.hourly.relativehumidity_2m[0], // approximate current
      windSpeed: Math.round(current.windspeed)
    };
  } catch (error) {
    console.error('Weather API error:', error.message);
    // Ultimate fallback for any city if APIs are down
    return {
      temp: 26,
      condition: 'Clear Sky',
      icon: '01d',
      humidity: 50,
      windSpeed: 10
    };
  }
};

module.exports = { getWeatherData };
