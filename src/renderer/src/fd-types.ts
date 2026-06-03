// fd-types.ts — 渲染层(UI)类型
// 渲染层用的形状和后端契约(shared/todo.ts)不完全一致,差异由数据层的
// toUiState / settingsForBackend 负责翻译。这里集中定义这些 UI 侧类型,供
// 各组件与 hook 复用。后端原始类型仍从 ../../shared/todo 引入。
import type { Task, Insight, FocusSession, TagOption, FocusScene } from '../../shared/todo'

// 渲染层主题键(与后端 FocusSettings.theme 的 'clear'|'dusk'|'moss' 不同,
// 由 themeToThemeKey / settingsForBackend 互相映射)。
export type ThemeKey = 'clarity' | 'dusk' | 'sage'

// 渲染层 Task:后端 Task 之上加 UI 用的 done(= completed 的镜像);
// planDate 在 toUiTask 里把"今天"归一为字面量 'today'。
export type UiTask = Task & { done: boolean }

// 渲染层设置:比后端 FocusSettings 更丰富——主题/计时用前端词汇,另含一批
// 纯前端项(自动开始、提示音、通知开关、免打扰、跟随系统)。
export type UiSettings = {
  themeKey: ThemeKey
  focusMin: number
  shortBreakMin: number
  longBreakMin: number
  autoStart: boolean
  sound: boolean
  pomodoroNotify: boolean
  breakNotify: boolean
  dnd: boolean
  followSystem: boolean
  focusScene: FocusScene
  tags: TagOption[]
}

// 渲染层持有的整体状态(applyState 用后端 FocusDoState 映射而来)。
export type UiState = {
  tasks: UiTask[]
  insights: Insight[]
  focusSessions: FocusSession[]
  settings: UiSettings
}
