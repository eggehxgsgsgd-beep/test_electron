export type Todo = {
  id: string
  title: string
  completed: boolean
  createdAt: string
}

export type CreateTodoInput = {
  title: string
}

export type UpdateTodoInput = {
  id: string
  title?: string
  completed?: boolean
}
