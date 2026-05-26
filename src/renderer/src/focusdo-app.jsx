const DEFAULT_SETTINGS = {
  themeKey: 'clarity',
  focusMin: 25,
  shortBreakMin: 5,
  longBreakMin: 15,
  autoStart: false,
  sound: true,
  pomodoroNotify: true,
  breakNotify: true,
  dnd: false,
  followSystem: false,
  tags: DEFAULT_TAGS,
};

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function normalizePlanDate(planDate) {
  if (planDate === todayKey()) return 'today';
  return planDate;
}

function toUiTask(task) {
  return {
    ...task,
    done: task.done ?? task.completed ?? false,
    planDate: normalizePlanDate(task.planDate),
    pomodoroCount: task.pomodoroCount ?? 0,
  };
}

function toUiState(state) {
  return {
    tasks: (state.tasks || []).map(toUiTask),
    insights: state.insights || [],
    focusSessions: state.focusSessions || [],
    settings: {
      ...DEFAULT_SETTINGS,
      ...(state.settings || {}),
      themeKey: state.settings?.themeKey || themeToThemeKey(state.settings?.theme),
      focusMin: state.settings?.focusMin || state.settings?.focusMinutes || 25,
      shortBreakMin: state.settings?.shortBreakMin || state.settings?.shortBreakMinutes || 5,
      longBreakMin: state.settings?.longBreakMin || state.settings?.longBreakMinutes || 15,
      tags: state.settings?.tags || DEFAULT_TAGS,
    },
  };
}

function statDateKey(input) {
  if (!input) return null;
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return String(input).slice(0, 10);
  return date.toISOString().slice(0, 10);
}

function statStartOfDay(date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function statAddDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function statMinutes(seconds) {
  return Math.round((seconds || 0) / 60);
}

function statCompletedTasks(tasks) {
  return (tasks || []).filter(t => t.done || t.completed);
}

function statGroupByDate(items, getDate, getValue = () => 1) {
  const map = {};
  items.forEach(item => {
    const key = statDateKey(getDate(item));
    if (!key) return;
    map[key] = (map[key] || 0) + getValue(item);
  });
  return map;
}

function statStreak(focusSessions) {
  const days = new Set((focusSessions || [])
    .filter(s => s.type === 'focus' && s.status === 'completed')
    .map(s => statDateKey(s.startedAt))
    .filter(Boolean));
  let count = 0;
  let cursor = statStartOfDay(new Date());
  while (days.has(statDateKey(cursor))) {
    count += 1;
    cursor = statAddDays(cursor, -1);
  }
  return count;
}

function RealStatCard({ label, value, sub, theme }) {
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

function RealHeatmap({ theme, activeHeatTab, tasks, insights, focusSessions }) {
  const CELL = 13, GAP = 3, WEEKS = 20;
  const dayLabels = ['', '一', '', '三', '', '五', ''];
  const monthNames = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
  const [tooltip, setTooltip] = React.useState(null);

  const valueMaps = React.useMemo(() => ({
    focus: statGroupByDate(
      focusSessions.filter(s => s.type === 'focus' && s.status === 'completed'),
      s => s.startedAt,
      s => statMinutes(s.actualDuration)
    ),
    tasks: statGroupByDate(statCompletedTasks(tasks), t => t.completedAt),
    insights: statGroupByDate(insights, i => i.createdAt),
  }), [tasks, insights, focusSessions]);

  const { grid, monthMarkers, maxValue } = React.useMemo(() => {
    const today = statStartOfDay(new Date());
    const todayDay = today.getDay() === 0 ? 6 : today.getDay() - 1;
    const startDate = statAddDays(today, -(WEEKS * 7 + todayDay));
    const map = valueMaps[activeHeatTab] || {};
    const cells = [];
    const markers = [];
    let lastMonth = -1;
    let max = 0;
    for (let w = 0; w <= WEEKS; w++) {
      for (let d = 0; d < 7; d++) {
        const cur = statAddDays(startDate, w * 7 + d);
        if (cur > today) continue;
        const key = statDateKey(cur);
        const value = map[key] || 0;
        max = Math.max(max, value);
        cells.push({ date: key, value, col: w, row: d });
        if (cur.getMonth() !== lastMonth && d <= 2) {
          if (markers.length === 0 || markers[markers.length - 1].col < w - 1) {
            markers.push({ label: monthNames[cur.getMonth()], col: w });
          }
          lastMonth = cur.getMonth();
        }
      }
    }
    return { grid: cells, monthMarkers: markers, maxValue: max };
  }, [activeHeatTab, valueMaps]);

  const levelForValue = (value) => {
    if (!value || !maxValue) return 0;
    if (value <= maxValue * 0.25) return 1;
    if (value <= maxValue * 0.5) return 2;
    if (value <= maxValue * 0.75) return 3;
    return 4;
  };
  const heatColor = (level) => {
    if (theme.id === 'dusk') return ['#1e1e2a', '#3b2f10', '#6b4a0a', '#c98a08', '#f59e0b'][level] || '#1e1e2a';
    if (theme.id === 'sage') return ['#e2ebd8', '#b8dbb8', '#6dbc6d', '#35a345', '#1a7a2e'][level] || '#e2ebd8';
    return ['#ebedf0', '#c6dbf7', '#79b8f8', '#3b82f6', '#1d4ed8'][level] || '#ebedf0';
  };
  const metricLabel = activeHeatTab === 'focus' ? '分钟' : '条';
  const labelW = 26;

  return (
    <React.Fragment>
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', marginLeft: labelW, marginBottom: 6, height: 14 }}>
          {monthMarkers.map((m, i) => (
            <div key={i} style={{
              position: 'absolute', left: labelW + m.col * (CELL + GAP),
              fontSize: 11, color: theme.muted, whiteSpace: 'nowrap',
            }}>{m.label}</div>
          ))}
        </div>
        <div style={{ display: 'flex' }}>
          <div style={{ width: labelW, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: GAP, marginTop: 1 }}>
            {dayLabels.map((lbl, i) => (
              <div key={i} style={{ height: CELL, fontSize: 10, color: theme.muted, display: 'flex', alignItems: 'center', lineHeight: 1 }}>{lbl}</div>
            ))}
          </div>
          <div style={{
            display: 'grid',
            gridTemplateRows: `repeat(7, ${CELL}px)`,
            gridAutoFlow: 'column',
            gridAutoColumns: `${CELL}px`,
            gap: GAP,
          }}>
            {grid.map((cell, i) => {
              const level = levelForValue(cell.value);
              return (
                <div key={i}
                  onMouseEnter={(e) => {
                    const r = e.currentTarget.getBoundingClientRect();
                    setTooltip({ x: r.left + r.width / 2, y: r.top - 4, date: cell.date, value: cell.value });
                  }}
                  onMouseLeave={() => setTooltip(null)}
                  style={{
                    width: CELL, height: CELL, borderRadius: 3,
                    background: heatColor(level),
                    cursor: 'default',
                    outline: tooltip?.date === cell.date ? `2px solid ${theme.sub}` : '2px solid transparent',
                    outlineOffset: -1,
                  }} />
              );
            })}
          </div>
        </div>
        {tooltip && (
          <div style={{
            position: 'fixed', left: tooltip.x, top: tooltip.y,
            transform: 'translate(-50%, -100%)',
            background: theme.text, color: theme.bg,
            padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 500,
            whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: 100,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          }}>
            {tooltip.date} · {tooltip.value || 0}{metricLabel}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 12, justifyContent: 'flex-end', fontSize: 11, color: theme.muted }}>
        <span style={{ marginRight: 4 }}>少</span>
        {[0, 1, 2, 3, 4].map(level => (
          <div key={level} style={{ width: 12, height: 12, borderRadius: 2, background: heatColor(level) }} />
        ))}
        <span style={{ marginLeft: 4 }}>多</span>
      </div>
    </React.Fragment>
  );
}

function RealStatsView({ tasks = [], insights = [], focusSessions = [], theme }) {
  const [heatTab, setHeatTab] = React.useState('focus');
  const today = statDateKey(new Date());
  const weekStart = statAddDays(statStartOfDay(new Date()), -((new Date().getDay() + 6) % 7));
  const weekDays = Array.from({ length: 7 }, (_, i) => statAddDays(weekStart, i));
  const weekKeys = new Set(weekDays.map(statDateKey));
  const completed = statCompletedTasks(tasks);
  const completedThisWeek = completed.filter(t => weekKeys.has(statDateKey(t.completedAt))).length;
  const focusCompleted = focusSessions.filter(s => s.type === 'focus' && s.status === 'completed');
  const focusTodayMin = statMinutes(focusCompleted.filter(s => statDateKey(s.startedAt) === today).reduce((sum, s) => sum + (s.actualDuration || 0), 0));
  const totalPomos = focusCompleted.length;
  const streak = statStreak(focusSessions);
  const monthInsights = insights.filter(i => {
    const d = new Date(i.createdAt);
    const now = new Date();
    return !Number.isNaN(d.getTime()) && d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).length;
  const focusByDay = statGroupByDate(focusCompleted, s => s.startedAt, s => statMinutes(s.actualDuration));
  const weekData = weekDays.map(d => {
    const key = statDateKey(d);
    return { day: ['日','一','二','三','四','五','六'][d.getDay()], val: focusByDay[key] || 0 };
  });
  const maxVal = Math.max(...weekData.map(d => d.val), 1);
  const tagTotals = {};
  tasks.forEach(t => { if (t.tag) tagTotals[t.tag] = (tagTotals[t.tag] || 0) + 1; });
  insights.forEach(i => { if (i.tag) tagTotals[i.tag] = (tagTotals[i.tag] || 0) + 1; });
  const totalTagged = Object.values(tagTotals).reduce((sum, value) => sum + value, 0);
  const tagData = Object.entries(tagTotals)
    .map(([tag, count]) => ({ tag, count, pct: totalTagged ? Math.round((count / totalTagged) * 100) : 0 }))
    .sort((a, b) => b.count - a.count);
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
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          <RealStatCard label="今日专注" value={`${focusTodayMin}min`} theme={theme} />
          <RealStatCard label="本周完成" value={completedThisWeek} sub="任务" theme={theme} />
          <RealStatCard label="连续打卡" value={streak} sub="天" theme={theme} />
          <RealStatCard label="累计番茄" value={totalPomos} theme={theme} />
          <RealStatCard label="Insights" value={insights.length || 0} sub={`本月 +${monthInsights}`} theme={theme} />
        </div>
        <div style={{ padding: '18px 20px', borderRadius: 10, border: `1px solid ${theme.borderL}`, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', gap: 2, background: theme.hov, borderRadius: 7, padding: 2 }}>
              {heatTabs.map(tab => (
                <div key={tab.id} onClick={() => setHeatTab(tab.id)} style={{
                  padding: '5px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
                  fontWeight: heatTab === tab.id ? 600 : 450,
                  background: heatTab === tab.id ? theme.bg : 'transparent',
                  color: heatTab === tab.id ? theme.text : theme.muted,
                  boxShadow: heatTab === tab.id ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.15s',
                }}>{tab.label}</div>
              ))}
            </div>
            <span style={{ fontSize: 11, color: theme.muted }}>近 20 周</span>
          </div>
          <RealHeatmap theme={theme} activeHeatTab={heatTab} tasks={tasks} insights={insights} focusSessions={focusSessions} />
        </div>
        <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
          <div style={{ flex: 1, padding: '18px 20px', borderRadius: 10, border: `1px solid ${theme.borderL}` }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: theme.text, marginBottom: 16 }}>本周趋势</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 100 }}>
              {weekData.map((item, index) => (
                <div key={index} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <div style={{
                    width: '100%', maxWidth: 28, borderRadius: 4,
                    height: item.val ? Math.max(6, (item.val / maxVal) * 80) : 6,
                    background: theme.accent, opacity: item.val ? 0.7 : 0.16,
                  }} />
                  <span style={{ fontSize: 11, color: theme.muted }}>{item.day}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ flex: 1, padding: '18px 20px', borderRadius: 10, border: `1px solid ${theme.borderL}` }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: theme.text, marginBottom: 16 }}>标签分布</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {tagData.length === 0 && <div style={{ fontSize: 13, color: theme.muted }}>暂无标签数据</div>}
              {tagData.map((item, index) => (
                <div key={index}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                    <span style={{ color: theme.tags[item.tag] || theme.sub, fontWeight: 600 }}>#{item.tag}</span>
                    <span style={{ color: theme.muted }}>{item.pct}%</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: theme.borderL }}>
                    <div style={{ height: '100%', borderRadius: 3, width: `${item.pct}%`, background: theme.tags[item.tag] || theme.accent, opacity: 0.75 }} />
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

function themeToThemeKey(theme) {
  if (theme === 'dusk') return 'dusk';
  if (theme === 'moss' || theme === 'sage') return 'sage';
  return 'clarity';
}

function settingsForBackend(settings) {
  return {
    ...settings,
    theme: settings.themeKey === 'sage' ? 'moss' : settings.themeKey,
    focusMinutes: settings.focusMin,
    shortBreakMinutes: settings.shortBreakMin,
    longBreakMinutes: settings.longBreakMin,
  };
}

function getSystemThemeKey() {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dusk' : 'clarity';
}

function Sidebar({ activeTab, onTabChange, counts, pomo, onOpenSettings, theme }) {
  const [hovItem, setHovItem] = React.useState(null);
  const pomoRunning = pomo.phase === 'focus' || pomo.phase === 'shortBreak' || pomo.phase === 'longBreak';
  const pomoM = Math.floor(pomo.timeLeft / 60);
  const pomoS = pomo.timeLeft % 60;

  const navItems = [
    { id: 'today', label: '今天', count: counts.today, dotColor: theme.accent },
    { id: 'all', label: '全部任务', count: counts.all },
    { id: 'insights', label: 'Insights' },
    { id: 'focus', label: '专注', dotColor: pomoRunning ? theme.err || '#ef4444' : undefined,
      extra: pomoRunning ? `${String(pomoM).padStart(2,'0')}:${String(pomoS).padStart(2,'0')}` : null },
    { id: 'stats', label: '统计' },
  ];

  return (
    <div style={{
      width: 180, flexShrink: 0, background: theme.side, display: 'flex', flexDirection: 'column',
      borderRight: `1px solid ${theme.borderL}`, userSelect: 'none', padding: '12px 8px',
    }}>
      <div style={{ display: 'flex', gap: 8, padding: '6px 10px 20px' }}>
        {['#ff5f57', '#febc2e', '#28c840'].map((c, i) => (
          <div key={i} style={{ width: 12, height: 12, borderRadius: '50%', background: c }} />
        ))}
      </div>

      <div style={{
        fontSize: 18, fontWeight: 700, color: theme.text, padding: '0 10px 24px',
        letterSpacing: '-0.03em',
      }}>FocusDo</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {navItems.map(item => {
          const active = activeTab === item.id;
          const hovered = hovItem === item.id;
          return (
            <div key={item.id} onClick={() => onTabChange(item.id)}
              onMouseEnter={() => setHovItem(item.id)} onMouseLeave={() => setHovItem(null)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 10px', borderRadius: 7, cursor: 'pointer',
                background: active ? theme.accentBg : (hovered ? theme.hov : 'transparent'),
                transition: 'background 0.1s',
              }}>
              <div style={{
                width: 7, height: 7, borderRadius: '50%',
                background: active ? theme.accent : (item.dotColor || theme.muted),
                transition: 'background 0.15s',
                animation: item.id === 'focus' && pomoRunning ? 'breathe 2s ease-in-out infinite' : 'none',
              }} />
              <span style={{
                flex: 1, fontSize: 13.5, fontWeight: active ? 600 : 450,
                color: active ? theme.text : theme.sub,
              }}>{item.label}</span>
              {item.extra && (
                <span style={{
                  fontSize: 11, fontFamily: theme.mono, fontWeight: 600,
                  color: item.dotColor || theme.muted,
                }}>{item.extra}</span>
              )}
              {item.count > 0 && !item.extra && (
                <span style={{ fontSize: 11, fontWeight: 600, color: theme.muted }}>{item.count}</span>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ height: 1, background: theme.borderL, margin: '12px 10px' }} />

      <div onClick={() => onTabChange('archive')}
        onMouseEnter={() => setHovItem('archive')} onMouseLeave={() => setHovItem(null)}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '8px 10px', borderRadius: 7, cursor: 'pointer',
          background: activeTab === 'archive' ? theme.accentBg : (hovItem === 'archive' ? theme.hov : 'transparent'),
          transition: 'background 0.1s',
        }}>
        <div style={{
          width: 7, height: 7, borderRadius: '50%',
          background: activeTab === 'archive' ? theme.accent : theme.muted,
        }} />
        <span style={{
          flex: 1, fontSize: 13.5, fontWeight: activeTab === 'archive' ? 600 : 450,
          color: activeTab === 'archive' ? theme.text : theme.sub,
        }}>已归档</span>
        {counts.archived > 0 && (
          <span style={{ fontSize: 11, fontWeight: 600, color: theme.muted }}>{counts.archived}</span>
        )}
      </div>

      <div style={{ flex: 1 }} />

      <div onClick={onOpenSettings}
        onMouseEnter={() => setHovItem('settings')} onMouseLeave={() => setHovItem(null)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 10px', borderRadius: 7, cursor: 'pointer',
          background: hovItem === 'settings' ? theme.hov : 'transparent',
          transition: 'background 0.1s',
        }}>
        <FdIcon name="gear" size={16} color={theme.sub} />
        <span style={{ fontSize: 13, color: theme.sub }}>设置</span>
      </div>
    </div>
  );
}

function App() {
  const [tasks, setTasks] = React.useState([]);
  const [insights, setInsights] = React.useState([]);
  const [focusSessions, setFocusSessions] = React.useState([]);
  const [settings, setSettings] = React.useState(DEFAULT_SETTINGS);
  const [activeTab, setActiveTab] = React.useState('today');
  const [selectedTaskId, setSelectedTaskId] = React.useState(null);
  const [selectedInsightId, setSelectedInsightId] = React.useState(null);
  const [showSettings, setShowSettings] = React.useState(false);
  const [pomosToday, setPomosToday] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [systemThemeKey, setSystemThemeKey] = React.useState(getSystemThemeKey);

  React.useEffect(() => {
    window.focusDo.load().then((state) => {
      const ui = toUiState(state);
      setTasks(ui.tasks);
      setInsights(ui.insights);
      setFocusSessions(ui.focusSessions);
      setSettings(ui.settings);
      setLoading(false);
    });
  }, []);

  const applyState = React.useCallback((state) => {
    const ui = toUiState(state);
    setTasks(ui.tasks);
    setInsights(ui.insights);
    setFocusSessions(ui.focusSessions);
    setSettings(ui.settings);
  }, []);

  React.useEffect(() => {
    const media = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!media) return;
    const update = () => setSystemThemeKey(getSystemThemeKey());
    update();
    media.addEventListener?.('change', update);
    return () => media.removeEventListener?.('change', update);
  }, []);

  const effectiveThemeKey = settings.followSystem ? systemThemeKey : settings.themeKey;
  const theme = FD_THEMES[effectiveThemeKey] || FD_THEMES.clarity;
  const tagList = settings.tags || DEFAULT_TAGS;
  const tagColors = buildTagColors(tagList);
  const focusSec = (settings.focusMin || 25) * 60;
  const shortSec = (settings.shortBreakMin || 5) * 60;
  const longSec = (settings.longBreakMin || 15) * 60;

  const [pomo, setPomo] = React.useState({
    timeLeft: focusSec, totalTime: focusSec,
    phase: 'idle', taskId: null, consecutiveFocus: 0, showCompletion: false,
  });
  const timerRef = React.useRef(null);
  const focusStartedAtRef = React.useRef(null);

  React.useEffect(() => {
    if (pomo.phase === 'idle') {
      setPomo(p => ({ ...p, timeLeft: focusSec, totalTime: focusSec }));
    }
  }, [focusSec]);

  React.useEffect(() => {
    const running = pomo.phase === 'focus' || pomo.phase === 'shortBreak' || pomo.phase === 'longBreak';
    const label = `${String(Math.floor(pomo.timeLeft / 60)).padStart(2, '0')}:${String(pomo.timeLeft % 60).padStart(2, '0')}`;
    window.focusDo.updateTray({ running, label, phase: pomo.phase });
    if (running && !pomo.showCompletion) {
      timerRef.current = setInterval(() => {
        setPomo(prev => {
          if (prev.timeLeft <= 1) {
            if (prev.phase === 'focus') {
              const newConsec = prev.consecutiveFocus + 1;
              setPomosToday(c => c + 1);
              window.focusDo.recordFocusSession({
                taskId: prev.taskId || null,
                startedAt: focusStartedAtRef.current || new Date(Date.now() - prev.totalTime * 1000).toISOString(),
                endedAt: new Date().toISOString(),
                plannedDuration: prev.totalTime,
                actualDuration: prev.totalTime - prev.timeLeft + 1,
                status: 'completed',
                type: 'focus',
              }).then(applyState);
              if (prev.taskId) {
                const task = tasks.find(t => t.id === prev.taskId);
                if (task) updateTask(prev.taskId, { pomodoroCount: (task.pomodoroCount || 0) + 1 });
              }
              return { ...prev, timeLeft: 0, showCompletion: true, consecutiveFocus: newConsec };
            }
            return { ...prev, timeLeft: focusSec, totalTime: focusSec, phase: 'idle' };
          }
          return { ...prev, timeLeft: prev.timeLeft - 1 };
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [pomo.phase, pomo.showCompletion, focusSec, tasks]);

  const startFocus = (taskId) => {
    focusStartedAtRef.current = new Date().toISOString();
    setPomo(p => ({
      timeLeft: focusSec, totalTime: focusSec,
      phase: 'focus', taskId: taskId ?? p.taskId,
      consecutiveFocus: p.consecutiveFocus, showCompletion: false,
    }));
    setActiveTab('focus');
  };
  const pauseTimer = () => {
    window.focusDo.updateTray({ running: false });
    setPomo(p => ({ ...p, phase: 'idle' }));
  };
  const resetTimer = () => {
    if (focusStartedAtRef.current && pomo.phase === 'focus') {
      window.focusDo.recordFocusSession({
        taskId: pomo.taskId || null,
        startedAt: focusStartedAtRef.current,
        endedAt: new Date().toISOString(),
        plannedDuration: pomo.totalTime,
        actualDuration: Math.max(0, pomo.totalTime - pomo.timeLeft),
        status: 'abandoned',
        type: 'focus',
      }).then(applyState);
    }
    focusStartedAtRef.current = null;
    window.focusDo.updateTray({ running: false });
    setPomo({
      timeLeft: focusSec, totalTime: focusSec,
      phase: 'idle', taskId: null, consecutiveFocus: 0, showCompletion: false,
    });
  };
  const skipBreak = () => setPomo(p => ({ ...p, timeLeft: focusSec, totalTime: focusSec, phase: 'idle' }));

  const handleCompleteTask = (markDone) => {
    if (markDone && pomo.taskId) updateTask(pomo.taskId, { completed: true });
    const isLong = pomo.consecutiveFocus > 0 && pomo.consecutiveFocus % 4 === 0;
    const breakSec = isLong ? longSec : shortSec;
    setPomo(p => ({
      ...p, timeLeft: breakSec, totalTime: breakSec,
      phase: isLong ? 'longBreak' : 'shortBreak', showCompletion: false,
    }));
  };
  const handleDismissComplete = () => handleCompleteTask(false);

  const toggleTask = (id) => {
    const task = tasks.find(t => t.id === id);
    if (task) updateTask(id, { completed: !task.done });
  };
  const addTask = async (title) => {
    const state = await window.focusDo.createTask({ title, planDate: activeTab === 'today' ? 'today' : null });
    applyState(state);
  };
  const updateTask = async (id, updates) => {
    const payload = { id, ...updates };
    if ('done' in payload) {
      payload.completed = payload.done;
      delete payload.done;
    }
    const state = await window.focusDo.updateTask(payload);
    applyState(state);
  };
  const archiveTask = (id) => {
    updateTask(id, { archived: true });
    if (selectedTaskId === id) setSelectedTaskId(null);
  };
  const deleteTask = async (id) => {
    const state = await window.focusDo.deleteTask(id);
    applyState(state);
    if (selectedTaskId === id) setSelectedTaskId(null);
  };
  const restoreTask = (id) => updateTask(id, { archived: false, completed: false });
  const updateSettings = async (updates) => {
    const next = { ...settings, ...updates };
    setSettings(next);
    const state = await window.focusDo.updateSettings(settingsForBackend(next));
    applyState(state);
  };

  const addInsight = async (linkedTaskId) => {
    const state = await window.focusDo.createInsight({ linkedTaskId: linkedTaskId || null, content: '' });
    const ui = toUiState(state);
    setTasks(ui.tasks);
    setInsights(ui.insights);
    setFocusSessions(ui.focusSessions);
    setSettings(ui.settings);
    setSelectedInsightId(ui.insights[0]?.id || null);
    setActiveTab('insights');
  };
  const saveQuickInsight = async ({ content, linkedTaskId, tag }) => {
    const state = await window.focusDo.createInsight({ content, linkedTaskId: linkedTaskId || null, tag: tag || null });
    applyState(state);
  };
  const updateInsight = async (id, updates) => {
    const state = await window.focusDo.updateInsight({ id, ...updates });
    applyState(state);
  };
  const deleteInsight = async (id) => {
    const state = await window.focusDo.deleteInsight(id);
    applyState(state);
    if (selectedInsightId === id) setSelectedInsightId(null);
  };
  const navigateToInsight = (insId) => {
    setActiveTab('insights');
    setSelectedInsightId(insId);
    setSelectedTaskId(null);
  };

  const nonArchived = tasks.filter(t => !t.archived);
  const todayTasks = nonArchived.filter(t => t.planDate === 'today' || t.planDate === todayKey());
  const allTasks = nonArchived;
  const archivedTasks = tasks.filter(t => t.archived);
  const incompleteTasks = nonArchived.filter(t => !t.done);
  const counts = {
    today: todayTasks.filter(t => !t.done).length,
    all: incompleteTasks.length,
    archived: archivedTasks.length,
  };
  const selectedTask = selectedTaskId ? tasks.find(t => t.id === selectedTaskId) : null;
  const dateStr = new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' });
  const totalFocusMin = pomosToday * (settings.focusMin || 25);

  React.useEffect(() => { document.body.style.background = theme.deskBg; }, [theme.deskBg]);

  React.useEffect(() => {
    const fn = (e) => {
      if (e.key === 'Escape') {
        if (showSettings) { setShowSettings(false); return; }
        if (selectedTaskId) { setSelectedTaskId(null); return; }
        if (selectedInsightId) { setSelectedInsightId(null); return; }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === ',') { e.preventDefault(); setShowSettings(true); }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'N') {
        e.preventDefault(); addInsight(null);
      }
      const tabMap = { '1': 'today', '2': 'all', '3': 'insights', '4': 'focus', '5': 'stats' };
      if ((e.metaKey || e.ctrlKey) && tabMap[e.key]) { e.preventDefault(); setActiveTab(tabMap[e.key]); }
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [showSettings, selectedTaskId, selectedInsightId, activeTab]);

  if (loading) {
    return (
      <div style={{
        width: '100vw', height: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', color: '#71717a', fontFamily: FD_THEMES.clarity.font,
      }}>加载 FocusDo...</div>
    );
  }

  return (
    <div style={{
      width: '100vw', height: '100vh', overflow: 'hidden',
      background: theme.bg,
      display: 'flex', fontFamily: theme.font, color: theme.text,
      transition: 'background 0.4s',
      position: 'relative',
    }}>
      <Sidebar activeTab={activeTab} onTabChange={tab => {
          setActiveTab(tab);
          if (tab !== 'today' && tab !== 'all') setSelectedTaskId(null);
          if (tab !== 'insights') setSelectedInsightId(null);
        }}
        counts={counts} pomo={pomo} onOpenSettings={() => setShowSettings(true)} theme={theme} />

      <div key={activeTab} style={{
        flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden',
        position: 'relative',
      }}>
        {activeTab === 'today' && (
          <TaskListView title="今天" subtitle={dateStr} tasks={todayTasks}
            onToggle={toggleTask} onClick={id => setSelectedTaskId(id === selectedTaskId ? null : id)}
            onStartFocus={startFocus} onAdd={addTask} selectedTaskId={selectedTaskId} theme={theme} tagColors={tagColors} />
        )}
        {activeTab === 'all' && (
          <TaskListView title="全部任务" subtitle={`${counts.all} 个待办`} tasks={allTasks}
            onToggle={toggleTask} onClick={id => setSelectedTaskId(id === selectedTaskId ? null : id)}
            onStartFocus={startFocus} onAdd={addTask} selectedTaskId={selectedTaskId} theme={theme} tagColors={tagColors} />
        )}
        {activeTab === 'focus' && (
          <FocusView pomo={pomo} incompleteTasks={incompleteTasks}
            onStart={() => startFocus(pomo.taskId)}
            onPause={pauseTimer} onReset={resetTimer} onSkipBreak={skipBreak}
            onChangeTask={id => setPomo(p => ({ ...p, taskId: id }))}
            onCompleteTask={handleCompleteTask} onDismissComplete={handleDismissComplete}
            onSaveQuickInsight={saveQuickInsight}
            pomosToday={pomosToday} totalFocusMin={totalFocusMin} theme={theme} />
        )}
        {activeTab === 'insights' && !selectedInsightId && (
          <InsightsListView insights={insights} tasks={tasks}
            onClickInsight={id => setSelectedInsightId(id)}
            onAdd={() => addInsight(null)}
            selectedId={selectedInsightId}
            tagList={tagList} tagColors={tagColors} theme={theme} />
        )}
        {activeTab === 'insights' && selectedInsightId && (() => {
          const ins = insights.find(i => i.id === selectedInsightId);
          return ins ? (
            <InsightFullPage insight={ins}
              onBack={() => setSelectedInsightId(null)}
              onUpdate={updateInsight}
              onDelete={deleteInsight}
              tasks={tasks}
              tagList={tagList} tagColors={tagColors} theme={theme} />
          ) : null;
        })()}
        {activeTab === 'stats' && (
          <RealStatsView tasks={tasks} insights={insights}
            focusSessions={focusSessions} theme={theme} />
        )}
        {activeTab === 'archive' && (
          <ArchiveView tasks={archivedTasks} onRestore={restoreTask} onDelete={deleteTask} theme={theme} />
        )}
      </div>

      {(() => {
        const showTaskPanel = selectedTask && !selectedTask.archived && (activeTab === 'today' || activeTab === 'all');
        const panelWidth = showTaskPanel ? 320 : 0;

        return (
          <div style={{
            width: panelWidth,
            minWidth: panelWidth,
            overflow: 'hidden', transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.25s cubic-bezier(0.4, 0, 0.2, 1)', flexShrink: 0,
          }}>
            {showTaskPanel && (
              <DetailPanel task={selectedTask}
                onClose={() => setSelectedTaskId(null)}
                onUpdate={updateTask}
                tagList={tagList} tagColors={tagColors}
                insights={insights}
                onNavigateInsight={navigateToInsight}
                onArchive={archiveTask}
                onDelete={deleteTask}
                onStartFocus={() => startFocus(selectedTask.id)}
                theme={theme} />
            )}
          </div>
        );
      })()}

      <SettingsModal show={showSettings} onClose={() => setShowSettings(false)}
        settings={settings} onUpdateSettings={updateSettings}
        theme={theme} allThemes={FD_THEMES} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
