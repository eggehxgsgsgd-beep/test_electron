import { join } from 'node:path'
import { app, BrowserWindow, ipcMain, shell } from 'electron'
import { TodoStore } from './todoStore'
import type { CreateTodoInput, UpdateTodoInput } from '../shared/todo'

let mainWindow: BrowserWindow | null = null
let todoStore: TodoStore

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 960,
    height: 680,
    minWidth: 720,
    minHeight: 520,
    title: 'Electron Todo',
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function registerTodoHandlers(): void {
  ipcMain.handle('todos:list', () => todoStore.list())
  ipcMain.handle('todos:create', (_event, input: CreateTodoInput) => todoStore.create(input))
  ipcMain.handle('todos:update', (_event, input: UpdateTodoInput) => todoStore.update(input))
  ipcMain.handle('todos:delete', (_event, id: string) => todoStore.delete(id))
}

app.whenReady().then(() => {
  todoStore = new TodoStore(join(app.getPath('userData'), 'todos.json'))
  registerTodoHandlers()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
