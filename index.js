import initiateFolders from './components/bookmark.js';
import initialDeck from './components/deck.js';
import rangeSlider from './components/media.js';
import initiateList from './components/todo.js';
import initialWeather from './components/weather.js';

(function main() {
    rangeSlider();
    initiateList()
    initiateFolders();
    initialDeck();
    initialWeather()
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(initialWeather);
    } else console.log('navigator geolocation is not supported!')
})();
