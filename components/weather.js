import { crrDate, crrTime } from '../lib/utils.js';

const weather_time = document.getElementById('weather_time');
const weather_date = document.getElementById('weather_date');

(async function initialWeather() {
    weather_time.innerText = crrTime();
    weather_date.innerText = crrDate();
})();
