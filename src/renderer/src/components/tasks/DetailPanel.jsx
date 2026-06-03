// DetailPanel.jsx — 任务详情面板(右侧滑出)
import React from 'react';
import { FdIcon } from '@/components/primitives/Icon';
import { QUICK_PLANS, formatPlanDate } from '@/theme/themes';

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

export { DetailPanel };
