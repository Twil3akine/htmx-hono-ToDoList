import { Hono } from 'hono';
import { MemoryTodoService } from '../services/todoService';
import { html } from 'hono/html';
import fs from 'fs/promises';
import path from 'path';

const todoService = new MemoryTodoService();

export const todoRouter = new Hono();

const newLine = (): void => {
    console.log();
}

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
                hx-swap="outerHTML"
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

// GET /api/todos
todoRouter.get('/', async (c) => {
    // 1) リクエスト情報をログ出力
    console.log('Received GET /api/todos');
    console.log('  Method:', c.req.method);
    console.log('  URL:', c.req.url);
    // クエリがあれば
    const allQueries = c.req.query();
    console.log('  Query params:', allQueries);

    // 2) ToDo一覧を取得して返却
    const htmlFragment = await renderTodoList();
    // ログ: 返却内容の一部を確認（長い場合は要注意）
    console.log('  Returning HTML fragment length:', htmlFragment.length);

    newLine();

    return c.html(htmlFragment);
});

// POST /api/todos
todoRouter.post('/', async (c) => {
    console.log('Received POST /api/todos');
    console.log('  Method:', c.req.method);
    console.log('  URL:', c.req.url);

    // FormデータやURLエンコードされたボディをパース
    const form = await c.req.parseBody();
    console.log('  Parsed body (parseBody):', form);

    // もし JSON 送信を想定するなら:
    // try {
    //   const jsonBody = await c.req.json();
    //   console.log('  Parsed JSON body:', jsonBody);
    // } catch (e) {
    //   console.log('  No valid JSON body:', e);
    // }

    const content = (form.content as string) || '';
    console.log('  ToDo content:', content);

    if (content.trim()) {
        const created = await todoService.create(content.trim());
        console.log('  Created ToDo:', created);
    } else {
        console.log('  Empty content, not creating.');
    }

    const htmlFragment = await renderTodoList();
    console.log('  Returning HTML fragment length:', htmlFragment.length);
    
    newLine();

    return c.html(htmlFragment);
});

// PUT /api/todos/:id
todoRouter.put('/:id', async (c) => {
    const idParam = c.req.param('id');
    console.log(`Received PUT /api/todos/${idParam}`);
    console.log('  Method:', c.req.method);
    console.log('  URL:', c.req.url);

    // Bodyをパースする場合（例えば JSON ボディで何か追加情報を受け取りたいとき）
    // const body = await c.req.json();
    // console.log('  Parsed JSON body:', body);

    const idNum = Number(idParam);
    console.log('  Parsed ID number:', idNum);
    const toggled = await todoService.toggleComplete(idNum);
    console.log('  Toggle result:', toggled);

    const htmlFragment = await renderTodoList();
    console.log('  Returning HTML fragment length:', htmlFragment.length);

    newLine();

    return c.html(htmlFragment);
});

// DELETE /api/todos/:id
todoRouter.delete('/:id', async (c) => {
    const idParam = c.req.param('id');
    console.log(`Received DELETE /api/todos/${idParam}`);
    console.log('  Method:', c.req.method);
    console.log('  URL:', c.req.url);

    const idNum = Number(idParam);
    console.log('  Parsed ID number:', idNum);
    const deleted = await todoService.delete(idNum);
    console.log('  Delete result:', deleted);

    const htmlFragment = await renderTodoList();
    console.log('  Returning HTML fragment length:', htmlFragment.length);
    
    newLine();

    return c.html(htmlFragment);
});

todoRouter.post('/', async (c) => {
    console.log('✅ POSTリクエスト受信');

    const form = await c.req.parseBody();
    console.log('📦 受信フォームデータ:', form);

    const content = (form.content as string) || '';
    if (content.trim()) {
        const created = await todoService.create(content.trim());
        console.log('🆕 ToDo作成:', created);
    } else {
        console.log('⚠️ 空のToDo、スキップ');
    }

    const htmlFragment = await renderTodoList();

    newLine();

    return c.html(htmlFragment);
});
