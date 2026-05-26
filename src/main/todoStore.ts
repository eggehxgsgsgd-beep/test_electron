import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import initSqlJs from 'sql.js'
import type { Database, SqlJsStatic, SqlValue } from 'sql.js'
import type {
  CreateFocusSessionInput,
  CreateInsightInput,
  CreateTaskInput,
  FocusDoState,
  FocusSession,
  FocusSettings,
  Insight,
  Task,
  UpdateInsightInput,
  UpdateSettingsInput,
  UpdateTaskInput
} from '../shared/todo'

const DEFAULT_SETTINGS: FocusSettings = {
  theme: 'clear',
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  tags: [
    { name: '工作', color: '#3b82f6' },
    { name: '开发', color: '#10b981' },
    { name: '设计', color: '#ec4899' },
    { name: '个人', color: '#8b5cf6' }
  ]
}

const now = (): string => new Date().toISOString()

export class TodoStore {
  private sqlPromise: Promise<SqlJsStatic> | null = null
  private dbPromise: Promise<Database> | null = null
  private db: Database | null = null

  constructor(private readonly filePath: string) {}

  async load(): Promise<FocusDoState> {
    await this.getDb()
    return this.readState()
  }

  async createTask(input: CreateTaskInput): Promise<FocusDoState> {
    const title = input.title.trim()
    if (!title) return this.readState()

    const db = await this.getDb()
    db.run(
      `INSERT INTO tasks
        (id, title, notes, tag, priority, plan_date, completed, completed_at, created_at, pomodoro_count, archived, sort_order)
       VALUES (?, ?, '', NULL, 'normal', ?, 0, NULL, ?, 0, 0, ?)`,
      [crypto.randomUUID(), title, input.planDate ?? todayKey(), now(), Date.now()]
    )
    return this.persistAndRead()
  }

  async updateTask(input: UpdateTaskInput): Promise<FocusDoState> {
    const db = await this.getDb()
    const current = this.getTask(input.id)
    if (!current) return this.readState()

    const completed =
      input.completed === undefined ? current.completed : Boolean(input.completed)
    const completedAt =
      input.completed === undefined ? current.completedAt : completed ? now() : null

    db.run(
      `UPDATE tasks SET
        title = ?, notes = ?, tag = ?, priority = ?, plan_date = ?, completed = ?,
        completed_at = ?, pomodoro_count = ?, archived = ?
       WHERE id = ?`,
      [
        input.title === undefined ? current.title : input.title.trim() || current.title,
        input.notes === undefined ? current.notes : input.notes,
        input.tag === undefined ? current.tag : input.tag,
        input.priority === undefined ? current.priority : input.priority,
        input.planDate === undefined ? current.planDate : input.planDate,
        completed ? 1 : 0,
        completedAt,
        input.pomodoroCount === undefined ? current.pomodoroCount : input.pomodoroCount,
        input.archived === undefined ? (current.archived ? 1 : 0) : input.archived ? 1 : 0,
        input.id
      ]
    )

    return this.persistAndRead()
  }

  async deleteTask(id: string): Promise<FocusDoState> {
    const db = await this.getDb()
    db.run('DELETE FROM tasks WHERE id = ?', [id])
    db.run('UPDATE insights SET linked_task_id = NULL WHERE linked_task_id = ?', [id])
    return this.persistAndRead()
  }

  async createInsight(input: CreateInsightInput): Promise<FocusDoState> {
    const db = await this.getDb()
    const timestamp = now()
    db.run(
      `INSERT INTO insights
        (id, title, content, tag, linked_task_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        crypto.randomUUID(),
        input.title?.trim() || null,
        input.content ?? '',
        input.tag ?? null,
        input.linkedTaskId ?? null,
        timestamp,
        timestamp
      ]
    )
    return this.persistAndRead()
  }

  async updateInsight(input: UpdateInsightInput): Promise<FocusDoState> {
    const db = await this.getDb()
    const current = this.getInsight(input.id)
    if (!current) return this.readState()

    db.run(
      `UPDATE insights SET title = ?, content = ?, tag = ?, linked_task_id = ?, updated_at = ?
       WHERE id = ?`,
      [
        input.title === undefined ? current.title : input.title?.trim() || null,
        input.content === undefined ? current.content : input.content,
        input.tag === undefined ? current.tag : input.tag,
        input.linkedTaskId === undefined ? current.linkedTaskId : input.linkedTaskId,
        now(),
        input.id
      ]
    )
    return this.persistAndRead()
  }

  async deleteInsight(id: string): Promise<FocusDoState> {
    const db = await this.getDb()
    db.run('DELETE FROM insights WHERE id = ?', [id])
    return this.persistAndRead()
  }

  async updateSettings(input: UpdateSettingsInput): Promise<FocusDoState> {
    const current = await this.readSettings()
    await this.writeSettings({ ...current, ...input })
    return this.persistAndRead()
  }

  async recordFocusSession(input: CreateFocusSessionInput): Promise<FocusDoState> {
    const db = await this.getDb()
    db.run(
      `INSERT INTO focus_sessions
        (id, task_id, started_at, ended_at, planned_duration, actual_duration, status, type)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        crypto.randomUUID(),
        input.taskId ?? null,
        input.startedAt,
        input.endedAt,
        input.plannedDuration,
        input.actualDuration,
        input.status ?? 'completed',
        input.type ?? 'focus'
      ]
    )
    return this.persistAndRead()
  }

  private async getDb(): Promise<Database> {
    if (!this.dbPromise) {
      this.dbPromise = this.openDb()
    }
    return this.dbPromise
  }

  private async openDb(): Promise<Database> {
    const SQL = await this.getSql()
    let db: Database

    try {
      db = new SQL.Database(await readFile(this.filePath))
    } catch (error) {
      if (!isNodeError(error) || error.code !== 'ENOENT') throw error
      db = new SQL.Database()
    }

    this.db = db
    this.migrate(db)
    if (this.countRows(db, 'tasks') === 0 && this.countRows(db, 'insights') === 0) {
      this.seed(db)
    }
    await this.persistDb(db)
    return db
  }

  private async getSql(): Promise<SqlJsStatic> {
    if (!this.sqlPromise) {
      this.sqlPromise = initSqlJs()
    }
    return this.sqlPromise
  }

  private migrate(db: Database): void {
    db.run(`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        notes TEXT NOT NULL DEFAULT '',
        tag TEXT,
        priority TEXT NOT NULL DEFAULT 'normal',
        plan_date TEXT,
        completed INTEGER NOT NULL DEFAULT 0,
        completed_at TEXT,
        created_at TEXT NOT NULL,
        pomodoro_count INTEGER NOT NULL DEFAULT 0,
        archived INTEGER NOT NULL DEFAULT 0,
        sort_order INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS insights (
        id TEXT PRIMARY KEY,
        title TEXT,
        content TEXT NOT NULL DEFAULT '',
        tag TEXT,
        linked_task_id TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS focus_sessions (
        id TEXT PRIMARY KEY,
        task_id TEXT,
        started_at TEXT NOT NULL,
        ended_at TEXT NOT NULL,
        planned_duration INTEGER NOT NULL,
        actual_duration INTEGER NOT NULL,
        status TEXT NOT NULL,
        type TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_tasks_plan_date ON tasks(plan_date);
      CREATE INDEX IF NOT EXISTS idx_insights_tag ON insights(tag);
      CREATE INDEX IF NOT EXISTS idx_focus_sessions_started_at ON focus_sessions(started_at);
    `)

    const existingSettings = this.scalar<string>(
      "SELECT value FROM settings WHERE key = 'settings'"
    )
    if (!existingSettings) {
      db.run('INSERT INTO settings (key, value) VALUES (?, ?)', [
        'settings',
        JSON.stringify(DEFAULT_SETTINGS)
      ])
    }
  }

  private seed(db: Database): void {
    seedTasks().forEach((task) => {
      db.run(
        `INSERT INTO tasks
          (id, title, notes, tag, priority, plan_date, completed, completed_at, created_at, pomodoro_count, archived, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          task.id,
          task.title,
          task.notes,
          task.tag,
          task.priority,
          task.planDate,
          task.completed ? 1 : 0,
          task.completedAt,
          task.createdAt,
          task.pomodoroCount,
          task.archived ? 1 : 0,
          task.sortOrder
        ]
      )
    })

    seedInsights().forEach((insight) => {
      db.run(
        `INSERT INTO insights (id, title, content, tag, linked_task_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          insight.id,
          insight.title,
          insight.content,
          insight.tag,
          insight.linkedTaskId,
          insight.createdAt,
          insight.updatedAt
        ]
      )
    })
  }

  private async readState(): Promise<FocusDoState> {
    await this.getDb()
    return {
      tasks: this.readTasks(),
      insights: this.readInsights(),
      settings: await this.readSettings(),
      focusSessions: this.readFocusSessions()
    }
  }

  private readTasks(): Task[] {
    return this.queryRows(
      `SELECT id, title, notes, tag, priority, plan_date, completed, completed_at,
        created_at, pomodoro_count, archived, sort_order
       FROM tasks
       ORDER BY sort_order DESC, created_at DESC`,
      rowToTask
    )
  }

  private readInsights(): Insight[] {
    return this.queryRows(
      `SELECT id, title, content, tag, linked_task_id, created_at, updated_at
       FROM insights
       ORDER BY created_at DESC`,
      rowToInsight
    )
  }

  private readFocusSessions(): FocusSession[] {
    return this.queryRows(
      `SELECT id, task_id, started_at, ended_at, planned_duration, actual_duration, status, type
       FROM focus_sessions
       ORDER BY started_at DESC
       LIMIT 500`,
      rowToFocusSession
    )
  }

  private async readSettings(): Promise<FocusSettings> {
    await this.getDb()
    const raw = this.scalar<string>("SELECT value FROM settings WHERE key = 'settings'")
    if (!raw) return DEFAULT_SETTINGS

    try {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
    } catch {
      return DEFAULT_SETTINGS
    }
  }

  private async writeSettings(settings: FocusSettings): Promise<void> {
    const db = await this.getDb()
    db.run(
      `INSERT INTO settings (key, value) VALUES ('settings', ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      [JSON.stringify(settings)]
    )
  }

  private getTask(id: string): Task | null {
    return (
      this.queryRows(
        `SELECT id, title, notes, tag, priority, plan_date, completed, completed_at,
          created_at, pomodoro_count, archived, sort_order
         FROM tasks WHERE id = ?`,
        rowToTask,
        [id]
      )[0] ?? null
    )
  }

  private getInsight(id: string): Insight | null {
    return (
      this.queryRows(
        `SELECT id, title, content, tag, linked_task_id, created_at, updated_at
         FROM insights WHERE id = ?`,
        rowToInsight,
        [id]
      )[0] ?? null
    )
  }

  private async persistAndRead(): Promise<FocusDoState> {
    await this.persistDb(await this.getDb())
    return this.readState()
  }

  private async persistDb(db: Database): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true })
    await writeFile(this.filePath, Buffer.from(db.export()))
  }

  private countRows(db: Database, table: string): number {
    const result = db.exec(`SELECT COUNT(*) AS count FROM ${table}`)
    return Number(result[0]?.values[0]?.[0] ?? 0)
  }

  private scalar<T>(sql: string, params: SqlValue[] = []): T | null {
    return this.queryRows(sql, (row) => row[0] as T, params)[0] ?? null
  }

  private queryRows<T>(
    sql: string,
    map: (row: unknown[]) => T,
    params: SqlValue[] = []
  ): T[] {
    const db = this.db
    if (!db) throw new Error('Database is not loaded yet')
    const stmt = db.prepare(sql)
    stmt.bind(params)
    const rows: T[] = []
    while (stmt.step()) {
      rows.push(map(stmt.get()))
    }
    stmt.free()
    return rows
  }
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

function rowToTask(row: unknown[]): Task {
  return {
    id: String(row[0]),
    title: String(row[1]),
    notes: String(row[2] ?? ''),
    tag: (row[3] as Task['tag']) ?? null,
    priority: (row[4] as Task['priority']) ?? 'normal',
    planDate: (row[5] as string | null) ?? null,
    completed: Boolean(row[6]),
    completedAt: (row[7] as string | null) ?? null,
    createdAt: String(row[8]),
    pomodoroCount: Number(row[9] ?? 0),
    archived: Boolean(row[10]),
    sortOrder: Number(row[11] ?? 0)
  }
}

function rowToInsight(row: unknown[]): Insight {
  return {
    id: String(row[0]),
    title: (row[1] as string | null) ?? null,
    content: String(row[2] ?? ''),
    tag: (row[3] as Insight['tag']) ?? null,
    linkedTaskId: (row[4] as string | null) ?? null,
    createdAt: String(row[5]),
    updatedAt: String(row[6])
  }
}

function rowToFocusSession(row: unknown[]): FocusSession {
  return {
    id: String(row[0]),
    taskId: (row[1] as string | null) ?? null,
    startedAt: String(row[2]),
    endedAt: String(row[3]),
    plannedDuration: Number(row[4]),
    actualDuration: Number(row[5]),
    status: (row[6] as FocusSession['status']) ?? 'completed',
    type: (row[7] as FocusSession['type']) ?? 'focus'
  }
}

function seedTasks(): Task[] {
  return [
    createSeedTask('回复客户邮件', '工作', 'important', 'today'),
    createSeedTask('代码审查 - PR #247', '开发', 'important', 'today', '注意边界情况的处理', 1),
    createSeedTask('准备周五演示文稿', '工作', 'normal', 'thisWeek'),
    createSeedTask('更新设计文档 v2', '设计', 'normal', 'today', '', 2),
    createSeedTask('阅读《深度工作》第 3 章', '个人', 'normal', null)
  ]
}

function createSeedTask(
  title: string,
  tag: Task['tag'],
  priority: Task['priority'],
  planDate: string | null,
  notes = '',
  pomodoroCount = 0
): Task {
  return {
    id: crypto.randomUUID(),
    title,
    notes,
    tag,
    priority,
    planDate,
    completed: false,
    completedAt: null,
    createdAt: now(),
    pomodoroCount,
    archived: false,
    sortOrder: Date.now() + Math.floor(Math.random() * 1000)
  }
}

function seedInsights(): Insight[] {
  const timestamp = now()
  return [
    {
      id: crypto.randomUUID(),
      title: 'Electron 主进程通信优化',
      content: '发现 IPC 同步调用会阻塞渲染，改用 invoke 异步方式后流畅度显著提升。',
      tag: '开发',
      linkedTaskId: null,
      createdAt: timestamp,
      updatedAt: timestamp
    },
    {
      id: crypto.randomUUID(),
      title: null,
      content: '开场先 align 议程，中途有人跑题时用「这个我们会后单独聊」收回。会议效率提升明显。',
      tag: '工作',
      linkedTaskId: null,
      createdAt: timestamp,
      updatedAt: timestamp
    }
  ]
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error
}
