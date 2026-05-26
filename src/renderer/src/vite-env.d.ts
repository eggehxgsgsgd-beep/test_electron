/// <reference types="vite/client" />

import type { CreateTodoInput, Todo, UpdateTodoInput } from '../../shared/todo'

declare global {
  interface Window {
    todos: {
      list: () => Promise<Todo[]>
      create: (input: CreateTodoInput) => Promise<Todo[]>
      update: (input: UpdateTodoInput) => Promise<Todo[]>
      delete: (id: string) => Promise<Todo[]>
    }
  }
}
