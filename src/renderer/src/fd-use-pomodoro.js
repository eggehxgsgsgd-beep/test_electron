// fd-use-pomodoro.js — 番茄钟计时引擎(从 focusdo-app.jsx 抽出)
// 负责:专注/休息阶段状态机、基于墙钟的倒计时(抗后台节流)、阶段切换时的
// 会话落库 / 托盘更新 / 系统通知 / 崩溃恢复快照(in-flight)。
//
// 这是个有副作用的 hook:它直接调用 window.focusDo.*(记录会话、增番茄计数、
// 写 in-flight 快照、通知、更新托盘),并把若干 App 级关注点通过回调交还调用方:
//   settings       — UI 设置对象(读 focusMin/shortBreakMin/longBreakMin、
//                    autoStart、dnd、pomodoroNotify、breakNotify)
//   applyState     — (state) => void,用后端返回的完整 FocusDoState 覆盖 App 状态
//   onMarkTaskDone — (taskId) => void,完成番茄并选择"标记任务完成"时调用
//   onFocusStart   — () => void,开始专注时的副作用(切到专注页)
// 返回:pomo 状态、pomosToday,以及一组控制函数。
import React from 'react';

export function usePomodoro({ settings, applyState, onMarkTaskDone, onFocusStart }) {
  const focusSec = (settings.focusMin || 25) * 60;
  const shortSec = (settings.shortBreakMin || 5) * 60;
  const longSec = (settings.longBreakMin || 15) * 60;

  const [pomo, setPomo] = React.useState({
    timeLeft: focusSec, totalTime: focusSec,
    phase: 'idle', taskId: null, consecutiveFocus: 0, showCompletion: false,
  });
  const [pomosToday, setPomosToday] = React.useState(0);
  const timerRef = React.useRef(null);
  const focusStartedAtRef = React.useRef(null);
  // Wall-clock anchor for the currently running phase (focus / shortBreak / longBreak).
  // The setInterval below decides timeLeft from (Date.now() - phaseStartMsRef.current)
  // rather than decrementing by 1 each tick — that way a backgrounded window
  // whose interval gets throttled to 1 Hz / 30 s still ends up displaying the
  // correct remaining time the moment it fires.
  const phaseStartMsRef = React.useRef(null);
  const phaseDurationRef = React.useRef(focusSec);
  const settingsRef = React.useRef(settings);
  React.useEffect(() => { settingsRef.current = settings; }, [settings]);

  const fireNotify = React.useCallback((flag, payload) => {
    const s = settingsRef.current;
    if (s.dnd) return;
    if (!s[flag]) return;
    // Errors propagate to the global unhandledrejection listener; no local swallow.
    window.focusDo.notify(payload);
  }, []);

  const writeInFlightFocus = (snap) => {
    // Fire-and-forget. Failures bubble to the global unhandledrejection alert.
    window.focusDo.setInFlightFocus(snap);
  };
  const computeElapsedSec = () => {
    const startMs = phaseStartMsRef.current;
    if (!startMs) return 0;
    return Math.max(0, Math.round((Date.now() - startMs) / 1000));
  };

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
          const startMs = phaseStartMsRef.current;
          const duration = phaseDurationRef.current;
          if (!startMs || !duration) return prev;
          const elapsedSec = (Date.now() - startMs) / 1000;
          const newTimeLeft = Math.max(0, Math.ceil(duration - elapsedSec));
          if (newTimeLeft > 0) {
            return prev.timeLeft === newTimeLeft ? prev : { ...prev, timeLeft: newTimeLeft };
          }
          // newTimeLeft === 0 → phase transition
          if (prev.phase === 'focus') {
            const newConsec = prev.consecutiveFocus + 1;
            const actualDuration = Math.min(prev.totalTime, Math.max(0, Math.round(elapsedSec)));
            setPomosToday(c => c + 1);
            window.focusDo.recordFocusSession({
              taskId: prev.taskId || null,
              startedAt: focusStartedAtRef.current || new Date(startMs).toISOString(),
              endedAt: new Date().toISOString(),
              plannedDuration: prev.totalTime,
              actualDuration,
              status: 'completed',
              type: 'focus',
            }).then(applyState);
            if (prev.taskId) {
              // Atomic +1 on the backend — avoids the read-modify-write race
              // where two near-simultaneous completions could both write N+1.
              window.focusDo.incrementPomodoroCount(prev.taskId).then(applyState);
            }
            focusStartedAtRef.current = null;
            phaseStartMsRef.current = null;
            writeInFlightFocus(null);
            fireNotify('pomodoroNotify', { title: '番茄完成', body: '专注时段已结束，可以休息一下。' });
            return { ...prev, timeLeft: 0, showCompletion: true, consecutiveFocus: newConsec };
          }
          // break phase ended
          fireNotify('breakNotify', { title: '休息结束', body: '准备好开始下一个番茄了吗？' });
          if (settingsRef.current.autoStart) {
            const nextStartMs = Date.now();
            focusStartedAtRef.current = new Date(nextStartMs).toISOString();
            phaseStartMsRef.current = nextStartMs;
            phaseDurationRef.current = focusSec;
            writeInFlightFocus({
              taskId: prev.taskId || null,
              startedAt: focusStartedAtRef.current,
              startedAtMs: nextStartMs,
              plannedDuration: focusSec,
            });
            return { ...prev, timeLeft: focusSec, totalTime: focusSec, phase: 'focus', showCompletion: false };
          }
          phaseStartMsRef.current = null;
          return { ...prev, timeLeft: focusSec, totalTime: focusSec, phase: 'idle' };
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [pomo.phase, pomo.showCompletion, focusSec, fireNotify]);

  const startFocus = (taskId) => {
    const nowMs = Date.now();
    const effectiveTaskId = taskId ?? pomo.taskId ?? null;
    focusStartedAtRef.current = new Date(nowMs).toISOString();
    phaseStartMsRef.current = nowMs;
    phaseDurationRef.current = focusSec;
    setPomo(p => ({
      timeLeft: focusSec, totalTime: focusSec,
      phase: 'focus', taskId: taskId ?? p.taskId,
      consecutiveFocus: p.consecutiveFocus, showCompletion: false,
    }));
    writeInFlightFocus({
      taskId: effectiveTaskId,
      startedAt: focusStartedAtRef.current,
      startedAtMs: nowMs,
      plannedDuration: focusSec,
    });
    onFocusStart();
  };
  const recordPartialFocus = () => {
    if (!focusStartedAtRef.current || pomo.phase !== 'focus') return;
    const elapsed = Math.min(pomo.totalTime, computeElapsedSec());
    window.focusDo.recordFocusSession({
      taskId: pomo.taskId || null,
      startedAt: focusStartedAtRef.current,
      endedAt: new Date().toISOString(),
      plannedDuration: pomo.totalTime,
      actualDuration: elapsed,
      status: 'abandoned',
      type: 'focus',
    }).then(applyState);
  };
  const pauseTimer = () => {
    recordPartialFocus();
    writeInFlightFocus(null);
    focusStartedAtRef.current = null;
    phaseStartMsRef.current = null;
    window.focusDo.updateTray({ running: false });
    setPomo(p => ({ ...p, phase: 'idle' }));
  };
  const resetTimer = () => {
    recordPartialFocus();
    writeInFlightFocus(null);
    focusStartedAtRef.current = null;
    phaseStartMsRef.current = null;
    window.focusDo.updateTray({ running: false });
    setPomo({
      timeLeft: focusSec, totalTime: focusSec,
      phase: 'idle', taskId: null, consecutiveFocus: 0, showCompletion: false,
    });
  };
  const skipBreak = () => {
    phaseStartMsRef.current = null;
    setPomo(p => ({ ...p, timeLeft: focusSec, totalTime: focusSec, phase: 'idle' }));
  };

  const changeTask = (id) => {
    setPomo(p => ({ ...p, taskId: id }));
    // Keep the in-flight snapshot in sync with the visible task link so a crash
    // recovery doesn't attribute the session to the task the user just unlinked.
    if (focusStartedAtRef.current && phaseStartMsRef.current) {
      writeInFlightFocus({
        taskId: id,
        startedAt: focusStartedAtRef.current,
        startedAtMs: phaseStartMsRef.current,
        plannedDuration: phaseDurationRef.current,
      });
    }
  };

  const handleCompleteTask = (markDone) => {
    if (markDone && pomo.taskId) onMarkTaskDone(pomo.taskId);
    const isLong = pomo.consecutiveFocus > 0 && pomo.consecutiveFocus % 4 === 0;
    const breakSec = isLong ? longSec : shortSec;
    phaseStartMsRef.current = Date.now();
    phaseDurationRef.current = breakSec;
    setPomo(p => ({
      ...p, timeLeft: breakSec, totalTime: breakSec,
      phase: isLong ? 'longBreak' : 'shortBreak', showCompletion: false,
    }));
  };
  const handleDismissComplete = () => handleCompleteTask(false);

  return {
    pomo,
    pomosToday,
    startFocus,
    pauseTimer,
    resetTimer,
    skipBreak,
    changeTask,
    handleCompleteTask,
    handleDismissComplete,
  };
}
