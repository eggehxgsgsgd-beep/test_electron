// fd-ui.jsx — FocusDo V2: Themes, Icons, Task Components, Views
import lottie from 'lottie-web';
import sceneForestUrl from './assets/scene-forest.webp';
import emptyTodayUrl from './assets/empty-today.webp';
import tickLottieData from './assets/lottie/tick.json';

// Confetti is ~600 KB — lazy-load only when the first pomodoro finishes.
let confettiLottieDataPromise = null;
const loadConfettiData = () => {
  if (!confettiLottieDataPromise) {
    confettiLottieDataPromise = import('./assets/lottie/confetti.json').then((m) => m.default);
  }
  return confettiLottieDataPromise;
};

// Other scenes are code-split: only `forest` is in the main bundle. Switching
// to `sea` / `mountain` fetches its WebP on demand (a few-tens-of-KB chunk).
const sceneLoaders = {
  forest: () => Promise.resolve(sceneForestUrl),
  sea: () => import('./assets/scene-sea.webp').then(m => m.default),
  mountain: () => import('./assets/scene-mountain.webp').then(m => m.default),
};

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

/* ═══════════════════════════════════════════════════
   LOTTIE (one-shot animation player)
   ═══════════════════════════════════════════════════ */

function LottieView({ data, loop = false, autoplay = true, onComplete, style }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !data) return;
    const anim = lottie.loadAnimation({
      container: containerRef.current,
      renderer: 'svg',
      loop,
      autoplay,
      animationData: data,
    });
    if (onComplete) anim.addEventListener('complete', onComplete);
    return () => anim.destroy();
  }, [data, loop, autoplay]);

  return <div ref={containerRef} style={{ pointerEvents: 'none', ...style }} />;
}

function ConfettiOverlay() {
  // Lazy-loads the heavy confetti JSON the first time it's needed. While the
  // fetch is in flight the overlay renders nothing — confetti is purely
  // decorative, so a brief delay before it appears is acceptable.
  const [data, setData] = useState(null);
  useEffect(() => {
    let cancelled = false;
    loadConfettiData().then((d) => { if (!cancelled) setData(d); });
    return () => { cancelled = true; };
  }, []);
  if (!data) return null;
  return (
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none',
      zIndex: 25,  // above the dim overlay (20) so confetti renders in front
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <LottieView data={data} autoplay loop={false}
        style={{ width: 480, height: 480 }} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   EMPTY STATE (shared illustration card)
   ═══════════════════════════════════════════════════ */

function EmptyState({ src, title, subtitle, theme }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '100%', minHeight: 280,
      padding: '32px 20px', gap: 4, textAlign: 'center',
    }}>
      <img src={src} width={200} height={200} alt=""
        style={{ objectFit: 'contain', userSelect: 'none' }} />
      <div style={{ fontSize: 15, fontWeight: 600, color: theme.text, marginTop: 12 }}>
        {title}
      </div>
      <div style={{ fontSize: 13, color: theme.muted, marginTop: 2 }}>
        {subtitle}
      </div>
    </div>
  );
}

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

function FocusBackground({ sceneKey, theme }) {
  const [bgUrl, setBgUrl] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // Hide immediately so the outgoing scene fades out before the new URL swaps in.
    setVisible(false);
    const loader = sceneLoaders[sceneKey] || sceneLoaders.forest;
    Promise.resolve(loader()).then((url) => {
      if (cancelled) return;
      setBgUrl(url);
      // requestAnimationFrame so the new URL has rendered before opacity ramps up.
      requestAnimationFrame(() => { if (!cancelled) setVisible(true); });
    });
    return () => { cancelled = true; };
  }, [sceneKey]);

  // Dusk is the only dark theme; needs higher opacity to read against dark bg.
  const opacity = theme.id === 'dusk' ? 0.22 : 0.12;

  return (
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
      backgroundImage: bgUrl ? `url(${bgUrl})` : 'none',
      backgroundSize: 'cover', backgroundPosition: 'center',
      opacity: visible ? opacity : 0,
      transition: 'opacity 150ms ease',
    }} />
  );
}

function SceneThumb({ url, label, isCurrent, onClick, theme }) {
  const [hov, setHov] = useState(false);
  return (
    <div onClick={onClick} title={label}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        width: 38, height: 38, borderRadius: '50%', cursor: 'pointer', flexShrink: 0,
        backgroundImage: url ? `url(${url})` : 'none',
        backgroundColor: theme.hov,
        backgroundSize: 'cover', backgroundPosition: 'center',
        border: isCurrent ? `2px solid ${theme.accent}` : `1px solid ${theme.borderL}`,
        boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
        transition: 'border-color 0.15s, transform 0.15s',
        transform: hov ? 'scale(1.07)' : 'scale(1)',
      }} />
  );
}

const SCENE_LIST = [
  { key: 'forest', label: '森林' },
  { key: 'sea', label: '海边' },
  { key: 'mountain', label: '高山' },
];

function SceneSwitcher({ current, onChange, theme }) {
  const [open, setOpen] = useState(false);
  const [urls, setUrls] = useState({ forest: sceneForestUrl, sea: null, mountain: null });
  const closeTimerRef = useRef(null);

  useEffect(() => {
    // Lazy-load thumbnails the first time the switcher opens. Once cached,
    // subsequent opens are instant.
    if (!open) return;
    if (!urls.sea) sceneLoaders.sea().then((u) => setUrls((s) => ({ ...s, sea: u })));
    if (!urls.mountain) sceneLoaders.mountain().then((u) => setUrls((s) => ({ ...s, mountain: u })));
  }, [open]);

  const cancelClose = () => { clearTimeout(closeTimerRef.current); closeTimerRef.current = null; };
  const scheduleClose = () => {
    cancelClose();
    closeTimerRef.current = setTimeout(() => setOpen(false), 2000);
  };

  const currentLabel = SCENE_LIST.find((s) => s.key === current)?.label ?? '森林';
  const others = SCENE_LIST.filter((s) => s.key !== current);

  return (
    <div onMouseEnter={() => { cancelClose(); setOpen(true); }}
      onMouseLeave={scheduleClose}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
      {open && others.map((s) => (
        <SceneThumb key={s.key}
          url={urls[s.key]}
          label={s.label}
          isCurrent={false}
          onClick={() => { onChange(s.key); cancelClose(); scheduleClose(); }}
          theme={theme} />
      ))}
      <SceneThumb url={urls[current]} label={currentLabel}
        isCurrent={true}
        onClick={() => { cancelClose(); setOpen((o) => !o); }}
        theme={theme} />
    </div>
  );
}

function FocusView({ pomo, tasks, onStart, onPause, onReset, onSkipBreak, onChangeTask,
  onDismissComplete, onCompleteTask, pomosToday, totalFocusMin, onSaveQuickInsight,
  focusScene, onChangeFocusScene, theme }) {

  const currentTask = pomo.taskId ? (tasks || []).find(t => t.id === pomo.taskId) : null;
  const phaseLabel = {
    idle: '专注', focus: '专注中', shortBreak: '短休息', longBreak: '长休息',
  }[pomo.phase] || '专注';

  return (
    <div style={{ position: 'relative', height: '100%', overflow: 'hidden' }}>
      <FocusBackground sceneKey={focusScene || 'forest'} theme={theme} />

      <div style={{
        position: 'relative', zIndex: 1, height: '100%',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}>
      {/* Top bar: scene switcher on the left, focus stats on the right */}
      <div style={{
        alignSelf: 'stretch', display: 'flex', justifyContent: 'space-between',
        alignItems: 'center',
        padding: '14px 22px 12px', fontSize: 13, color: theme.sub,
      }}>
        <SceneSwitcher current={focusScene || 'forest'}
          onChange={onChangeFocusScene} theme={theme} />
        <div style={{ display: 'flex', gap: 16 }}>
          <span>今日 <b style={{ color: theme.text }}>{pomosToday}</b> 个番茄</span>
          <span>累计 <b style={{ color: theme.text }}>{totalFocusMin}</b> 分钟</span>
        </div>
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

      {/* Completion dialog + confetti overlay (confetti lottie is lazy-loaded) */}
      {pomo.showCompletion && <ConfettiOverlay />}
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
  FdIcon, LottieView, EmptyState, TaskCheckbox, TaskItem, AddTaskInput, TaskListView,
  CircularTimer, FocusBtn, CompletionWithInsight, FocusView,
  ArchiveView, ArchiveItem,
});
