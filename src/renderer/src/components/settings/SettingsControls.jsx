// SettingsControls.jsx — 设置页内部共享的表单小部件(行 / 滑块 / 开关)
import React from 'react';

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

export { SettingsRow, SettingsSlider, SettingsToggle };
