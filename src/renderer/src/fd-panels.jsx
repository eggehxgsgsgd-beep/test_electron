// fd-panels.jsx — FocusDo V2: Detail Panel + Settings Modal

/* ═══════════════════════════════════════════════════
   DETAIL PANEL
   ═══════════════════════════════════════════════════ */

function DetailPanel({ task, onClose, onUpdate, onArchive, onDelete, onStartFocus, theme, tagList, tagColors, insights, onNavigateInsight }) {
  const [title, setTitle] = React.useState(task.title);
  const [notes, setNotes] = React.useState(task.notes || '');
  const [showDatePicker, setShowDatePicker] = React.useState(false);
  const titleRef = React.useRef(null);

  React.useEffect(() => { setTitle(task.title); setNotes(task.notes || ''); }, [task.id]);

  const saveTitle = () => { if (title.trim() && title !== task.title) onUpdate(task.id, { title: title.trim() }); };
  const saveNotes = () => { if (notes !== (task.notes || '')) onUpdate(task.id, { notes }); };

  const togglePriority = () => {
    onUpdate(task.id, { priority: task.priority === 'important' ? 'normal' : 'important' });
  };
  const setTag = (tag) => onUpdate(task.id, { tag: task.tag === tag ? null : tag });
  const setPlan = (val) => onUpdate(task.id, { planDate: val });

  const relatedInsights = (insights || []).filter(i => i.linkedTaskId === task.id);

  return (
    <div style={{
      width: 320, height: '100%', display: 'flex', flexDirection: 'column',
      borderLeft: `1px solid ${theme.border}`, background: theme.elev,
      overflow: 'hidden', flexShrink: 0,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 18px', borderBottom: `1px solid ${theme.borderL}`,
      }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: theme.muted, letterSpacing: '0.04em' }}>任务详情</span>
        <div onClick={onClose} style={{ cursor: 'pointer', padding: 4, borderRadius: 6 }}
          onMouseEnter={e => e.currentTarget.style.background = theme.hov}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
          <FdIcon name="x" size={16} color={theme.sub} />
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', scrollbarWidth: 'none' }}>
        {/* Title */}
        <div style={{ padding: '16px 18px 0' }}>
          <input ref={titleRef} value={title} onChange={e => setTitle(e.target.value)}
            onBlur={saveTitle} onKeyDown={e => e.key === 'Enter' && titleRef.current?.blur()}
            style={{
              width: '100%', border: 'none', outline: 'none', background: 'transparent',
              fontSize: 17, fontWeight: 700, color: theme.text, fontFamily: theme.font,
              letterSpacing: '-0.01em', padding: 0,
            }} />
        </div>

        {/* Priority + Plan + Tag */}
        <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Priority */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 12, color: theme.sub, width: 52 }}>优先级</span>
            <div onClick={togglePriority} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 12px', borderRadius: 6, cursor: 'pointer',
              background: task.priority === 'important' ? theme.flagBg : theme.hov,
              border: `1px solid ${task.priority === 'important' ? theme.flag + '40' : theme.borderL}`,
              fontSize: 12, fontWeight: 600,
              color: task.priority === 'important' ? theme.flag : theme.sub,
              transition: 'all 0.15s',
            }}>
              <FdIcon name="flag" size={12} color={task.priority === 'important' ? theme.flag : theme.muted} />
              {task.priority === 'important' ? '重要' : '普通'}
            </div>
          </div>

          {/* Plan date */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <span style={{ fontSize: 12, color: theme.sub, width: 52, paddingTop: 5 }}>计划日</span>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', flex: 1 }}>
              {QUICK_PLANS.map(opt => {
                const active = task.planDate === opt.value;
                return (
                  <div key={opt.value} onClick={() => { setPlan(opt.value); setShowDatePicker(false); }}
                    style={{
                      padding: '4px 10px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
                      background: active ? theme.accentBg : theme.hov,
                      color: active ? theme.accent : theme.sub,
                      fontWeight: active ? 600 : 450,
                      border: `1px solid ${active ? theme.accent + '30' : 'transparent'}`,
                      transition: 'all 0.12s',
                    }}>
                    {opt.label}
                  </div>
                );
              })}
              {/* Custom date button / picker */}
              {(() => {
                const isCustom = task.planDate && !QUICK_PLANS.find(p => p.value === task.planDate) && task.planDate !== null;
                return (
                  <React.Fragment>
                    {!showDatePicker && !isCustom && (
                      <div onClick={() => setShowDatePicker(true)} style={{
                        padding: '4px 10px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
                        background: theme.hov, color: theme.sub, fontWeight: 450,
                        display: 'flex', alignItems: 'center', gap: 4,
                      }}>
                        <FdIcon name="calendar" size={11} color={theme.sub} /> 选日期
                      </div>
                    )}
                    {isCustom && !showDatePicker && (
                      <div onClick={() => setShowDatePicker(true)} style={{
                        padding: '4px 10px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
                        background: theme.accentBg, color: theme.accent, fontWeight: 600,
                        border: `1px solid ${theme.accent}30`,
                        display: 'flex', alignItems: 'center', gap: 4,
                      }}>
                        <FdIcon name="calendar" size={11} color={theme.accent} />
                        {formatPlanDate(task.planDate)}
                      </div>
                    )}
                    {showDatePicker && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <input type="date"
                          value={task.planDate && !QUICK_PLANS.find(p => p.value === task.planDate) ? task.planDate : ''}
                          onChange={e => { if (e.target.value) { setPlan(e.target.value); setShowDatePicker(false); } }}
                          style={{
                            padding: '3px 8px', borderRadius: 6, fontSize: 12,
                            border: `1px solid ${theme.accent}50`, outline: 'none',
                            background: theme.bg, color: theme.text, fontFamily: theme.font,
                          }}
                          autoFocus />
                        <div onClick={() => setShowDatePicker(false)} style={{
                          cursor: 'pointer', padding: 2, color: theme.muted,
                        }}>
                          <FdIcon name="x" size={12} color={theme.muted} />
                        </div>
                      </div>
                    )}
                  </React.Fragment>
                );
              })()}
              {/* Clear date */}
              {task.planDate && (
                <div onClick={() => { setPlan(null); setShowDatePicker(false); }} style={{
                  padding: '4px 10px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
                  background: theme.hov, color: theme.muted, fontWeight: 450,
                }}>
                  清除
                </div>
              )}
            </div>
          </div>

          {/* Tags */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <span style={{ fontSize: 12, color: theme.sub, width: 52, paddingTop: 5 }}>标签</span>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {(tagList || []).map(tag => {
                const color = (tagColors || {})[tag.name] || theme.accent;
                const active = task.tag === tag.name;
                return (
                  <div key={tag.name} onClick={() => setTag(tag.name)}
                    style={{
                      padding: '4px 10px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
                      background: active ? color + '14' : theme.hov,
                      color: active ? color : theme.sub,
                      fontWeight: active ? 600 : 450,
                      border: `1px solid ${active ? color + '30' : 'transparent'}`,
                      transition: 'all 0.12s',
                    }}>
                    #{tag.name}
                  </div>
                );
              })}
              {task.tag && (
                <div onClick={() => setTag(null)} style={{
                  padding: '4px 10px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
                  background: theme.hov, color: theme.muted, fontWeight: 450,
                }}>
                  清除
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={{ height: 1, background: theme.borderL, margin: '0 18px' }} />

        {/* Notes */}
        <div style={{ padding: '14px 18px' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: theme.sub, marginBottom: 8 }}>备注</div>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} onBlur={saveNotes}
            placeholder="添加备注（支持 Markdown）…"
            rows={4}
            style={{
              width: '100%', border: `1px solid ${theme.borderL}`, borderRadius: 8,
              padding: '10px 12px', fontSize: 13, color: theme.text, fontFamily: theme.font,
              background: theme.bg, outline: 'none', resize: 'vertical', lineHeight: 1.6,
              transition: 'border-color 0.2s',
            }}
            onFocus={e => e.target.style.borderColor = theme.accent}
            onBlurCapture={e => e.target.style.borderColor = theme.borderL} />
        </div>

        <div style={{ height: 1, background: theme.borderL, margin: '0 18px' }} />

        {/* Related Insights */}
        {relatedInsights.length > 0 && (
          <React.Fragment>
            <div style={{ height: 1, background: theme.borderL, margin: '0 18px' }} />
            <div style={{ padding: '14px 18px' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: theme.sub, marginBottom: 8 }}>
                相关 Insights · {relatedInsights.length}
              </div>
              {relatedInsights.map(ins => (
                <div key={ins.id} onClick={() => onNavigateInsight && onNavigateInsight(ins.id)}
                  style={{
                    padding: '8px 10px', borderRadius: 6, marginBottom: 4, cursor: 'pointer',
                    background: theme.hov, fontSize: 13, color: theme.text, lineHeight: 1.5,
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = theme.accentBg}
                  onMouseLeave={e => e.currentTarget.style.background = theme.hov}>
                  {ins.title || (ins.content || '').slice(0, 60) + ((ins.content || '').length > 60 ? '…' : '')}
                </div>
              ))}
            </div>
          </React.Fragment>
        )}

        <div style={{ height: 1, background: theme.borderL, margin: '0 18px' }} />

        {/* Start focus */}
        {!task.done && (
          <div style={{ padding: '14px 18px' }}>
            <div onClick={onStartFocus} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '10px', borderRadius: 8, cursor: 'pointer',
              background: theme.accentBg, color: theme.accent,
              fontSize: 13.5, fontWeight: 600, transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
              <FdIcon name="play" size={13} color={theme.accent} />
              开始专注
            </div>
            {task.pomodoroCount > 0 && (
              <div style={{ textAlign: 'center', marginTop: 8, fontSize: 12, color: theme.muted }}>
                已完成 {task.pomodoroCount} 个番茄
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom actions */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '12px 18px', borderTop: `1px solid ${theme.borderL}`,
      }}>
        <div onClick={() => onArchive(task.id)} style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
          padding: '8px', borderRadius: 6, cursor: 'pointer',
          fontSize: 12, color: theme.sub, background: theme.hov, transition: 'background 0.12s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = theme.border}
        onMouseLeave={e => e.currentTarget.style.background = theme.hov}>
          <FdIcon name="archive" size={13} color={theme.sub} />
          归档
        </div>
        <div onClick={() => onDelete(task.id)} style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
          padding: '8px', borderRadius: 6, cursor: 'pointer',
          fontSize: 12, color: theme.err, background: theme.errBg, transition: 'opacity 0.12s',
        }}
        onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
        onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
          <FdIcon name="trash" size={13} color={theme.err} />
          删除
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   SETTINGS MODAL
   ═══════════════════════════════════════════════════ */

function SettingsModal({ show, onClose, settings, onUpdateSettings, theme, allThemes }) {
  const [tab, setTab] = React.useState('appearance');
  if (!show) return null;

  const tabs = [
    { id: 'appearance', label: '外观' },
    { id: 'tags', label: '标签' },
    { id: 'pomodoro', label: '番茄钟' },
    { id: 'notification', label: '通知' },
    { id: 'shortcuts', label: '快捷键' },
    { id: 'data', label: '数据' },
    { id: 'about', label: '关于' },
  ];

  return (
    <div style={{
      position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.3)', zIndex: 50, animation: 'fadeIn 0.15s ease-out',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width: 600, height: 440, background: theme.bg, borderRadius: 14,
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)', display: 'flex', overflow: 'hidden',
        animation: 'popIn 0.2s ease-out',
      }}>
        {/* Tab nav */}
        <div style={{
          width: 160, background: theme.side, padding: '20px 10px',
          display: 'flex', flexDirection: 'column', gap: 2,
          borderRight: `1px solid ${theme.borderL}`,
        }}>
          <div style={{
            fontSize: 14, fontWeight: 700, color: theme.text, padding: '0 10px 16px',
            letterSpacing: '-0.01em',
          }}>设置</div>
          {tabs.map(t => (
            <div key={t.id} onClick={() => setTab(t.id)}
              style={{
                padding: '8px 12px', borderRadius: 7, fontSize: 13, cursor: 'pointer',
                fontWeight: tab === t.id ? 600 : 450,
                background: tab === t.id ? theme.accentBg : 'transparent',
                color: tab === t.id ? theme.accent : theme.sub,
                transition: 'all 0.12s',
              }}
              onMouseEnter={e => { if (tab !== t.id) e.currentTarget.style.background = theme.hov; }}
              onMouseLeave={e => { if (tab !== t.id) e.currentTarget.style.background = 'transparent'; }}>
              {t.label}
            </div>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: '24px 28px', overflow: 'auto', scrollbarWidth: 'none' }}>
          {tab === 'appearance' && (
            <AppearanceTab settings={settings} onUpdate={onUpdateSettings} theme={theme} allThemes={allThemes} />
          )}
          {tab === 'tags' && (
            <TagsTab settings={settings} onUpdate={onUpdateSettings} theme={theme} />
          )}
          {tab === 'pomodoro' && (
            <PomodoroTab settings={settings} onUpdate={onUpdateSettings} theme={theme} />
          )}
          {tab === 'notification' && (
            <NotificationTab settings={settings} onUpdate={onUpdateSettings} theme={theme} />
          )}
          {tab === 'shortcuts' && <ShortcutsTab theme={theme} />}
          {tab === 'data' && <DataTab theme={theme} />}
          {tab === 'about' && <AboutTab theme={theme} />}
        </div>
      </div>
    </div>
  );
}

/* ── Settings Tabs ── */

function SettingsRow({ label, desc, children, theme }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 0', borderBottom: `1px solid ${theme.borderL}`, gap: 16,
    }}>
      <div>
        <div style={{ fontSize: 13.5, fontWeight: 500, color: theme.text }}>{label}</div>
        {desc && <div style={{ fontSize: 12, color: theme.muted, marginTop: 2 }}>{desc}</div>}
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  );
}

function SettingsSlider({ value, min, max, step, unit, onChange, theme }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <input type="range" value={value} min={min} max={max} step={step}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: 120, accentColor: theme.accent }} />
      <span style={{ fontSize: 13, fontWeight: 600, color: theme.text, minWidth: 44, textAlign: 'right' }}>
        {value}{unit}
      </span>
    </div>
  );
}

function SettingsToggle({ checked, onChange, theme }) {
  return (
    <div onClick={() => onChange(!checked)} style={{
      width: 40, height: 22, borderRadius: 11, padding: 2, cursor: 'pointer',
      background: checked ? theme.accent : theme.border,
      transition: 'background 0.2s', display: 'flex', alignItems: 'center',
    }}>
      <div style={{
        width: 18, height: 18, borderRadius: '50%', background: '#fff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
        transform: checked ? 'translateX(18px)' : 'translateX(0)',
        transition: 'transform 0.2s',
      }} />
    </div>
  );
}

function AppearanceTab({ settings, onUpdate, theme, allThemes }) {
  return (
    <div>
      <div style={{ fontSize: 16, fontWeight: 700, color: theme.text, marginBottom: 16 }}>外观</div>
      <div style={{ fontSize: 12, fontWeight: 600, color: theme.sub, marginBottom: 10 }}>主题配色</div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        {Object.entries(allThemes).map(([key, t]) => (
          <div key={key} onClick={() => onUpdate({ themeKey: key })}
            style={{
              flex: 1, padding: 14, borderRadius: 10, cursor: 'pointer',
              border: `2px solid ${settings.themeKey === key ? theme.accent : theme.borderL}`,
              background: t.bg, transition: 'border-color 0.2s',
            }}>
            {/* Mini preview */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
              <div style={{ width: 20, height: 12, borderRadius: 3, background: t.side }} />
              <div style={{ flex: 1, height: 12, borderRadius: 3, background: t.border }} />
            </div>
            <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: t.accent }} />
              <div style={{ flex: 1, height: 6, borderRadius: 3, background: t.borderL }} />
            </div>
            <div style={{
              fontSize: 12, fontWeight: 600, textAlign: 'center',
              color: settings.themeKey === key ? theme.accent : theme.sub,
            }}>{t.name}</div>
          </div>
        ))}
      </div>
      <SettingsRow label="跟随系统" desc="自动切换深色/浅色模式" theme={theme}>
        <SettingsToggle checked={settings.followSystem || false}
          onChange={v => onUpdate({ followSystem: v })} theme={theme} />
      </SettingsRow>
    </div>
  );
}

const TAG_COLORS_PALETTE = [
  '#3b82f6', '#10b981', '#ec4899', '#8b5cf6', '#f59e0b',
  '#ef4444', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
  '#14b8a6', '#e11d48', '#8b5cf6', '#0ea5e9',
];

function TagsTab({ settings, onUpdate, theme }) {
  const tags = settings.tags || DEFAULT_TAGS;
  const [newName, setNewName] = React.useState('');
  const [editId, setEditId] = React.useState(null);
  const [editName, setEditName] = React.useState('');

  const addTag = () => {
    if (!newName.trim()) return;
    if (tags.find(t => t.name === newName.trim())) return;
    const usedColors = tags.map(t => t.color);
    const nextColor = TAG_COLORS_PALETTE.find(c => !usedColors.includes(c)) || TAG_COLORS_PALETTE[0];
    onUpdate({ tags: [...tags, { name: newName.trim(), color: nextColor }] });
    setNewName('');
  };
  const removeTag = (name) => onUpdate({ tags: tags.filter(t => t.name !== name) });
  const setColor = (name, color) => onUpdate({ tags: tags.map(t => t.name === name ? { ...t, color } : t) });
  const startEdit = (tag) => { setEditId(tag.name); setEditName(tag.name); };
  const saveEdit = (oldName) => {
    if (!editName.trim() || (editName.trim() !== oldName && tags.find(t => t.name === editName.trim()))) {
      setEditId(null); return;
    }
    onUpdate({ tags: tags.map(t => t.name === oldName ? { ...t, name: editName.trim() } : t) });
    setEditId(null);
  };

  return (
    <div>
      <div style={{ fontSize: 16, fontWeight: 700, color: theme.text, marginBottom: 6 }}>标签管理</div>
      <div style={{ fontSize: 12, color: theme.muted, marginBottom: 16 }}>自定义任务标签和颜色</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
        {tags.map(tag => (
          <div key={tag.name} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px', borderRadius: 8,
            border: `1px solid ${theme.borderL}`,
          }}>
            {/* Color swatches */}
            <div style={{ position: 'relative' }}>
              <div style={{
                width: 22, height: 22, borderRadius: 6, background: tag.color, cursor: 'pointer',
                border: `2px solid ${theme.bg}`, boxShadow: `0 0 0 1px ${theme.border}`,
              }} onClick={() => {
                const idx = TAG_COLORS_PALETTE.indexOf(tag.color);
                setColor(tag.name, TAG_COLORS_PALETTE[(idx + 1) % TAG_COLORS_PALETTE.length]);
              }} />
            </div>

            {/* Name */}
            {editId === tag.name ? (
              <input value={editName} onChange={e => setEditName(e.target.value)}
                onBlur={() => saveEdit(tag.name)}
                onKeyDown={e => { if (e.key === 'Enter') saveEdit(tag.name); if (e.key === 'Escape') setEditId(null); }}
                autoFocus
                style={{
                  flex: 1, border: 'none', outline: 'none', background: theme.hov,
                  padding: '3px 8px', borderRadius: 4, fontSize: 13,
                  color: theme.text, fontFamily: theme.font,
                }} />
            ) : (
              <span onDoubleClick={() => startEdit(tag)} style={{
                flex: 1, fontSize: 13, fontWeight: 500, color: theme.text, cursor: 'default',
              }}>#{tag.name}</span>
            )}

            {/* Color dots for quick pick */}
            <div style={{ display: 'flex', gap: 3 }}>
              {TAG_COLORS_PALETTE.slice(0, 6).map(c => (
                <div key={c} onClick={() => setColor(tag.name, c)} style={{
                  width: 14, height: 14, borderRadius: '50%', background: c, cursor: 'pointer',
                  border: tag.color === c ? `2px solid ${theme.text}` : `2px solid transparent`,
                  opacity: tag.color === c ? 1 : 0.5,
                  transition: 'all 0.12s',
                }} />
              ))}
            </div>

            {/* Delete */}
            <div onClick={() => removeTag(tag.name)} style={{
              cursor: 'pointer', padding: 4, borderRadius: 4, color: theme.muted,
            }}
            onMouseEnter={e => e.currentTarget.style.color = theme.err}
            onMouseLeave={e => e.currentTarget.style.color = theme.muted}>
              <FdIcon name="x" size={13} color="currentColor" />
            </div>
          </div>
        ))}
      </div>

      {/* Add new tag */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 12px', borderRadius: 8,
        border: `1px dashed ${theme.border}`,
      }}>
        <FdIcon name="plus" size={14} color={theme.muted} />
        <input value={newName} onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addTag()}
          placeholder="添加新标签…"
          style={{
            flex: 1, border: 'none', outline: 'none', background: 'transparent',
            fontSize: 13, color: theme.text, fontFamily: theme.font,
          }} />
        {newName.trim() && (
          <div onClick={addTag} style={{
            padding: '3px 10px', borderRadius: 5, fontSize: 12, fontWeight: 600,
            background: theme.accentBg, color: theme.accent, cursor: 'pointer',
          }}>添加</div>
        )}
      </div>

      <div style={{ fontSize: 11, color: theme.muted, marginTop: 10 }}>
        点击色块切换颜色 · 双击名称可编辑
      </div>
    </div>
  );
}

function PomodoroTab({ settings, onUpdate, theme }) {
  return (
    <div>
      <div style={{ fontSize: 16, fontWeight: 700, color: theme.text, marginBottom: 16 }}>番茄钟</div>
      <SettingsRow label="专注时长" desc="每个番茄的专注时间" theme={theme}>
        <SettingsSlider value={settings.focusMin || 25} min={15} max={60} step={5} unit=" 分钟"
          onChange={v => onUpdate({ focusMin: v })} theme={theme} />
      </SettingsRow>
      <SettingsRow label="短休息" desc="每个番茄之间的休息" theme={theme}>
        <SettingsSlider value={settings.shortBreakMin || 5} min={3} max={15} step={1} unit=" 分钟"
          onChange={v => onUpdate({ shortBreakMin: v })} theme={theme} />
      </SettingsRow>
      <SettingsRow label="长休息" desc="每 4 个番茄后的休息" theme={theme}>
        <SettingsSlider value={settings.longBreakMin || 15} min={10} max={30} step={5} unit=" 分钟"
          onChange={v => onUpdate({ longBreakMin: v })} theme={theme} />
      </SettingsRow>
      <SettingsRow label="自动开始下个番茄" desc="休息结束后自动开始" theme={theme}>
        <SettingsToggle checked={settings.autoStart || false}
          onChange={v => onUpdate({ autoStart: v })} theme={theme} />
      </SettingsRow>
      <SettingsRow label="提示音" desc="番茄完成时播放声音" theme={theme}>
        <SettingsToggle checked={settings.sound !== false}
          onChange={v => onUpdate({ sound: v })} theme={theme} />
      </SettingsRow>
    </div>
  );
}

function NotificationTab({ settings, onUpdate, theme }) {
  return (
    <div>
      <div style={{ fontSize: 16, fontWeight: 700, color: theme.text, marginBottom: 16 }}>通知</div>
      <SettingsRow label="番茄完成通知" desc="专注结束时发送系统通知" theme={theme}>
        <SettingsToggle checked={settings.pomodoroNotify !== false}
          onChange={v => onUpdate({ pomodoroNotify: v })} theme={theme} />
      </SettingsRow>
      <SettingsRow label="休息结束通知" desc="休息结束时提醒" theme={theme}>
        <SettingsToggle checked={settings.breakNotify !== false}
          onChange={v => onUpdate({ breakNotify: v })} theme={theme} />
      </SettingsRow>
      <SettingsRow label="勿扰模式" desc="专注期间屏蔽其他通知" theme={theme}>
        <SettingsToggle checked={settings.dnd || false}
          onChange={v => onUpdate({ dnd: v })} theme={theme} />
      </SettingsRow>
    </div>
  );
}

function ShortcutsTab({ theme }) {
  const isMac = navigator.platform?.includes('Mac');
  const mod = isMac ? '⌘' : 'Ctrl+';
  // Only list shortcuts that are actually wired in focusdo-app.jsx's keydown
  // handler. The previous "search / edit / delete / dnd-panel / up-down" lines
  // pointed to features that don't exist yet — adding them here when there's
  // no handler is exactly the "lying to the user" pattern we already cleaned
  // up in the DataTab.
  const shortcuts = [
    { key: `${mod}N`, desc: '新建任务' },
    { key: `${mod}⇧N`, desc: '新建 Insight' },
    { key: `${mod}1~5`, desc: '切换视图（今天/全部/Insights/专注/统计）' },
    { key: `${mod},`, desc: '打开设置' },
    { key: 'Esc', desc: '关闭当前面板 / 模态' },
    { key: `${mod}↩`, desc: '在 Insight 模态中保存' },
  ];
  return (
    <div>
      <div style={{ fontSize: 16, fontWeight: 700, color: theme.text, marginBottom: 16 }}>快捷键</div>
      {shortcuts.map((s, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 0', borderBottom: `1px solid ${theme.borderL}`,
        }}>
          <span style={{ fontSize: 13, color: theme.text }}>{s.desc}</span>
          <code style={{
            fontSize: 12, fontFamily: theme.mono, color: theme.sub,
            background: theme.hov, padding: '3px 8px', borderRadius: 5,
          }}>{s.key}</code>
        </div>
      ))}
    </div>
  );
}

function DataTab({ theme }) {
  const [busy, setBusy] = React.useState(false);
  const [lastPath, setLastPath] = React.useState(null);

  const onExport = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const result = await window.focusDo.exportData();
      if (result.ok) {
        setLastPath(result.path);
      } else if ('error' in result && result.error) {
        window.alert(`FocusDo 出错：${result.error}`);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div style={{ fontSize: 16, fontWeight: 700, color: theme.text, marginBottom: 16 }}>数据</div>

      <div onClick={onExport}
        onMouseEnter={e => !busy && (e.currentTarget.style.background = theme.hov)}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        style={{
          padding: '12px 14px', borderRadius: 8, marginBottom: 8,
          border: `1px solid ${theme.borderL}`,
          cursor: busy ? 'progress' : 'pointer',
          opacity: busy ? 0.6 : 1,
          transition: 'background 0.12s',
        }}>
        <div style={{ fontSize: 13.5, fontWeight: 500, color: theme.text }}>
          {busy ? '正在导出…' : '导出为 JSON'}
        </div>
        <div style={{ fontSize: 12, color: theme.muted, marginTop: 2 }}>
          导出全部任务、Insights、专注记录和设置到一个 .json 文件
        </div>
      </div>

      {lastPath && (
        <div style={{
          padding: '10px 14px', borderRadius: 8,
          background: theme.accentBg, color: theme.accent,
          fontSize: 12, lineHeight: 1.6, marginBottom: 8, wordBreak: 'break-all',
        }}>
          上次导出至：{lastPath}
        </div>
      )}

      <div style={{
        padding: '12px 14px', borderRadius: 8,
        border: `1px dashed ${theme.borderL}`, background: theme.hov,
        fontSize: 12, color: theme.muted, lineHeight: 1.6,
      }}>
        导入与备份功能尚未上线。数据保存在用户目录下的 <code>focusdo.sqlite</code>。
      </div>
    </div>
  );
}

function AboutTab({ theme }) {
  return (
    <div>
      <div style={{ fontSize: 16, fontWeight: 700, color: theme.text, marginBottom: 16 }}>关于</div>
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <div style={{
          width: 56, height: 56, borderRadius: 14, margin: '0 auto 14px',
          background: theme.accent, display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 4px 12px ${theme.accentGlow}`,
        }}>
          <span style={{ fontSize: 24, color: '#fff', fontWeight: 800 }}>F</span>
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, color: theme.text }}>FocusDo</div>
        <div style={{ fontSize: 13, color: theme.muted, marginTop: 4 }}>v{__APP_VERSION__}</div>
        <div style={{ fontSize: 13, color: theme.sub, marginTop: 12, lineHeight: 1.6 }}>
          极简任务管理 + 番茄钟专注工具
        </div>
        <div style={{ fontSize: 12, color: theme.muted, marginTop: 16 }}>
          macOS · Windows · Linux
        </div>
      </div>
      <div style={{ height: 1, background: theme.borderL, margin: '12px 0' }} />
      <div style={{ display: 'flex', justifyContent: 'center', gap: 16, fontSize: 13 }}>
        <span style={{ color: theme.accent, cursor: 'pointer' }}>检查更新</span>
        <span style={{ color: theme.accent, cursor: 'pointer' }}>反馈</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   EXPORTS
   ═══════════════════════════════════════════════════ */

Object.assign(window, {
  DetailPanel,
  SettingsModal, SettingsRow, SettingsSlider, SettingsToggle,
  AppearanceTab, TagsTab, PomodoroTab, NotificationTab, ShortcutsTab, DataTab, AboutTab,
});
