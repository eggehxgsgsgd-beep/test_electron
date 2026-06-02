// fd-use-focusdo-data.js — FocusDo 数据层 hook + UI↔后端映射
// 收口 App 的全部数据态(tasks/insights/focusSessions/settings)与对应的
// window.focusDo 增删改。沿用项目"每个写操作返回完整 FocusDoState、整体替换"
// 的约定:每个 mutation 内部都用 applyState 覆盖,并把后端原始 state 返回给
// 需要做后续判断的调用方(如新建 insight 后定位刚建的那条)。App 因此不再
// 直接喊数据 IPC。
//
// 边界说明:番茄钟引擎(fd-use-pomodoro.js)保留自己的引擎级 IPC(会话落库、
// 托盘、通知、in-flight 快照),它通过本 hook 提供的 applyState 回写状态;设置
// 弹窗里自包含的"导出 JSON"仍走其本地 window.focusDo.exportData。
import React from 'react';
import { DEFAULT_TAGS } from './fd-ui.jsx';

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

function themeToThemeKey(theme) {
  if (theme === 'dusk') return 'dusk';
  if (theme === 'moss' || theme === 'sage') return 'sage';
  return 'clarity';
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

function settingsForBackend(settings) {
  return {
    ...settings,
    theme: settings.themeKey === 'sage' ? 'moss' : settings.themeKey,
    focusMinutes: settings.focusMin,
    shortBreakMinutes: settings.shortBreakMin,
    longBreakMinutes: settings.longBreakMin,
  };
}

export function useFocusDoData() {
  const [tasks, setTasks] = React.useState([]);
  const [insights, setInsights] = React.useState([]);
  const [focusSessions, setFocusSessions] = React.useState([]);
  const [settings, setSettings] = React.useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = React.useState(true);

  const applyState = React.useCallback((state) => {
    const ui = toUiState(state);
    setTasks(ui.tasks);
    setInsights(ui.insights);
    setFocusSessions(ui.focusSessions);
    setSettings(ui.settings);
  }, []);

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

  // 每个 mutation 都返回后端原始 state(供调用方做后续判断),内部已 applyState。
  const createTask = async (input) => {
    const state = await window.focusDo.createTask(input);
    applyState(state);
    return state;
  };
  const updateTask = async (id, updates) => {
    const payload = { id, ...updates };
    if ('done' in payload) {
      payload.completed = payload.done;
      delete payload.done;
    }
    const state = await window.focusDo.updateTask(payload);
    applyState(state);
    return state;
  };
  const deleteTask = async (id) => {
    const state = await window.focusDo.deleteTask(id);
    applyState(state);
    return state;
  };
  const createInsight = async (input) => {
    const state = await window.focusDo.createInsight(input);
    applyState(state);
    return state;
  };
  const updateInsight = async (id, updates) => {
    const state = await window.focusDo.updateInsight({ id, ...updates });
    applyState(state);
    return state;
  };
  const deleteInsight = async (id) => {
    const state = await window.focusDo.deleteInsight(id);
    applyState(state);
    return state;
  };
  const updateSettings = async (updates) => {
    // 乐观更新:先本地切换,失败再回滚。settingsForBackend 把 UI 词汇映射回后端。
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

  return {
    tasks,
    insights,
    focusSessions,
    settings,
    loading,
    applyState,
    createTask,
    updateTask,
    deleteTask,
    createInsight,
    updateInsight,
    deleteInsight,
    updateSettings,
  };
}
