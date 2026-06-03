// 固定时区为 UTC：statDateKey 用 UTC、statStartOfDay 用本地时区，两者只有在
// UTC 下才一致，这样断言才不随运行机器的时区漂移。必须在任何 Date 操作前设置。
process.env.TZ = 'UTC'

import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  statDateKey,
  statStartOfDay,
  statAddDays,
  statMinutes,
  statCompletedTasks,
  statGroupByDate,
  statStreak,
} from './stats'

describe('statDateKey', () => {
  it('空值返回 null', () => {
    expect(statDateKey(null)).toBeNull()
    expect(statDateKey(undefined)).toBeNull()
    expect(statDateKey('')).toBeNull()
  })

  it('Date 对象取其 UTC 日期', () => {
    expect(statDateKey(new Date('2026-06-02T08:30:00Z'))).toBe('2026-06-02')
  })

  it('ISO 字符串归一为 YYYY-MM-DD', () => {
    expect(statDateKey('2026-06-02T23:59:59Z')).toBe('2026-06-02')
  })

  it('无法解析的字符串退化为取前 10 个字符(既有行为)', () => {
    // new Date('2026-13-45') 非法 → 返回 String(input).slice(0,10)
    expect(statDateKey('2026-13-45')).toBe('2026-13-45')
  })
})

describe('statStartOfDay', () => {
  it('把时间归零到当天 0 点', () => {
    const result = statStartOfDay(new Date('2026-06-02T15:30:45Z'))
    expect(result.getHours()).toBe(0)
    expect(result.getMinutes()).toBe(0)
    expect(result.getSeconds()).toBe(0)
    expect(statDateKey(result)).toBe('2026-06-02')
  })

  it('不修改入参', () => {
    const input = new Date('2026-06-02T15:30:00Z')
    const before = input.getTime()
    statStartOfDay(input)
    expect(input.getTime()).toBe(before)
  })
})

describe('statAddDays', () => {
  it('正负天数偏移', () => {
    const base = new Date('2026-06-02T00:00:00Z')
    expect(statDateKey(statAddDays(base, 1))).toBe('2026-06-03')
    expect(statDateKey(statAddDays(base, -1))).toBe('2026-06-01')
  })

  it('跨月边界', () => {
    expect(statDateKey(statAddDays(new Date('2026-06-30T00:00:00Z'), 1))).toBe('2026-07-01')
  })

  it('不修改入参', () => {
    const input = new Date('2026-06-02T00:00:00Z')
    const before = input.getTime()
    statAddDays(input, 5)
    expect(input.getTime()).toBe(before)
  })
})

describe('statMinutes', () => {
  it('秒四舍五入为分钟', () => {
    expect(statMinutes(0)).toBe(0)
    expect(statMinutes(30)).toBe(1) // 0.5 → 1
    expect(statMinutes(89)).toBe(1) // 1.48 → 1
    expect(statMinutes(90)).toBe(2) // 1.5 → 2
    expect(statMinutes(1500)).toBe(25)
  })

  it('空值按 0 处理', () => {
    expect(statMinutes(undefined)).toBe(0)
    expect(statMinutes(null)).toBe(0)
  })
})

describe('statCompletedTasks', () => {
  it('保留 done 或 completed 为真的任务', () => {
    const tasks = [
      { id: 'a', done: true },
      { id: 'b', completed: true },
      { id: 'c', done: false, completed: false },
      { id: 'd' },
    ]
    expect(statCompletedTasks(tasks).map((t) => t.id)).toEqual(['a', 'b'])
  })

  it('空输入返回空数组', () => {
    expect(statCompletedTasks(null)).toEqual([])
    expect(statCompletedTasks([])).toEqual([])
  })
})

describe('statGroupByDate', () => {
  it('默认按出现次数计数', () => {
    const items = [
      { at: '2026-06-01T10:00:00Z' },
      { at: '2026-06-01T20:00:00Z' },
      { at: '2026-06-02T10:00:00Z' },
    ]
    expect(statGroupByDate(items, (i) => i.at)).toEqual({
      '2026-06-01': 2,
      '2026-06-02': 1,
    })
  })

  it('可自定义累加值', () => {
    const items = [
      { at: '2026-06-01T10:00:00Z', min: 25 },
      { at: '2026-06-01T20:00:00Z', min: 5 },
    ]
    expect(statGroupByDate(items, (i) => i.at, (i) => i.min)).toEqual({
      '2026-06-01': 30,
    })
  })

  it('日期取不到的项被跳过', () => {
    const items = [{ at: '2026-06-01T10:00:00Z' }, { at: null }]
    expect(statGroupByDate(items, (i) => i.at)).toEqual({ '2026-06-01': 1 })
  })
})

describe('statStreak', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  function focus(endedAt: string) {
    return { type: 'focus', status: 'completed', endedAt }
  }

  it('从今天往回数连续完成专注的天数', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-02T12:00:00Z'))
    const sessions = [
      focus('2026-06-02T09:00:00Z'),
      focus('2026-06-01T09:00:00Z'),
      focus('2026-05-31T09:00:00Z'),
    ]
    expect(statStreak(sessions)).toBe(3)
  })

  it('遇到断档即停止计数', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-02T12:00:00Z'))
    // 今天、昨天有，前天(05-31)断档，更早的不再计入
    const sessions = [
      focus('2026-06-02T09:00:00Z'),
      focus('2026-06-01T09:00:00Z'),
      focus('2026-05-29T09:00:00Z'),
    ]
    expect(statStreak(sessions)).toBe(2)
  })

  it('今天没有完成的专注则连续数为 0', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-02T12:00:00Z'))
    expect(statStreak([focus('2026-06-01T09:00:00Z')])).toBe(0)
  })

  it('忽略非 focus 或未完成的会话', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-02T12:00:00Z'))
    const sessions = [
      { type: 'shortBreak', status: 'completed', endedAt: '2026-06-02T09:00:00Z' },
      { type: 'focus', status: 'abandoned', endedAt: '2026-06-02T10:00:00Z' },
    ]
    expect(statStreak(sessions)).toBe(0)
  })

  it('空输入返回 0', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-02T12:00:00Z'))
    expect(statStreak([])).toBe(0)
    expect(statStreak(null)).toBe(0)
  })
})
