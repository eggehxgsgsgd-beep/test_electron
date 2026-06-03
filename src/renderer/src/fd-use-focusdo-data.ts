// fd-use-focusdo-data.ts — FocusDo 数据层 hook + UI↔后端映射
// 收口 App 的全部数据态(tasks/insights/focusSessions/settings)与对应的
// window.focusDo 增删改。沿用项目"每个写操作返回完整 FocusDoState、整体替换"
// 的约定:每个 mutation 内部都用 applyState 覆盖,并把后端原始 state 返回给
// 需要做后续判断的调用方(如新建 insight 后定位刚建的那条)。App 因此不再
// 直接喊数据 IPC。
//
// 边界说明:番茄钟引擎(fd-use-pomodoro)保留自己的引擎级 IPC(会话落库、托盘、
// 通知、in-flight 快照),它通过本 hook 提供的 applyState 回写状态;设置弹窗里
// 自包含的"导出 JSON"仍走其本地 window.focusDo.exportData。
import React from 'react'
import { DEFAULT_TAGS } from './fd-ui.jsx'
import type {
  FocusDoState,
  FocusSettings,
  TagOption,
  CreateTaskInput,
  UpdateTaskInput,
  CreateInsightInput,
  UpdateInsightInput,
} from '../../shared/todo'
import type { UiSettings, UiState, UiTask } from './fd-types'

const DEFAULT_SETTINGS: UiSettings = {
  themeKey: 'clarity',
  focusMin: 25,
  shortBreakMin: 5,
  longBreakMin: 15,
  autoStart: false,
  sound: true,
  pomodoroNotify: true,
  breakNotify: true,
  dnd: false,
  followSystem: false,
  focusScene: 'forest',
  // DEFAULT_TAGS 来自尚未 TS 化的 fd-ui.jsx,类型断言到 TagOption[](C4 转换后可去掉)
  tags: DEFAULT_TAGS as TagOption[],
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

function normalizePlanDate(planDate: string | null): string | null {
  if (planDate === todayKey()) return 'today'
  return planDate
}

function toUiTask(task: FocusDoState['tasks'][number]): UiTask {
  // Backend Task has `completed`; UI components use `done`. Map directly — no
  // `?? false` because the type guarantees boolean.
  return {
    ...task,
    done: task.completed,
    planDate: normalizePlanDate(task.planDate),
  }
}

// theme 可能是后端值('clear'|'dusk'|'moss')也可能是历史遗留串,故按 string 收。
function themeToThemeKey(theme: string): UiSettings['themeKey'] {
  if (theme === 'dusk') return 'dusk'
  if (theme === 'moss' || theme === 'sage') return 'sage'
  return 'clarity'
}

function toUiState(state: FocusDoState): UiState {
  // `state` 来自类型化的 IPC 契约(FocusDoState)。settings 块保留旧键回退
  // (focusMinutes vs focusMin、theme vs themeKey),因为磁盘上的 settings JSON
  // 可能携带旧版键——故把 s 视为"后端字段 + 可能并存的 UI 字段"。
  const s = state.settings as FocusSettings & Partial<UiSettings>
  return {
    tasks: state.tasks.map(toUiTask),
    insights: state.insights,
    focusSessions: state.focusSessions,
    settings: {
      ...DEFAULT_SETTINGS,
      ...s, // 展开不触发多余属性检查:带过持久化的 UI 字段;后端专属键无害
      themeKey: s.themeKey || themeToThemeKey(s.theme),
      focusMin: s.focusMin || s.focusMinutes || 25,
      shortBreakMin: s.shortBreakMin || s.shortBreakMinutes || 5,
      longBreakMin: s.longBreakMin || s.longBreakMinutes || 15,
      tags: s.tags || (DEFAULT_TAGS as TagOption[]),
    },
  }
}

function settingsForBackend(settings: UiSettings) {
  return {
    ...settings,
    // 历史遗留:UI 'clarity' 会被原样发成后端 theme 'clarity'(而非官方的 'clear'),
    // 靠 toUiState 的 else 兜底回 'clarity' 才得以来回对齐。此处保持现状,不改行为。
    theme: (settings.themeKey === 'sage' ? 'moss' : settings.themeKey) as FocusSettings['theme'],
    focusMinutes: settings.focusMin,
    shortBreakMinutes: settings.shortBreakMin,
    longBreakMinutes: settings.longBreakMin,
  }
}

// updateTask 接受 UI 的 done(= completed 镜像);其余沿用后端 UpdateTaskInput。
type TaskUpdate = Partial<Omit<UpdateTaskInput, 'id'>> & { done?: boolean }

export function useFocusDoData() {
  const [tasks, setTasks] = React.useState<UiTask[]>([])
  const [insights, setInsights] = React.useState<UiState['insights']>([])
  const [focusSessions, setFocusSessions] = React.useState<UiState['focusSessions']>([])
  const [settings, setSettings] = React.useState<UiSettings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = React.useState(true)

  const applyState = React.useCallback((state: FocusDoState) => {
    const ui = toUiState(state)
    setTasks(ui.tasks)
    setInsights(ui.insights)
    setFocusSessions(ui.focusSessions)
    setSettings(ui.settings)
  }, [])

  React.useEffect(() => {
    window.focusDo
      .load()
      .then(state => {
        const ui = toUiState(state)
        setTasks(ui.tasks)
        setInsights(ui.insights)
        setFocusSessions(ui.focusSessions)
        setSettings(ui.settings)
        setLoading(false)
      })
      .catch((err: unknown) => {
        console.error('[FocusDo] load failed:', err)
        const message = err instanceof Error ? err.message : String(err)
        window.alert(`FocusDo 出错：${message}`)
        setLoading(false)
      })
  }, [])

  // 每个 mutation 都返回后端原始 state(供调用方做后续判断),内部已 applyState。
  const createTask = async (input: CreateTaskInput) => {
    const state = await window.focusDo.createTask(input)
    applyState(state)
    return state
  }
  const updateTask = async (id: string, updates: TaskUpdate) => {
    const { done, ...rest } = updates
    const payload: UpdateTaskInput = { id, ...rest }
    if (done !== undefined) payload.completed = done
    const state = await window.focusDo.updateTask(payload)
    applyState(state)
    return state
  }
  const deleteTask = async (id: string) => {
    const state = await window.focusDo.deleteTask(id)
    applyState(state)
    return state
  }
  const createInsight = async (input: CreateInsightInput) => {
    const state = await window.focusDo.createInsight(input)
    applyState(state)
    return state
  }
  const updateInsight = async (id: string, updates: Omit<UpdateInsightInput, 'id'>) => {
    const state = await window.focusDo.updateInsight({ id, ...updates })
    applyState(state)
    return state
  }
  const deleteInsight = async (id: string) => {
    const state = await window.focusDo.deleteInsight(id)
    applyState(state)
    return state
  }
  const updateSettings = async (updates: Partial<UiSettings>) => {
    // 乐观更新:先本地切换,失败再回滚。settingsForBackend 把 UI 词汇映射回后端。
    const prev = settings
    const next = { ...settings, ...updates }
    setSettings(next)
    try {
      const state = await window.focusDo.updateSettings(settingsForBackend(next))
      applyState(state)
    } catch (err) {
      setSettings(prev)
      throw err
    }
  }

  return {
    tasks,
    insights,
    focusSessions,
    settings,
    loading,
    applyState,
    createTask,
    updateTask,
    deleteTask,
    createInsight,
    updateInsight,
    deleteInsight,
    updateSettings,
  }
}
