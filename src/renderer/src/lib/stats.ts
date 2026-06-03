// fd-stats-utils.ts — 统计相关纯函数(日期归一、按天分组、连续打卡等)
// 从 fd-stats.jsx 抽出，与视图组件分离：零外部依赖(仅用 Date / Math)，
// 因而可在 node 环境直接单测，也可被任意展示组件复用。
//
// 注意:statDateKey 用 toISOString()(UTC)取日期，而 statStartOfDay 用
// setHours(本地时区)。两者在非 UTC 时区下跨天可能不一致——这是既有行为，
// 测试用例据此把时区固定为 UTC 以获得确定结果。

type DateInput = Date | string | number | null | undefined

// 任务只关心"是否完成"——后端字段叫 completed，UI 侧叫 done，两者都接受。
interface TaskLike {
  done?: boolean
  completed?: boolean
}

// 连续打卡只看已完成的专注会话，按结束日归属。
interface FocusSessionLike {
  type?: string
  status?: string
  endedAt?: string | null
}

export function statDateKey(input: DateInput): string | null {
  if (!input) return null
  const date = input instanceof Date ? input : new Date(input)
  if (Number.isNaN(date.getTime())) return String(input).slice(0, 10)
  return date.toISOString().slice(0, 10)
}

export function statStartOfDay(date: Date): Date {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

export function statAddDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

export function statMinutes(seconds: number | null | undefined): number {
  return Math.round((seconds || 0) / 60)
}

export function statCompletedTasks<T extends TaskLike>(tasks: T[] | null | undefined): T[] {
  return (tasks || []).filter((t) => t.done || t.completed)
}

export function statGroupByDate<T>(
  items: T[],
  getDate: (item: T) => DateInput,
  getValue: (item: T) => number = () => 1
): Record<string, number> {
  const map: Record<string, number> = {}
  items.forEach((item) => {
    const key = statDateKey(getDate(item))
    if (!key) return
    map[key] = (map[key] || 0) + getValue(item)
  })
  return map
}

export function statStreak(focusSessions: FocusSessionLike[] | null | undefined): number {
  // Attribute by endedAt so a session that crosses midnight counts toward the
  // day the user actually finished focusing, not the day they started.
  const days = new Set(
    (focusSessions || [])
      .filter((s) => s.type === 'focus' && s.status === 'completed')
      .map((s) => statDateKey(s.endedAt))
      .filter(Boolean)
  )
  let count = 0
  let cursor = statStartOfDay(new Date())
  while (days.has(statDateKey(cursor))) {
    count += 1
    cursor = statAddDays(cursor, -1)
  }
  return count
}
