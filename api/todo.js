import { crrDay } from '../lib/utils.js';
import { read, create } from '../middlewares/db.js';

const TodoistApi = window.todo;
const apiForTodo = new TodoistApi('2d3080632e86c72a9f1033911e5ea5fd0adb11c9');

async function getTask() {
    const crrDate = crrDay();
    const todoist = await read("todo");
    /** 
     ** for the 1st time user
     */
    if (!todoist) {
        const result = await apiForTodo.getTasks();
        const info = { lastUpdate: crrDate, alredyFetched: true }
        create("todo", { todo: result, info: info })
        return result;
    }
    const { todo, info: { lastUpdate, alredyFetched } } = todoist;
    /**
     ** (crrDate == lastUpdate) = is this a new day or not?
     ** alredyFetched = is this a first time in a day or not?
     */
    if ((crrDate == lastUpdate) && alredyFetched) return todo;
    const result = await apiForTodo.getTasks();
    const info = { lastUpdate: crrDate, alredyFetched: true }
    create("todo", { todo: result, info: info });
    return result;
}

function closeTask(id) { return apiForTodo.closeTask(id) };

export { getTask, closeTask };

