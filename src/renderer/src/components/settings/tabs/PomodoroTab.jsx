// PomodoroTab.jsx — 番茄钟时长 / 自动开始 / 提示音
import React from 'react';
import { SettingsRow, SettingsSlider, SettingsToggle } from '@/components/settings/SettingsControls';

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

export { PomodoroTab };
