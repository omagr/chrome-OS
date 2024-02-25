import { create, read } from '../middlewares/db.js';

const textarea = document.getElementById('textarea');

(function initialTextarea() {
    textarea.addEventListener('focusin', () => {
        textarea.addEventListener('focusout', () => {
            const newValue = textarea.value;
            console.log(newValue);
            create('notes', newValue);
        });
    });
    const value = read('notes');
    if (!value) return;
    textarea.value = value;
})();
