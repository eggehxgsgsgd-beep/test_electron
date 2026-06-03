import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { TodoStore } from './todoStore'

// Each test gets a fresh sqlite file in an isolated temp dir so runs never
// share state. The dir is removed in afterEach.
let dir: string
let store: TodoStore

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'focusdo-test-'))
  store = new TodoStore(join(dir, 'focusdo.sqlite'))
})

afterEach(async () => {
  await rm(dir, { recursive: true, force: true })
})

describe('TodoStore — smoke test', () => {
  it('loads a fresh db with default settings and no tasks', async () => {
    const state = await store.load()

    expect(state.tasks).toEqual([])
    expect(state.insights).toEqual([])
    expect(state.focusSessions).toEqual([])
    expect(state.settings.focusMin).toBe(25)
    expect(state.settings.tags).toHaveLength(4)
  })

  it('persists a created task across a reopen', async () => {
    await store.createTask({ title: '写测试' })

    // New store instance pointed at the same file — proves the write actually
    // hit disk, not just the in-memory db.
    const reopened = new TodoStore(join(dir, 'focusdo.sqlite'))
    const state = await reopened.load()

    expect(state.tasks).toHaveLength(1)
    expect(state.tasks[0].title).toBe('写测试')
  })
})

describe('TodoStore — 输入校验与拒绝路径', () => {
  // 多个 update 用例都需要先有一条可改的记录。createTask 返回完整 state,
  // 新建的任务 sort_order 最大、排在最前,所以 tasks[0] 就是它。
  async function seedTask(title = '任务'): Promise<string> {
    const state = await store.createTask({ title })
    return state.tasks[0].id
  }

  describe('createTask（静默拒绝型）', () => {
    it('空白标题不创建任务，也不抛错', async () => {
      // createTask 对空标题不抛错，而是原样返回当前状态。所以断言的是
      // “任务没被建出来”，而不是去接一个异常。
      const state = await store.createTask({ title: '   ' })
      expect(state.tasks).toEqual([])
    })

    it('非法 planDate 会抛错', async () => {
      // 这里走的是抛错分支：标题非空，于是继续校验 planDate，格式不符即抛。
      await expect(store.createTask({ title: '买菜', planDate: '2026/01/01' })).rejects.toThrow(
        'planDate 格式无效'
      )
    })
  })

  describe('updateTask（抛错型）', () => {
    it('标题改成空白会抛错', async () => {
      const id = await seedTask()
      await expect(store.updateTask({ id, title: '   ' })).rejects.toThrow('标题不能为空')
    })

    it('非法 priority 会抛错', async () => {
      const id = await seedTask()
      // @ts-expect-error 故意传一个不在 Priority 联合类型里的值，验证运行时校验
      await expect(store.updateTask({ id, priority: 'urgent' })).rejects.toThrow('priority')
    })

    it('非法 planDate 会抛错', async () => {
      const id = await seedTask()
      await expect(store.updateTask({ id, planDate: '不是日期' })).rejects.toThrow(
        'planDate 格式无效'
      )
    })

    it('不在允许集合中的 tag 会抛错', async () => {
      const id = await seedTask()
      // @ts-expect-error tag 是固定联合类型，这里故意越界传一个未定义的标签
      await expect(store.updateTask({ id, tag: '不存在的标签' })).rejects.toThrow(
        '不在允许集合中'
      )
    })

    it('允许集合中的 tag 会被接受（正向对照）', async () => {
      // 反例之外补一个正例：确认校验没有“误杀”合法输入。
      const id = await seedTask()
      const state = await store.updateTask({ id, tag: '工作' })
      expect(state.tasks[0].tag).toBe('工作')
    })
  })

  describe('createInsight（静默拒绝型）', () => {
    it('标题和内容都为空白时不创建', async () => {
      const state = await store.createInsight({ title: '  ', content: '  ' })
      expect(state.insights).toEqual([])
    })
  })

  describe('updateInsight（抛错型）', () => {
    it('把唯一内容清空（变成全空）会抛错', async () => {
      const created = await store.createInsight({ content: '一条想法' })
      const id = created.insights[0].id
      await expect(store.updateInsight({ id, content: '' })).rejects.toThrow(
        'Insight 不能完全为空'
      )
    })
  })
})
