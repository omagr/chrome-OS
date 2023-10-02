import { getWeather } from "../api/weather.js";
import { crrDate, crrTime } from "../lib/utils.js";

const weather_time = document.getElementById('weather_time');
const weather_date = document.getElementById('weather_date');
const weather_locn = document.getElementById('weather_locn');
const weather_temp = document.getElementById('weather_temp');

export default async function initialWeather(pos) {
    const data = await getWeather(pos);
    if (!data) return;
    const { main: { temp }, name, sys: { country }, weather } = data
    console.log(temp, name, country, weather);
    weather_time.innerText = crrTime();
    weather_date.innerText = crrDate()
    weather_locn.innerText = `${name}, ${country}`;
    weather_temp.innerText = `${weather[0].main}, ${temp}°C`;
}