import icons from "../lib/sm.js";
import { crrDate } from "../lib/utils.js";

const deck = document.getElementById('deck');
const date = document.getElementById('todist_date');

export default function initialDeck() {
    date.innerText = crrDate() + ', @todoist'
    return deck.innerHTML = icons.map(icon =>
        `
        <div class="icon"><a href=${icon.url}>
        <img src=${icon.location} alt=${icon.name}>
        </a></div>
        `
    ).join('')
}