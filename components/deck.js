import icons from "../lib/sm.js";
const deck = document.getElementById('deck');

(function main() {
    return deck.innerHTML = icons.map(icon =>
        `
        <div class="icon"><a target="_blank" href=${icon.url}>
        <img src=${icon.location} alt=${icon.name}>
        </a></div>
        `
    ).join('')
})();
