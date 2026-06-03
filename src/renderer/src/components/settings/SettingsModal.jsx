// SettingsModal.jsx — 设置弹窗外壳 + Tab 切换
import React from 'react';
import { AppearanceTab } from '@/components/settings/tabs/AppearanceTab';
import { TagsTab } from '@/components/settings/tabs/TagsTab';
import { PomodoroTab } from '@/components/settings/tabs/PomodoroTab';
import { NotificationTab } from '@/components/settings/tabs/NotificationTab';
import { ShortcutsTab } from '@/components/settings/tabs/ShortcutsTab';
import { DataTab } from '@/components/settings/tabs/DataTab';

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
        </div>
      </div>
    </div>
  );
}

export { SettingsModal };
