// fd-types.ts — 渲染层(UI)类型
// 设置词汇已与后端契约统一(见 shared/todo.ts 的 FocusSettings),故渲染层不再
// 需要单独的设置形状——UiSettings 直接别名到 FocusSettings。仍保留的差异只有
// Task:UI 组件用 done(completed 的镜像)、planDate 把"今天"归一为 'today'。
import type { Task, Insight, FocusSession, FocusSettings } from '@shared/todo'

// 渲染层 Task:后端 Task 之上加 UI 用的 done。
export type UiTask = Task & { done: boolean }

// 渲染层设置 = 后端设置(已统一)。保留别名以表达"渲染层视角"。
export type UiSettings = FocusSettings

// 渲染层持有的整体状态(applyState 用后端 FocusDoState 映射而来)。
export type UiState = {
  tasks: UiTask[]
  insights: Insight[]
  focusSessions: FocusSession[]
  settings: FocusSettings
}
