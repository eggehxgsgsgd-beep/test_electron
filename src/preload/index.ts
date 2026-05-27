import { contextBridge, ipcRenderer } from 'electron'
import type {
  CreateInsightInput,
  CreateFocusSessionInput,
  CreateTaskInput,
  ExportResult,
  FocusDoApi,
  FocusDoState,
  InFlightFocus,
  NotifyInput,
  TrayStateInput,
  UpdateInsightInput,
  UpdateSettingsInput,
  UpdateTaskInput
} from '../shared/todo'

const focusDoApi: FocusDoApi = {
  load: (): Promise<FocusDoState> => ipcRenderer.invoke('focusdo:load'),
  createTask: (input: CreateTaskInput): Promise<FocusDoState> =>
    ipcRenderer.invoke('focusdo:task:create', input),
  updateTask: (input: UpdateTaskInput): Promise<FocusDoState> =>
    ipcRenderer.invoke('focusdo:task:update', input),
  deleteTask: (id: string): Promise<FocusDoState> =>
    ipcRenderer.invoke('focusdo:task:delete', id),
  incrementPomodoroCount: (id: string): Promise<FocusDoState> =>
    ipcRenderer.invoke('focusdo:task:increment-pomodoro', id),
  createInsight: (input: CreateInsightInput): Promise<FocusDoState> =>
    ipcRenderer.invoke('focusdo:insight:create', input),
  updateInsight: (input: UpdateInsightInput): Promise<FocusDoState> =>
    ipcRenderer.invoke('focusdo:insight:update', input),
  deleteInsight: (id: string): Promise<FocusDoState> =>
    ipcRenderer.invoke('focusdo:insight:delete', id),
  updateSettings: (input: UpdateSettingsInput): Promise<FocusDoState> =>
    ipcRenderer.invoke('focusdo:settings:update', input),
  recordFocusSession: (input: CreateFocusSessionInput): Promise<FocusDoState> =>
    ipcRenderer.invoke('focusdo:focus-session:create', input),
  updateTray: (input: TrayStateInput): Promise<void> =>
    ipcRenderer.invoke('focusdo:tray:update', input),
  notify: (input: NotifyInput): Promise<void> => ipcRenderer.invoke('focusdo:notify', input),
  setInFlightFocus: (snapshot: InFlightFocus | null): Promise<void> =>
    ipcRenderer.invoke('focusdo:in-flight:set', snapshot),
  exportData: (): Promise<ExportResult> => ipcRenderer.invoke('focusdo:data:export')
}

contextBridge.exposeInMainWorld('focusDo', focusDoApi)
