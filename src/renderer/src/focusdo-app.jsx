import React from 'react';
import ReactDOM from 'react-dom/client';
import {
  FD_THEMES, DEFAULT_TAGS, buildTagColors,
  TaskListView, FocusView, ArchiveView, Sidebar
} from './fd-ui.jsx';
import { DetailPanel, SettingsModal } from './fd-panels.jsx';
import { InsightsListView, InsightFullPage, QuickInsightModal } from './fd-insights.jsx';
import { RealStatsView } from './fd-stats.jsx';
import { usePomodoro } from './fd-use-pomodoro.js';

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
  focusScene: 'forest',
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
  // Backend Task has `completed`; UI components use `done`. Map directly — no
  // `?? false` because the type guarantees boolean.
  return {
    ...task,
    done: task.completed,
    planDate: normalizePlanDate(task.planDate),
  };
}

function toUiState(state) {
  // `state` comes from the typed IPC contract (FocusDoState). tasks/insights/
  // focusSessions/settings are always present, so we trust them directly.
  // The settings block keeps legacy-key fallbacks (focusMinutes vs focusMin,
  // theme vs themeKey) because the on-disk settings JSON may carry older keys.
  const s = state.settings;
  return {
    tasks: state.tasks.map(toUiTask),
    insights: state.insights,
    focusSessions: state.focusSessions,
    settings: {
      ...DEFAULT_SETTINGS,
      ...s,
      themeKey: s.themeKey || themeToThemeKey(s.theme),
      focusMin: s.focusMin || s.focusMinutes || 25,
      shortBreakMin: s.shortBreakMin || s.shortBreakMinutes || 5,
      longBreakMin: s.longBreakMin || s.longBreakMinutes || 15,
      tags: s.tags || DEFAULT_TAGS,
    },
  };
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

function App() {
  const [tasks, setTasks] = React.useState([]);
  const [insights, setInsights] = React.useState([]);
  const [focusSessions, setFocusSessions] = React.useState([]);
  const [settings, setSettings] = React.useState(DEFAULT_SETTINGS);
  const [activeTab, setActiveTab] = React.useState('today');
  const [selectedTaskId, setSelectedTaskId] = React.useState(null);
  const [selectedInsightId, setSelectedInsightId] = React.useState(null);
  const [showSettings, setShowSettings] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [systemThemeKey, setSystemThemeKey] = React.useState(getSystemThemeKey);
  const [insightModal, setInsightModal] = React.useState(null);
  // Bumped on Cmd/Ctrl+N — the visible TaskListView's AddTaskInput watches this
  // and focuses its <input> when the tick changes.
  const [addTaskFocusTick, setAddTaskFocusTick] = React.useState(0);

  React.useEffect(() => {
    window.focusDo.load().then((state) => {
      const ui = toUiState(state);
      setTasks(ui.tasks);
      setInsights(ui.insights);
      setFocusSessions(ui.focusSessions);
      setSettings(ui.settings);
      setLoading(false);
    }).catch((err) => {
      console.error('[FocusDo] load failed:', err);
      window.alert(`FocusDo 出错：${err?.message ?? err}`);
      setLoading(false);
    });
  }, []);

  React.useEffect(() => {
    const onRejection = (event) => {
      const reason = event.reason;
      const message = reason?.message ?? String(reason ?? '未知错误');
      console.error('[FocusDo] unhandled rejection:', reason);
      window.alert(`FocusDo 出错：${message}`);
      event.preventDefault();
    };
    window.addEventListener('unhandledrejection', onRejection);
    return () => window.removeEventListener('unhandledrejection', onRejection);
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

  const {
    pomo, pomosToday,
    startFocus, pauseTimer, resetTimer, skipBreak,
    changeTask, handleCompleteTask, handleDismissComplete,
  } = usePomodoro({
    settings,
    applyState,
    onMarkTaskDone: (taskId) => updateTask(taskId, { completed: true }),
    onFocusStart: () => setActiveTab('focus'),
  });

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
    if (!window.confirm('确定删除该任务？此操作不可恢复。')) return;
    const state = await window.focusDo.deleteTask(id);
    applyState(state);
    if (selectedTaskId === id) setSelectedTaskId(null);
  };
  const restoreTask = (id) => updateTask(id, { archived: false, completed: false });
  const updateSettings = async (updates) => {
    const prev = settings;
    const next = { ...settings, ...updates };
    setSettings(next);
    try {
      const state = await window.focusDo.updateSettings(settingsForBackend(next));
      applyState(state);
    } catch (err) {
      setSettings(prev);
      throw err;
    }
  };

  const openInsightModal = React.useCallback((linkedTaskId) => {
    setInsightModal({ defaultLinkedTaskId: linkedTaskId || null });
  }, []);
  const submitNewInsight = async ({ content, title, tag, linkedTaskId }) => {
    const prevIds = new Set(insights.map(i => i.id));
    const state = await window.focusDo.createInsight({
      content: content || '',
      title: title || null,
      linkedTaskId: linkedTaskId || null,
      tag: tag || null,
    });
    applyState(state);
    setInsightModal(null);
    const created = (state.insights || []).find(i => !prevIds.has(i.id));
    if (created) setActiveTab('insights');
  };
  const saveQuickInsight = async ({ content, linkedTaskId, tag }) => {
    // Called from the pomodoro completion dialog — content is guaranteed non-empty by caller.
    const state = await window.focusDo.createInsight({ content, linkedTaskId: linkedTaskId || null, tag: tag || null });
    applyState(state);
  };
  const updateInsight = async (id, updates) => {
    const state = await window.focusDo.updateInsight({ id, ...updates });
    applyState(state);
  };
  const deleteInsight = async (id) => {
    if (!window.confirm('确定删除该洞察？此操作不可恢复。')) return;
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
  // toUiTask 已经把 ISO 今天日期归一为 'today'，所以这里只需比对字符串。
  const todayTasks = nonArchived.filter(t => t.planDate === 'today');
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
        if (insightModal) return;  // modal handles its own Escape
        if (showSettings) { setShowSettings(false); return; }
        if (selectedTaskId) { setSelectedTaskId(null); return; }
        if (selectedInsightId) { setSelectedInsightId(null); return; }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === ',') { e.preventDefault(); setShowSettings(true); }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 'N' || e.key === 'n')) {
        e.preventDefault(); openInsightModal(null); return;
      }
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && (e.key === 'N' || e.key === 'n')) {
        e.preventDefault();
        if (activeTab !== 'today' && activeTab !== 'all') setActiveTab('today');
        setAddTaskFocusTick(n => n + 1);
        return;
      }
      const tabMap = { '1': 'today', '2': 'all', '3': 'insights', '4': 'focus', '5': 'stats' };
      if ((e.metaKey || e.ctrlKey) && tabMap[e.key]) { e.preventDefault(); setActiveTab(tabMap[e.key]); }
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [showSettings, selectedTaskId, selectedInsightId, activeTab, insightModal, openInsightModal]);

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
            onStartFocus={startFocus} onAdd={addTask} addFocusTick={addTaskFocusTick}
            selectedTaskId={selectedTaskId} theme={theme} tagColors={tagColors} />
        )}
        {activeTab === 'all' && (
          <TaskListView title="全部任务" subtitle={`${counts.all} 个待办`} tasks={allTasks}
            onToggle={toggleTask} onClick={id => setSelectedTaskId(id === selectedTaskId ? null : id)}
            onStartFocus={startFocus} onAdd={addTask} addFocusTick={addTaskFocusTick}
            selectedTaskId={selectedTaskId} theme={theme} tagColors={tagColors} />
        )}
        {activeTab === 'focus' && (
          <FocusView pomo={pomo} tasks={tasks}
            onStart={() => startFocus(pomo.taskId)}
            onPause={pauseTimer} onReset={resetTimer} onSkipBreak={skipBreak}
            onChangeTask={changeTask}
            onCompleteTask={handleCompleteTask} onDismissComplete={handleDismissComplete}
            onSaveQuickInsight={saveQuickInsight}
            focusScene={settings.focusScene || 'forest'}
            onChangeFocusScene={(scene) => updateSettings({ focusScene: scene })}
            pomosToday={pomosToday} totalFocusMin={totalFocusMin} theme={theme} />
        )}
        {activeTab === 'insights' && !selectedInsightId && (
          <InsightsListView insights={insights} tasks={tasks}
            onClickInsight={id => setSelectedInsightId(id)}
            onAdd={() => openInsightModal(null)}
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

      <QuickInsightModal open={!!insightModal}
        defaultLinkedTaskId={insightModal?.defaultLinkedTaskId || null}
        tasks={tasks} tagList={tagList} tagColors={tagColors} theme={theme}
        onSubmit={submitNewInsight} onCancel={() => setInsightModal(null)} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
