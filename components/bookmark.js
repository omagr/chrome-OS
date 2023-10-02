import { Bookmark, Group } from "../api/bookmark.js";
import { create, read } from "../middlewares/db.js";
import { insertHTML } from "../middlewares/event.js";

const folders = document.querySelector('.folders');

export default async function loadFolders() {
    var Groups = await read('Folders') ?? [];
    return Groups.map(Group => {
        var html;
        var bookmarks_html = [];
        const { Name, Id, Bookmarks } = Group;
        Bookmarks.map(Bookmark => {
            const ele = `
        <a href=${Bookmark.Link} >
            <div class="folder">
                <p>${Bookmark.Name}</p>
                <img src="./assets/folder.svg" alt="">
            </div>
        </a>`
            bookmarks_html.push(ele);
        })
        html = `
    <fieldset id=${`fieldset_` + Id}> 
        <legend>
            <i>&#10140;</i>
            <p id=${Id} class="popup">${Name}</p>
            <svg id=${Id} class="createBookmarkBtn" xmlns="http://www.w3.org/2000/svg" width="32" height="32"
                viewBox="0 0 24 24">
                <path fill="#fff" d="M13 7h-2v4H7v2h4v4h2v-4h4v-2h-4V7zm-1-5C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8s8 3.59 8 8s-3.59 8-8 8z" />
            </svg>
        </legend>
        ${bookmarks_html.join('')}
    </fieldset>
    `;
        return insertHTML(folders, html, 'beforeend');
    })
}

async function createBookmark(id, name, link) {
    const prevData = await read('Folders') ?? null;
    if (!prevData) return;
    const grandParent = document.getElementById(id).parentNode.parentNode;
    const html = `
        <a href=${link} >
            <div class="folder">
                <p>${name}</p>
                <img src="./assets/folder.svg" alt="bookmark">
            </div>
        </a>
    `
    insertHTML(grandParent, html, 'beforeend');
    const bookmark = new Bookmark(name, link, id)
    prevData.filter(item => { if (item.Id == id) item.Bookmarks.push(bookmark) });
    return create('Folders', prevData)
}


async function createGroup(Name) {
    const Id = Date.now();
    let element = document.createElement('fieldset')
    const html = `
        <legend>
            <i>&#10140;</i>
            <p onclick='onclick' id=${Id} class="popup">${Name}</p>
            <svg id=${Id} class="createBookmarkBtn" xmlns="http://www.w3.org/2000/svg" width="32" height="32"
                viewBox="0 0 24 24">
                <path fill="#fff" d="M13 7h-2v4H7v2h4v4h2v-4h4v-2h-4V7zm-1-5C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8s8 3.59 8 8s-3.59 8-8 8z" />
            </svg>
        </legend>
    `;
    element.innerHTML = html
    folders.appendChild(element);
    const newGroup = new Group(Name, Id);
    const prevData = await read('Folders') ?? [];
    return create('Folders', [...prevData, newGroup])
}

export { createBookmark, createGroup }
