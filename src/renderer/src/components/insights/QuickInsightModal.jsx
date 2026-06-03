// QuickInsightModal.jsx — 快速录入洞察的弹窗表单
import React from 'react';
import { InsightTaskLinker } from '@/components/insights/InsightTaskLinker';

function QuickInsightModal({ open, defaultLinkedTaskId, tasks, tagList, tagColors, theme, onSubmit, onCancel }) {
  const [content, setContent] = React.useState('');
  const [title, setTitle] = React.useState('');
  const [showTitle, setShowTitle] = React.useState(false);
  const [tag, setTag] = React.useState(null);
  const [linkedTaskId, setLinkedTaskId] = React.useState(defaultLinkedTaskId || null);
  const [submitting, setSubmitting] = React.useState(false);
  const textareaRef = React.useRef(null);

  React.useEffect(() => {
    if (!open) return;
    setContent('');
    setTitle('');
    setShowTitle(false);
    setTag(null);
    setLinkedTaskId(defaultLinkedTaskId || null);
    setSubmitting(false);
    const t = setTimeout(() => textareaRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, [open, defaultLinkedTaskId]);

  const canSubmit = content.trim().length > 0 || title.trim().length > 0;

  const handleSubmit = React.useCallback(async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit({
        content: content.trim(),
        title: title.trim() || null,
        tag,
        linkedTaskId,
      });
    } finally {
      setSubmitting(false);
    }
  }, [canSubmit, submitting, content, title, tag, linkedTaskId, onSubmit]);

  React.useEffect(() => {
    if (!open) return;
    const fn = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); onCancel(); }
      else if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault(); e.stopPropagation();
        handleSubmit();
      }
    };
    window.addEventListener('keydown', fn, true);
    return () => window.removeEventListener('keydown', fn, true);
  }, [open, onCancel, handleSubmit]);

  if (!open) return null;

  return (
    <div onClick={onCancel} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.32)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: theme.bg, borderRadius: 12, padding: '22px 26px 20px',
        boxShadow: '0 18px 48px rgba(0,0,0,0.22)', width: 460, maxWidth: '90vw',
        fontFamily: theme.font, color: theme.text,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: theme.text }}>新建 Insight</div>
          <div onClick={onCancel} style={{
            cursor: 'pointer', color: theme.muted, fontSize: 20, lineHeight: 1, padding: '0 4px',
          }}>×</div>
        </div>

        {showTitle ? (
          <input value={title} onChange={e => setTitle(e.target.value)}
            placeholder="标题（可选）" autoFocus
            style={{
              width: '100%', border: 'none', outline: 'none', background: 'transparent',
              fontSize: 16, fontWeight: 700, color: theme.text, marginBottom: 10,
              padding: 0, fontFamily: theme.font,
            }} />
        ) : (
          <div onClick={() => setShowTitle(true)} style={{
            fontSize: 12, color: theme.accent, cursor: 'pointer', marginBottom: 10,
            display: 'inline-block', fontWeight: 600,
          }}>+ 添加标题</div>
        )}

        <textarea ref={textareaRef} value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="记录想法、复盘、知识点..."
          rows={6}
          style={{
            width: '100%', border: `1px solid ${theme.borderL}`, borderRadius: 8,
            padding: '10px 12px', fontSize: 13.5, color: theme.text, fontFamily: theme.font,
            background: theme.bg, outline: 'none', resize: 'vertical', lineHeight: 1.65,
            marginBottom: 14, boxSizing: 'border-box',
          }} />

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
          {(tagList || []).map(t => {
            const active = tag === t.name;
            const color = (tagColors || {})[t.name] || theme.accent;
            return (
              <div key={t.name} onClick={() => setTag(active ? null : t.name)}
                style={{
                  padding: '4px 10px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
                  background: active ? color + '14' : theme.hov,
                  color: active ? color : theme.sub,
                  fontWeight: active ? 600 : 450,
                  border: `1px solid ${active ? color + '30' : 'transparent'}`,
                }}>#{t.name}</div>
            );
          })}
        </div>

        <div style={{ fontSize: 12, color: theme.muted, marginBottom: 6 }}>关联任务（可选）</div>
        <div style={{ marginBottom: 18 }}>
          <InsightTaskLinker selectedTaskId={linkedTaskId} tasks={tasks}
            onChange={setLinkedTaskId} theme={theme} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: theme.muted }}>⌘Enter 保存 · Esc 取消</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <div onClick={onCancel}
              style={{
                padding: '7px 16px', borderRadius: 7, fontSize: 13, cursor: 'pointer',
                color: theme.sub, background: theme.hov,
              }}>取消</div>
            <div onClick={handleSubmit}
              style={{
                padding: '7px 16px', borderRadius: 7, fontSize: 13,
                cursor: canSubmit && !submitting ? 'pointer' : 'not-allowed',
                color: '#fff', background: theme.accent, fontWeight: 600,
                opacity: canSubmit && !submitting ? 1 : 0.5,
              }}>保存</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { QuickInsightModal };
