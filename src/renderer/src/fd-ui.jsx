// fd-ui.jsx — FocusDo V2: Themes, Icons, Task Components, Views

const { useState, useRef, useEffect, useCallback, useMemo } = React;

/* ═══════════════════════════════════════════════════
   THEMES
   ═══════════════════════════════════════════════════ */

const FD_THEMES = {
  clarity: {
    name: '清透', id: 'clarity',
    font: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", system-ui, sans-serif',
    mono: '"SF Mono", "Cascadia Mono", Consolas, monospace',
    bg: '#ffffff', side: '#f7f7f6', elev: '#ffffff',
    text: '#18181b', sub: '#71717a', muted: '#a1a1aa',
    accent: '#3b82f6', accentH: '#2563eb',
    accentBg: 'rgba(59,130,246,0.07)', accentGlow: 'rgba(59,130,246,0.14)',
    border: '#e4e4e7', borderL: '#f4f4f5', hov: '#f4f4f5',
    flag: '#eab308', flagBg: 'rgba(234,179,8,0.08)',
    done: '#c0c0bb', err: '#ef4444', errBg: 'rgba(239,68,68,0.06)',
    ok: '#22c55e', okBg: 'rgba(34,197,94,0.07)',
    tags: { '工作': '#3b82f6', '开发': '#10b981', '设计': '#ec4899', '个人': '#8b5cf6' },
    winShadow: '0 0 0 .5px rgba(0,0,0,.08), 0 20px 50px rgba(0,0,0,.12)',
    deskBg: 'linear-gradient(140deg, #e5e3de 0%, #d5d2cc 50%, #e0ddd8 100%)',
  },
  dusk: {
    name: '暮色', id: 'dusk',
    font: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", system-ui, sans-serif',
    mono: '"SF Mono", "Cascadia Mono", Consolas, monospace',
    bg: '#111114', side: '#18181e', elev: '#1c1c24',
    text: '#dddde4', sub: '#7e7e9a', muted: '#4a4a5e',
    accent: '#f59e0b', accentH: '#d97706',
    accentBg: 'rgba(245,158,11,0.09)', accentGlow: 'rgba(245,158,11,0.18)',
    border: '#28283a', borderL: '#1e1e2a', hov: '#20202c',
    flag: '#eab308', flagBg: 'rgba(234,179,8,0.10)',
    done: '#3e3e4c', err: '#f87171', errBg: 'rgba(248,113,113,0.08)',
    ok: '#4ade80', okBg: 'rgba(74,222,128,0.08)',
    tags: { '工作': '#60a5fa', '开发': '#34d399', '设计': '#f472b6', '个人': '#a78bfa' },
    winShadow: '0 0 0 .5px rgba(255,255,255,.04), 0 20px 50px rgba(0,0,0,.45)',
    deskBg: 'linear-gradient(140deg, #08080c 0%, #0c0c18 50%, #080810 100%)',
  },
  sage: {
    name: '青苔', id: 'sage',
    font: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", system-ui, sans-serif',
    mono: '"SF Mono", "Cascadia Mono", Consolas, monospace',
    bg: '#f7f9f4', side: '#edf2e7', elev: '#f7f9f4',
    text: '#1a2e1a', sub: '#4d6a4d', muted: '#8aaa8a',
    accent: '#2d8a4e', accentH: '#1d7a3e',
    accentBg: 'rgba(45,138,78,0.07)', accentGlow: 'rgba(45,138,78,0.14)',
    border: '#d2ddc8', borderL: '#e2ebd8', hov: '#e4ece0',
    flag: '#eab308', flagBg: 'rgba(234,179,8,0.08)',
    done: '#a0b89a', err: '#dc2626', errBg: 'rgba(220,38,38,0.06)',
    ok: '#16a34a', okBg: 'rgba(22,163,74,0.07)',
    tags: { '工作': '#2563eb', '开发': '#059669', '设计': '#db2777', '个人': '#7c3aed' },
    winShadow: '0 0 0 .5px rgba(0,0,0,.06), 0 20px 50px rgba(0,0,0,.09)',
    deskBg: 'linear-gradient(140deg, #c4d4b8 0%, #b4c8a8 50%, #c0d0b4 100%)',
  },
};

const DEFAULT_TAGS = [
  { name: '工作', color: '#3b82f6' },
  { name: '开发', color: '#10b981' },
  { name: '设计', color: '#ec4899' },
  { name: '个人', color: '#8b5cf6' },
];
const QUICK_PLANS = [
  { value: 'today', label: '今天' },
  { value: 'tomorrow', label: '明天' },
  { value: 'thisWeek', label: '本周' },
];

/* Helper: format planDate for display */
function formatPlanDate(val) {
  if (!val) return null;
  const quick = QUICK_PLANS.find(p => p.value === val);
  if (quick) return quick.label;
  // ISO date string → readable
  try {
    const d = new Date(val + 'T00:00:00');
    if (isNaN(d)) return val;
    const now = new Date(); now.setHours(0,0,0,0);
    const diff = Math.round((d - now) / 86400000);
    if (diff === 0) return '今天';
    if (diff === 1) return '明天';
    if (diff === -1) return '昨天';
    return `${d.getMonth()+1}月${d.getDate()}日`;
  } catch { return val; }
}

/* Helper: build tag color map from settings tags */
function buildTagColors(tags) {
  const map = {};
  (tags || DEFAULT_TAGS).forEach(t => { map[t.name] = t.color; });
  return map;
}

/* ═══════════════════════════════════════════════════
   SVG ICONS (compact)
   ═══════════════════════════════════════════════════ */

function FdIcon({ name, size = 16, color = 'currentColor', sw = 1.5 }) {
  const p = { fill: 'none', stroke: color, strokeWidth: sw, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const box = '0 0 24 24';
  const icons = {
    plus: <svg width={size} height={size} viewBox={box}><line x1="12" y1="5" x2="12" y2="19" {...p} /><line x1="5" y1="12" x2="19" y2="12" {...p} /></svg>,
    x: <svg width={size} height={size} viewBox={box}><line x1="6" y1="6" x2="18" y2="18" {...p} /><line x1="18" y1="6" x2="6" y2="18" {...p} /></svg>,
    check: <svg width={size} height={size} viewBox={box}><polyline points="4,12 9,17 20,6" {...p} /></svg>,
    flag: <svg width={size} height={size} viewBox={box}><path d="M4 3v18" {...p} /><path d="M4 3l12 5-12 5" {...p} fill={color} fillOpacity={0.15} /></svg>,
    play: <svg width={size} height={size} viewBox={box}><polygon points="7,4 19,12 7,20" fill={color} stroke="none" /></svg>,
    pause: <svg width={size} height={size} viewBox={box}><rect x="6" y="4" width="3" height="16" rx="1" fill={color} stroke="none" /><rect x="15" y="4" width="3" height="16" rx="1" fill={color} stroke="none" /></svg>,
    reset: <svg width={size} height={size} viewBox={box}><path d="M3 12a9 9 0 0115.4-6.3M21 12a9 9 0 01-15.4 6.3" {...p} /><path d="M18.4 2.7v3h3M5.6 21.3v-3h-3" {...p} /></svg>,
    gear: <svg width={size} height={size} viewBox={box}><circle cx="12" cy="12" r="3" {...p} /><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42m12.72-12.72l1.42-1.42" {...p} /></svg>,
    archive: <svg width={size} height={size} viewBox={box}><rect x="2" y="3" width="20" height="4" rx="1" {...p} /><path d="M4 7v11a2 2 0 002 2h12a2 2 0 002-2V7" {...p} /><path d="M10 12h4" {...p} /></svg>,
    chart: <svg width={size} height={size} viewBox={box}><rect x="4" y="12" width="3" height="8" rx="1" fill={color} stroke="none" /><rect x="10.5" y="6" width="3" height="14" rx="1" fill={color} stroke="none" /><rect x="17" y="9" width="3" height="11" rx="1" fill={color} stroke="none" /></svg>,
    trash: <svg width={size} height={size} viewBox={box}><path d="M4 7h16M10 11v6m4-6v6M6 7V5a2 2 0 012-2h8a2 2 0 012 2v2M6 7v12a2 2 0 002 2h8a2 2 0 002-2V7" {...p} /></svg>,
    copy: <svg width={size} height={size} viewBox={box}><rect x="8" y="8" width="12" height="12" rx="2" {...p} /><path d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2" {...p} /></svg>,
    chevDown: <svg width={size} height={size} viewBox={box}><polyline points="6,9 12,15 18,9" {...p} /></svg>,
    calendar: <svg width={size} height={size} viewBox={box}><rect x="3" y="4" width="18" height="18" rx="2" {...p} /><path d="M3 10h18M8 2v4m8-4v4" {...p} /></svg>,
    sun: <svg width={size} height={size} viewBox={box}><circle cx="12" cy="12" r="5" {...p} /><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42m12.72-12.72l1.42-1.42" {...p} /></svg>,
    list: <svg width={size} height={size} viewBox={box}><path d="M4 6h16M4 12h16M4 18h16" {...p} /></svg>,
    timer: <svg width={size} height={size} viewBox={box}><circle cx="12" cy="13" r="8" {...p} /><path d="M12 9v4l2.5 1.5M10 1h4" {...p} /></svg>,
    skipFwd: <svg width={size} height={size} viewBox={box}><polygon points="5,4 15,12 5,20" fill={color} stroke="none" /><line x1="19" y1="5" x2="19" y2="19" {...p} strokeWidth={2} /></svg>,
  };
  return icons[name] || null;
}

/* ═══════════════════════════════════════════════════
   TASK CHECKBOX
   ═══════════════════════════════════════════════════ */

function TaskCheckbox({ checked, onChange, theme }) {
  const [h, setH] = useState(false);
  return (
    <div onClick={e => { e.stopPropagation(); onChange(); }}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
        border: `1.5px solid ${checked ? theme.done : (h ? theme.accent : theme.border)}`,
        background: checked ? theme.done : (h ? theme.accentBg : 'transparent'),
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', transition: 'all 0.2s',
      }}>
      {checked && (
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M2 5.5l2 2L8 3.5" stroke={theme.bg} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   TASK ITEM
   ═══════════════════════════════════════════════════ */

function TaskItem({ task, onToggle, onClick, onStartFocus, isSelected, theme, tagColors }) {
  const [h, setH] = useState(false);
  const subDone = (task.subtasks || []).filter(s => s.done).length;
  const subTotal = (task.subtasks || []).length;
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

        {!task.done && (task.tag || planLabel || subTotal > 0 || task.pomodoroCount > 0) && (
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
            {subTotal > 0 && <span style={{ color: theme.muted }}>{subDone}/{subTotal}</span>}
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

function AddTaskInput({ onAdd, theme }) {
  const [val, setVal] = useState('');
  const [focused, setFocused] = useState(false);
  const ref = useRef(null);
  const submit = () => { if (val.trim()) { onAdd(val.trim()); setVal(''); } };

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

function TaskListView({ title, subtitle, tasks, onToggle, onClick, onStartFocus, onAdd, selectedTaskId, theme, tagColors }) {
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

      <AddTaskInput onAdd={onAdd} theme={theme} />

      <div style={{ flex: 1, overflow: 'auto', scrollbarWidth: 'none' }}>
        {incomplete.length === 0 && completed.length === 0 && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', height: 200, color: theme.muted, gap: 8,
          }}>
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="20" r="16" stroke={theme.borderL} strokeWidth="2" strokeDasharray="4 4" />
              <path d="M14 21l4 4 8-8" stroke={theme.muted} strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span style={{ fontSize: 14 }}>暂无任务</span>
          </div>
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

/* ═══════════════════════════════════════════════════
   CIRCULAR TIMER
   ═══════════════════════════════════════════════════ */

function CircularTimer({ timeLeft, totalTime, size = 220, running, isBreak, theme }) {
  const r = (size - 14) / 2;
  const C = 2 * Math.PI * r;
  const progress = totalTime > 0 ? Math.min(1, Math.max(0, timeLeft / totalTime)) : 1;
  const offset = C * (1 - progress);
  const m = Math.floor(timeLeft / 60);
  const s = timeLeft % 60;
  const ringColor = isBreak ? theme.ok : theme.accent;

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      {running && (
        <div style={{
          position: 'absolute', inset: -20,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${theme.accentGlow} 0%, transparent 70%)`,
          animation: 'breathe 3s ease-in-out infinite',
          pointerEvents: 'none',
        }} />
      )}
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', display: 'block', position: 'relative' }}>
        <circle cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={theme.border} strokeWidth={5} opacity={0.35} />
        <circle cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={ringColor} strokeWidth={5}
          strokeDasharray={C} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: running ? 'stroke-dashoffset 1s linear' : 'stroke-dashoffset 0.3s ease' }} />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{
          fontFamily: theme.mono, fontSize: size * 0.22, fontWeight: 600,
          color: theme.text, letterSpacing: '-0.02em',
        }}>
          {String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
        </span>
        <span style={{ fontSize: 13, color: theme.sub, marginTop: 6, fontWeight: 500 }}>
          {isBreak ? '☕ 休息中' : (running ? '专注中' : '准备就绪')}
        </span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   FOCUS BUTTON
   ═══════════════════════════════════════════════════ */

function FocusBtn({ primary, icon, label, onClick, disabled, theme, danger }) {
  const [h, setH] = useState(false);
  const bg = primary ? theme.accent : (danger ? theme.errBg : theme.hov);
  const fg = primary ? '#fff' : (danger ? theme.err : theme.text);
  return (
    <button onClick={onClick} disabled={disabled}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        padding: '9px 22px', borderRadius: 8, border: 'none',
        background: bg, color: fg,
        fontSize: 13.5, fontWeight: 600, cursor: disabled ? 'default' : 'pointer',
        fontFamily: theme.font, display: 'flex', alignItems: 'center', gap: 6,
        boxShadow: primary ? `0 3px 12px ${theme.accentGlow}` : 'none',
        transition: 'all 0.15s', opacity: disabled ? 0.5 : (h ? 0.88 : 1),
        transform: h && !disabled ? 'translateY(-1px)' : 'none',
      }}>
      {icon && <FdIcon name={icon} size={14} color={fg} />}
      {label}
    </button>
  );
}

/* ═══════════════════════════════════════════════════
   COMPLETION WITH INLINE INSIGHT INPUT
   ═══════════════════════════════════════════════════ */

function CompletionWithInsight({ taskId, taskTag, onComplete, onSaveInsight, theme, freeMode }) {
  const [showInput, setShowInput] = useState(false);
  const [insightText, setInsightText] = useState('');
  const inputRef = useRef(null);

  const handleSaveInsight = () => {
    if (insightText.trim() && onSaveInsight) {
      onSaveInsight({ content: insightText.trim(), linkedTaskId: taskId, tag: taskTag });
    }
    setInsightText('');
    setShowInput(false);
    if (freeMode) onComplete(false); else onComplete(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center', width: '100%' }}>
      {!showInput && (
        <React.Fragment>
          <div style={{ display: 'flex', gap: 10 }}>
            {freeMode ? (
              <FocusBtn primary label="好的" onClick={() => onComplete(false)} theme={theme} />
            ) : (
              <React.Fragment>
                <FocusBtn primary label="标记已完成" onClick={() => onComplete(true)} theme={theme} />
                <FocusBtn label="继续做" onClick={() => onComplete(false)} theme={theme} />
              </React.Fragment>
            )}
          </div>
          <div onClick={() => { setShowInput(true); setTimeout(() => inputRef.current?.focus(), 50); }}
            style={{
              fontSize: 12, color: theme.accent, cursor: 'pointer', fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 4, marginTop: 2,
            }}>
            <FdIcon name="plus" size={12} color={theme.accent} />
            记录 Insight
          </div>
        </React.Fragment>
      )}

      {showInput && (
        <div style={{ width: '100%', maxWidth: 300 }}>
          <textarea ref={inputRef} value={insightText}
            onChange={e => setInsightText(e.target.value)}
            onKeyDown={e => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); handleSaveInsight(); }
              if (e.key === 'Escape') { setShowInput(false); setInsightText(''); }
            }}
            placeholder="记录一个想法或经验..."
            rows={3}
            style={{
              width: '100%', border: `1px solid ${theme.accent}50`, borderRadius: 8,
              padding: '10px 12px', fontSize: 13, color: theme.text, fontFamily: theme.font,
              background: theme.bg, outline: 'none', resize: 'none', lineHeight: 1.6,
            }} />
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8,
          }}>
            <span style={{ fontSize: 11, color: theme.muted }}>⌘Enter 保存</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <div onClick={() => { setShowInput(false); setInsightText(''); }}
                style={{
                  padding: '5px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
                  color: theme.sub, background: theme.hov,
                }}>取消</div>
              <div onClick={handleSaveInsight}
                style={{
                  padding: '5px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
                  color: '#fff', background: theme.accent, fontWeight: 600,
                  opacity: insightText.trim() ? 1 : 0.5,
                }}>保存</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   FOCUS VIEW (Pomodoro)
   ═══════════════════════════════════════════════════ */

function FocusView({ pomo, tasks, onStart, onPause, onReset, onSkipBreak, onChangeTask,
  onDismissComplete, onCompleteTask, pomosToday, totalFocusMin, onSaveQuickInsight, theme }) {

  const currentTask = pomo.taskId ? (tasks || []).find(t => t.id === pomo.taskId) : null;
  const phaseLabel = {
    idle: '专注', focus: '专注中', shortBreak: '短休息', longBreak: '长休息',
  }[pomo.phase] || '专注';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%' }}>
      {/* Top stats bar */}
      <div style={{
        alignSelf: 'stretch', display: 'flex', justifyContent: 'flex-end',
        padding: '16px 24px', gap: 16, fontSize: 13, color: theme.sub,
      }}>
        <span>今日 <b style={{ color: theme.text }}>{pomosToday}</b> 个番茄</span>
        <span>累计 <b style={{ color: theme.text }}>{totalFocusMin}</b> 分钟</span>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
        <CircularTimer
          timeLeft={pomo.timeLeft} totalTime={pomo.totalTime}
          size={220} running={pomo.phase === 'focus' || pomo.phase === 'shortBreak' || pomo.phase === 'longBreak'}
          isBreak={pomo.phase === 'shortBreak' || pomo.phase === 'longBreak'}
          theme={theme} />

        {/* Current task indicator */}
        {pomo.phase === 'idle' && currentTask && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '6px 12px', borderRadius: 20,
            background: theme.accentBg, color: theme.accent,
            fontSize: 13, fontWeight: 500, maxWidth: 360,
          }}>
            <span style={{
              flex: 1, minWidth: 0, overflow: 'hidden',
              textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }} title={currentTask.title}>{currentTask.title}</span>
            <span onClick={(e) => { e.stopPropagation(); onChangeTask(null); }}
              title="取消关联任务"
              style={{
                cursor: 'pointer', color: theme.accent, opacity: 0.6,
                lineHeight: 1, padding: '0 2px',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '1'}
              onMouseLeave={e => e.currentTarget.style.opacity = '0.6'}>×</span>
          </div>
        )}
        {pomo.phase === 'idle' && !currentTask && (
          <div style={{ fontSize: 12, color: theme.muted }}>
            自由专注 · 可从任务列表点"专注"按钮以关联任务
          </div>
        )}

        {/* Running task label */}
        {pomo.phase !== 'idle' && currentTask && (
          <div style={{
            fontSize: 14, color: theme.sub, fontWeight: 500,
            maxWidth: 300, textAlign: 'center', lineHeight: 1.5,
          }}>
            {currentTask.title}
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 12 }}>
          {pomo.phase === 'idle' && (
            <FocusBtn primary icon="play" label="开始专注" onClick={onStart} theme={theme} />
          )}
          {pomo.phase === 'focus' && (
            <>
              <FocusBtn icon="pause" label="暂停" onClick={onPause} theme={theme} />
              <FocusBtn label="放弃" onClick={onReset} theme={theme} danger />
            </>
          )}
          {(pomo.phase === 'shortBreak' || pomo.phase === 'longBreak') && (
            <FocusBtn icon="skipFwd" label="跳过休息" onClick={onSkipBreak} theme={theme} />
          )}
        </div>

        {/* Pomodoro dots */}
        {pomosToday > 0 && (
          <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
            {Array.from({ length: Math.min(pomosToday, 12) }, (_, i) => (
              <div key={i} style={{
                width: 8, height: 8, borderRadius: '50%',
                background: theme.accent, opacity: 0.5 + (i / 12) * 0.5,
              }} />
            ))}
          </div>
        )}
      </div>

      {/* Completion dialog */}
      {pomo.showCompletion && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.25)', zIndex: 20,
        }}>
          <div style={{
            background: theme.bg, borderRadius: 14, padding: '28px 32px', textAlign: 'center',
            boxShadow: '0 16px 48px rgba(0,0,0,0.15)', maxWidth: 320,
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: theme.text, marginBottom: 6 }}>
              本次专注完成
            </div>
            <div style={{ fontSize: 13, color: theme.sub, marginBottom: 20 }}>
              {currentTask ? `任务：${currentTask.title}` : '自由专注'}
            </div>
            {currentTask && (
              <CompletionWithInsight
                taskId={pomo.taskId} taskTag={currentTask?.tag}
                onComplete={onCompleteTask} onSaveInsight={onSaveQuickInsight} theme={theme} />
            )}
            {!currentTask && (
              <CompletionWithInsight
                taskId={null} taskTag={null}
                onComplete={(markDone) => onDismissComplete()} onSaveInsight={onSaveQuickInsight} theme={theme}
                freeMode />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   STATS VIEW
   ═══════════════════════════════════════════════════ */

function StatCard({ label, value, sub, theme }) {
  return (
    <div style={{
      flex: 1, padding: '16px 18px', borderRadius: 10,
      border: `1px solid ${theme.borderL}`, background: theme.bg,
    }}>
      <div style={{ fontSize: 22, fontWeight: 700, color: theme.text, letterSpacing: '-0.02em' }}>{value}</div>
      <div style={{ fontSize: 12, color: theme.sub, marginTop: 3 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: theme.muted, marginTop: 1 }}>{sub}</div>}
    </div>
  );
}

/* ── GitHub-style Heatmap ── */

function Heatmap({ theme, activeHeatTab }) {
  const CELL = 13, GAP = 3, WEEKS = 20;
  const dayLabels = ['', '一', '', '三', '', '五', ''];
  const monthNames = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];

  const { grid, monthMarkers } = useMemo(() => {
    const today = new Date();
    const todayDay = today.getDay() === 0 ? 6 : today.getDay() - 1;
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - (WEEKS * 7 + todayDay));

    const cells = [];
    const mMarkers = [];
    let lastMonth = -1;

    for (let w = 0; w <= WEEKS; w++) {
      for (let d = 0; d < 7; d++) {
        const cur = new Date(startDate);
        cur.setDate(cur.getDate() + w * 7 + d);
        if (cur > today) continue;

        const dateStr = cur.toISOString().slice(0, 10);
        // Different seed per tab for visual variety
        const tabSeed = activeHeatTab === 'tasks' ? 7 : (activeHeatTab === 'insights' ? 13 : 1);
        let hash = 0;
        for (let c = 0; c < dateStr.length; c++) hash = ((hash << 5) - hash + dateStr.charCodeAt(c) * tabSeed) | 0;
        const rand = Math.abs(hash % 100);
        const isWeekend = d >= 5;
        let level;
        if (activeHeatTab === 'insights') {
          level = rand < 35 ? 0 : (rand < 60 ? 1 : (rand < 80 ? 2 : (rand < 92 ? 3 : 4)));
        } else if (isWeekend) {
          level = rand < 50 ? 0 : (rand < 75 ? 1 : 2);
        } else {
          level = rand < 20 ? 0 : (rand < 45 ? 1 : (rand < 70 ? 2 : (rand < 88 ? 3 : 4)));
        }

        cells.push({ date: dateStr, level, col: w, row: d, dateObj: cur });

        if (cur.getMonth() !== lastMonth && d <= 2) {
          if (mMarkers.length === 0 || mMarkers[mMarkers.length - 1].col < w - 1) {
            mMarkers.push({ label: monthNames[cur.getMonth()], col: w });
          }
          lastMonth = cur.getMonth();
        }
      }
    }
    return { grid: cells, monthMarkers: mMarkers };
  }, [activeHeatTab]);

  const heatColor = (level) => {
    if (theme.id === 'dusk') {
      return ['#1e1e2a', '#3b2f10', '#6b4a0a', '#c98a08', '#f59e0b'][level] || '#1e1e2a';
    }
    if (theme.id === 'sage') {
      return ['#e2ebd8', '#b8dbb8', '#6dbc6d', '#35a345', '#1a7a2e'][level] || '#e2ebd8';
    }
    // clarity
    return ['#ebedf0', '#c6dbf7', '#79b8f8', '#3b82f6', '#1d4ed8'][level] || '#ebedf0';
  };

  const [tooltip, setTooltip] = useState(null);
  const labelW = 26;
  const totalW = labelW + (WEEKS + 1) * (CELL + GAP);

  return (
    <React.Fragment>
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        {/* Month labels */}
        <div style={{ display: 'flex', marginLeft: labelW, marginBottom: 6, height: 14 }}>
          {monthMarkers.map((m, i) => (
            <div key={i} style={{
              position: 'absolute', left: labelW + m.col * (CELL + GAP),
              fontSize: 11, color: theme.muted, whiteSpace: 'nowrap',
            }}>{m.label}</div>
          ))}
        </div>

        <div style={{ display: 'flex' }}>
          {/* Day labels */}
          <div style={{
            width: labelW, flexShrink: 0,
            display: 'flex', flexDirection: 'column', gap: GAP, marginTop: 1,
          }}>
            {dayLabels.map((lbl, i) => (
              <div key={i} style={{
                height: CELL, fontSize: 10, color: theme.muted,
                display: 'flex', alignItems: 'center', lineHeight: 1,
              }}>{lbl}</div>
            ))}
          </div>

          {/* Grid */}
          <div style={{
            display: 'grid',
            gridTemplateRows: `repeat(7, ${CELL}px)`,
            gridAutoFlow: 'column',
            gridAutoColumns: `${CELL}px`,
            gap: GAP,
          }}>
            {grid.map((cell, i) => (
              <div key={i}
                onMouseEnter={(e) => {
                  const r = e.currentTarget.getBoundingClientRect();
                  setTooltip({ x: r.left + r.width / 2, y: r.top - 4, date: cell.date, level: cell.level });
                }}
                onMouseLeave={() => setTooltip(null)}
                style={{
                  width: CELL, height: CELL, borderRadius: 3,
                  background: heatColor(cell.level),
                  gridRow: cell.row + 1,
                  gridColumn: cell.col + 1,
                  cursor: 'default',
                  transition: 'outline 0.1s',
                  outline: tooltip?.date === cell.date ? `2px solid ${theme.sub}` : '2px solid transparent',
                  outlineOffset: -1,
                }} />
            ))}
          </div>
        </div>

        {/* Tooltip */}
        {tooltip && (
          <div style={{
            position: 'fixed', left: tooltip.x, top: tooltip.y,
            transform: 'translate(-50%, -100%)',
            background: theme.text, color: theme.bg,
            padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 500,
            whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: 100,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          }}>
            {tooltip.date} · {['无专注', '少量', '中等', '较多', '高强度'][tooltip.level]}
          </div>
        )}
      </div>

      {/* Legend */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 4,
        marginTop: 12, justifyContent: 'flex-end', fontSize: 11, color: theme.muted,
      }}>
        <span style={{ marginRight: 4 }}>少</span>
        {[0, 1, 2, 3, 4].map(l => (
          <div key={l} style={{
            width: 12, height: 12, borderRadius: 2,
            background: heatColor(l),
          }} />
        ))}
        <span style={{ marginLeft: 4 }}>多</span>
      </div>
    </React.Fragment>
  );
}

function StatsView({ pomosToday, totalFocusMin, insightsCount, theme }) {
  const [heatTab, setHeatTab] = React.useState('focus');
  const weekData = [
    { day: '周一', val: 4 }, { day: '周二', val: 6 }, { day: '周三', val: 3 },
    { day: '周四', val: 7 }, { day: '周五', val: 5 }, { day: '周六', val: 2 }, { day: '周日', val: 1 },
  ];
  const maxVal = Math.max(...weekData.map(d => d.val), 1);
  const tagData = [
    { tag: '工作', pct: 45 }, { tag: '开发', pct: 28 },
    { tag: '设计', pct: 18 }, { tag: '个人', pct: 9 },
  ];

  const heatTabs = [
    { id: 'focus', label: '专注时长' },
    { id: 'tasks', label: '任务完成' },
    { id: 'insights', label: 'Insights' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '22px 24px 8px' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: theme.text, letterSpacing: '-0.02em', margin: 0 }}>统计</h1>
        <div style={{ fontSize: 13, color: theme.sub, marginTop: 4 }}>你的专注数据概览</div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '12px 24px 24px', scrollbarWidth: 'none' }}>
        {/* Summary cards - 5 cards */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          <StatCard label="今日专注" value={`${pomosToday * 25}min`} theme={theme} />
          <StatCard label="本周完成" value="12" sub="任务" theme={theme} />
          <StatCard label="连续打卡" value="7" sub="天" theme={theme} />
          <StatCard label="累计番茄" value={pomosToday + 48} theme={theme} />
          <StatCard label="Insights" value={insightsCount || 0} sub={`本月 +${Math.min(insightsCount || 0, 8)}`} theme={theme} />
        </div>

        {/* Heatmap with 3 tabs */}
        <div style={{
          padding: '18px 20px', borderRadius: 10,
          border: `1px solid ${theme.borderL}`, marginBottom: 20,
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14,
          }}>
            <div style={{ display: 'flex', gap: 2, background: theme.hov, borderRadius: 7, padding: 2 }}>
              {heatTabs.map(t => (
                <div key={t.id} onClick={() => setHeatTab(t.id)} style={{
                  padding: '5px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
                  fontWeight: heatTab === t.id ? 600 : 450,
                  background: heatTab === t.id ? theme.bg : 'transparent',
                  color: heatTab === t.id ? theme.text : theme.muted,
                  boxShadow: heatTab === t.id ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.15s',
                }}>{t.label}</div>
              ))}
            </div>
            <span style={{ fontSize: 11, color: theme.muted }}>近 20 周</span>
          </div>
          <Heatmap theme={theme} activeHeatTab={heatTab} />
        </div>

        {/* Weekly trend + Tag distribution */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
          <div style={{
            flex: 1, padding: '18px 20px', borderRadius: 10,
            border: `1px solid ${theme.borderL}`,
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: theme.text, marginBottom: 16 }}>本周趋势</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 100 }}>
              {weekData.map((d, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <div style={{
                    width: '100%', maxWidth: 28, borderRadius: 4,
                    height: Math.max(6, (d.val / maxVal) * 80),
                    background: theme.accent, opacity: 0.7,
                  }} />
                  <span style={{ fontSize: 11, color: theme.muted }}>{d.day.slice(1)}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{
            flex: 1, padding: '18px 20px', borderRadius: 10,
            border: `1px solid ${theme.borderL}`,
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: theme.text, marginBottom: 16 }}>标签分布</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {tagData.map((d, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                    <span style={{ color: theme.tags[d.tag] || theme.sub, fontWeight: 600 }}>#{d.tag}</span>
                    <span style={{ color: theme.muted }}>{d.pct}%</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: theme.borderL }}>
                    <div style={{
                      height: '100%', borderRadius: 3, width: `${d.pct}%`,
                      background: theme.tags[d.tag] || theme.accent, opacity: 0.75,
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   ARCHIVE VIEW
   ═══════════════════════════════════════════════════ */

function ArchiveView({ tasks, onRestore, onDelete, theme }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '22px 24px 8px' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: theme.text, letterSpacing: '-0.02em', margin: 0 }}>已归档</h1>
        <div style={{ fontSize: 13, color: theme.sub, marginTop: 4 }}>{tasks.length} 个已归档任务</div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '0', scrollbarWidth: 'none' }}>
        {tasks.length === 0 ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', height: 200, color: theme.muted, gap: 8,
          }}>
            <FdIcon name="archive" size={32} color={theme.muted} />
            <span style={{ fontSize: 14 }}>还没有归档的任务</span>
          </div>
        ) : tasks.map(t => (
          <ArchiveItem key={t.id} task={t} onRestore={onRestore} onDelete={onDelete} theme={theme} />
        ))}
      </div>
    </div>
  );
}

function ArchiveItem({ task, onRestore, onDelete, theme }) {
  const [h, setH] = useState(false);
  return (
    <div onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 24px', borderBottom: `1px solid ${theme.borderL}`,
      }}>
      <div style={{
        width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
        background: theme.done, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M2 5.5l2 2L8 3.5" stroke={theme.bg} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, color: theme.sub, textDecoration: 'line-through', textDecorationColor: theme.done }}>
          {task.title}
        </div>
        {task.completedAt && (
          <div style={{ fontSize: 11, color: theme.muted, marginTop: 2 }}>完成于 {task.completedAt}</div>
        )}
      </div>
      {h && (
        <div style={{ display: 'flex', gap: 6 }}>
          <div onClick={() => onRestore(task.id)} style={{
            fontSize: 12, color: theme.accent, cursor: 'pointer',
            padding: '4px 10px', borderRadius: 6, background: theme.accentBg,
          }}>恢复</div>
          <div onClick={() => onDelete(task.id)} style={{
            fontSize: 12, color: theme.err, cursor: 'pointer',
            padding: '4px 10px', borderRadius: 6, background: theme.errBg,
          }}>删除</div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   EXPORTS
   ═══════════════════════════════════════════════════ */

Object.assign(window, {
  FD_THEMES, DEFAULT_TAGS, QUICK_PLANS, formatPlanDate, buildTagColors,
  FdIcon, TaskCheckbox, TaskItem, AddTaskInput, TaskListView,
  CircularTimer, FocusBtn, CompletionWithInsight, FocusView,
  StatCard, Heatmap, StatsView,
  ArchiveView, ArchiveItem,
});
