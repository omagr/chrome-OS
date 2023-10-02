import { read } from "../middlewares/db.js";
import { insertHTML } from "../middlewares/event.js";

const parent = document.querySelector('.container');
const holder = document.querySelector('#nameForWHoleBookmark');

export default async function uiExpandedFolders(id) {
    const prevData = await read('Folders') ?? null;
    const { Bookmarks, Name } = prevData.find(item => item.Id == id);
    parent.innerHTML = '';
    holder.innerHTML = Name;
    return Bookmarks.map(bookmark => {
        var html;
        var { Link, Name } = bookmark;
        html = `
        <a href=${Link} >
        <div class="folder">
        <p>${Name}</p>
        <img src="./assets/folder.svg" alt="">
        </div>
        </a>
        `;
        return insertHTML(parent, html, 'beforeend');
    })
}


