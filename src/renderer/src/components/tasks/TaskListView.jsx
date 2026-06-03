// TaskListView.jsx — 任务列表族(勾选框 / 任务项 / 新增输入 / 列表视图)
import React from 'react';
import { FdIcon } from '@/components/primitives/Icon';
import { EmptyState } from '@/components/primitives/EmptyState';
import { formatPlanDate } from '@/theme/themes';
import emptyTodayUrl from '@/assets/empty-today.webp';
import { LottieView } from '@/components/primitives/LottieView';
import tickLottieData from '@/assets/lottie/tick.json';
const { useState, useRef, useEffect, useMemo } = React

function TaskCheckbox({ checked, onChange, theme }) {
  const [h, setH] = useState(false);
  // `playing` is the one-shot tick animation right after the user toggles ✓.
  // It auto-clears when the lottie's `complete` event fires (~400 ms).
  const [playing, setPlaying] = useState(false);
  const prevCheckedRef = useRef(checked);

  useEffect(() => {
    // Only animate when transitioning unchecked → checked. If the prop is
    // already true on first render (page reload of a completed task) we
    // skip the animation to avoid replaying historical state.
    if (!prevCheckedRef.current && checked) setPlaying(true);
    prevCheckedRef.current = checked;
  }, [checked]);

  return (
    <div onClick={e => { e.stopPropagation(); onChange(); }}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        position: 'relative',
        width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
        border: `1.5px solid ${checked ? theme.done : (h ? theme.accent : theme.border)}`,
        background: checked ? theme.done : (h ? theme.accentBg : 'transparent'),
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', transition: 'all 0.2s',
      }}>
      {checked && !playing && (
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M2 5.5l2 2L8 3.5" stroke={theme.bg} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      {playing && (
        <LottieView data={tickLottieData} autoplay loop={false}
          onComplete={() => setPlaying(false)}
          style={{
            position: 'absolute', inset: -8,  // overshoot for the burst animation
            width: 'calc(100% + 16px)', height: 'calc(100% + 16px)',
          }} />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   TASK ITEM
   ═══════════════════════════════════════════════════ */

function TaskItem({ task, onToggle, onClick, onStartFocus, isSelected, theme, tagColors }) {
  const [h, setH] = useState(false);
  const planLabel = formatPlanDate(task.planDate);
  const tc = tagColors || theme.tags;

  return (
    <div onClick={() => onClick(task.id)}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 12,
        padding: '11px 16px', cursor: 'pointer',
        background: isSelected ? theme.accentBg : (h ? theme.hov : 'transparent'),
        borderBottom: `1px solid ${theme.borderL}`,
        transition: 'background 0.12s',
      }}>
      <div style={{ paddingTop: 2 }}>
        <TaskCheckbox checked={task.done} onChange={() => onToggle(task.id)} theme={theme} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 14, fontWeight: 500, lineHeight: 1.55,
          color: task.done ? theme.done : theme.text,
          textDecoration: task.done ? 'line-through' : 'none',
          textDecorationColor: theme.done,
          transition: 'color 0.25s',
        }}>{task.title}</div>

        {!task.done && (task.tag || planLabel || task.pomodoroCount > 0) && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, marginTop: 3,
            fontSize: 12, color: theme.sub, flexWrap: 'wrap',
          }}>
            {task.tag && (
              <span style={{ color: tc[task.tag] || theme.sub, fontWeight: 600 }}>
                #{task.tag}
              </span>
            )}
            {planLabel && <span>{planLabel}</span>}
            {task.pomodoroCount > 0 && (
              <span style={{ color: theme.muted }}>
                <span style={{ opacity: 0.7 }}>●</span> ×{task.pomodoroCount}
              </span>
            )}
          </div>
        )}
      </div>

      {task.priority === 'important' && !task.done && (
        <div style={{ alignSelf: 'center', flexShrink: 0, lineHeight: 0 }} title="重要">
          <FdIcon name="flag" size={14} color={theme.flag} />
        </div>
      )}

      {h && !task.done && onStartFocus && (
        <div onClick={e => { e.stopPropagation(); onStartFocus(task.id); }}
          style={{
            padding: '4px 10px', borderRadius: 6,
            background: theme.accentBg, color: theme.accent,
            fontSize: 12, fontWeight: 600, cursor: 'pointer',
            whiteSpace: 'nowrap', alignSelf: 'center',
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
          <FdIcon name="play" size={10} color={theme.accent} />
          专注
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   ADD TASK INPUT
   ═══════════════════════════════════════════════════ */

function AddTaskInput({ onAdd, theme, focusTick }) {
  const [val, setVal] = useState('');
  const [focused, setFocused] = useState(false);
  const ref = useRef(null);
  const submit = () => { if (val.trim()) { onAdd(val.trim()); setVal(''); } };

  // App bumps focusTick on Cmd+N — focus the input on each tick (>0 so the
  // initial mount doesn't auto-focus unexpectedly).
  useEffect(() => {
    if (focusTick && ref.current) ref.current.focus();
  }, [focusTick]);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      margin: '4px 20px 10px', padding: '10px 12px',
      borderRadius: 8,
      border: `1px solid ${focused ? theme.accent : theme.borderL}`,
      background: focused ? theme.bg : theme.hov,
      transition: 'border-color 0.15s, background 0.15s',
    }}>
      <FdIcon name="plus" size={15} color={focused ? theme.accent : theme.muted} />
      <input ref={ref} value={val} onChange={e => setVal(e.target.value)}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        onKeyDown={e => e.key === 'Enter' && submit()}
        placeholder="添加新任务…"
        style={{
          flex: 1, border: 'none', outline: 'none', background: 'transparent',
          color: theme.text, fontSize: 14, fontFamily: theme.font,
        }} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   TASK LIST VIEW (Today / All)
   ═══════════════════════════════════════════════════ */

function TaskListView({ title, subtitle, tasks, onToggle, onClick, onStartFocus, onAdd, addFocusTick, selectedTaskId, theme, tagColors }) {
  const incomplete = useMemo(() => {
    const imp = tasks.filter(t => !t.done && t.priority === 'important');
    const norm = tasks.filter(t => !t.done && t.priority !== 'important');
    return [...imp, ...norm];
  }, [tasks]);
  const completed = useMemo(() => tasks.filter(t => t.done), [tasks]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '22px 24px 10px' }}>
        <h1 style={{
          fontSize: 22, fontWeight: 700, color: theme.text,
          letterSpacing: '-0.02em', margin: 0, lineHeight: 1.2,
        }}>{title}</h1>
        {subtitle && <div style={{ fontSize: 13, color: theme.sub, marginTop: 4 }}>{subtitle}</div>}
      </div>

      <AddTaskInput onAdd={onAdd} theme={theme} focusTick={addFocusTick} />

      <div style={{ flex: 1, overflow: 'auto', scrollbarWidth: 'none' }}>
        {incomplete.length === 0 && completed.length === 0 && (
          <EmptyState src={emptyTodayUrl}
            title="今天还没有任务"
            subtitle="开始规划你的一天"
            theme={theme} />
        )}

        {incomplete.map(t => (
          <TaskItem key={t.id} task={t} onToggle={onToggle} onClick={onClick}
            onStartFocus={onStartFocus} isSelected={t.id === selectedTaskId} theme={theme} tagColors={tagColors} />
        ))}

        {completed.length > 0 && (
          <div style={{ marginTop: 4 }}>
            <div style={{
              fontSize: 11, fontWeight: 600, color: theme.muted,
              padding: '14px 16px 6px', letterSpacing: '0.05em',
            }}>已完成 · {completed.length}</div>
            {completed.map(t => (
              <TaskItem key={t.id} task={t} onToggle={onToggle} onClick={onClick}
                isSelected={t.id === selectedTaskId} theme={theme} tagColors={tagColors} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export { TaskListView };
