// ArchiveView.jsx — 已归档任务列表
import React from 'react';
import { FdIcon } from '@/components/primitives/Icon';
const { useState } = React

function ArchiveView({ tasks, onRestore, onDelete, theme }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '22px 24px 8px' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: theme.text, letterSpacing: '-0.02em', margin: 0 }}>已归档</h1>
        <div style={{ fontSize: 13, color: theme.sub, marginTop: 4 }}>{tasks.length} 个已归档任务</div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '0', scrollbarWidth: 'none' }}>
        {tasks.length === 0 ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', height: 200, color: theme.muted, gap: 8,
          }}>
            <FdIcon name="archive" size={32} color={theme.muted} />
            <span style={{ fontSize: 14 }}>还没有归档的任务</span>
          </div>
        ) : tasks.map(t => (
          <ArchiveItem key={t.id} task={t} onRestore={onRestore} onDelete={onDelete} theme={theme} />
        ))}
      </div>
    </div>
  );
}

function ArchiveItem({ task, onRestore, onDelete, theme }) {
  const [h, setH] = useState(false);
  return (
    <div onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 24px', borderBottom: `1px solid ${theme.borderL}`,
      }}>
      <div style={{
        width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
        background: theme.done, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M2 5.5l2 2L8 3.5" stroke={theme.bg} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, color: theme.sub, textDecoration: 'line-through', textDecorationColor: theme.done }}>
          {task.title}
        </div>
        {task.completedAt && (
          <div style={{ fontSize: 11, color: theme.muted, marginTop: 2 }}>完成于 {task.completedAt}</div>
        )}
      </div>
      {h && (
        <div style={{ display: 'flex', gap: 6 }}>
          <div onClick={() => onRestore(task.id)} style={{
            fontSize: 12, color: theme.accent, cursor: 'pointer',
            padding: '4px 10px', borderRadius: 6, background: theme.accentBg,
          }}>恢复</div>
          <div onClick={() => onDelete(task.id)} style={{
            fontSize: 12, color: theme.err, cursor: 'pointer',
            padding: '4px 10px', borderRadius: 6, background: theme.errBg,
          }}>删除</div>
        </div>
      )}
    </div>
  );
}

export { ArchiveView };
