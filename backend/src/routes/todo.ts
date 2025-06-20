import { Hono } from 'hono';
import { MemoryTodoService, type Todo } from '../services/todoService';

const todoService = new MemoryTodoService();

export const todoRouter = new Hono();

const newLine = (): void => {
    console.log();
}

function renderTodoItem(todo: Todo): string {
    return `
        <li class="flex items-center space-x-2 mb-2">
            <button
              hx-put="/api/todos/${todo.id}"
              hx-target="closest li"
              hx-swap="outerHTML"
              class="mr-2"
              aria-label="Toggle Complete"
            >
              ${todo.completed ? '✅' : '⬜️'}
            </button>

            <span ${todo.completed ? 'class="line-through text-gray-500"' : ''}>
              ${todo.content}
            </span>

            <button
              hx-delete="/api/todos/${todo.id}"
              hx-target="closest li"
              hx-swap="outerHTML"
              class="ml-auto text-red-500"
              aria-label="Delete"
            >
              ✖️
            </button>
        </li>
        `.trim();
}

// 複数 ToDo をまとめて <li> 群として返す関数
async function renderTodoList(): Promise<string> {
    const todos = await todoService.findAll();

    return todos.map(todo => renderTodoItem(todo)).join('\n');
}

// GET /api/todos: リスト全体を <li> 群で返す
todoRouter.get('/', async (c) => {
    console.log('Received GET /api/todos');
    const listHtml = await renderTodoList(); // "<li>...</li>..."
    // innerHTML で差し替えるので <li> 群だけ返せば良い
    return c.html(listHtml);
});

// POST /api/todos: 新規追加後、リスト全体を <li> 群で返す
todoRouter.post('/', async (c) => {
    console.log('Received POST /api/todos');
    const form = await c.req.parseBody();
    const content = (form.content as string) || '';
    if (content.trim()) {
        const created = await todoService.create(content.trim());
        console.log('Created ToDo:', created);
    }
    const listHtml = await renderTodoList();
    return c.html(listHtml);
});

// PUT /api/todos/:id: 完了トグル → 単一の <li> を返す
todoRouter.put('/:id', async (c) => {
    const idNum = Number(c.req.param('id'));
    console.log(`Received PUT /api/todos/${idNum}`);
    const updated = await todoService.toggleComplete(idNum);
    if (!updated) {
        return c.text('Not found', 404);
    }
    // 単一アイテムの HTML を返す: hx-target="closest li", hx-swap="outerHTML" に対応
    const itemHtml = renderTodoItem(updated);
    return c.html(itemHtml);
});

// DELETE /api/todos/:id: 削除 → 204 No Content
todoRouter.delete('/:id', async (c) => {
    const idNum = Number(c.req.param('id'));
    console.log(`Received DELETE /api/todos/${idNum}`);
    const success = await todoService.delete(idNum);
    if (!success) {
        return c.text('Not found', 404);
    }
    // HTMX は 204 を受け取ると要素を削除する挙動になる
    return c.text('', 200);
});
