import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import type { CreateTodoInput, Todo, UpdateTodoInput } from '../shared/todo'

export class TodoStore {
  constructor(private readonly filePath: string) {}

  async list(): Promise<Todo[]> {
    return this.readTodos()
  }

  async create(input: CreateTodoInput): Promise<Todo[]> {
    const title = input.title.trim()

    if (!title) {
      return this.readTodos()
    }

    const todos = await this.readTodos()
    const nextTodos: Todo[] = [
      {
        id: crypto.randomUUID(),
        title,
        completed: false,
        createdAt: new Date().toISOString()
      },
      ...todos
    ]

    await this.writeTodos(nextTodos)
    return nextTodos
  }

  async update(input: UpdateTodoInput): Promise<Todo[]> {
    const todos = await this.readTodos()
    const nextTodos = todos.map((todo) => {
      if (todo.id !== input.id) {
        return todo
      }

      return {
        ...todo,
        title: input.title === undefined ? todo.title : input.title.trim(),
        completed: input.completed === undefined ? todo.completed : input.completed
      }
    })

    await this.writeTodos(nextTodos)
    return nextTodos
  }

  async delete(id: string): Promise<Todo[]> {
    const todos = await this.readTodos()
    const nextTodos = todos.filter((todo) => todo.id !== id)

    await this.writeTodos(nextTodos)
    return nextTodos
  }

  private async readTodos(): Promise<Todo[]> {
    try {
      const content = await readFile(this.filePath, 'utf-8')
      const parsed = JSON.parse(content)

      return Array.isArray(parsed) ? parsed : []
    } catch (error) {
      if (isNodeError(error) && error.code === 'ENOENT') {
        return []
      }

      throw error
    }
  }

  private async writeTodos(todos: Todo[]): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true })
    await writeFile(this.filePath, JSON.stringify(todos, null, 2), 'utf-8')
  }
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error
}
