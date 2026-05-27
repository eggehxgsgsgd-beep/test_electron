import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { app, BrowserWindow, Menu, Notification, Tray, dialog, ipcMain, nativeImage, shell } from 'electron'
import { TodoStore } from './todoStore'
import type {
  CreateFocusSessionInput,
  CreateInsightInput,
  CreateTaskInput,
  InFlightFocus,
  NotifyInput,
  TrayStateInput,
  UpdateInsightInput,
  UpdateSettingsInput,
  UpdateTaskInput
} from '../shared/todo'

let mainWindow: BrowserWindow | null = null
let todoStore: TodoStore
let tray: Tray | null = null
let quitting = false
let trayState: TrayStateInput = { running: false }

const appIconPath = join(__dirname, '../../build/icon.ico')

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 960,
    height: 680,
    minWidth: 860,
    minHeight: 580,
    title: 'FocusDo',
    icon: appIconPath,
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

  mainWindow.on('close', (event) => {
    if (quitting) return
    event.preventDefault()
    mainWindow?.hide()
  })

  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  }

  mainWindow.webContents.on('console-message', (_event, level, message) => {
    console.log(`[renderer:${level}] ${message}`)
  })

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    console.error(`Renderer failed to load ${validatedURL}: ${errorCode} ${errorDescription}`)
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

function registerFocusDoHandlers(): void {
  ipcMain.handle('focusdo:load', () => todoStore.load())
  ipcMain.handle('focusdo:task:create', (_event, input: CreateTaskInput) =>
    todoStore.createTask(input)
  )
  ipcMain.handle('focusdo:task:update', (_event, input: UpdateTaskInput) =>
    todoStore.updateTask(input)
  )
  ipcMain.handle('focusdo:task:delete', (_event, id: string) => todoStore.deleteTask(id))
  ipcMain.handle('focusdo:task:increment-pomodoro', (_event, id: string) =>
    todoStore.incrementPomodoroCount(id)
  )
  ipcMain.handle('focusdo:insight:create', (_event, input: CreateInsightInput) =>
    todoStore.createInsight(input)
  )
  ipcMain.handle('focusdo:insight:update', (_event, input: UpdateInsightInput) =>
    todoStore.updateInsight(input)
  )
  ipcMain.handle('focusdo:insight:delete', (_event, id: string) => todoStore.deleteInsight(id))
  ipcMain.handle('focusdo:settings:update', (_event, input: UpdateSettingsInput) =>
    todoStore.updateSettings(input)
  )
  ipcMain.handle('focusdo:focus-session:create', (_event, input: CreateFocusSessionInput) =>
    todoStore.recordFocusSession(input)
  )
  ipcMain.handle('focusdo:tray:update', (_event, input: TrayStateInput) => {
    trayState = input
    updateTrayMenu()
  })
  ipcMain.handle('focusdo:notify', (_event, input: NotifyInput) => {
    if (!Notification.isSupported()) return
    try {
      new Notification({
        title: input.title,
        body: input.body ?? '',
        icon: appIconPath,
        silent: false
      }).show()
    } catch (error) {
      console.error('[FocusDo] notify failed:', error)
    }
  })
  ipcMain.handle('focusdo:in-flight:set', (_event, snapshot: InFlightFocus | null) =>
    todoStore.setInFlightFocus(snapshot)
  )
  ipcMain.handle('focusdo:data:export', async (event) => {
    const parent = BrowserWindow.fromWebContents(event.sender)
    const defaultName = `focusdo-export-${new Date().toISOString().slice(0, 10)}.json`
    const opts = {
      title: '导出 FocusDo 数据',
      defaultPath: defaultName,
      filters: [{ name: 'JSON', extensions: ['json'] }]
    }
    const picked = parent
      ? await dialog.showSaveDialog(parent, opts)
      : await dialog.showSaveDialog(opts)
    if (picked.canceled || !picked.filePath) return { ok: false, cancelled: true }
    try {
      const snapshot = await todoStore.exportSnapshot()
      const payload = {
        meta: {
          exportedAt: new Date().toISOString(),
          version: app.getVersion(),
          appName: 'FocusDo'
        },
        tasks: snapshot.tasks,
        insights: snapshot.insights,
        focusSessions: snapshot.focusSessions,
        settings: snapshot.settings
      }
      await writeFile(picked.filePath, JSON.stringify(payload, null, 2), 'utf8')
      return { ok: true, path: picked.filePath }
    } catch (error) {
      console.error('[FocusDo] export failed:', error)
      return {
        ok: false,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  })
}

// Single-instance lock: sql.js has no on-disk concurrency control, so two
// FocusDo processes opening the same sqlite would race on writeFile.  If
// another instance is already running, focus its window instead of starting
// a new one.
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    showMainWindow()
  })
}

app.whenReady().then(() => {
  todoStore = new TodoStore(join(app.getPath('userData'), 'focusdo.sqlite'))
  registerFocusDoHandlers()
  createTray()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (quitting && process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  quitting = true
})

function createTray(): void {
  const icon = nativeImage.createFromPath(appIconPath)
  tray = new Tray(icon)
  tray.setToolTip('FocusDo')
  tray.on('click', () => showMainWindow())
  updateTrayMenu()
}

function updateTrayMenu(): void {
  if (!tray) return

  const status = trayState.running
    ? `${trayState.phase === 'focus' ? '专注中' : '休息中'} ${trayState.label ?? ''}`.trim()
    : '未运行'

  tray.setToolTip(`FocusDo - ${status}`)
  if (process.platform === 'darwin') {
    tray.setTitle(trayState.running ? trayState.label ?? '' : '')
  }
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: `FocusDo · ${status}`, enabled: false },
      { type: 'separator' },
      { label: '显示主窗口', click: () => showMainWindow() },
      {
        label: '退出 FocusDo',
        click: () => {
          quitting = true
          app.quit()
        }
      }
    ])
  )
}

function showMainWindow(): void {
  if (!mainWindow) {
    createWindow()
    return
  }
  mainWindow.show()
  mainWindow.focus()
}
