// TagsTab.jsx — 标签管理(增删改 + 配色)
import React from 'react';
import { FdIcon } from '@/components/primitives/Icon';
import { DEFAULT_TAGS } from '@/theme/themes';

const TAG_COLORS_PALETTE = [
  '#3b82f6', '#10b981', '#ec4899', '#8b5cf6', '#f59e0b',
  '#ef4444', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
  '#14b8a6', '#e11d48', '#8b5cf6', '#0ea5e9',
];

function TagsTab({ settings, onUpdate, theme }) {
  const tags = settings.tags || DEFAULT_TAGS;
  const [newName, setNewName] = React.useState('');
  const [editId, setEditId] = React.useState(null);
  const [editName, setEditName] = React.useState('');

  const addTag = () => {
    if (!newName.trim()) return;
    if (tags.find(t => t.name === newName.trim())) return;
    const usedColors = tags.map(t => t.color);
    const nextColor = TAG_COLORS_PALETTE.find(c => !usedColors.includes(c)) || TAG_COLORS_PALETTE[0];
    onUpdate({ tags: [...tags, { name: newName.trim(), color: nextColor }] });
    setNewName('');
  };
  const removeTag = (name) => onUpdate({ tags: tags.filter(t => t.name !== name) });
  const setColor = (name, color) => onUpdate({ tags: tags.map(t => t.name === name ? { ...t, color } : t) });
  const startEdit = (tag) => { setEditId(tag.name); setEditName(tag.name); };
  const saveEdit = (oldName) => {
    if (!editName.trim() || (editName.trim() !== oldName && tags.find(t => t.name === editName.trim()))) {
      setEditId(null); return;
    }
    onUpdate({ tags: tags.map(t => t.name === oldName ? { ...t, name: editName.trim() } : t) });
    setEditId(null);
  };

  return (
    <div>
      <div style={{ fontSize: 16, fontWeight: 700, color: theme.text, marginBottom: 6 }}>标签管理</div>
      <div style={{ fontSize: 12, color: theme.muted, marginBottom: 16 }}>自定义任务标签和颜色</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
        {tags.map(tag => (
          <div key={tag.name} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px', borderRadius: 8,
            border: `1px solid ${theme.borderL}`,
          }}>
            {/* Color swatches */}
            <div style={{ position: 'relative' }}>
              <div style={{
                width: 22, height: 22, borderRadius: 6, background: tag.color, cursor: 'pointer',
                border: `2px solid ${theme.bg}`, boxShadow: `0 0 0 1px ${theme.border}`,
              }} onClick={() => {
                const idx = TAG_COLORS_PALETTE.indexOf(tag.color);
                setColor(tag.name, TAG_COLORS_PALETTE[(idx + 1) % TAG_COLORS_PALETTE.length]);
              }} />
            </div>

            {/* Name */}
            {editId === tag.name ? (
              <input value={editName} onChange={e => setEditName(e.target.value)}
                onBlur={() => saveEdit(tag.name)}
                onKeyDown={e => { if (e.key === 'Enter') saveEdit(tag.name); if (e.key === 'Escape') setEditId(null); }}
                autoFocus
                style={{
                  flex: 1, border: 'none', outline: 'none', background: theme.hov,
                  padding: '3px 8px', borderRadius: 4, fontSize: 13,
                  color: theme.text, fontFamily: theme.font,
                }} />
            ) : (
              <span onDoubleClick={() => startEdit(tag)} style={{
                flex: 1, fontSize: 13, fontWeight: 500, color: theme.text, cursor: 'default',
              }}>#{tag.name}</span>
            )}

            {/* Color dots for quick pick */}
            <div style={{ display: 'flex', gap: 3 }}>
              {TAG_COLORS_PALETTE.slice(0, 6).map(c => (
                <div key={c} onClick={() => setColor(tag.name, c)} style={{
                  width: 14, height: 14, borderRadius: '50%', background: c, cursor: 'pointer',
                  border: tag.color === c ? `2px solid ${theme.text}` : `2px solid transparent`,
                  opacity: tag.color === c ? 1 : 0.5,
                  transition: 'all 0.12s',
                }} />
              ))}
            </div>

            {/* Delete */}
            <div onClick={() => removeTag(tag.name)} style={{
              cursor: 'pointer', padding: 4, borderRadius: 4, color: theme.muted,
            }}
            onMouseEnter={e => e.currentTarget.style.color = theme.err}
            onMouseLeave={e => e.currentTarget.style.color = theme.muted}>
              <FdIcon name="x" size={13} color="currentColor" />
            </div>
          </div>
        ))}
      </div>

      {/* Add new tag */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 12px', borderRadius: 8,
        border: `1px dashed ${theme.border}`,
      }}>
        <FdIcon name="plus" size={14} color={theme.muted} />
        <input value={newName} onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addTag()}
          placeholder="添加新标签…"
          style={{
            flex: 1, border: 'none', outline: 'none', background: 'transparent',
            fontSize: 13, color: theme.text, fontFamily: theme.font,
          }} />
        {newName.trim() && (
          <div onClick={addTag} style={{
            padding: '3px 10px', borderRadius: 5, fontSize: 12, fontWeight: 600,
            background: theme.accentBg, color: theme.accent, cursor: 'pointer',
          }}>添加</div>
        )}
      </div>

      <div style={{ fontSize: 11, color: theme.muted, marginTop: 10 }}>
        点击色块切换颜色 · 双击名称可编辑
      </div>
    </div>
  );
}

export { TagsTab };
