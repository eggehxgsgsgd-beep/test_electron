// Sidebar.jsx — 左侧导航栏
import React from 'react';
import { FdIcon } from '@/components/primitives/Icon';
import iconAppUrl from '@/assets/icon-app-64.png';

function Sidebar({ activeTab, onTabChange, counts, pomo, onOpenSettings, theme }) {
  const [hovItem, setHovItem] = React.useState(null);
  const pomoRunning = pomo.phase === 'focus' || pomo.phase === 'shortBreak' || pomo.phase === 'longBreak';
  const pomoM = Math.floor(pomo.timeLeft / 60);
  const pomoS = pomo.timeLeft % 60;

  const taskItems = [
    { id: 'today', label: '今天', count: counts.today },
    { id: 'all', label: '全部', count: counts.all },
    { id: 'archive', label: '已归档', count: counts.archived },
  ];
  const mainItems = [
    { id: 'insights', label: 'Insights' },
    { id: 'focus', label: '专注', dotColor: pomoRunning ? theme.err || '#ef4444' : undefined,
      extra: pomoRunning ? `${String(pomoM).padStart(2,'0')}:${String(pomoS).padStart(2,'0')}` : null },
    { id: 'stats', label: '统计' },
  ];

  const renderItem = (item, indented) => {
    const active = activeTab === item.id;
    const hovered = hovItem === item.id;
    return (
      <div key={item.id} onClick={() => onTabChange(item.id)}
        onMouseEnter={() => setHovItem(item.id)} onMouseLeave={() => setHovItem(null)}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: indented ? '7px 10px 7px 22px' : '8px 10px',
          borderRadius: 7, cursor: 'pointer',
          background: active ? theme.accentBg : (hovered ? theme.hov : 'transparent'),
          transition: 'background 0.1s',
        }}>
        <div style={{
          width: 7, height: 7, borderRadius: '50%',
          background: active ? theme.accent : (item.dotColor || theme.muted),
          transition: 'background 0.15s',
          animation: item.id === 'focus' && pomoRunning ? 'breathe 2s ease-in-out infinite' : 'none',
          flexShrink: 0,
        }} />
        <span style={{
          flex: 1, fontSize: 13.5, fontWeight: active ? 600 : 450,
          color: active ? theme.text : theme.sub,
        }}>{item.label}</span>
        {item.extra && (
          <span style={{
            fontSize: 11, fontFamily: theme.mono, fontWeight: 600,
            color: item.dotColor || theme.muted,
          }}>{item.extra}</span>
        )}
        {item.count > 0 && !item.extra && (
          <span style={{ fontSize: 11, fontWeight: 600, color: theme.muted }}>{item.count}</span>
        )}
      </div>
    );
  };

  return (
    <div style={{
      width: 180, flexShrink: 0, background: theme.side, display: 'flex', flexDirection: 'column',
      borderRight: `1px solid ${theme.borderL}`, userSelect: 'none', padding: '20px 8px 12px',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '0 10px 22px',
      }}>
        <img src={iconAppUrl} width={24} height={24} alt=""
          style={{ borderRadius: 5, flexShrink: 0 }} />
        <span style={{
          fontSize: 18, fontWeight: 700, color: theme.text,
          letterSpacing: '-0.03em',
        }}>FocusDo</span>
      </div>

      <div style={{
        fontSize: 11, fontWeight: 600, color: theme.muted,
        padding: '0 10px 6px', letterSpacing: '0.06em',
      }}>任务</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1, marginBottom: 14 }}>
        {taskItems.map(item => renderItem(item, true))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {mainItems.map(item => renderItem(item, false))}
      </div>

      <div style={{ flex: 1 }} />

      <div onClick={onOpenSettings}
        onMouseEnter={() => setHovItem('settings')} onMouseLeave={() => setHovItem(null)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 10px', borderRadius: 7, cursor: 'pointer',
          background: hovItem === 'settings' ? theme.hov : 'transparent',
          transition: 'background 0.1s',
        }}>
        <FdIcon name="gear" size={16} color={theme.sub} />
        <span style={{ fontSize: 13, color: theme.sub }}>设置</span>
      </div>
    </div>
  );
}

export { Sidebar };
