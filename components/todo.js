import { closeTask, getTask } from "../api/todo.js"
import { create, read } from "../middlewares/db.js";

var list;
export default async function initiateList() {
    list = await getTask();
    list.forEach(item => {
        const { content, isCompleted, id, priority } = item;
        addItem(content, isCompleted, id);
    })
}

function addItem(todo, isCompleted, id) {
    const list = document.getElementById('todolist')
    if (!list) return;

    const listItemText = document.createElement('span');
    listItemText.textContent = todo;
    listItemText.classList.add('todo-list__item__text');

    const listItemCheckbox = document.createElement('span');
    listItemCheckbox.classList.add('todo-list__item__check');

    const listItem = document.createElement('li');
    listItem.appendChild(listItemCheckbox);
    listItem.appendChild(listItemText);

    listItem.classList.add('todo-list__item');
    listItem.classList.add(isCompleted);
    listItem.classList.add(id);
    if (isCompleted) listItem.classList.add('done');

    listItem.addEventListener('click', toggleListItem);
    list.appendChild(listItem);
}

function toggleListItem(event) {
    const isCompleted = event.target.classList[1]
    if (isCompleted === 'false') {
        console.log('toggleListItem')
        const id = event.target.classList[2]
        closeTask(id).then(res => {
            if (!res) return;
            event.target.classList.replace('false', 'true')
            const updatedList = list.map(item => {
                if (item.id == id) {
                    return { ...item, isCompleted: true }
                }
                return item;
            })
            const prev = read('todo');
            event.target.classList.add('done')
            return create("todo", { todo: updatedList, info: prev.info })
        });
    }
}

