function onClick(node, callback) {
    return node.addEventListener('click', callback);
}

function insertHTML(node, html, position) {
    return node.insertAdjacentHTML(position, html);
}

function onSubmit(node, callback) {
    node.addEventListener('submit', (e, id) => callback(e, id));
}

export { onClick, insertHTML, onSubmit };
