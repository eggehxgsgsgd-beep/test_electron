// InsightTaskLinker.jsx — "关联任务"下拉选择器(被详情页与快速录入弹窗共用)
import React from 'react';
import { FdIcon } from '@/components/primitives/Icon';

function InsightTaskLinker({ selectedTaskId, tasks, onChange, theme }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  const selected = tasks.find(t => t.id === selectedTaskId);
  const available = tasks.filter(t => !t.archived);

  React.useEffect(() => {
    if (!open) return;
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div onClick={() => setOpen(!open)} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 12px', borderRadius: 7,
        border: `1px solid ${theme.borderL}`, background: theme.bg,
        cursor: 'pointer', fontSize: 13, color: selected ? theme.text : theme.muted,
      }}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
          {selected ? selected.title : '未关联任务'}
        </span>
        <FdIcon name="chevDown" size={13} color={theme.sub} />
      </div>
      {open && (
        <div className="fd-scroll" style={{
          position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
          background: theme.bg, border: `1px solid ${theme.border}`, borderRadius: 8,
          boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 10,
          overflowY: 'auto', overflowX: 'hidden', maxHeight: 220,
        }}>
          <div onClick={() => { onChange(null); setOpen(false); }}
            style={{ padding: '8px 12px', fontSize: 12, color: theme.muted, cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.background = theme.hov}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            不关联任务
          </div>
          {available.map(t => (
            <div key={t.id} onClick={() => { onChange(t.id); setOpen(false); }}
              style={{
                padding: '8px 12px', fontSize: 13, color: theme.text,
                cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => e.currentTarget.style.background = theme.hov}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              {t.title}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export { InsightTaskLinker };
