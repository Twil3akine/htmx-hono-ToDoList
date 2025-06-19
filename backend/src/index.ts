import { Hono } from "hono";
import { serveStatic } from 'hono/bun';
import { todoRouter } from "./routes/todo";
import path from "path";
import { readFile } from "fs/promises";

const app = new Hono();

app.get('/', async (c) => {
    const filePath = path.resolve(__dirname, '../../frontend/public/index.html');
    try {
        const html = await readFile(filePath, 'utf-8');
        return c.html(html);
    } catch (e) {
        return c.text('index.html not found', 404);
    }
});

app.use('/', serveStatic({ root: path.resolve(__dirname, '../../frontend/public') }));

app.route('/api/todos', todoRouter);

app.all('*', (c) => c.text('Not Found', 404));

export default {
    port: 3000,
    fetch: app.fetch,
};