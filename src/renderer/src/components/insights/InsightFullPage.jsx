// InsightFullPage.jsx — 单条洞察的详情/编辑全页(文档式)
import React from 'react';
import { FdIcon } from '@/components/primitives/Icon';
import { InsightTaskLinker } from '@/components/insights/InsightTaskLinker';

function InsightFullPage({ insight, onBack, onUpdate, onDelete, tasks, tagList, tagColors, theme }) {
  const [showTitle, setShowTitle] = React.useState(!!insight.title);
  const [title, setTitle] = React.useState(insight.title || '');
  const [content, setContent] = React.useState(insight.content || '');
  const contentRef = React.useRef(null);
  const saveTimerRef = React.useRef(null);
  const titleRef = React.useRef(title);
  const contentValRef = React.useRef(content);
  React.useEffect(() => { titleRef.current = title; }, [title]);
  React.useEffect(() => { contentValRef.current = content; }, [content]);

  React.useEffect(() => {
    setShowTitle(!!insight.title);
    setTitle(insight.title || '');
    setContent(insight.content || '');
    if (!insight.content) setTimeout(() => contentRef.current?.focus(), 100);
    // Auto-resize on load
    setTimeout(() => {
      if (contentRef.current) {
        contentRef.current.style.height = 'auto';
        contentRef.current.style.height = contentRef.current.scrollHeight + 'px';
      }
    }, 50);
  }, [insight.id]);

  // Build full diff from current refs at fire time. Previously the autoSave
  // took the latest changed field as `updates`, but a quick title→content
  // sequence within 1s would clear the title timer and only persist the
  // content update — losing the title change. Now we always recompute the
  // full diff so no in-progress edit gets dropped.
  const autoSave = React.useCallback(() => {
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      const t = titleRef.current;
      const c = contentValRef.current;
      if (!t.trim() && !c.trim()) return;
      const updates = {};
      if (t !== (insight.title || '')) updates.title = t.trim() || null;
      if (c !== (insight.content || '')) updates.content = c;
      if (Object.keys(updates).length) onUpdate(insight.id, updates);
    }, 1000);
  }, [insight.id, insight.title, insight.content, onUpdate]);

  const flushSave = React.useCallback(() => {
    clearTimeout(saveTimerRef.current);
    if (!title.trim() && !content.trim()) return;
    const updates = {};
    if (title !== (insight.title || '')) updates.title = title.trim() || null;
    if (content !== (insight.content || '')) updates.content = content;
    if (Object.keys(updates).length) onUpdate(insight.id, updates);
  }, [insight.id, title, content, insight.title, insight.content, onUpdate]);

  const handleBack = () => { flushSave(); onBack(); };

  React.useEffect(() => {
    const fn = (e) => {
      if (e.key === 'Escape') { handleBack(); e.stopPropagation(); }
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { handleBack(); e.stopPropagation(); }
    };
    window.addEventListener('keydown', fn);
    return () => { window.removeEventListener('keydown', fn); flushSave(); };
  }, [handleBack, flushSave]);

  const handleTitleChange = (v) => { setTitle(v); autoSave(); };
  const handleContentChange = (v) => { setContent(v); autoSave(); };
  const setTag = (tag) => onUpdate(insight.id, { tag: insight.tag === tag ? null : tag });
  const setLinkedTask = (taskId) => onUpdate(insight.id, { linkedTaskId: taskId });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Back bar */}
      <div style={{
        padding: '12px 24px', borderBottom: `1px solid ${theme.borderL}`,
        display: 'flex', alignItems: 'center',
      }}>
        <div onClick={handleBack} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          cursor: 'pointer', fontSize: 13.5, color: theme.accent, fontWeight: 600,
          padding: '4px 10px', borderRadius: 6, marginLeft: -10,
        }}
        onMouseEnter={e => e.currentTarget.style.background = theme.accentBg}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke={theme.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15,18 9,12 15,6" />
          </svg>
          返回 Insights
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflow: 'auto', scrollbarWidth: 'none', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 640, padding: '32px 24px 60px' }}>
          {/* Title */}
          {!showTitle ? (
            <div onClick={() => setShowTitle(true)} style={{
              fontSize: 13, color: theme.accent, cursor: 'pointer', fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 4, marginBottom: 12,
            }}>
              <FdIcon name="plus" size={13} color={theme.accent} /> 加标题
            </div>
          ) : (
            <div style={{ marginBottom: 8, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <input value={title} onChange={e => handleTitleChange(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') contentRef.current?.focus(); }}
                placeholder="标题（可选）"
                style={{
                  flex: 1, border: 'none', outline: 'none', background: 'transparent',
                  fontSize: 24, fontWeight: 700, color: theme.text, fontFamily: theme.font,
                  letterSpacing: '-0.02em', padding: 0, lineHeight: 1.3,
                }} />
              <div onClick={() => { setShowTitle(false); handleTitleChange(''); }}
                style={{ fontSize: 11, color: theme.muted, cursor: 'pointer', paddingTop: 8, whiteSpace: 'nowrap' }}>
                折叠
              </div>
            </div>
          )}

          {/* Borderless content — auto-height based on text */}
          <textarea ref={contentRef} value={content}
            onChange={e => {
              handleContentChange(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = e.target.scrollHeight + 'px';
            }}
            placeholder="记录一个想法、解决方案或经验..."
            style={{
              width: '100%', border: 'none', padding: 0,
              fontSize: 15.5, color: theme.text, fontFamily: theme.font,
              background: 'transparent', outline: 'none', resize: 'none',
              lineHeight: 1.8, minHeight: 48, overflow: 'hidden',
            }} />

          {/* Metadata section */}
          <div style={{
            marginTop: 40, paddingTop: 20,
            borderTop: `1px solid ${theme.borderL}`,
            display: 'flex', flexDirection: 'column', gap: 14,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 12, color: theme.muted, width: 56 }}>标签</span>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                {(tagList || []).map(t => {
                  const color = (tagColors || {})[t.name] || theme.accent;
                  const active = insight.tag === t.name;
                  return (
                    <div key={t.name} onClick={() => setTag(t.name)} style={{
                      padding: '4px 10px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
                      background: active ? color + '14' : theme.hov,
                      color: active ? color : theme.sub,
                      fontWeight: active ? 600 : 450,
                      border: `1px solid ${active ? color + '30' : 'transparent'}`,
                    }}>#{t.name}</div>
                  );
                })}
                {insight.tag && (
                  <div onClick={() => setTag(null)} style={{
                    padding: '4px 10px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
                    background: theme.hov, color: theme.muted,
                  }}>×</div>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 12, color: theme.muted, width: 56 }}>关联</span>
              <div style={{ flex: 1, maxWidth: 280 }}>
                <InsightTaskLinker selectedTaskId={insight.linkedTaskId} tasks={tasks} onChange={setLinkedTask} theme={theme} />
              </div>
            </div>
            <div style={{ paddingTop: 10, display: 'flex', gap: 8 }}>
              <div onClick={() => { navigator.clipboard?.writeText((insight.title ? insight.title + '\n' : '') + content); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  padding: '6px 14px', borderRadius: 6, cursor: 'pointer',
                  fontSize: 12, color: theme.sub, background: theme.hov,
                }}
                onMouseEnter={e => e.currentTarget.style.background = theme.border}
                onMouseLeave={e => e.currentTarget.style.background = theme.hov}>
                <FdIcon name="copy" size={13} color={theme.sub} /> 复制
              </div>
              <div onClick={() => { onDelete(insight.id); onBack(); }} style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '6px 14px', borderRadius: 6, cursor: 'pointer',
                fontSize: 12, color: theme.err, background: theme.errBg,
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                <FdIcon name="trash" size={13} color={theme.err} /> 删除
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { InsightFullPage };
