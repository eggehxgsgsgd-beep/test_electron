// FocusView.jsx — 专注/番茄族(环形计时 / 按钮 / 完成对话 / 场景背景 / 主视图)
import React from 'react';
import { FdIcon } from '@/components/primitives/Icon';
import { ConfettiOverlay } from '@/components/primitives/LottieView';
import sceneForestUrl from '@/assets/scene-forest.webp';
const { useState, useRef, useEffect } = React

// Other scenes are code-split: only `forest` is in the main bundle. Switching
// to `sea` / `mountain` fetches its WebP on demand (a few-tens-of-KB chunk).
// Other scenes are code-split: only `forest` is in the main bundle. Switching
// to `sea` / `mountain` fetches its WebP on demand (a few-tens-of-KB chunk).
const sceneLoaders = {
  forest: () => Promise.resolve(sceneForestUrl),
  sea: () => import('@/assets/scene-sea.webp').then(m => m.default),
  mountain: () => import('@/assets/scene-mountain.webp').then(m => m.default),
};

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
                onComplete={() => onDismissComplete()} onSaveInsight={onSaveQuickInsight} theme={theme}
                freeMode />
            )}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

export { FocusView };
