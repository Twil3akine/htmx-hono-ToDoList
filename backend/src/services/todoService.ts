export interface Todo {
    id: number,
    content: string,
    completed: boolean,
};

export interface TodoService {
    findAll(): Promise<Todo[]>,
    create(content: string): Promise<Todo>,
    toggleComplete(id: number): Promise<Todo | null>,
    delete(id: number): Promise<boolean>,
};

export class MemoryTodoService implements TodoService {
    private todos: Todo[] = [];
    private nextId: number = 1;

    async findAll(): Promise<Todo[]> {
        return [...this.todos].sort((a, b) => a.id - b.id);
    }

    async create(content: string): Promise<Todo> {
        const todo: Todo = { id: this.nextId++, content, completed: false }
        this.todos.push(todo);

        return todo;
    }

    async toggleComplete(id: number): Promise<Todo | null> {
        const todo: Todo | undefined = this.todos.find(t => t.id === id);

        if (!todo) return null;
        todo.completed = !todo.completed;

        return todo;
    }

    async delete(id: number): Promise<boolean> {
        const idx = this.todos.findIndex(t => t.id === id);
        
        if (idx === -1) return false;
        this.todos.splice(idx, 1);

        return true;
    }
}