/**
 * version: v1
 * storage: Local-storage
 * type: crud
 * encryption: true
 */

import { decrypt, encrypt } from "./crypto.js";

const salt = '626961287b607a6d6d287a6965';

function create(key, value) {
    console.log(value)
    const string = JSON.stringify(value);
    // const enHash = encrypt(salt)(string);

    // location.reload(); // Refresh the page
    // return localStorage.setItem(key, enHash);
    return localStorage.setItem(key, string);
}
function read(key) {
    let string, deHash;
    string = localStorage.getItem(key);
    // deHash = string ? decrypt(salt)(string) : null;
    // return JSON.parse(deHash);
    return JSON.parse(string);
}

export { create, read }




