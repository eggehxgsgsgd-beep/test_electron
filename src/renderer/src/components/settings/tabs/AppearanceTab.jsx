// AppearanceTab.jsx — 外观设置(主题 / 跟随系统)
import React from 'react';
import { SettingsRow, SettingsToggle } from '@/components/settings/SettingsControls';

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

export { AppearanceTab };
