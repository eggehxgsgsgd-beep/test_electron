// NotificationTab.jsx — 通知开关 / 勿扰
import React from 'react';
import { SettingsRow, SettingsToggle } from '@/components/settings/SettingsControls';

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

export { NotificationTab };
