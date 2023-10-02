import { onClick, onSubmit } from '../middlewares/event.js';
import { createBookmark, createGroup } from './bookmark.js';
import uiExpandedFolders from './fullBookmarks.js';

var id_for_bookmark;

var createbookmk = document.querySelector('#BtnCreateBookmark');
var createAGroup = document.querySelector('#BtnCreateFolder');

var show_Group = document.querySelector('.pop');
var open_show_Group = document.querySelectorAll('.popup');
var closed_show_Group = document.querySelector('.cross');

var create_Group = document.querySelector('.createfolderpopup');
var open_create_Group = document.querySelector('.createFolderBtn');
var closed_create_Group = document.querySelector('.crosscreatefolderkpopup');

var create_Bookmark = document.querySelector('.createbookmarkpopup');
var open_create_Bookmark = document.querySelectorAll('.createBookmarkBtn');
var closed_create_Bookmark = document.querySelector('.crosscreatebookmarkpopup');

[...open_show_Group].forEach((item) => {
    item.addEventListener('click', () => {
        if (show_Group.classList.value.includes('show')) return;
        uiExpandedFolders(item.id);
        show_Group.classList.add('show');
    });
});

[...open_create_Bookmark].forEach((item) => {
    item.addEventListener('click', () => {
        if (create_Bookmark.classList.value.includes('show')) return;
        id_for_bookmark = item.id;
        create_Bookmark.classList.add('show');
    });
});

onClick(closed_create_Bookmark, () => {
    if (!create_Bookmark.classList.value.includes('show')) return;
    create_Bookmark.classList.remove('show');
});

onClick(closed_show_Group, () => {
    if (!show_Group.classList.value.includes('show')) return;
    show_Group.classList.remove('show');
});

onClick(open_create_Group, () => {
    if (create_Group.classList.value.includes('show')) return;
    create_Group.classList.add('show');
});

onClick(closed_create_Group, () => {
    if (!create_Group.classList.value.includes('show')) return;
    create_Group.classList.remove('show');
});

onSubmit(createAGroup, (e) => {
    e.preventDefault();
    let name = document.getElementById('Group_Name');
    createGroup(name.value);
    create_Group.classList.remove('show');
    name.value = '';
});

onSubmit(createbookmk, (e) => {
    e.preventDefault();
    let name = document.getElementById('Bookmark_Name');
    let link = document.getElementById('Bookmark_url');
    createBookmark(id_for_bookmark, name.value, link.value);
    create_Bookmark.classList.remove('show');
    name.value = '';
    link.value = '';
});
