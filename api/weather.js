import { crrDay } from "../lib/utils.js";
import { create, read } from "../middlewares/db.js";

// const key = process.env.weather;
const key = "f40ce506945a26d0791a6d98ae1e775b";

async function getWeather(position) {
    if (!position) return;
    const crrDate = crrDay();
    const weather = await read("weather");
    const { coords: { latitude, longitude }, timestamp } = position;
    /** 
     ** for the 1st time user
     */
    if (!weather) {
        const base = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${key}&units=metric`
        const response = await fetch(base)
        const result = await response.json();
        const info = { lastUpdate: crrDate }
        create("weather", { data: result, info: info })
        return result;
    }
    const { data, info: { lastUpdate } } = weather;
    /**
     ** (crrDate == lastUpdate) = is this a new day or not?
     */
    if (crrDate == lastUpdate) return data;
    const base = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${key}&units=metric`
    const response = await fetch(base)
    const result = await response.json();
    const info = { lastUpdate: crrDate }
    create("weather", { data: result, info: info })
    return result;
}

export { getWeather }

