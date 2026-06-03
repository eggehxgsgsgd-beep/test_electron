// fd-stats.jsx — 统计视图(RealStatsView / RealHeatmap / RealStatCard)
// 统计纯函数已抽到 ./fd-stats-utils.js(零依赖、可单测)，这里只负责展示。
import React from 'react';
import { EmptyState } from '@/components/primitives/EmptyState';
import emptyStatsUrl from '@/assets/empty-stats.webp';
import {
  statDateKey, statStartOfDay, statAddDays, statMinutes,
  statCompletedTasks, statGroupByDate, statStreak,
} from '@/lib/stats';

function RealStatCard({ label, value, sub, theme }) {
  return (
    <div style={{
      flex: 1, padding: '16px 18px', borderRadius: 10,
      border: `1px solid ${theme.borderL}`, background: theme.bg,
    }}>
      <div style={{ fontSize: 22, fontWeight: 700, color: theme.text, letterSpacing: '-0.02em' }}>{value}</div>
      <div style={{ fontSize: 12, color: theme.sub, marginTop: 3 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: theme.muted, marginTop: 1 }}>{sub}</div>}
    </div>
  );
}

function RealHeatmap({ theme, activeHeatTab, tasks, insights, focusSessions }) {
  const CELL = 13, GAP = 3, WEEKS = 20;
  const dayLabels = ['', '一', '', '三', '', '五', ''];
  const monthNames = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
  const [tooltip, setTooltip] = React.useState(null);

  const valueMaps = React.useMemo(() => ({
    focus: statGroupByDate(
      focusSessions.filter(s => s.type === 'focus' && s.status === 'completed'),
      s => s.endedAt,
      s => statMinutes(s.actualDuration)
    ),
    tasks: statGroupByDate(statCompletedTasks(tasks), t => t.completedAt),
    insights: statGroupByDate(insights, i => i.createdAt),
  }), [tasks, insights, focusSessions]);

  const { grid, monthMarkers, maxValue } = React.useMemo(() => {
    const today = statStartOfDay(new Date());
    const todayDay = today.getDay() === 0 ? 6 : today.getDay() - 1;
    const startDate = statAddDays(today, -(WEEKS * 7 + todayDay));
    const map = valueMaps[activeHeatTab] || {};
    const cells = [];
    const markers = [];
    let lastMonth = -1;
    let max = 0;
    for (let w = 0; w <= WEEKS; w++) {
      for (let d = 0; d < 7; d++) {
        const cur = statAddDays(startDate, w * 7 + d);
        if (cur > today) continue;
        const key = statDateKey(cur);
        const value = map[key] || 0;
        max = Math.max(max, value);
        cells.push({ date: key, value, col: w, row: d });
        if (cur.getMonth() !== lastMonth && d <= 2) {
          if (markers.length === 0 || markers[markers.length - 1].col < w - 1) {
            markers.push({ label: monthNames[cur.getMonth()], col: w });
          }
          lastMonth = cur.getMonth();
        }
      }
    }
    return { grid: cells, monthMarkers: markers, maxValue: max };
  }, [activeHeatTab, valueMaps]);

  const levelForValue = (value) => {
    if (!value || !maxValue) return 0;
    if (value <= maxValue * 0.25) return 1;
    if (value <= maxValue * 0.5) return 2;
    if (value <= maxValue * 0.75) return 3;
    return 4;
  };
  const heatColor = (level) => {
    if (theme.id === 'dusk') return ['#1e1e2a', '#3b2f10', '#6b4a0a', '#c98a08', '#f59e0b'][level] || '#1e1e2a';
    if (theme.id === 'sage') return ['#e2ebd8', '#b8dbb8', '#6dbc6d', '#35a345', '#1a7a2e'][level] || '#e2ebd8';
    return ['#ebedf0', '#c6dbf7', '#79b8f8', '#3b82f6', '#1d4ed8'][level] || '#ebedf0';
  };
  const metricLabel = activeHeatTab === 'focus' ? '分钟' : '条';
  const labelW = 26;

  return (
    <React.Fragment>
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', marginLeft: labelW, marginBottom: 6, height: 14 }}>
          {monthMarkers.map((m, i) => (
            <div key={i} style={{
              position: 'absolute', left: labelW + m.col * (CELL + GAP),
              fontSize: 11, color: theme.muted, whiteSpace: 'nowrap',
            }}>{m.label}</div>
          ))}
        </div>
        <div style={{ display: 'flex' }}>
          <div style={{ width: labelW, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: GAP, marginTop: 1 }}>
            {dayLabels.map((lbl, i) => (
              <div key={i} style={{ height: CELL, fontSize: 10, color: theme.muted, display: 'flex', alignItems: 'center', lineHeight: 1 }}>{lbl}</div>
            ))}
          </div>
          <div style={{
            display: 'grid',
            gridTemplateRows: `repeat(7, ${CELL}px)`,
            gridAutoFlow: 'column',
            gridAutoColumns: `${CELL}px`,
            gap: GAP,
          }}>
            {grid.map((cell, i) => {
              const level = levelForValue(cell.value);
              return (
                <div key={i}
                  onMouseEnter={(e) => {
                    const r = e.currentTarget.getBoundingClientRect();
                    setTooltip({ x: r.left + r.width / 2, y: r.top - 4, date: cell.date, value: cell.value });
                  }}
                  onMouseLeave={() => setTooltip(null)}
                  style={{
                    width: CELL, height: CELL, borderRadius: 3,
                    background: heatColor(level),
                    cursor: 'default',
                    outline: tooltip?.date === cell.date ? `2px solid ${theme.sub}` : '2px solid transparent',
                    outlineOffset: -1,
                  }} />
              );
            })}
          </div>
        </div>
        {tooltip && (
          <div style={{
            position: 'fixed', left: tooltip.x, top: tooltip.y,
            transform: 'translate(-50%, -100%)',
            background: theme.text, color: theme.bg,
            padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 500,
            whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: 100,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          }}>
            {tooltip.date} · {tooltip.value || 0}{metricLabel}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 12, justifyContent: 'flex-end', fontSize: 11, color: theme.muted }}>
        <span style={{ marginRight: 4 }}>少</span>
        {[0, 1, 2, 3, 4].map(level => (
          <div key={level} style={{ width: 12, height: 12, borderRadius: 2, background: heatColor(level) }} />
        ))}
        <span style={{ marginLeft: 4 }}>多</span>
      </div>
    </React.Fragment>
  );
}

function RealStatsView({ tasks = [], insights = [], focusSessions = [], theme }) {
  const [heatTab, setHeatTab] = React.useState('focus');

  // Full empty state: no tasks, no insights, no recorded sessions yet.
  // Render the illustration instead of the all-zero dashboard.
  // (Hook order: useState above must stay first; we early-return below it.)
  if (tasks.length === 0 && insights.length === 0 && focusSessions.length === 0) {
    return (
      <EmptyState src={emptyStatsUrl}
        title="还没有数据"
        subtitle="完成第一个番茄钟开启统计"
        theme={theme} />
    );
  }
  const today = statDateKey(new Date());
  const weekStart = statAddDays(statStartOfDay(new Date()), -((new Date().getDay() + 6) % 7));
  const weekDays = Array.from({ length: 7 }, (_, i) => statAddDays(weekStart, i));
  const weekKeys = new Set(weekDays.map(statDateKey));
  const completed = statCompletedTasks(tasks);
  const completedThisWeek = completed.filter(t => weekKeys.has(statDateKey(t.completedAt))).length;
  const focusCompleted = focusSessions.filter(s => s.type === 'focus' && s.status === 'completed');
  const focusTodayMin = statMinutes(focusCompleted.filter(s => statDateKey(s.endedAt) === today).reduce((sum, s) => sum + (s.actualDuration || 0), 0));
  const totalPomos = focusCompleted.length;
  const streak = statStreak(focusSessions);
  const monthInsights = insights.filter(i => {
    const d = new Date(i.createdAt);
    const now = new Date();
    return !Number.isNaN(d.getTime()) && d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).length;
  const focusByDay = statGroupByDate(focusCompleted, s => s.endedAt, s => statMinutes(s.actualDuration));
  const weekData = weekDays.map(d => {
    const key = statDateKey(d);
    return { day: ['日','一','二','三','四','五','六'][d.getDay()], val: focusByDay[key] || 0 };
  });
  const maxVal = Math.max(...weekData.map(d => d.val), 1);
  const tagTotals = {};
  tasks.forEach(t => { if (t.tag) tagTotals[t.tag] = (tagTotals[t.tag] || 0) + 1; });
  insights.forEach(i => { if (i.tag) tagTotals[i.tag] = (tagTotals[i.tag] || 0) + 1; });
  const totalTagged = Object.values(tagTotals).reduce((sum, value) => sum + value, 0);
  const tagData = Object.entries(tagTotals)
    .map(([tag, count]) => ({ tag, count, pct: totalTagged ? Math.round((count / totalTagged) * 100) : 0 }))
    .sort((a, b) => b.count - a.count);
  const heatTabs = [
    { id: 'focus', label: '专注时长' },
    { id: 'tasks', label: '任务完成' },
    { id: 'insights', label: 'Insights' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '22px 24px 8px' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: theme.text, letterSpacing: '-0.02em', margin: 0 }}>统计</h1>
        <div style={{ fontSize: 13, color: theme.sub, marginTop: 4 }}>你的专注数据概览</div>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '12px 24px 24px', scrollbarWidth: 'none' }}>
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          <RealStatCard label="今日专注" value={`${focusTodayMin}min`} theme={theme} />
          <RealStatCard label="本周完成" value={completedThisWeek} sub="任务" theme={theme} />
          <RealStatCard label="连续打卡" value={streak} sub="天" theme={theme} />
          <RealStatCard label="累计番茄" value={totalPomos} theme={theme} />
          <RealStatCard label="Insights" value={insights.length || 0} sub={`本月 +${monthInsights}`} theme={theme} />
        </div>
        <div style={{ padding: '18px 20px', borderRadius: 10, border: `1px solid ${theme.borderL}`, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', gap: 2, background: theme.hov, borderRadius: 7, padding: 2 }}>
              {heatTabs.map(tab => (
                <div key={tab.id} onClick={() => setHeatTab(tab.id)} style={{
                  padding: '5px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
                  fontWeight: heatTab === tab.id ? 600 : 450,
                  background: heatTab === tab.id ? theme.bg : 'transparent',
                  color: heatTab === tab.id ? theme.text : theme.muted,
                  boxShadow: heatTab === tab.id ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.15s',
                }}>{tab.label}</div>
              ))}
            </div>
            <span style={{ fontSize: 11, color: theme.muted }}>近 20 周</span>
          </div>
          <RealHeatmap theme={theme} activeHeatTab={heatTab} tasks={tasks} insights={insights} focusSessions={focusSessions} />
        </div>
        <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
          <div style={{ flex: 1, padding: '18px 20px', borderRadius: 10, border: `1px solid ${theme.borderL}` }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: theme.text, marginBottom: 16 }}>本周趋势</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 100 }}>
              {weekData.map((item, index) => (
                <div key={index} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <div style={{
                    width: '100%', maxWidth: 28, borderRadius: 4,
                    height: item.val ? Math.max(6, (item.val / maxVal) * 80) : 6,
                    background: theme.accent, opacity: item.val ? 0.7 : 0.16,
                  }} />
                  <span style={{ fontSize: 11, color: theme.muted }}>{item.day}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ flex: 1, padding: '18px 20px', borderRadius: 10, border: `1px solid ${theme.borderL}` }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: theme.text, marginBottom: 16 }}>标签分布</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {tagData.length === 0 && <div style={{ fontSize: 13, color: theme.muted }}>暂无标签数据</div>}
              {tagData.map((item, index) => (
                <div key={index}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                    <span style={{ color: theme.tags[item.tag] || theme.sub, fontWeight: 600 }}>#{item.tag}</span>
                    <span style={{ color: theme.muted }}>{item.pct}%</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: theme.borderL }}>
                    <div style={{ height: '100%', borderRadius: 3, width: `${item.pct}%`, background: theme.tags[item.tag] || theme.accent, opacity: 0.75 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { RealStatsView };
