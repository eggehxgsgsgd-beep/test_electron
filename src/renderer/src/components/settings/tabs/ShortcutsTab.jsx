// ShortcutsTab.jsx — 快捷键说明(静态)
import React from 'react';

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

export { ShortcutsTab };
