import { contextBridge, ipcRenderer } from 'electron'
import type { CreateTodoInput, Todo, UpdateTodoInput } from '../shared/todo'

const todoApi = {
  list: (): Promise<Todo[]> => ipcRenderer.invoke('todos:list'),
  create: (input: CreateTodoInput): Promise<Todo[]> => ipcRenderer.invoke('todos:create', input),
  update: (input: UpdateTodoInput): Promise<Todo[]> => ipcRenderer.invoke('todos:update', input),
  delete: (id: string): Promise<Todo[]> => ipcRenderer.invoke('todos:delete', id)
}

contextBridge.exposeInMainWorld('todos', todoApi)
