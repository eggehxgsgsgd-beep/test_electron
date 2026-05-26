import { FormEvent, ReactElement, useEffect, useMemo, useState } from 'react'
import type { Todo } from '../../shared/todo'

type Filter = 'all' | 'active' | 'completed'

export function App(): ReactElement {
  const [todos, setTodos] = useState<Todo[]>([])
  const [newTitle, setNewTitle] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    window.todos
      .list()
      .then(setTodos)
      .catch(() => setError('读取待办失败，请重启应用后再试。'))
      .finally(() => setLoading(false))
  }, [])

  const visibleTodos = useMemo(() => {
    if (filter === 'active') {
      return todos.filter((todo) => !todo.completed)
    }

    if (filter === 'completed') {
      return todos.filter((todo) => todo.completed)
    }

    return todos
  }, [filter, todos])

  const remainingCount = todos.filter((todo) => !todo.completed).length

  async function handleCreate(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()

    const title = newTitle.trim()
    if (!title) {
      return
    }

    try {
      setError(null)
      setTodos(await window.todos.create({ title }))
      setNewTitle('')
    } catch {
      setError('新增待办失败。')
    }
  }

  async function handleToggle(todo: Todo): Promise<void> {
    try {
      setError(null)
      setTodos(await window.todos.update({ id: todo.id, completed: !todo.completed }))
    } catch {
      setError('更新待办状态失败。')
    }
  }

  async function handleRename(todo: Todo, title: string): Promise<void> {
    const nextTitle = title.trim()
    if (!nextTitle || nextTitle === todo.title) {
      return
    }

    try {
      setError(null)
      setTodos(await window.todos.update({ id: todo.id, title: nextTitle }))
    } catch {
      setError('重命名待办失败。')
    }
  }

  async function handleDelete(id: string): Promise<void> {
    try {
      setError(null)
      setTodos(await window.todos.delete(id))
    } catch {
      setError('删除待办失败。')
    }
  }

  return (
    <main className="app-shell">
      <section className="hero">
        <p className="eyebrow">Electron 学习项目</p>
        <h1>桌面待办清单</h1>
        <p className="hero-copy">
          一个最小但完整的 Electron 应用：React 负责界面，preload 暴露安全 API，主进程负责把数据保存到本地。
        </p>
      </section>

      <section className="todo-panel" aria-label="Todo list">
        <form className="todo-form" onSubmit={handleCreate}>
          <input
            value={newTitle}
            onChange={(event) => setNewTitle(event.target.value)}
            placeholder="输入一个待办事项，例如：学习 IPC 通信"
            aria-label="新的待办事项"
          />
          <button type="submit">添加</button>
        </form>

        <div className="toolbar">
          <span>{remainingCount} 个未完成</span>
          <div className="filters" aria-label="筛选待办">
            <FilterButton active={filter === 'all'} onClick={() => setFilter('all')}>
              全部
            </FilterButton>
            <FilterButton active={filter === 'active'} onClick={() => setFilter('active')}>
              未完成
            </FilterButton>
            <FilterButton active={filter === 'completed'} onClick={() => setFilter('completed')}>
              已完成
            </FilterButton>
          </div>
        </div>

        {error ? <p className="error">{error}</p> : null}

        {loading ? (
          <p className="empty-state">正在读取本地数据...</p>
        ) : visibleTodos.length === 0 ? (
          <p className="empty-state">还没有待办，先添加一条吧。</p>
        ) : (
          <ul className="todo-list">
            {visibleTodos.map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onToggle={handleToggle}
                onRename={handleRename}
                onDelete={handleDelete}
              />
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}

function FilterButton({
  active,
  children,
  onClick
}: {
  active: boolean
  children: string
  onClick: () => void
}): ReactElement {
  return (
    <button className={active ? 'filter active' : 'filter'} type="button" onClick={onClick}>
      {children}
    </button>
  )
}

function TodoItem({
  todo,
  onToggle,
  onRename,
  onDelete
}: {
  todo: Todo
  onToggle: (todo: Todo) => Promise<void>
  onRename: (todo: Todo, title: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
}): ReactElement {
  const [draftTitle, setDraftTitle] = useState(todo.title)

  useEffect(() => {
    setDraftTitle(todo.title)
  }, [todo.title])

  return (
    <li className={todo.completed ? 'todo-item completed' : 'todo-item'}>
      <label className="check-row">
        <input checked={todo.completed} type="checkbox" onChange={() => onToggle(todo)} />
        <span className="sr-only">切换完成状态</span>
      </label>
      <input
        className="todo-title"
        value={draftTitle}
        onBlur={() => onRename(todo, draftTitle)}
        onChange={(event) => setDraftTitle(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.currentTarget.blur()
          }
        }}
      />
      <button className="delete-button" type="button" onClick={() => onDelete(todo.id)}>
        删除
      </button>
    </li>
  )
}
