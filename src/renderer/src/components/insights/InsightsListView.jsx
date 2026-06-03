// InsightsListView.jsx — Insights 列表视图(含列表项 InsightItem)
import React from 'react';
import { FdIcon } from '@/components/primitives/Icon';
import { EmptyState } from '@/components/primitives/EmptyState';
import emptyInsightsUrl from '@/assets/empty-insights.webp';

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
    // Sort by createdAt descending. createdAt is NOT NULL TEXT per schema, so
    // no fallback needed.
    return [...result].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
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
        {/* Truly empty (zero records) — full illustration */}
        {insights.length === 0 && (
          <EmptyState src={emptyInsightsUrl}
            title="还没有 Insights"
            subtitle="记录你的第一个想法"
            theme={theme} />
        )}
        {/* Has data but current filter/search returns nothing — small hint */}
        {insights.length > 0 && filtered.length === 0 && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', height: 160, color: theme.muted, gap: 8,
          }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none"
              stroke={theme.borderL} strokeWidth="1.5" strokeLinecap="round">
              <path d="M9 12h6M12 9v6M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span style={{ fontSize: 14 }}>没有匹配的 Insight</span>
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

export { InsightsListView };
