// fd-insights.jsx — FocusDo: Insights (复盘/知识沉淀) Module

/* ═══════════════════════════════════════════════════
   INSIGHT ITEM (list row)
   ═══════════════════════════════════════════════════ */

function InsightItem({ insight, onClick, isSelected, tasks, theme, tagColors }) {
  const [h, setH] = React.useState(false);
  const tc = tagColors || theme.tags;
  const linkedTask = insight.linkedTaskId ? tasks.find(t => t.id === insight.linkedTaskId) : null;

  return (
    <div onClick={() => onClick(insight.id)}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        padding: '14px 20px', cursor: 'pointer',
        background: isSelected ? theme.accentBg : (h ? theme.hov : 'transparent'),
        borderBottom: `1px solid ${theme.borderL}`,
        transition: 'background 0.1s',
      }}>
      {/* Title (if present) */}
      {insight.title && (
        <div style={{
          fontSize: 14, fontWeight: 700, color: theme.text, marginBottom: 4,
          lineHeight: 1.5,
        }}>{insight.title}</div>
      )}

      {/* Content (full display, not truncated) */}
      <div style={{
        fontSize: 13.5, color: insight.title ? theme.sub : theme.text,
        lineHeight: 1.65, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
        fontWeight: insight.title ? 400 : 450,
      }}>{insight.content}</div>

      {/* Meta: tag + linked task */}
      {(insight.tag || linkedTask) && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, marginTop: 8,
          fontSize: 12,
        }}>
          {insight.tag && (
            <span style={{ color: tc[insight.tag] || theme.sub, fontWeight: 600 }}>
              #{insight.tag}
            </span>
          )}
          {linkedTask && (
            <span onClick={e => { e.stopPropagation(); }}
              style={{
                color: theme.muted, display: 'flex', alignItems: 'center', gap: 3,
              }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                stroke={theme.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
              </svg>
              {linkedTask.title}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   INSIGHTS LIST VIEW
   ═══════════════════════════════════════════════════ */

function InsightsListView({ insights, tasks, onClickInsight, onAdd, selectedId, tagList, tagColors, theme }) {
  const [search, setSearch] = React.useState('');
  const [filterTag, setFilterTag] = React.useState(null);
  const [searchFocused, setSearchFocused] = React.useState(false);

  const filtered = React.useMemo(() => {
    let result = insights;
    if (filterTag) result = result.filter(i => i.tag === filterTag);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(i =>
        (i.title || '').toLowerCase().includes(q) ||
        (i.content || '').toLowerCase().includes(q)
      );
    }
    // Sort by createdAt descending
    return [...result].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }, [insights, filterTag, search]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '22px 24px 0' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <h1 style={{
              fontSize: 22, fontWeight: 700, color: theme.text,
              letterSpacing: '-0.02em', margin: 0, lineHeight: 1.2,
            }}>Insights</h1>
            <div style={{ fontSize: 13, color: theme.sub, marginTop: 4 }}>
              共 {insights.length} 条
            </div>
          </div>
          <div onClick={onAdd} title="新建 Insight (Ctrl+Shift+N)"
            onMouseEnter={e => { e.currentTarget.style.background = theme.hov; e.currentTarget.style.color = theme.text; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = theme.sub; }}
            style={{
              width: 30, height: 30, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: `1px solid ${theme.borderL}`,
              cursor: 'pointer', color: theme.sub,
              transition: 'background 0.15s, color 0.15s',
              userSelect: 'none', flexShrink: 0,
            }}>
            <FdIcon name="plus" size={14} color="currentColor" />
          </div>
        </div>
      </div>

      {/* Search + tag filter */}
      <div style={{ padding: '14px 20px 8px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Search */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 12px', borderRadius: 8,
          border: `1px solid ${searchFocused ? theme.accent : theme.borderL}`,
          background: theme.bg, transition: 'border-color 0.2s',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke={searchFocused ? theme.accent : theme.muted} strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)}
            placeholder="搜索 Insights…"
            style={{
              flex: 1, border: 'none', outline: 'none', background: 'transparent',
              fontSize: 13, color: theme.text, fontFamily: theme.font,
            }} />
          {search && (
            <div onClick={() => setSearch('')} style={{ cursor: 'pointer' }}>
              <FdIcon name="x" size={13} color={theme.muted} />
            </div>
          )}
        </div>

        {/* Tag filter pills */}
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          <div onClick={() => setFilterTag(null)}
            style={{
              padding: '4px 10px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
              background: !filterTag ? theme.accentBg : theme.hov,
              color: !filterTag ? theme.accent : theme.sub,
              fontWeight: !filterTag ? 600 : 450,
              border: `1px solid ${!filterTag ? theme.accent + '30' : 'transparent'}`,
            }}>全部</div>
          {(tagList || []).map(t => {
            const active = filterTag === t.name;
            const color = (tagColors || {})[t.name] || theme.accent;
            return (
              <div key={t.name} onClick={() => setFilterTag(active ? null : t.name)}
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
      </div>

      {/* List */}
      <div style={{ flex: 1, overflow: 'auto', scrollbarWidth: 'none' }}>
        {filtered.length === 0 && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', height: 160, color: theme.muted, gap: 8,
          }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none"
              stroke={theme.borderL} strokeWidth="1.5" strokeLinecap="round">
              <path d="M9 12h6M12 9v6M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span style={{ fontSize: 14 }}>
              {search ? '没有匹配的 Insight' : '还没有 Insight'}
            </span>
          </div>
        )}
        {filtered.map(ins => (
          <InsightItem key={ins.id} insight={ins} onClick={onClickInsight}
            isSelected={ins.id === selectedId} tasks={tasks}
            theme={theme} tagColors={tagColors} />
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   INSIGHT FULL PAGE VIEW (v1.2 — doc-style borderless)
   ═══════════════════════════════════════════════════ */

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

  const autoSave = React.useCallback((updates) => {
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      // Skip persistence if applying this update would leave the insight fully empty.
      // Use refs so we read the *latest* user input at fire time, not stale closure values.
      const nextTitle = 'title' in updates ? (updates.title || '') : titleRef.current;
      const nextContent = 'content' in updates ? (updates.content || '') : contentValRef.current;
      if (!String(nextTitle).trim() && !String(nextContent).trim()) return;
      onUpdate(insight.id, updates);
    }, 1000);
  }, [insight.id, onUpdate]);

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

  const handleTitleChange = (v) => { setTitle(v); autoSave({ title: v.trim() || null }); };
  const handleContentChange = (v) => { setContent(v); autoSave({ content: v }); };
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

/* ═══════════════════════════════════════════════════
   INSIGHT TASK LINKER (dropdown)
   ═══════════════════════════════════════════════════ */

function InsightTaskLinker({ selectedTaskId, tasks, onChange, theme }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  const selected = tasks.find(t => t.id === selectedTaskId);
  const available = tasks.filter(t => !t.archived);

  React.useEffect(() => {
    if (!open) return;
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div onClick={() => setOpen(!open)} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 12px', borderRadius: 7,
        border: `1px solid ${theme.borderL}`, background: theme.bg,
        cursor: 'pointer', fontSize: 13, color: selected ? theme.text : theme.muted,
      }}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
          {selected ? selected.title : '未关联任务'}
        </span>
        <FdIcon name="chevDown" size={13} color={theme.sub} />
      </div>
      {open && (
        <div className="fd-scroll" style={{
          position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
          background: theme.bg, border: `1px solid ${theme.border}`, borderRadius: 8,
          boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 10,
          overflowY: 'auto', overflowX: 'hidden', maxHeight: 220,
        }}>
          <div onClick={() => { onChange(null); setOpen(false); }}
            style={{ padding: '8px 12px', fontSize: 12, color: theme.muted, cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.background = theme.hov}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            不关联任务
          </div>
          {available.map(t => (
            <div key={t.id} onClick={() => { onChange(t.id); setOpen(false); }}
              style={{
                padding: '8px 12px', fontSize: 13, color: theme.text,
                cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => e.currentTarget.style.background = theme.hov}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              {t.title}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   QUICK INSIGHT MODAL (new-insight capture form)
   ═══════════════════════════════════════════════════ */

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

/* ═══════════════════════════════════════════════════
   EXPORTS
   ═══════════════════════════════════════════════════ */

Object.assign(window, {
  InsightItem, InsightsListView, InsightFullPage, InsightTaskLinker, QuickInsightModal,
});
