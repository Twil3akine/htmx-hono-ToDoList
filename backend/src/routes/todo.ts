import { Hono } from 'hono';
import { MemoryTodoService } from '../services/todoService';
import { html } from 'hono/html';
import fs from 'fs/promises';
import path from 'path';

const todoService = new MemoryTodoService();

export const todoRouter = new Hono();

async function renderTodoList(): Promise<string> {
    const todos = await todoService.findAll();
    const templatePath = path.resolve(__dirname, "../templates/todoList.html");
    
    let tpl = await fs.readFile(templatePath, 'utf-8');

    const itemsHTML = todos.map(todo => {
        const checked = todo.completed ? 'checked' : '';
        
        return `
            <li class="flex items-center space-x-2 mb-2">
              <button
                hx-put="/api/todos/${todo.id}"
                hx-swap="outerHTML"
                hx-target="closest li"
                class="mr-2"
                aria-label="Toggle Complete"
                >
                    ${todo.completed ? '✅' : '⬜️'}
                </button>
                <span ${todo.completed ? 'class="line-through text-gray-500"' : ''}>${todo.content}</span>
                <button
                hx-delete="/api/todos/${todo.id}"
                hx-swap="outerHTML
                hx-target="closest li"
                class="ml-auto text-red-500"
                aria-label="Delete"
                >
                ✖️
                </button>
            </li>
        `
    }).join('\n');

    tpl = tpl.replace('{{ TODO_ITEMS }}', itemsHTML);

    return tpl;
}

todoRouter.get('/', async (c) => {
    const htmlFragment = await renderTodoList();

    return c.html(htmlFragment);
})

todoRouter.post('/', async (c) => {
    const form = await c.req.parseBody();
    const content = (form.content as string) || '';

    if (content.trim()) {
        await todoService.create(content.trim());
    }

    const htmlFragment = await renderTodoList();

    return c.html(htmlFragment);
})

todoRouter.put('/:id', async (c) => {
    const id = Number(c.req.param('id'));
    await todoService.toggleComplete(id);

    const htmlFragment = await renderTodoList();

    return c.html(htmlFragment);
})

todoRouter.delete('/:id', async (c) => {
    const id = Number(c.req.param('id'));
    await todoService.delete(id);

    const htmlFragment = await renderTodoList();

    return c.html(htmlFragment);
})