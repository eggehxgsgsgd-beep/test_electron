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
  InFlightFocus,
  Insight,
  Task,
  UpdateInsightInput,
  UpdateSettingsInput,
  UpdateTaskInput
} from '../shared/todo'

// A focus session is considered stale (and skipped during recovery) once this much
// wall-clock time has elapsed since it started — covers cases where the machine
// slept overnight rather than crashed mid-pomodoro.
const IN_FLIGHT_STALE_MS = 4 * 60 * 60 * 1000

const DEFAULT_SETTINGS: FocusSettings = {
  theme: 'clear',
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  focusScene: 'forest',
  tags: [
    { name: '工作', color: '#3b82f6' },
    { name: '开发', color: '#10b981' },
    { name: '设计', color: '#ec4899' },
    { name: '个人', color: '#8b5cf6' }
  ]
}

const VALID_FOCUS_SCENES: ReadonlyArray<FocusSettings['focusScene']> = ['forest', 'sea', 'mountain']

// Legacy → current focus-scene names. Older builds wrote `'night'` for users
// who picked it before we dropped that scene; coerce to forest on read.
function migrateFocusScene(value: unknown): FocusSettings['focusScene'] {
  if (typeof value === 'string' && VALID_FOCUS_SCENES.includes(value as FocusSettings['focusScene'])) {
    return value as FocusSettings['focusScene']
  }
  return 'forest'
}

const now = (): string => new Date().toISOString()

const VALID_PRIORITIES: ReadonlyArray<Task['priority']> = ['normal', 'important']
const PLAN_DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function validatePlanDate(value: unknown): string | null {
  if (value === null || value === undefined) return null
  if (typeof value !== 'string') {
    throw new Error('planDate 格式无效')
  }
  if (value === 'today') return value
  if (!PLAN_DATE_RE.test(value) || Number.isNaN(new Date(value).getTime())) {
    throw new Error('planDate 格式无效')
  }
  return value
}

function validatePriority(value: unknown): Task['priority'] {
  if (value === undefined || value === null) return 'normal'
  if (typeof value !== 'string' || !VALID_PRIORITIES.includes(value as Task['priority'])) {
    throw new Error(`priority 必须是 ${VALID_PRIORITIES.join(' / ')}`)
  }
  return value as Task['priority']
}

function validateTag(value: unknown, allowed: ReadonlyArray<string>): string | null {
  if (value === null || value === undefined) return null
  if (typeof value !== 'string') {
    throw new Error('tag 格式无效')
  }
  if (!allowed.includes(value)) {
    throw new Error(`tag "${value}" 不在允许集合中`)
  }
  return value
}

export class TodoStore {
  private sqlPromise: Promise<SqlJsStatic> | null = null
  private dbPromise: Promise<Database> | null = null
  private db: Database | null = null
  // Promise-chain mutex serializing disk writes. Without it, two concurrent
  // mutations could each kick off a writeFile to the same path and race —
  // libuv truncates on each open, so partial / corrupted bytes are possible.
  // We do NOT serialize the db.run mutations themselves (sql.js is sync) —
  // only the async persistDb work.
  private writeChain: Promise<void> = Promise.resolve()

  constructor(private readonly filePath: string) {}

  async load(): Promise<FocusDoState> {
    await this.getDb()
    await this.recoverInFlightFocus()
    return this.readState()
  }

  // Read-only snapshot for the export path.  Unlike load(), this does NOT
  // trigger the in-flight focus recovery, so exporting while a pomodoro is
  // running won't surprise-record a session.
  async exportSnapshot(): Promise<FocusDoState> {
    await this.getDb()
    return this.readState()
  }

  // Records a focus snapshot to the settings table.  The renderer calls this on
  // focus start (and on the autoStart-triggered next focus); it calls it with
  // null on natural completion, pause, or reset.
  async setInFlightFocus(snapshot: InFlightFocus | null): Promise<void> {
    const db = await this.getDb()
    if (snapshot === null) {
      db.run(`DELETE FROM settings WHERE key = 'inFlightFocus'`)
    } else {
      db.run(
        `INSERT INTO settings (key, value) VALUES ('inFlightFocus', ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
        [JSON.stringify(snapshot)]
      )
    }
    await this.persistDb(db)
  }

  // On startup, look for an orphaned in-flight focus snapshot — if present,
  // record it as an abandoned focus_session and clear it.  This way force-quits
  // / OS kills mid-pomodoro don't silently swallow the user's work.
  private async recoverInFlightFocus(): Promise<void> {
    const db = await this.getDb()
    const raw = this.scalar<string>(`SELECT value FROM settings WHERE key = 'inFlightFocus'`)
    if (!raw) return
    db.run(`DELETE FROM settings WHERE key = 'inFlightFocus'`)

    let snap: InFlightFocus | null = null
    try {
      snap = JSON.parse(raw) as InFlightFocus
    } catch {
      await this.persistDb(db)
      return
    }
    const startedMs = Number(snap?.startedAtMs)
    const planned = Number(snap?.plannedDuration)
    if (!Number.isFinite(startedMs) || !Number.isFinite(planned) || planned <= 0) {
      await this.persistDb(db)
      return
    }
    const elapsedMs = Date.now() - startedMs
    if (elapsedMs > IN_FLIGHT_STALE_MS || elapsedMs < 0) {
      // System probably slept or the clock jumped; don't fabricate a session.
      await this.persistDb(db)
      return
    }
    const actualDuration = Math.min(planned, Math.max(0, Math.round(elapsedMs / 1000)))
    if (actualDuration < 1) {
      await this.persistDb(db)
      return
    }
    let taskId: string | null = snap.taskId ?? null
    if (taskId && !this.getTask(taskId)) taskId = null
    db.run(
      `INSERT INTO focus_sessions
        (id, task_id, started_at, ended_at, planned_duration, actual_duration, status, type)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        crypto.randomUUID(),
        taskId,
        snap.startedAt,
        new Date().toISOString(),
        planned,
        actualDuration,
        'abandoned',
        'focus'
      ]
    )
    console.log(
      `[FocusDo] recovered in-flight focus: taskId=${taskId} elapsed=${actualDuration}s of ${planned}s`
    )
    await this.persistDb(db)
  }

  async createTask(input: CreateTaskInput): Promise<FocusDoState> {
    const title = input.title.trim()
    if (!title) return this.readState()
    const planDate = validatePlanDate(input.planDate)

    const db = await this.getDb()
    db.run(
      `INSERT INTO tasks
        (id, title, notes, tag, priority, plan_date, completed, completed_at, created_at, pomodoro_count, archived, sort_order)
       VALUES (?, ?, '', NULL, 'normal', ?, 0, NULL, ?, 0, 0, ?)`,
      [crypto.randomUUID(), title, planDate, now(), Date.now()]
    )
    return this.persistAndRead()
  }

  async updateTask(input: UpdateTaskInput): Promise<FocusDoState> {
    const db = await this.getDb()
    const current = this.getTask(input.id)
    if (!current) return this.readState()

    let title = current.title
    if (input.title !== undefined) {
      const t = input.title.trim()
      if (!t) throw new Error('标题不能为空')
      title = t
    }
    const priority =
      input.priority === undefined ? current.priority : validatePriority(input.priority)
    const planDate =
      input.planDate === undefined ? current.planDate : validatePlanDate(input.planDate)
    let tag: Task['tag'] = current.tag
    if (input.tag !== undefined && input.tag !== current.tag) {
      // Skip validation when the tag isn't actually changing — that lets legacy
      // tasks (whose tag was renamed away without cascading) still accept other
      // field updates without false-rejecting the no-op tag pass-through.
      if (input.tag === null) {
        tag = null
      } else {
        const settings = await this.readSettings()
        tag = validateTag(input.tag, settings.tags.map((t) => t.name)) as Task['tag']
      }
    }

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
        title,
        input.notes === undefined ? current.notes : input.notes,
        tag,
        priority,
        planDate,
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
    db.run('DELETE FROM focus_sessions WHERE task_id = ?', [id])
    return this.persistAndRead()
  }

  // Atomic `pomodoroCount += 1` for a given task. Avoids the read-modify-write
  // race in the renderer's setInterval where two near-simultaneous completions
  // could each read N and both write N+1, losing an increment. The whole op is
  // a single sqlite UPDATE inside writeChain so concurrent calls just serialize.
  async incrementPomodoroCount(id: string): Promise<FocusDoState> {
    const db = await this.getDb()
    db.run('UPDATE tasks SET pomodoro_count = pomodoro_count + 1 WHERE id = ?', [id])
    return this.persistAndRead()
  }

  async createInsight(input: CreateInsightInput): Promise<FocusDoState> {
    const title = input.title?.trim() || null
    const content = (input.content ?? '').trim()
    if (!title && !content) {
      // Refuse to create a blank insight. Mirrors createTask's empty-title guard.
      return this.readState()
    }
    const db = await this.getDb()
    const timestamp = now()
    db.run(
      `INSERT INTO insights
        (id, title, content, tag, linked_task_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        crypto.randomUUID(),
        title,
        content,
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

    const nextTitle =
      input.title === undefined ? current.title : input.title?.trim() || null
    const nextContent =
      input.content === undefined ? current.content : input.content
    // Mirror createInsight's empty-guard: an insight without title AND without content
    // (after trim) carries no information; reject so users either type something or
    // delete the whole record explicitly.
    if (!nextTitle && !(nextContent ?? '').trim()) {
      throw new Error('Insight 不能完全为空，请删除整条')
    }

    db.run(
      `UPDATE insights SET title = ?, content = ?, tag = ?, linked_task_id = ?, updated_at = ?
       WHERE id = ?`,
      [
        nextTitle,
        nextContent,
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
    const next = { ...current, ...input }

    // Detect positional tag renames (TagsTab edits a single name in place while
    // preserving array order + color, so the rename can be matched at index N
    // when color matches and only the name differs). Cascade the new name onto
    // tasks / insights so they don't get orphaned with a stale tag string.
    if (input.tags && current.tags) {
      const db = await this.getDb()
      const len = Math.min(current.tags.length, input.tags.length)
      for (let i = 0; i < len; i++) {
        const before = current.tags[i]
        const after = input.tags[i]
        if (
          before &&
          after &&
          before.name !== after.name &&
          before.color === after.color
        ) {
          db.run('UPDATE tasks SET tag = ? WHERE tag = ?', [after.name, before.name])
          db.run('UPDATE insights SET tag = ? WHERE tag = ?', [after.name, before.name])
        }
      }
    }

    await this.writeSettings(next)
    return this.persistAndRead()
  }

  async recordFocusSession(input: CreateFocusSessionInput): Promise<FocusDoState> {
    const db = await this.getDb()
    // If the referenced task was deleted between focus start and end, fall back to
    // a free-focus session rather than throwing — preserves the user's work while
    // avoiding a dangling foreign reference.
    let taskId: string | null = input.taskId ?? null
    if (taskId && !this.getTask(taskId)) {
      console.warn(`[FocusDo] recordFocusSession: task ${taskId} not found, recording as free focus`)
      taskId = null
    }
    db.run(
      `INSERT INTO focus_sessions
        (id, task_id, started_at, ended_at, planned_duration, actual_duration, status, type)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        crypto.randomUUID(),
        taskId,
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
      const merged = { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
      // Coerce focusScene through whitelist so old 'night' values roll forward
      // to the default without throwing on every read.
      merged.focusScene = migrateFocusScene(merged.focusScene)
      return merged
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
    const work = async (): Promise<void> => {
      try {
        // Snapshot the in-memory db state at write time. Any mutation completed
        // before this point is included in the snapshot.
        const buffer = Buffer.from(db.export())
        await mkdir(dirname(this.filePath), { recursive: true })
        await writeFile(this.filePath, buffer)
      } catch (error) {
        console.error('[FocusDo] persistDb failed:', error)
        throw new Error(
          `保存失败：${error instanceof Error ? error.message : String(error)}`
        )
      }
    }
    // Chain onto the existing queue regardless of whether the previous write
    // succeeded — we don't want one failed write to block all subsequent ones.
    const next = this.writeChain.then(work, work)
    // The chain swallows so a single failure can't poison the queue. Callers
    // still get their original rejection through `next`. Logging here means
    // background writes that nothing awaits are still observable in stdout.
    this.writeChain = next.catch((error) => {
      console.warn('[FocusDo] write queue saw a failure (already surfaced to caller):', error)
    })
    return next
  }

  private countRows(
    db: Database,
    table: 'tasks' | 'insights' | 'focus_sessions' | 'settings'
  ): number {
    const ALLOWED = ['tasks', 'insights', 'focus_sessions', 'settings'] as const
    if (!ALLOWED.includes(table)) {
      throw new Error(`countRows: 不允许的表名 ${table}`)
    }
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
    completed: Number(row[6]) === 1,
    completedAt: (row[7] as string | null) ?? null,
    createdAt: String(row[8]),
    pomodoroCount: Number(row[9] ?? 0),
    archived: Number(row[10]) === 1,
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

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error
}
