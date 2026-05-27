export type TagName = '工作' | '开发' | '设计' | '个人'

export type Priority = 'normal' | 'important'

export type Task = {
  id: string
  title: string
  notes: string
  tag: TagName | null
  priority: Priority
  planDate: string | null
  completed: boolean
  completedAt: string | null
  createdAt: string
  pomodoroCount: number
  archived: boolean
  sortOrder: number
}

export type Insight = {
  id: string
  title: string | null
  content: string
  tag: TagName | null
  linkedTaskId: string | null
  createdAt: string
  updatedAt: string
}

export type TagOption = {
  name: TagName
  color: string
}

export type FocusScene = 'forest' | 'sea' | 'mountain'

export type FocusSettings = {
  theme: 'clear' | 'dusk' | 'moss'
  focusMinutes: number
  shortBreakMinutes: number
  longBreakMinutes: number
  focusScene: FocusScene
  tags: TagOption[]
}

export type FocusSession = {
  id: string
  taskId: string | null
  startedAt: string
  endedAt: string
  plannedDuration: number
  actualDuration: number
  status: 'completed' | 'abandoned'
  type: 'focus' | 'shortBreak' | 'longBreak'
}

export type FocusDoState = {
  tasks: Task[]
  insights: Insight[]
  settings: FocusSettings
  focusSessions: FocusSession[]
}

export type CreateTaskInput = {
  title: string
  planDate?: string | null
}

export type UpdateTaskInput = {
  id: string
  title?: string
  notes?: string
  tag?: TagName | null
  priority?: Priority
  planDate?: string | null
  completed?: boolean
  archived?: boolean
  pomodoroCount?: number
}

export type CreateInsightInput = {
  title?: string | null
  content?: string
  tag?: TagName | null
  linkedTaskId?: string | null
}

export type UpdateInsightInput = {
  id: string
  title?: string | null
  content?: string
  tag?: TagName | null
  linkedTaskId?: string | null
}

export type UpdateSettingsInput = Partial<FocusSettings>

export type CreateFocusSessionInput = {
  taskId?: string | null
  startedAt: string
  endedAt: string
  plannedDuration: number
  actualDuration: number
  status?: FocusSession['status']
  type?: FocusSession['type']
}

export type TrayStateInput = {
  running: boolean
  label?: string
  phase?: string
}

export type NotifyInput = {
  title: string
  body?: string
}

// Snapshot of the focus phase currently running on the renderer side, persisted
// to disk so a crash / force-quit during a pomodoro can be recovered as an
// abandoned session on next launch instead of silently lost.
export type InFlightFocus = {
  taskId: string | null
  startedAt: string
  startedAtMs: number
  plannedDuration: number
}

export type ExportResult =
  | { ok: true; path: string }
  | { ok: false; cancelled: true }
  | { ok: false; error: string }

export type FocusDoApi = {
  load: () => Promise<FocusDoState>
  createTask: (input: CreateTaskInput) => Promise<FocusDoState>
  updateTask: (input: UpdateTaskInput) => Promise<FocusDoState>
  deleteTask: (id: string) => Promise<FocusDoState>
  incrementPomodoroCount: (id: string) => Promise<FocusDoState>
  createInsight: (input: CreateInsightInput) => Promise<FocusDoState>
  updateInsight: (input: UpdateInsightInput) => Promise<FocusDoState>
  deleteInsight: (id: string) => Promise<FocusDoState>
  updateSettings: (input: UpdateSettingsInput) => Promise<FocusDoState>
  recordFocusSession: (input: CreateFocusSessionInput) => Promise<FocusDoState>
  updateTray: (input: TrayStateInput) => Promise<void>
  notify: (input: NotifyInput) => Promise<void>
  setInFlightFocus: (snapshot: InFlightFocus | null) => Promise<void>
  exportData: () => Promise<ExportResult>
}
